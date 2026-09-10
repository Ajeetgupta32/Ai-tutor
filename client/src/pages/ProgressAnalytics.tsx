import React, { useEffect, useState } from 'react';
import API from '../api/axios.js';
import { Navbar } from '../components/layout/Navbar.js';
import { Sidebar } from '../components/layout/Sidebar.js';
import { Card } from '../components/ui/Card.js';
import { Badge } from '../components/ui/Badge.js';
import { Preloader } from '../components/ui/Preloader.js';
import { Trophy, TrendingUp, BarChart2, PieChart, Clock, Award } from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  AreaChart,
  Area,
} from 'recharts';
import { Achievement } from '../types/index.js';

export const ProgressAnalytics: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [scoreOverTime, setScoreOverTime] = useState<any[]>([]);
  const [subjectPerformance, setSubjectPerformance] = useState<any[]>([]);
  const [difficultyPerformance, setDifficultyPerformance] = useState<any[]>([]);
  const [studyTimeChart, setStudyTimeChart] = useState<any[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await API.get('/progress/analytics');
        if (res.data?.success) {
          const d = res.data.data || {};
          setScoreOverTime(Array.isArray(d.scoreOverTime) ? d.scoreOverTime : []);
          setSubjectPerformance(Array.isArray(d.subjectPerformance) ? d.subjectPerformance : []);
          setDifficultyPerformance(Array.isArray(d.difficultyPerformance) ? d.difficultyPerformance : []);
          setStudyTimeChart(Array.isArray(d.studyTimeChart) ? d.studyTimeChart : []);
          setAchievements(Array.isArray(d.achievements) ? d.achievements : []);
        }
      } catch (err) {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) {
    return <Preloader message="Generating analytics charts..." subMessage="Aggregating your mastery scores and study time" />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col">
      <Navbar />

      <div className="flex-1 flex">
        <Sidebar />

        <main className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full space-y-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Progress & Performance Analytics</h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Interactive charts tracking your accuracy, score progression, subject strengths, and study time
            </p>
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Score Over Time (Line Chart) */}
            <Card className="p-6">
              <h3 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-600" /> Score & Accuracy Progression
              </h3>
              <p className="text-xs text-slate-500 mb-6">Percentage score tracking across recent quiz attempts</p>

              <div className="h-64 w-full">
                {scoreOverTime.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-xs text-slate-400">
                    No attempt data available yet
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={scoreOverTime}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} />
                      <YAxis stroke="#94a3b8" fontSize={11} domain={[0, 100]} />
                      <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', color: '#0f172a' }} />
                      <Line type="monotone" dataKey="score" stroke="#2563eb" strokeWidth={3} dot={{ r: 4, fill: '#2563eb' }} name="Score %" />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </Card>

            {/* Subject Performance (Bar Chart) */}
            <Card className="p-6">
              <h3 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-2">
                <BarChart2 className="w-5 h-5 text-sky-600" /> Subject Average Mastery
              </h3>
              <p className="text-xs text-slate-500 mb-6">Average score performance grouped by educational domain</p>

              <div className="h-64 w-full">
                {subjectPerformance.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-xs text-slate-400">
                    No subject data available yet
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={subjectPerformance}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="subject" stroke="#94a3b8" fontSize={11} />
                      <YAxis stroke="#94a3b8" fontSize={11} domain={[0, 100]} />
                      <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', color: '#0f172a' }} />
                      <Bar dataKey="averageScore" fill="#0284c7" radius={[6, 6, 0, 0]} name="Avg Score %" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </Card>

            {/* Difficulty Breakdown (Bar Chart) */}
            <Card className="p-6">
              <h3 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-2">
                <PieChart className="w-5 h-5 text-purple-600" /> Difficulty Performance Breakdown
              </h3>
              <p className="text-xs text-slate-500 mb-6">Average performance across Beginner, Intermediate, and Advanced</p>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={difficultyPerformance}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="difficulty" stroke="#94a3b8" fontSize={11} />
                    <YAxis stroke="#94a3b8" fontSize={11} domain={[0, 100]} />
                    <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', color: '#0f172a' }} />
                    <Bar dataKey="averageScore" fill="#7c3aed" radius={[6, 6, 0, 0]} name="Accuracy %" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Study Time Distribution (Area Chart) */}
            <Card className="p-6">
              <h3 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-2">
                <Clock className="w-5 h-5 text-emerald-600" /> Study Time Distribution (Minutes)
              </h3>
              <p className="text-xs text-slate-500 mb-6">Active learning minutes spent per day</p>

              <div className="h-64 w-full">
                {studyTimeChart.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-xs text-slate-400">
                    No study time logged yet
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={studyTimeChart}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} />
                      <YAxis stroke="#94a3b8" fontSize={11} />
                      <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', color: '#0f172a' }} />
                      <Area type="monotone" dataKey="minutes" stroke="#059669" fill="#10b981" fillOpacity={0.15} name="Minutes" />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </Card>
          </div>

          {/* Badges / Achievements Section */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-500" /> Unlocked Achievement Badges
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Earn badges by achieving high scores and maintaining study streaks</p>
              </div>
              <Badge variant="warning">{achievements.length} Badges Earned</Badge>
            </div>

            {achievements.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500 border border-dashed border-slate-200 rounded-xl bg-slate-50">
                Complete your first quiz with high accuracy to unlock achievement badges!
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {(Array.isArray(achievements) ? achievements : []).map((ach) => (
                  <div key={ach._id} className="p-4 rounded-xl border border-amber-200 bg-amber-50/50 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-600 flex-shrink-0">
                      <Trophy className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">{ach.badgeName}</h4>
                      <p className="text-xs text-slate-600 mt-0.5">{ach.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </main>
      </div>
    </div>
  );
};
