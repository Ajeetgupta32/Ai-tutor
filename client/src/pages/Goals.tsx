import React, { useEffect, useState } from 'react';
import API from '../lib/api.js';
import { useAuth } from '../context/AuthContext.js';
import { Navbar } from '../components/layout/Navbar.js';
import { Sidebar } from '../components/layout/Sidebar.js';
import { Card } from '../components/ui/Card.js';
import { Button } from '../components/ui/Button.js';
import { Badge } from '../components/ui/Badge.js';
import { Preloader } from '../components/ui/Preloader.js';
import { useToast } from '../context/ToastContext.js';
import {
  Target,
  Zap,
  Plus,
  Trash2,
  CheckCircle2,
  Trophy,
  Flame,
  Award,
} from 'lucide-react';
import { Goal } from '../types/index.js';

export const Goals: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [type, setType] = useState('daily');
  const [targetValue, setTargetValue] = useState(3);
  const [xpReward, setXpReward] = useState(50);

  const fetchGoals = async () => {
    try {
      const res = await API.get('/goals');
      if (res.data?.success) {
        const rawGoals = res.data.data ?? res.data.goals;
        const goalsArray = Array.isArray(rawGoals)
          ? rawGoals
          : Array.isArray(rawGoals?.goals)
          ? rawGoals.goals
          : [];
        setGoals(goalsArray);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      const res = await API.post('/goals', {
        title,
        type,
        targetValue,
        xpReward,
      });
      if (res.data.success) {
        setGoals([res.data.data, ...goals]);
        setShowModal(false);
        setTitle('');
        toast('success', 'Goal set successfully!');
      }
    } catch (e) {
      toast('error', 'Failed to create goal');
    }
  };

  const handleIncrement = async (goal: Goal) => {
    const nextVal = goal.currentValue + 1;
    try {
      const res = await API.patch(`/goals/${goal.id}`, {
        currentValue: nextVal,
      });
      if (res.data.success) {
        setGoals((prev) => prev.map((g) => (g.id === goal.id ? res.data.data : g)));
        if (res.data.xpAwarded) {
          toast('success', `🎉 ${res.data.message}`);
          if (refreshUser) refreshUser();
        }
      }
    } catch (e) {
      toast('error', 'Failed to update goal');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await API.delete(`/goals/${id}`);
      setGoals((prev) => prev.filter((g) => g.id !== id));
      toast('info', 'Goal deleted');
    } catch (e) {
      toast('error', 'Failed to delete goal');
    }
  };

  if (loading) {
    return <Preloader message="Loading your goals & achievements..." subMessage="Calculating XP milestones & active targets" />;
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
                <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center font-bold">
                  <Target className="w-6 h-6" />
                </div>
                <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Learning Goals & Gamification</h1>
              </div>
              <p className="text-sm text-slate-600">
                Set daily habits and exam objectives. Complete targets to earn XP and level up your mastery ranking.
              </p>
            </div>

            <Button onClick={() => setShowModal(true)}>
              <Plus className="w-4 h-4 mr-1.5" /> Create New Goal
            </Button>
          </div>

          {/* Gamification Stats Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="p-5 flex items-center gap-4 bg-indigo-50/70 border-indigo-200">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                <Zap className="w-6 h-6 fill-white" />
              </div>
              <div>
                <span className="text-xs font-bold uppercase text-indigo-700 block">Total Experience</span>
                <span className="text-2xl font-black text-indigo-950">{user?.xp || 0} XP</span>
              </div>
            </Card>

            <Card className="p-5 flex items-center gap-4 bg-amber-50/70 border-amber-200">
              <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
                <Flame className="w-6 h-6 fill-white" />
              </div>
              <div>
                <span className="text-xs font-bold uppercase text-amber-700 block">Study Streak</span>
                <span className="text-2xl font-black text-amber-950">{user?.studyStreak || 1} Days Active</span>
              </div>
            </Card>

            <Card className="p-5 flex items-center gap-4 bg-emerald-50/70 border-emerald-200">
              <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                <Trophy className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-bold uppercase text-emerald-700 block">Goals Completed</span>
                <span className="text-2xl font-black text-emerald-950">
                  {goals.filter((g) => g.isCompleted).length}
                </span>
              </div>
            </Card>
          </div>

          {/* Goals List */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Active & Completed Targets</h3>

            {goals.length === 0 ? (
              <Card className="p-12 text-center border-dashed border-slate-300">
                <Target className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                <h4 className="text-base font-bold text-slate-800">No goals set yet</h4>
                <p className="text-xs text-slate-500 mt-1 mb-4">
                  Set daily learning targets like "Solve 5 MCQs" to keep your study streak active.
                </p>
                <Button onClick={() => setShowModal(true)}>
                  <Plus className="w-4 h-4 mr-1.5" /> Create First Goal
                </Button>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {goals.map((goal) => {
                  const pct = Math.min(100, Math.round((goal.currentValue / Math.max(1, goal.targetValue)) * 100));
                  return (
                    <Card
                      key={goal.id}
                      className={`p-5 flex flex-col justify-between transition-all ${
                        goal.isCompleted
                          ? 'bg-emerald-50/50 border-emerald-200 opacity-90'
                          : 'bg-white border-slate-200 hover:border-indigo-300 shadow-xs'
                      }`}
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Badge variant={goal.isCompleted ? 'success' : 'primary'} className="capitalize text-[10px]">
                            {goal.type}
                          </Badge>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-100 text-indigo-700">
                            +{goal.xpReward} XP
                          </span>
                        </div>

                        <div>
                          <h4 className="font-extrabold text-slate-900 text-sm">{goal.title}</h4>
                          <span className="text-xs text-slate-500 mt-0.5 block">
                            Progress: {goal.currentValue} / {goal.targetValue}
                          </span>
                        </div>

                        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              goal.isCompleted ? 'bg-emerald-500' : 'bg-indigo-600'
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>

                      <div className="pt-4 border-t border-slate-100 flex items-center justify-between mt-3">
                        {!goal.isCompleted ? (
                          <Button size="sm" onClick={() => handleIncrement(goal)} className="text-xs h-8 px-3">
                            <Plus className="w-3.5 h-3.5 mr-1" /> Add Progress (+1)
                          </Button>
                        ) : (
                          <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                            <CheckCircle2 className="w-4 h-4" /> Goal Completed
                          </span>
                        )}

                        <button
                          onClick={() => handleDelete(goal.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          {/* Goal Modal */}
          {showModal && (
            <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h3 className="font-extrabold text-base text-slate-900">Create Learning Target</h3>
                  <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-700">
                    ✕
                  </button>
                </div>

                <form onSubmit={handleCreateGoal} className="space-y-3 text-xs">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Target Title</label>
                    <input
                      placeholder="e.g. Complete 3 Algorithms Quizzes"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">Goal Type</label>
                      <select
                        value={type}
                        onChange={(e) => setType(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm"
                      >
                        <option value="daily">Daily Target</option>
                        <option value="weekly">Weekly Target</option>
                        <option value="exam">Exam Milestone</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-700 font-bold mb-1">Target Value</label>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={targetValue}
                        onChange={(e) => setTargetValue(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">XP Reward</label>
                    <input
                      type="number"
                      min="10"
                      max="500"
                      step="10"
                      value={xpReward}
                      onChange={(e) => setXpReward(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-3">
                    <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">Save Goal</Button>
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
