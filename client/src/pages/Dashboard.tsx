import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import API from '../lib/api.js';
import { useAuth } from '../context/AuthContext.js';
import { Navbar } from '../components/layout/Navbar.js';
import { Sidebar } from '../components/layout/Sidebar.js';
import { Card } from '../components/ui/Card.js';
import { Button } from '../components/ui/Button.js';
import { Badge } from '../components/ui/Badge.js';
import { Preloader } from '../components/ui/Preloader.js';
import {
  FileQuestion,
  Target,
  Award,
  Clock,
  Flame,
  MessageSquare,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  LineChart,
  ShieldCheck,
  Zap,
  BookMarked,
  Dna,
  Map,
  Calendar,
  CheckSquare,
  Plus,
} from 'lucide-react';
import { DashboardMetrics, QuizAttempt, Goal, LearningDNA } from '../types/index.js';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalQuizzes: 0,
    averageScore: 0,
    accuracy: 0,
    studyTimeMinutes: 0,
    currentStreak: 1,
  });
  const [recentQuizzes, setRecentQuizzes] = useState<QuizAttempt[]>([]);
  const [strongTopics, setStrongTopics] = useState<string[]>([]);
  const [weakTopics, setWeakTopics] = useState<string[]>([]);
  const [recommendedTopics, setRecommendedTopics] = useState<string[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [learningDNA, setLearningDNA] = useState<LearningDNA | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [dashRes, goalsRes, dnaRes] = await Promise.allSettled([
          API.get('/progress/dashboard'),
          API.get('/goals'),
          API.get('/progress/dna'),
        ]);

        if (dashRes.status === 'fulfilled' && dashRes.value.data.success) {
          const d = dashRes.value.data.data;
          setMetrics(d.metrics);
          setRecentQuizzes(d.recentQuizzes || []);
          setStrongTopics(d.strongTopics || []);
          setWeakTopics(d.weakTopics || []);
          setRecommendedTopics(d.recommendedTopics || []);
        }

        if (goalsRes.status === 'fulfilled' && goalsRes.value.data?.success) {
          const rawGoals = goalsRes.value.data.data ?? goalsRes.value.data.goals;
          const goalsArray = Array.isArray(rawGoals)
            ? rawGoals
            : Array.isArray(rawGoals?.goals)
            ? rawGoals.goals
            : [];
          setGoals(goalsArray);
        } else {
          setGoals([]);
        }

        if (dnaRes.status === 'fulfilled' && dnaRes.value.data.success) {
          setLearningDNA(dnaRes.value.data.data || null);
        }
      } catch (err) {
        // use defaults
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  const handleCompleteGoal = async (goalId: string, currentVal: number, targetVal: number) => {
    try {
      const res = await API.patch(`/goals/${goalId}`, {
        currentValue: targetVal,
        isCompleted: true,
      });
      if (res.data.success) {
        setGoals((prev) =>
          prev.map((g) => (g.id === goalId ? { ...g, currentValue: targetVal, isCompleted: true } : g))
        );
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return <Preloader message="Loading your dashboard..." subMessage="Syncing your learning DNA, goals, and recent quizzes" />;
  }

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
  const currentXP = user?.xp || 0;
  const nextLevelXP = Math.ceil((currentXP + 100) / 250) * 250;
  const currentTierXP = nextLevelXP - 250;
  const xpProgress = Math.min(100, Math.round(((currentXP - currentTierXP) / 250) * 100));

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      <Navbar />

      <div className="flex-1 flex">
        <Sidebar />

        <main className="flex-1 p-5 sm:p-8 max-w-7xl mx-auto w-full space-y-6">
          {/* Admin Banner (If Admin User) */}
          {isAdmin && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-800 flex-shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-amber-950">Administrator Control Portal</h4>
                  <p className="text-xs text-amber-800">
                    Access At-Risk Student Intelligence, User Directory, AI Question Bank QC, and System Settings.
                  </p>
                </div>
              </div>
              <Link to="/admin">
                <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white font-semibold shadow-xs">
                  Open Admin Dashboard &rarr;
                </Button>
              </Link>
            </div>
          )}

          {/* Motivational Hero Card with XP & Streak */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-sm flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  Welcome back, {user?.name ? user.name.split(' ')[0] : 'Scholar'}! 👋
                </h1>
                <Badge variant="primary" className="capitalize text-xs font-bold">
                  {user?.level || 'Intermediate'} Learner
                </Badge>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">
                Your AI Tutor and Adaptive Learning Engine are active. Master your weak topics or earn XP by completing your daily goals.
              </p>

              {/* XP Progression Bar */}
              <div className="pt-2">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-bold text-slate-700 flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5 text-indigo-600 fill-indigo-600" />
                    Level Progress ({currentXP} XP)
                  </span>
                  <span className="text-slate-500 font-medium">Next Tier: {nextLevelXP} XP</span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/60">
                  <div
                    className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(5, xpProgress)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Streak & Quick Action Badges */}
            <div className="flex flex-col sm:flex-row items-stretch gap-3 w-full lg:w-auto flex-shrink-0">
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-amber-50/80 border border-amber-200">
                <div className="w-12 h-12 rounded-xl bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-600">
                  <Flame className="w-6 h-6 fill-amber-500" />
                </div>
                <div>
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Daily Streak</span>
                  <span className="text-xl font-black text-slate-900">{metrics.currentStreak} Days</span>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 rounded-2xl bg-indigo-50/80 border border-indigo-200">
                <div className="w-12 h-12 rounded-xl bg-indigo-100 border border-indigo-300 flex items-center justify-center text-indigo-600">
                  <Dna className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Learning DNA</span>
                  <span className="text-xs font-bold text-indigo-950">
                    {learningDNA?.primaryLearningStyle || 'Adaptive Pattern'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Study Actions Grid */}
          <div>
            <h2 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-3">Intelligent Learning Modules</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Action 1: AI Tutor */}
              <Link to="/tutor" className="group">
                <Card hoverEffect className="p-5 h-full flex flex-col justify-between border-slate-200 hover:border-blue-400">
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 mb-3 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                      <MessageSquare className="w-5 h-5" />
                    </div>
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-sm text-slate-900 group-hover:text-blue-600 transition-colors">
                        AI Tutor Chat
                      </h3>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-100 text-blue-700">
                        ELI10 / Voice
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      Instant concept breakdowns, voice chats & simple explanations.
                    </p>
                  </div>
                  <div className="flex items-center text-xs font-semibold text-blue-600 mt-4">
                    <span>Ask Tutor</span>
                    <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Card>
              </Link>

              {/* Action 2: Practice Quiz */}
              <Link to="/quiz-generator" className="group">
                <Card hoverEffect className="p-5 h-full flex flex-col justify-between border-slate-200 hover:border-emerald-400">
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 mb-3 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-sm text-slate-900 group-hover:text-emerald-600 transition-colors">
                      Adaptive Practice Quiz
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      Auto-generate MCQs with 1-click "Explain My Mistake" diagnostics.
                    </p>
                  </div>
                  <div className="flex items-center text-xs font-semibold text-emerald-600 mt-4">
                    <span>Start Practice</span>
                    <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Card>
              </Link>

              {/* Action 3: Adaptive Roadmap */}
              <Link to="/roadmap" className="group">
                <Card hoverEffect className="p-5 h-full flex flex-col justify-between border-slate-200 hover:border-indigo-400">
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 mb-3 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                      <Map className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-sm text-slate-900 group-hover:text-indigo-600 transition-colors">
                      Knowledge Roadmap
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      Visual prerequisite tree tracking your real concept mastery.
                    </p>
                  </div>
                  <div className="flex items-center text-xs font-semibold text-indigo-600 mt-4">
                    <span>View Tree</span>
                    <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Card>
              </Link>

              {/* Action 4: AI Study Planner */}
              <Link to="/study-planner" className="group">
                <Card hoverEffect className="p-5 h-full flex flex-col justify-between border-slate-200 hover:border-purple-400">
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600 mb-3 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-sm text-slate-900 group-hover:text-purple-600 transition-colors">
                      AI Study Planner
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      Customized day-by-day exam schedules with weakness targeting.
                    </p>
                  </div>
                  <div className="flex items-center text-xs font-semibold text-purple-600 mt-4">
                    <span>Generate Schedule</span>
                    <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Card>
              </Link>
            </div>
          </div>

          {/* Key Metrics Grid */}
          <div>
            <h2 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-3">Performance Pulse</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="p-5">
                <div className="flex items-center justify-between text-slate-500 mb-2">
                  <span className="text-xs font-bold uppercase text-slate-500">Quizzes Taken</span>
                  <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                    <FileQuestion className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-3xl font-extrabold text-slate-900">{metrics.totalQuizzes}</div>
                <p className="text-xs text-slate-500 mt-1">Recorded quiz sessions</p>
              </Card>

              <Card className="p-5">
                <div className="flex items-center justify-between text-slate-500 mb-2">
                  <span className="text-xs font-bold uppercase text-slate-500">Average Score</span>
                  <div className="w-7 h-7 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
                    <Award className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-3xl font-extrabold text-blue-600">{metrics.averageScore}%</div>
                <p className="text-xs text-slate-500 mt-1">Platform-wide average</p>
              </Card>

              <Card className="p-5">
                <div className="flex items-center justify-between text-slate-500 mb-2">
                  <span className="text-xs font-bold uppercase text-slate-500">Accuracy Rate</span>
                  <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <Target className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-3xl font-extrabold text-emerald-600">{metrics.accuracy}%</div>
                <p className="text-xs text-slate-500 mt-1">Correct answer ratio</p>
              </Card>

              <Card className="p-5">
                <div className="flex items-center justify-between text-slate-500 mb-2">
                  <span className="text-xs font-bold uppercase text-slate-500">Study Time</span>
                  <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                    <Clock className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-3xl font-extrabold text-purple-600">{metrics.studyTimeMinutes} min</div>
                <p className="text-xs text-slate-500 mt-1">Active time invested</p>
              </Card>
            </div>
          </div>

          {/* Active Goals & Weak Topics Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Active Goals */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-indigo-600" />
                  <h3 className="font-bold text-base text-slate-900">Active Learning Goals</h3>
                </div>
                <Link to="/goals" className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1">
                  Manage Goals <ArrowRight className="w-3 h-3" />
                </Link>
              </div>

              {(Array.isArray(goals) ? goals : []).filter((g) => !g.isCompleted).length === 0 ? (
                <div className="py-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <Target className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-700">All caught up!</p>
                  <p className="text-xs text-slate-500 mt-0.5 mb-3">Set a new study target to keep your momentum</p>
                  <Link to="/goals">
                    <Button size="sm" variant="outline">
                      <Plus className="w-3.5 h-3.5 mr-1" /> Create Goal
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {(Array.isArray(goals) ? goals : [])
                    .filter((g) => !g.isCompleted)
                    .slice(0, 3)
                    .map((g) => {
                      const pct = Math.min(100, Math.round((g.currentValue / Math.max(1, g.targetValue)) * 100));
                      return (
                        <div key={g.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold text-slate-800">{g.title}</span>
                            <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-indigo-100 text-indigo-700">
                              +{g.xpReward} XP
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-xs text-slate-500">
                            <span>
                              Progress: {g.currentValue}/{g.targetValue}
                            </span>
                            <span>{pct}%</span>
                          </div>
                          <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-600 rounded-full transition-all" style={{ width: `${pct}%` }} />
                          </div>
                          <div className="flex justify-end pt-1">
                            <button
                              onClick={() => handleCompleteGoal(g.id, g.currentValue, g.targetValue)}
                              className="text-xs font-bold text-emerald-600 hover:text-emerald-800 flex items-center gap-1"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" /> Mark Completed
                            </button>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </Card>

            {/* Knowledge Gap Analyzer Alert */}
            <Card className="p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-rose-600" />
                    <h3 className="font-bold text-base text-slate-900">Skill Gap Diagnosis</h3>
                  </div>
                  <Link to="/dna" className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1">
                    Full Analysis <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>

                {weakTopics.length === 0 ? (
                  <div className="p-6 bg-emerald-50/70 border border-emerald-200 rounded-2xl text-center">
                    <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
                    <p className="text-sm font-bold text-emerald-950">Zero Critical Knowledge Gaps!</p>
                    <p className="text-xs text-emerald-800 mt-1">
                      You are performing above standard accuracy across all attempted subjects.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    <p className="text-xs text-slate-600">
                      Our diagnostic engine identified the following concepts where accuracy dropped below target:
                    </p>
                    {weakTopics.slice(0, 3).map((topic, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 rounded-xl bg-rose-50/70 border border-rose-200 text-xs"
                      >
                        <div>
                          <span className="font-bold text-rose-950 block">{topic}</span>
                          <span className="text-[11px] text-rose-700">Needs review to prevent exam mistakes</span>
                        </div>
                        <Link to={`/quiz-generator?topic=${encodeURIComponent(topic)}`}>
                          <Button size="sm" className="bg-rose-600 hover:bg-rose-700 text-white text-xs h-7 px-3">
                            Fix Gap
                          </Button>
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>Learning DNA Profile: Active</span>
                <Link to="/dna" className="font-semibold text-blue-600 hover:underline">
                  View DNA Radar &rarr;
                </Link>
              </div>
            </Card>
          </div>

          {/* Recent Quiz History */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-5 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Recent Quiz Attempts</h3>
                <p className="text-xs text-slate-500">Review answers, scores, and AI mistake breakdowns</p>
              </div>
              <Link to="/my-quizzes">
                <Button variant="outline" size="sm">
                  View All Quizzes
                </Button>
              </Link>
            </div>

            {recentQuizzes.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-slate-200 rounded-2xl bg-slate-50">
                <FileQuestion className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-700">No quizzes completed yet</p>
                <p className="text-xs text-slate-500 mt-0.5 mb-4">Generate your first AI quiz to test your mastery</p>
                <Link to="/quiz-generator">
                  <Button size="sm">Start First Quiz</Button>
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {recentQuizzes.slice(0, 5).map((att) => {
                  const quizInfo = (att.quizId as any) || {};
                  return (
                    <div
                      key={att._id || att.id}
                      className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60 rounded-xl px-2 transition-colors"
                    >
                      <div>
                        <h4 className="font-semibold text-slate-900 text-sm">
                          {quizInfo.title || 'AI Practice Quiz'}
                        </h4>
                        <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                          <span className="font-medium text-slate-700">{quizInfo.subjectName}</span>
                          <span>•</span>
                          <span className="capitalize">{quizInfo.difficulty}</span>
                          <span>•</span>
                          <span>{new Date(att.completedAt).toLocaleDateString()}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <span
                            className={`text-base font-extrabold ${
                              att.percentage >= 80
                                ? 'text-emerald-600'
                                : att.percentage >= 60
                                ? 'text-amber-600'
                                : 'text-rose-600'
                            }`}
                          >
                            {att.percentage}%
                          </span>
                          <span className="block text-[11px] text-slate-400">
                            {att.score}/{att.totalQuestions} Correct
                          </span>
                        </div>
                        <Link to={`/quiz-results/${att._id || att.id}`}>
                          <Button size="sm" variant="outline">
                            Review & Diagnostic
                          </Button>
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </main>
      </div>
    </div>
  );
};
