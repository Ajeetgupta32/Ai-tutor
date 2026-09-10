import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import API from '../lib/api.js';
import { Navbar } from '../components/layout/Navbar.js';
import { Sidebar } from '../components/layout/Sidebar.js';
import { Card } from '../components/ui/Card.js';
import { Button } from '../components/ui/Button.js';
import { Badge } from '../components/ui/Badge.js';
import { Preloader } from '../components/ui/Preloader.js';
import {
  Trophy,
  CheckCircle2,
  XCircle,
  RotateCcw,
  MessageSquare,
  Sparkles,
  AlertCircle,
  Award,
  ArrowRight,
  HelpCircle,
  Lightbulb,
  X,
  Check,
} from 'lucide-react';
import { QuizAttempt, Quiz } from '../types/index.js';
import { formatTime } from '../lib/utils.js';

interface MistakeExplanation {
  whyWrong: string;
  correctConcept: string;
  simpleExplanation: string;
  similarQuestion: {
    question: string;
    options: string[];
    correctAnswer: string;
    explanation: string;
  };
}

export const QuizResults: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [attempt, setAttempt] = useState<QuizAttempt | null>(null);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);

  // Explain Mistake Drawer
  const [activeMistakeQuestionId, setActiveMistakeQuestionId] = useState<string | null>(null);
  const [mistakeData, setMistakeData] = useState<MistakeExplanation | null>(null);
  const [loadingMistake, setLoadingMistake] = useState(false);
  const [selectedPracticeAnswer, setSelectedPracticeAnswer] = useState<string | null>(null);
  const [showPracticeResult, setShowPracticeResult] = useState(false);

  useEffect(() => {
    const fetchAttempt = async () => {
      try {
        const res = await API.get(`/quiz-attempts/${id}`);
        if (res.data.success) {
          const att = res.data.data.attempt;
          setAttempt(att);
          setQuiz(att.quizId as Quiz);
        }
      } catch (err) {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    fetchAttempt();
  }, [id]);

  const handleExplainMistake = async (questionId: string) => {
    setActiveMistakeQuestionId(questionId);
    setMistakeData(null);
    setSelectedPracticeAnswer(null);
    setShowPracticeResult(false);
    setLoadingMistake(true);

    try {
      const res = await API.post(`/quiz-attempts/${id}/explain-mistake/${questionId}`);
      if (res.data.success) {
        setMistakeData(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMistake(false);
    }
  };

  if (loading || !attempt || !quiz) {
    return <Preloader message="Calculating your quiz results..." subMessage="Evaluating strengths & answer explanations" />;
  }

  const isPassed = attempt.percentage >= 70;
  const isCertified = attempt.percentage >= 80;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      <Navbar />

      <div className="flex-1 flex">
        <Sidebar />

        <main className="flex-1 p-5 sm:p-8 max-w-5xl mx-auto w-full space-y-6">
          {/* Certificate Earned Banner */}
          {isCertified && (
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                  <Award className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base">Verified Certificate Earned! 🎓</h3>
                  <p className="text-xs text-amber-100">
                    You scored {attempt.percentage}% and earned a cryptographically verified mastery certificate.
                  </p>
                </div>
              </div>
              <Link to="/certificates">
                <Button size="sm" className="bg-white text-amber-900 hover:bg-amber-50 font-bold">
                  View Certificate &rarr;
                </Button>
              </Link>
            </div>
          )}

          {/* Header Score Card */}
          <Card
            className={`p-8 text-center bg-white border shadow-sm ${
              isPassed ? 'border-emerald-200' : 'border-rose-200'
            }`}
          >
            <div
              className={`w-14 h-14 rounded-2xl mx-auto mb-3.5 flex items-center justify-center ${
                isPassed ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
              }`}
            >
              <Trophy className="w-7 h-7" />
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-1">Quiz Results</h1>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              {quiz.title} • {quiz.subjectName}
            </p>

            <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[11px] text-slate-500 font-semibold block uppercase">Score</span>
                <span className="text-2xl font-black text-slate-900">
                  {attempt.score}/{attempt.totalQuestions}
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[11px] text-slate-500 font-semibold block uppercase">Percentage</span>
                <span
                  className={`text-2xl font-black ${isPassed ? 'text-emerald-600' : 'text-rose-600'}`}
                >
                  {attempt.percentage}%
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[11px] text-slate-500 font-semibold block uppercase">Time Taken</span>
                <span className="text-2xl font-black text-slate-900">
                  {formatTime(attempt.timeTakenSeconds)}
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[11px] text-slate-500 font-semibold block uppercase">Accuracy</span>
                <span className="text-2xl font-black text-blue-600">{attempt.accuracy}%</span>
              </div>
            </div>

            {/* Actions Toolbar */}
            <div className="mt-6 flex flex-wrap justify-center gap-2.5">
              <Link to={`/quiz-player/${quiz._id || quiz.id}`}>
                <Button variant="outline" size="sm">
                  <RotateCcw className="w-4 h-4 mr-1.5" /> Retake Quiz
                </Button>
              </Link>
              <Link to={`/quiz-generator?topic=${encodeURIComponent(quiz.topicName || quiz.subjectName)}`}>
                <Button variant="primary" size="sm">
                  <Sparkles className="w-4 h-4 mr-1.5" /> Practice Similar Topic
                </Button>
              </Link>
              <Link to={`/tutor`}>
                <Button variant="outline" size="sm">
                  <MessageSquare className="w-4 h-4 mr-1.5 text-blue-600" /> Ask AI Tutor
                </Button>
              </Link>
            </div>
          </Card>

          {/* Identified Weak Topics Card */}
          {attempt.weakTopics && attempt.weakTopics.length > 0 && (
            <Card className="p-5 border-rose-200 bg-rose-50/40">
              <h3 className="text-sm font-bold text-slate-900 mb-1.5 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-rose-600" /> Topics for Further Practice
              </h3>
              <p className="text-xs text-slate-600 mb-3">
                Review these concepts with your AI tutor to improve your mastery:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {(Array.isArray(attempt.weakTopics) ? attempt.weakTopics : []).map((wt, idx) => (
                  <Badge key={idx} variant="danger">
                    {wt}
                  </Badge>
                ))}
              </div>
            </Card>
          )}

          {/* Question Breakdown with Explanations & Explain My Mistake Button */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Question by Question Review</h3>

            {(Array.isArray(attempt.answers) ? attempt.answers : []).map((ans, idx) => {
              const q = quiz.questions?.find((item) => item.id === ans.questionId) || {
                questionText: `Question ${idx + 1}`,
              };

              return (
                <Card
                  key={ans.questionId || idx}
                  className={`p-5 bg-white border-l-4 shadow-sm ${
                    ans.isCorrect ? 'border-l-emerald-500' : 'border-l-rose-500'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <h4 className="font-bold text-slate-900 text-sm sm:text-base">
                      {idx + 1}. {q.questionText}
                    </h4>
                    {ans.isCorrect ? (
                      <Badge variant="success">
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Correct
                      </Badge>
                    ) : (
                      <Badge variant="danger">
                        <XCircle className="w-3.5 h-3.5 mr-1" /> Incorrect
                      </Badge>
                    )}
                  </div>

                  <div className="space-y-1.5 text-xs mb-3">
                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                      <span className="text-slate-500 font-semibold">Your Answer: </span>
                      <span
                        className={
                          ans.isCorrect ? 'text-emerald-700 font-bold' : 'text-rose-700 font-bold'
                        }
                      >
                        {ans.userResponse || '(No answer provided)'}
                      </span>
                    </div>

                    {!ans.isCorrect && (
                      <div className="p-2.5 rounded-lg bg-emerald-50/60 border border-emerald-200">
                        <span className="text-emerald-800 font-semibold">Correct Answer: </span>
                        <span className="text-emerald-900 font-bold">{ans.correctAnswer}</span>
                      </div>
                    )}
                  </div>

                  {/* Standard Explanation Box */}
                  <div className="p-3.5 rounded-xl bg-blue-50/50 border border-blue-100 text-xs text-slate-700">
                    <div className="font-bold mb-1 flex items-center gap-1.5 text-blue-900">
                      <Sparkles className="w-3.5 h-3.5 text-blue-600" /> Explanation:
                    </div>
                    <p className="leading-relaxed">{ans.explanation}</p>
                  </div>

                  {/* Explain My Mistake Button (For Incorrect Answers) */}
                  {!ans.isCorrect && (
                    <div className="mt-3 pt-3 border-t border-slate-100 flex justify-end">
                      <Button
                        size="sm"
                        onClick={() => handleExplainMistake(ans.questionId)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold"
                      >
                        <Lightbulb className="w-3.5 h-3.5 mr-1.5" /> Explain My Mistake (AI Diagnostic)
                      </Button>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>

          {/* Explain My Mistake Modal / Drawer */}
          {activeMistakeQuestionId && (
            <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
                      <Lightbulb className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-base text-slate-900">AI Mistake Diagnosis</h3>
                      <p className="text-xs text-slate-500">4-Step personalized conceptual breakdown</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveMistakeQuestionId(null)}
                    className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {loadingMistake ? (
                  <div className="py-12 text-center space-y-3">
                    <Sparkles className="w-8 h-8 text-indigo-600 animate-spin mx-auto" />
                    <p className="text-sm font-semibold text-slate-700">Analyzing your thought process...</p>
                    <p className="text-xs text-slate-400">Identifying why this option was chosen and crafting intuitive analogies</p>
                  </div>
                ) : mistakeData ? (
                  <div className="space-y-4 text-xs">
                    {/* Part 1: Why it's wrong */}
                    <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-950">
                      <h4 className="font-bold text-xs uppercase tracking-wider text-rose-700 mb-1 flex items-center gap-1.5">
                        <XCircle className="w-4 h-4" /> 1. Why Your Answer Was Incorrect
                      </h4>
                      <p className="leading-relaxed text-rose-900">{mistakeData.whyWrong}</p>
                    </div>

                    {/* Part 2: Correct Concept */}
                    <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950">
                      <h4 className="font-bold text-xs uppercase tracking-wider text-emerald-700 mb-1 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" /> 2. The Core Concept
                      </h4>
                      <p className="leading-relaxed text-emerald-900">{mistakeData.correctConcept}</p>
                    </div>

                    {/* Part 3: Simple Everyday Analogy */}
                    <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-blue-950">
                      <h4 className="font-bold text-xs uppercase tracking-wider text-blue-700 mb-1 flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4" /> 3. Simple Everyday Analogy (ELI10)
                      </h4>
                      <p className="leading-relaxed text-blue-900">{mistakeData.simpleExplanation}</p>
                    </div>

                    {/* Part 4: Similar Practice Question */}
                    {mistakeData.similarQuestion && (
                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 space-y-3">
                        <h4 className="font-bold text-xs uppercase tracking-wider text-indigo-700 flex items-center gap-1.5">
                          <HelpCircle className="w-4 h-4" /> 4. Immediate Check: Practice Similar Question
                        </h4>
                        <p className="font-semibold text-slate-800 text-sm">
                          {mistakeData.similarQuestion.question}
                        </p>

                        <div className="space-y-1.5">
                          {(Array.isArray(mistakeData.similarQuestion.options) ? mistakeData.similarQuestion.options : []).map((opt, oIdx) => (
                            <button
                              key={oIdx}
                              onClick={() => {
                                setSelectedPracticeAnswer(opt);
                                setShowPracticeResult(true);
                              }}
                              className={`w-full p-2.5 text-left rounded-xl border text-xs transition-all ${
                                selectedPracticeAnswer === opt
                                  ? opt === mistakeData.similarQuestion.correctAnswer
                                    ? 'bg-emerald-100 border-emerald-400 text-emerald-900 font-bold'
                                    : 'bg-rose-100 border-rose-400 text-rose-900 font-bold'
                                  : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                              }`}
                            >
                              {opt}
                            </button>
                          ))}
                        </div>

                        {showPracticeResult && (
                          <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-950">
                            <span className="font-bold block mb-0.5">
                              {selectedPracticeAnswer === mistakeData.similarQuestion.correctAnswer
                                ? '🎉 Correct! You mastered this concept.'
                                : '💡 Notice:'}
                            </span>
                            <p>{mistakeData.similarQuestion.explanation}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-center py-6 text-slate-400">Failed to load diagnosis.</p>
                )}

                <div className="flex justify-end pt-2">
                  <Button onClick={() => setActiveMistakeQuestionId(null)} size="sm">
                    Close Diagnosis
                  </Button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
