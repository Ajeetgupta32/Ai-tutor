import React, { useEffect, useState } from 'react';
import API from '../lib/api.js';
import { Navbar } from '../components/layout/Navbar.js';
import { Sidebar } from '../components/layout/Sidebar.js';
import { Card } from '../components/ui/Card.js';
import { Button } from '../components/ui/Button.js';
import { Badge } from '../components/ui/Badge.js';
import { Preloader } from '../components/ui/Preloader.js';
import { useToast } from '../context/ToastContext.js';
import {
  Calendar,
  Sparkles,
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  Target,
  BookOpen,
  CheckSquare,
} from 'lucide-react';
import { StudyPlan } from '../types/index.js';

export const StudyPlanner: React.FC = () => {
  const { toast } = useToast();
  const [plans, setPlans] = useState<StudyPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  // Form states
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [targetExam, setTargetExam] = useState('Final Semester Assessment');
  const [targetScore, setTargetScore] = useState(90);
  const [dailyHours, setDailyHours] = useState(2.0);
  const [examDate, setExamDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 28);
    return d.toISOString().split('T')[0];
  });
  const [weakTopicsStr, setWeakTopicsStr] = useState('Algorithms, Binary Trees, SQL Joins');

  const fetchPlans = async () => {
    try {
      const res = await API.get('/study-plans');
      if (res.data.success) {
        setPlans(res.data.data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !targetExam.trim()) {
      toast('error', 'Please enter a plan title and exam name');
      return;
    }

    setGenerating(true);
    try {
      const weakTopics = weakTopicsStr
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const res = await API.post('/study-plans/generate', {
        title,
        targetExam,
        examDate,
        targetScore,
        dailyHours,
        weakTopics,
      });

      if (res.data.success) {
        toast('success', 'AI Study Plan generated!');
        setShowModal(false);
        fetchPlans();
      }
    } catch (err) {
      toast('error', 'Failed to generate study plan');
    } finally {
      setGenerating(false);
    }
  };

  const handleDeletePlan = async (planId: string) => {
    try {
      await API.delete(`/study-plans/${planId}`);
      setPlans((prev) => prev.filter((p) => p.id !== planId));
      toast('info', 'Study plan deleted');
    } catch (e) {
      toast('error', 'Failed to delete plan');
    }
  };

  if (loading) {
    return <Preloader message="Loading your AI study schedules..." subMessage="Fetching timeline and daily task checklists" />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      <Navbar />

      <div className="flex-1 flex">
        <Sidebar />

        <main className="flex-1 p-5 sm:p-8 max-w-7xl mx-auto w-full space-y-6">
          {/* Header */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center font-bold">
                  <Calendar className="w-6 h-6" />
                </div>
                <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">AI Study Planner</h1>
              </div>
              <p className="text-sm text-slate-600">
                Generate personalized, day-by-day mastery roadmaps tailored to your upcoming test deadlines.
              </p>
            </div>

            <Button onClick={() => setShowModal(true)}>
              <Sparkles className="w-4 h-4 mr-1.5" /> Generate New Plan
            </Button>
          </div>

          {/* Study Plans List */}
          {plans.length === 0 ? (
            <Card className="p-12 text-center border-dashed border-slate-300">
              <Calendar className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-slate-800">No active study plans</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-5">
                Let EduMentor AI design a structured day-by-day revision calendar targeting your exact weak topics.
              </p>
              <Button onClick={() => setShowModal(true)}>
                <Sparkles className="w-4 h-4 mr-1.5" /> Generate AI Study Plan
              </Button>
            </Card>
          ) : (
            <div className="space-y-8">
              {plans.map((plan) => {
                const days = (plan.scheduleJson as any) || [];
                return (
                  <Card key={plan.id} className="p-6 space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-xl font-extrabold text-slate-900">{plan.title}</h2>
                          <Badge variant="primary">{plan.targetExam}</Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1.5">
                          <span className="flex items-center gap-1">
                            <Target className="w-3.5 h-3.5 text-indigo-600" /> Target: {plan.targetScore}%+
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-blue-600" /> {plan.dailyHours} hrs/day
                          </span>
                          <span>•</span>
                          <span>Exam: {new Date(plan.examDate).toLocaleDateString()}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleDeletePlan(plan.id)}
                        className="p-2 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 transition-colors self-start sm:self-auto"
                        title="Delete Plan"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Daily Schedule Timeline */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {days.map((d: any, idx: number) => (
                        <div
                          key={idx}
                          className={`p-4 rounded-2xl border text-xs space-y-2.5 transition-all ${
                            d.isMockDay
                              ? 'bg-amber-50/60 border-amber-300'
                              : 'bg-slate-50/80 border-slate-200 hover:bg-white hover:shadow-xs'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-extrabold text-slate-900">{d.dateStr || `Day ${d.dayNumber}`}</span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700">
                              {d.estimatedMinutes || 60} mins
                            </span>
                          </div>

                          <div>
                            <span className="text-[11px] font-semibold text-purple-700 block">{d.subject}</span>
                            <h4 className="font-bold text-slate-800 text-sm">{d.topic}</h4>
                          </div>

                          <div className="space-y-1.5 pt-1">
                            {d.tasks?.map((t: string, tIdx: number) => (
                              <div key={tIdx} className="flex items-start gap-2 text-slate-600">
                                <CheckSquare className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                                <span className="leading-tight">{t}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Generator Modal */}
          {showModal && (
            <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h3 className="font-extrabold text-lg text-slate-900">Generate AI Study Plan</h3>
                  <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-700">
                    ✕
                  </button>
                </div>

                <form onSubmit={handleCreatePlan} className="space-y-3.5 text-xs">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Plan Title</label>
                    <input
                      placeholder="e.g. 4-Week Computer Science Mastery"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">Target Exam / Subject</label>
                      <input
                        value={targetExam}
                        onChange={(e) => setTargetExam(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">Exam Date</label>
                      <input
                        type="date"
                        value={examDate}
                        onChange={(e) => setExamDate(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">Target Score (%)</label>
                      <input
                        type="number"
                        min="50"
                        max="100"
                        value={targetScore}
                        onChange={(e) => setTargetScore(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">Daily Study (Hours)</label>
                      <input
                        type="number"
                        min="0.5"
                        max="8"
                        step="0.5"
                        value={dailyHours}
                        onChange={(e) => setDailyHours(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Weak Topics (Comma-separated)</label>
                    <input
                      placeholder="e.g. Graph Algorithms, Normalization, React State"
                      value={weakTopicsStr}
                      onChange={(e) => setWeakTopicsStr(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-3">
                    <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" isLoading={generating}>
                      <Sparkles className="w-4 h-4 mr-1" /> Generate Schedule
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
