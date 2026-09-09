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
  AlertTriangle,
  Send,
  CheckCircle2,
  Clock,
  Target,
  Sparkles,
  UserCheck,
  Search,
} from 'lucide-react';

export const AdminAtRisk: React.FC = () => {
  const { toast } = useToast();
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Intervention modal
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
  const [actionType, setActionType] = useState('study_plan');
  const [customMessage, setCustomMessage] = useState('');
  const [dispatching, setDispatching] = useState(false);

  const fetchAtRiskStudents = async () => {
    try {
      const res = await API.get('/admin/at-risk');
      if (res.data.success) {
        setStudents(res.data.data || []);
      }
    } catch (e) {
      console.error(e);
      toast('error', 'Failed to fetch at-risk students');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAtRiskStudents();
  }, []);

  const handleDispatchIntervention = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;

    setDispatching(true);
    try {
      const res = await API.post(`/admin/at-risk/${selectedStudent.id}/intervene`, {
        action: actionType,
        customMessage,
      });

      if (res.data.success) {
        toast('success', `Intervention dispatched to ${selectedStudent.name}`);
        setSelectedStudent(null);
        setCustomMessage('');
      }
    } catch (e) {
      toast('error', 'Failed to dispatch intervention');
    } finally {
      setDispatching(false);
    }
  };

  if (loading) {
    return <Preloader message="Running At-Risk Diagnostic Engine..." subMessage="Scanning student quiz performance, accuracy decay, and inactivity thresholds" />;
  }

  const filtered = students.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
                <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center font-bold">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  At-Risk Student Intelligence
                </h1>
              </div>
              <p className="text-sm text-slate-600">
                Automated detection of students struggling with low assessment scores or sudden learning drop-offs.
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                placeholder="Search students..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              />
            </div>
          </div>

          {/* Student Cards List */}
          {filtered.length === 0 ? (
            <Card className="p-12 text-center border-dashed border-slate-300">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-slate-900">Zero Critical At-Risk Students</h3>
              <p className="text-xs text-slate-500 mt-1">
                All active learners are maintaining healthy study streaks and passing scores.
              </p>
            </Card>
          ) : (
            <div className="space-y-4">
              {filtered.map((s) => (
                <Card
                  key={s.id}
                  className="p-6 bg-white border-l-4 border-l-rose-500 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-6"
                >
                  <div className="space-y-2 max-w-2xl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-700 font-extrabold flex items-center justify-center text-sm">
                        {s.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-extrabold text-base text-slate-900">{s.name}</h4>
                        <span className="text-xs text-slate-500">{s.email}</span>
                      </div>
                      <Badge
                        variant={s.riskLevel === 'critical' ? 'danger' : 'warning'}
                        className="capitalize text-[10px] font-extrabold"
                      >
                        {s.riskLevel} Risk
                      </Badge>
                    </div>

                    <div className="p-3 rounded-xl bg-rose-50/70 border border-rose-200 text-xs text-rose-950 space-y-1">
                      <span className="font-bold block text-rose-800">Diagnostic Cause:</span>
                      <p>{s.riskReason}</p>
                    </div>

                    <div className="p-3 rounded-xl bg-indigo-50/60 border border-indigo-200 text-xs text-indigo-950 space-y-1">
                      <span className="font-bold block text-indigo-800">AI Recommended Intervention:</span>
                      <p>{s.recommendedIntervention}</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
                      <span>Avg Score: <strong className="text-rose-600">{s.averageScore}%</strong></span>
                      <span>•</span>
                      <span>Accuracy: <strong className="text-slate-800">{s.accuracyRate}%</strong></span>
                      <span>•</span>
                      <span>Quizzes: <strong>{s.totalQuizCount}</strong></span>
                      <span>•</span>
                      <span>
                        Last Active: <strong>{s.lastActiveDate ? new Date(s.lastActiveDate).toLocaleDateString() : 'Never'}</strong>
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row lg:flex-col gap-2 shrink-0">
                    <Button
                      size="sm"
                      onClick={() => setSelectedStudent(s)}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
                    >
                      <Send className="w-3.5 h-3.5 mr-1.5" /> Dispatch Intervention
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Intervention Modal */}
          {selectedStudent && (
            <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h3 className="font-extrabold text-base text-slate-900">
                    Dispatch Intervention for {selectedStudent.name}
                  </h3>
                  <button onClick={() => setSelectedStudent(null)} className="text-slate-400 hover:text-slate-700">
                    ✕
                  </button>
                </div>

                <form onSubmit={handleDispatchIntervention} className="space-y-3.5 text-xs">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Intervention Action</label>
                    <select
                      value={actionType}
                      onChange={(e) => setActionType(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm"
                    >
                      <option value="study_plan">Assign Recovery AI Study Plan</option>
                      <option value="nudge">Send Encouraging Study Streak Nudge (+50 XP bonus)</option>
                      <option value="tutor_session">Schedule 1-on-1 AI Tutor Review Session</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Custom Message (Optional)</label>
                    <textarea
                      rows={3}
                      placeholder="Leave blank to use pedagogical AI recommendation message..."
                      value={customMessage}
                      onChange={(e) => setCustomMessage(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <Button type="button" variant="outline" onClick={() => setSelectedStudent(null)}>
                      Cancel
                    </Button>
                    <Button type="submit" isLoading={dispatching}>
                      <Send className="w-3.5 h-3.5 mr-1" /> Send Notification
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
