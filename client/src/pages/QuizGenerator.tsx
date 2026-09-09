import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import API from '../api/axios.js';
import { Navbar } from '../components/layout/Navbar.js';
import { Sidebar } from '../components/layout/Sidebar.js';
import { Card } from '../components/ui/Card.js';
import { Button } from '../components/ui/Button.js';
import { Input } from '../components/ui/Input.js';
import { useToast } from '../context/ToastContext.js';
import { Sparkles, BrainCircuit } from 'lucide-react';

export const QuizGenerator: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  const [subjectName, setSubjectName] = useState('Computer Science & Engineering');
  const [topicName, setTopicName] = useState(searchParams.get('topic') || 'Data Structures & Algorithms');
  const [difficulty, setDifficulty] = useState<'beginner' | 'intermediate' | 'advanced'>('intermediate');
  const [questionCount, setQuestionCount] = useState<number>(5);
  const [questionType, setQuestionType] = useState<'mcq' | 'true_false' | 'fill_in_blank' | 'short_answer' | 'mixed'>('mixed');
  const [language, setLanguage] = useState<'en' | 'hi'>('en');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const topicFromUrl = searchParams.get('topic');
    if (topicFromUrl) {
      setTopicName(topicFromUrl);
    }
  }, [searchParams]);

  const handleGenerateQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectName || !topicName) {
      toast('error', 'Please fill in Subject and Topic fields');
      return;
    }

    setLoading(true);
    try {
      const res = await API.post('/quizzes/generate', {
        subjectName,
        topicName,
        difficulty,
        questionCount: Number(questionCount),
        questionType,
        language,
      });

      if (res.data.success) {
        toast('success', 'Quiz Generated Successfully!', 'Redirecting to Quiz Player');
        const quizId = res.data.data.quiz._id;
        navigate(`/quiz-player/${quizId}`);
      }
    } catch (err: any) {
      toast('error', 'Quiz Generation Failed', err.response?.data?.message || 'Error communicating with AI Quiz Generator');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      <Navbar />

      <div className="flex-1 flex">
        <Sidebar />

        <main className="flex-1 p-5 sm:p-8 max-w-4xl mx-auto w-full space-y-6">
          {/* Header */}
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center border border-blue-200">
              <Sparkles className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Quiz Generator</h1>
              <p className="text-xs sm:text-sm text-slate-500">
                Choose a topic and format to generate personalized practice quizzes instantly
              </p>
            </div>
          </div>

          <Card className="p-6 sm:p-8 bg-white border border-slate-200 shadow-sm">
            <form onSubmit={handleGenerateQuiz} className="space-y-5">
              {/* Subject Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Subject / Course</label>
                <input
                  type="text"
                  value={subjectName}
                  onChange={(e) => setSubjectName(e.target.value)}
                  placeholder="e.g. Computer Science, Physics, Business Administration"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-xs"
                  required
                />
              </div>

              {/* Topic Input */}
              <Input
                label="Topic or Chapter"
                placeholder="e.g. Binary Search Trees, SQL Queries, Microeconomics"
                value={topicName}
                onChange={(e) => setTopicName(e.target.value)}
                required
              />

              {/* Difficulty Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Difficulty Level</label>
                <div className="grid grid-cols-3 gap-2.5">
                  {(['beginner', 'intermediate', 'advanced'] as const).map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setDifficulty(lvl)}
                      className={`p-3 rounded-xl border text-xs font-bold capitalize transition-all ${
                        difficulty === lvl
                          ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-xs'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              {/* Question Count & Type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Number of Questions ({questionCount})
                  </label>
                  <input
                    type="range"
                    min="3"
                    max="15"
                    value={questionCount}
                    onChange={(e) => setQuestionCount(Number(e.target.value))}
                    className="w-full accent-blue-600 cursor-pointer mt-2"
                  />
                  <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                    <span>3 Questions</span>
                    <span>15 Questions</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Question Format</label>
                  <select
                    value={questionType}
                    onChange={(e) => setQuestionType(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 shadow-xs"
                  >
                    <option value="mixed">Mixed Types (Recommended)</option>
                    <option value="mcq">Multiple Choice (MCQ)</option>
                    <option value="true_false">True / False</option>
                    <option value="fill_in_blank">Fill in the Blank</option>
                    <option value="short_answer">Short Answer</option>
                  </select>
                </div>
              </div>

              {/* Language Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Quiz Language</label>
                <div className="grid grid-cols-2 gap-2.5 max-w-xs">
                  <button
                    type="button"
                    onClick={() => setLanguage('en')}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all ${
                      language === 'en'
                        ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    English
                  </button>
                  <button
                    type="button"
                    onClick={() => setLanguage('hi')}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all ${
                      language === 'hi'
                        ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Hindi (हिंदी)
                  </button>
                </div>
              </div>

              <Button type="submit" size="lg" className="w-full mt-3 py-3" isLoading={loading}>
                <Sparkles className="w-4 h-4 mr-2" /> Generate Practice Quiz
              </Button>
            </form>
          </Card>
        </main>
      </div>
    </div>
  );
};
