import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import API from '../lib/api.js';
import { Navbar } from '../components/layout/Navbar.js';
import { Sidebar } from '../components/layout/Sidebar.js';
import { Card } from '../components/ui/Card.js';
import { Button } from '../components/ui/Button.js';
import { Badge } from '../components/ui/Badge.js';
import { Preloader } from '../components/ui/Preloader.js';
import { useToast } from '../context/ToastContext.js';
import {
  Users,
  FileQuestion,
  Activity,
  Cpu,
  ShieldCheck,
  Trash2,
  Award,
  BookOpen,
  Search,
  AlertTriangle,
  Layers,
  Database,
  Sliders,
  LifeBuoy,
  Megaphone,
  History,
  ArrowRight,
} from 'lucide-react';
import { User } from '../types/index.js';

export const AdminDashboard: React.FC = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [metrics, setMetrics] = useState({
    totalStudents: 0,
    totalQuizzes: 0,
    totalAttempts: 0,
    totalCourses: 0,
    openTickets: 0,
    atRiskStudents: 0,
    activeUsers: 0,
    totalTokensUsed: 0,
    averagePerformance: 0,
  });
  const [popularSubjects, setPopularSubjects] = useState<any[]>([]);

  const fetchAdminData = async () => {
    try {
      const res = await API.get('/admin/metrics');
      if (res.data.success) {
        setMetrics(res.data.data.metrics);
        setPopularSubjects(res.data.data.popularSubjects || []);
      }
    } catch (err: any) {
      toast('error', 'Failed to fetch platform metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  if (loading) {
    return <Preloader message="Loading admin intelligence overview..." subMessage="Fetching system metrics and student analytics" />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col">
      <Navbar />

      <div className="flex-1 flex">
        <Sidebar />

        <main className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-7 h-7 text-amber-500" /> Admin Command Center
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Institutional governance, At-Risk student interventions, curriculum builder, and AI quality control
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Link to="/admin/at-risk">
                <Button size="sm" className="bg-rose-600 hover:bg-rose-700 text-white font-semibold">
                  <AlertTriangle className="w-4 h-4 mr-1.5" /> At-Risk Students ({metrics.atRiskStudents})
                </Button>
              </Link>
            </div>
          </div>

          {/* At-Risk Warning Box */}
          {metrics.atRiskStudents > 0 && (
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-rose-500 to-rose-600 text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base">
                    {metrics.atRiskStudents} Students Require Academic Intervention
                  </h3>
                  <p className="text-xs text-rose-100">
                    Low accuracy rates (&lt;50%) or sudden inactivity for &gt;14 days detected. Send recovery study plans now.
                  </p>
                </div>
              </div>
              <Link to="/admin/at-risk">
                <Button size="sm" className="bg-white text-rose-900 hover:bg-rose-50 font-bold">
                  Review & Intervene &rarr;
                </Button>
              </Link>
            </div>
          )}

          {/* Platform Metrics Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-5">
              <span className="text-xs text-slate-500 font-bold uppercase block mb-1">Total Students</span>
              <span className="text-3xl font-black text-slate-900">{metrics.totalStudents}</span>
              <span className="text-[11px] text-slate-400 block mt-1">Registered learner accounts</span>
            </Card>

            <Card className="p-5">
              <span className="text-xs text-slate-500 font-bold uppercase block mb-1">Active Users (7d)</span>
              <span className="text-3xl font-black text-blue-600">{metrics.activeUsers}</span>
              <span className="text-[11px] text-slate-400 block mt-1">Logged active study sessions</span>
            </Card>

            <Card className="p-5">
              <span className="text-xs text-slate-500 font-bold uppercase block mb-1">Quiz Attempts</span>
              <span className="text-3xl font-black text-emerald-600">{metrics.totalAttempts}</span>
              <span className="text-[11px] text-slate-400 block mt-1">Total completed assessments</span>
            </Card>

            <Card className="p-5">
              <span className="text-xs text-slate-500 font-bold uppercase block mb-1">AI Tokens Consumed</span>
              <span className="text-3xl font-black text-purple-600">{metrics.totalTokensUsed}</span>
              <span className="text-[11px] text-slate-400 block mt-1">Gemini AI engine queries</span>
            </Card>
          </div>

          {/* Quick Management Suite Navigation */}
          <div>
            <h2 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-3">
              Management Suite
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Link to="/admin/at-risk">
                <Card hoverEffect className="p-5 border-rose-200 bg-rose-50/30">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center font-bold">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">At-Risk Intelligence</h4>
                      <span className="text-xs text-rose-700 font-semibold">{metrics.atRiskStudents} flagged learners</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500">
                    Automated drop-off detection and 1-click tailored intervention dispatch.
                  </p>
                </Card>
              </Link>

              <Link to="/admin/users">
                <Card hoverEffect className="p-5">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                      <Users className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">User Directory & Profiles</h4>
                      <span className="text-xs text-slate-500 font-semibold">{metrics.totalStudents} accounts</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500">
                    Inspect student attempt history, study streaks, DNA profiles & roles.
                  </p>
                </Card>
              </Link>

              <Link to="/admin/courses">
                <Card hoverEffect className="p-5">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center font-bold">
                      <Layers className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">Course & Curriculum Builder</h4>
                      <span className="text-xs text-slate-500 font-semibold">{metrics.totalCourses} courses</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500">
                    Create courses, modules, lessons, and structured syllabus trees.
                  </p>
                </Card>
              </Link>

              <Link to="/admin/question-bank">
                <Card hoverEffect className="p-5">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
                      <Database className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">Question Bank & QC</h4>
                      <span className="text-xs text-slate-500 font-semibold">AI Quality Review</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500">
                    Review generated MCQs, filter by subject/difficulty, and approve questions.
                  </p>
                </Card>
              </Link>

              <Link to="/admin/ai-settings">
                <Card hoverEffect className="p-5">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center font-bold">
                      <Sliders className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">AI Engine & Usage</h4>
                      <span className="text-xs text-slate-500 font-semibold">{metrics.totalTokensUsed} tokens</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500">
                    Monitor token usage by feature, view popular queries, and configure model safety.
                  </p>
                </Card>
              </Link>

              <Link to="/admin/support">
                <Card hoverEffect className="p-5">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center font-bold">
                      <LifeBuoy className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">Support Desk</h4>
                      <span className="text-xs text-sky-700 font-semibold">{metrics.openTickets} open tickets</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500">
                    Respond to student inquiries, resolve question disputes, and track SLA.
                  </p>
                </Card>
              </Link>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
