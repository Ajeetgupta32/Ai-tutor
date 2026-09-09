import React from 'react';
import { useAuth } from '../context/AuthContext.js';
import { Navbar } from '../components/layout/Navbar.js';
import { Sidebar } from '../components/layout/Sidebar.js';
import { Card } from '../components/ui/Card.js';
import { Badge } from '../components/ui/Badge.js';
import { User as UserIcon, Mail, ShieldCheck, Flame, Award, Clock, Target } from 'lucide-react';

export const Profile: React.FC = () => {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col">
      <Navbar />

      <div className="flex-1 flex">
        <Sidebar />

        <main className="flex-1 p-6 md:p-8 max-w-4xl mx-auto w-full space-y-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Student Profile</h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">Account overview and aggregated learning milestones</p>
          </div>

          {/* Profile Card */}
          <Card className="p-8 flex flex-col sm:flex-row items-center gap-6">
            <div className="w-24 h-24 rounded-full bg-blue-100 border-2 border-blue-200 flex items-center justify-center text-3xl font-bold text-blue-700 flex-shrink-0 shadow-inner">
              {user.name.charAt(0).toUpperCase()}
            </div>

            <div className="space-y-2 text-center sm:text-left flex-1">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h2 className="text-2xl font-bold text-slate-900">{user.name}</h2>
                <Badge variant="primary" className="capitalize">
                  {user.role}
                </Badge>
              </div>

              <p className="text-sm text-slate-500 flex items-center justify-center sm:justify-start gap-1.5">
                <Mail className="w-4 h-4 text-slate-400" /> {user.email}
              </p>

              <div className="pt-2 flex flex-wrap gap-2 justify-center sm:justify-start text-xs">
                <Badge variant="secondary">Level: {user.level}</Badge>
                <Badge variant="warning" className="flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500" /> {user.studyStreak} Day Streak
                </Badge>
              </div>
            </div>
          </Card>

          {/* Aggregated Statistics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-5 text-center">
              <span className="text-xs text-slate-500 font-semibold block uppercase mb-1">Total Quizzes</span>
              <span className="text-3xl font-black text-slate-900">{user.totalQuizCount}</span>
            </Card>

            <Card className="p-5 text-center">
              <span className="text-xs text-slate-500 font-semibold block uppercase mb-1">Average Score</span>
              <span className="text-3xl font-black text-blue-600">{user.averageScore}%</span>
            </Card>

            <Card className="p-5 text-center">
              <span className="text-xs text-slate-500 font-semibold block uppercase mb-1">Accuracy</span>
              <span className="text-3xl font-black text-emerald-600">{user.accuracyRate}%</span>
            </Card>

            <Card className="p-5 text-center">
              <span className="text-xs text-slate-500 font-semibold block uppercase mb-1">Study Time</span>
              <span className="text-3xl font-black text-purple-600">{user.totalStudyTimeMinutes} min</span>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
};
