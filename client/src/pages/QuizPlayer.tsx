import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../api/axios.js';
import { Card } from '../components/ui/Card.js';
import { Button } from '../components/ui/Button.js';
import { Progress } from '../components/ui/Progress.js';
import { Badge } from '../components/ui/Badge.js';
import { Preloader } from '../components/ui/Preloader.js';
import { useToast } from '../context/ToastContext.js';
import { Clock, ArrowLeft, ArrowRight, CheckCircle, Flag, AlertTriangle } from 'lucide-react';
import { Quiz, QuizQuestion } from '../types/index.js';
import { formatTime } from '../lib/utils.js';

export const QuizPlayer: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  // User answers map: { questionId: responseString }
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [flagged, setFlagged] = useState<Record<string, boolean>>({});

  // Timer
  const [timeLeftSeconds, setTimeLeftSeconds] = useState<number>(300);
  const [submitting, setSubmitting] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const res = await API.get(`/quizzes/${id}`);
        if (res.data.success) {
          const q = res.data.data.quiz;
          setQuiz(q);
          setTimeLeftSeconds(q.questionCount * 60);
        }
      } catch (err) {
        toast('error', 'Quiz not found');
        navigate('/my-quizzes');
      } finally {
        setLoading(false);
      }
    };
    fetchQuiz();
  }, [id]);

  useEffect(() => {
    if (!quiz || submitting) return;

    const timer = setInterval(() => {
      setTimeLeftSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmitQuiz();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [quiz, submitting]);

  const handleSelectOption = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const toggleFlag = (questionId: string) => {
    setFlagged((prev) => ({ ...prev, [questionId]: !prev[questionId] }));
  };

  const handleSubmitQuiz = async () => {
    if (!quiz || submitting) return;
    setSubmitting(true);

    const userAnswersPayload = (Array.isArray(quiz.questions) ? quiz.questions : []).map((q) => ({
      questionId: q.id,
      userResponse: answers[q.id] || '',
    }));

    const totalTimeSpent = quiz.questionCount * 60 - timeLeftSeconds;

    try {
      const res = await API.post('/quiz-attempts/submit', {
        quizId: quiz._id,
        userAnswers: userAnswersPayload,
        timeTakenSeconds: Math.max(10, totalTimeSpent),
      });

      if (res.data.success) {
        toast('success', 'Quiz Submitted Successfully!');
        const attemptId = res.data.data.attempt._id;
        navigate(`/quiz-results/${attemptId}`);
      }
    } catch (err: any) {
      toast('error', 'Failed to submit quiz');
      setSubmitting(false);
    }
  };

  if (loading || !quiz) {
    return <Preloader message="Loading your practice test..." subMessage="Preparing questions & answer options" />;
  }

  const currentQ: QuizQuestion = quiz.questions[currentIndex];
  const answeredCount = Object.keys(answers).length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* Top Test Header */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-xs">
        <div>
          <h2 className="font-bold text-slate-900 text-base sm:text-lg">{quiz.title}</h2>
          <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
            <span>{quiz.subjectName}</span>
            <span>•</span>
            <span className="capitalize">{quiz.difficulty}</span>
          </div>
        </div>

        {/* Timer & Submit */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-sm font-mono font-bold text-amber-800">
            <Clock className="w-4 h-4 text-amber-600" />
            {formatTime(timeLeftSeconds)}
          </div>

          <Button variant="primary" size="sm" onClick={() => setShowSubmitModal(true)}>
            Submit Quiz
          </Button>
        </div>
      </header>

      {/* Main Player Container */}
      <div className="flex-1 max-w-5xl mx-auto w-full p-4 sm:p-6 lg:p-8 flex flex-col lg:flex-row gap-6">
        {/* Left Side: Question View */}
        <div className="flex-1 space-y-5">
          {/* Progress Bar */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-slate-600 font-semibold">
              <span>
                Question {currentIndex + 1} of {quiz.questionCount}
              </span>
              <span>
                {answeredCount} of {quiz.questionCount} Answered
              </span>
            </div>
            <Progress value={((currentIndex + 1) / quiz.questionCount) * 100} />
          </div>

          {/* Question Card */}
          <Card className="p-6 md:p-8 bg-white border-slate-200 shadow-sm min-h-[320px] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <Badge variant="primary" className="capitalize">
                  {currentQ.type.replace('_', ' ')}
                </Badge>
                <button
                  onClick={() => toggleFlag(currentQ.id)}
                  className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg border transition-colors ${
                    flagged[currentQ.id]
                      ? 'bg-amber-50 text-amber-800 border-amber-300'
                      : 'text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <Flag className="w-3.5 h-3.5" />
                  {flagged[currentQ.id] ? 'Flagged' : 'Flag Question'}
                </button>
              </div>

              <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-6 leading-relaxed">
                {currentQ.questionText}
              </h3>

              {/* Answers Input depending on type */}
              {currentQ.type === 'mcq' || currentQ.type === 'true_false' ? (
                <div className="space-y-2.5">
                  {(Array.isArray(currentQ.options) ? currentQ.options : []).map((option, idx) => {
                    const isSelected = answers[currentQ.id] === option;
                    return (
                      <button
                        key={idx}
                        onClick={() => handleSelectOption(currentQ.id, option)}
                        className={`w-full p-4 rounded-xl text-left text-sm font-medium border transition-all flex items-center justify-between ${
                          isSelected
                            ? 'bg-blue-50 border-blue-500 text-blue-900 font-semibold shadow-xs'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <span>{option}</span>
                        <div
                          className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                            isSelected ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300'
                          }`}
                        >
                          {isSelected && <CheckCircle className="w-3.5 h-3.5" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <textarea
                  rows={4}
                  placeholder="Type your answer here..."
                  value={answers[currentQ.id] || ''}
                  onChange={(e) => handleSelectOption(currentQ.id, e.target.value)}
                  className="w-full p-4 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 shadow-xs"
                />
              )}
            </div>

            {/* Navigation buttons */}
            <div className="flex items-center justify-between pt-6 border-t border-slate-100 mt-6">
              <Button
                variant="outline"
                onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                disabled={currentIndex === 0}
              >
                <ArrowLeft className="w-4 h-4 mr-1" /> Previous
              </Button>

              {currentIndex < quiz.questionCount - 1 ? (
                <Button onClick={() => setCurrentIndex((prev) => Math.min(quiz.questionCount - 1, prev + 1))}>
                  Next <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              ) : (
                <Button variant="primary" onClick={() => setShowSubmitModal(true)}>
                  Submit Test
                </Button>
              )}
            </div>
          </Card>
        </div>

        {/* Right Side: Question Grid Navigator */}
        <div className="w-full lg:w-64 bg-white border border-slate-200 p-5 rounded-2xl h-fit shadow-sm">
          <h4 className="font-bold text-sm text-slate-900 mb-3.5">Question Navigator</h4>

          <div className="grid grid-cols-5 gap-2">
            {(Array.isArray(quiz.questions) ? quiz.questions : []).map((q, idx) => {
              const isAnswered = Boolean(answers[q.id]);
              const isCurrent = currentIndex === idx;
              const isFlagged = flagged[q.id];

              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentIndex(idx)}
                  className={`w-9 h-9 rounded-xl text-xs font-bold transition-all relative flex items-center justify-center ${
                    isCurrent
                      ? 'ring-2 ring-blue-500 bg-blue-600 text-white'
                      : isAnswered
                      ? 'bg-emerald-50 border border-emerald-300 text-emerald-700'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {idx + 1}
                  {isFlagged && <div className="w-2 h-2 rounded-full bg-amber-500 absolute -top-1 -right-1" />}
                </button>
              );
            })}
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100 text-xs space-y-2 text-slate-500">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-md bg-emerald-100 border border-emerald-300" />
              <span>Answered ({answeredCount})</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-md bg-white border border-slate-300" />
              <span>Unanswered ({quiz.questionCount - answeredCount})</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-amber-500" />
              <span>Flagged for review</span>
            </div>
          </div>
        </div>
      </div>

      {/* Submit Confirmation Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <Card className="max-w-md w-full p-6 text-center border-slate-200 bg-white shadow-xl">
            <AlertTriangle className="w-11 h-11 text-amber-500 mx-auto mb-3" />
            <h3 className="text-xl font-bold text-slate-900 mb-1.5">Submit Your Quiz?</h3>
            <p className="text-xs text-slate-500 mb-6">
              You have answered {answeredCount} out of {quiz.questionCount} questions. Would you like to finish and view your score?
            </p>
            <div className="flex gap-2.5">
              <Button variant="outline" className="flex-1" onClick={() => setShowSubmitModal(false)}>
                Back to Quiz
              </Button>
              <Button variant="primary" className="flex-1" isLoading={submitting} onClick={handleSubmitQuiz}>
                Yes, Submit
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
