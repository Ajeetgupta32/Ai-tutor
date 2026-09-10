import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.js';
import {
  LayoutDashboard,
  MessageSquare,
  Sparkles,
  CheckSquare,
  LineChart,
  BookMarked,
  User,
  ShieldCheck,
  Dna,
  Map,
  Calendar,
  Target,
  Award,
  AlertTriangle,
  Users,
  Layers,
  Database,
  Sliders,
  LifeBuoy,
  Megaphone,
  History,
} from 'lucide-react';
import { cn } from '../../lib/utils.js';

export const Sidebar: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';

  const studentNavItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Academy Courses', path: '/courses', icon: Layers, badge: 'XP & Certs' },
    { label: 'AI Tutor Chat', path: '/tutor', icon: MessageSquare, badge: 'Voice/ELI10' },
    { label: 'Learning DNA & Gaps', path: '/dna', icon: Dna },
    { label: 'Adaptive Roadmap', path: '/roadmap', icon: Map },
    { label: 'AI Study Planner', path: '/study-planner', icon: Calendar },
    { label: 'Learning Goals & XP', path: '/goals', icon: Target },
    { label: 'Quiz Generator', path: '/quiz-generator', icon: Sparkles },
    { label: 'My Quizzes', path: '/my-quizzes', icon: CheckSquare },
    { label: 'Verified Certificates', path: '/certificates', icon: Award },
    { label: 'Study Notes & PDFs', path: '/materials', icon: BookMarked },
    { label: 'Progress & Stats', path: '/progress', icon: LineChart },
    { label: 'Support & Help', path: '/support', icon: LifeBuoy },
    { label: 'My Profile', path: '/profile', icon: User },
  ];

  const adminNavItems = [
    { label: 'Overview & Analytics', path: '/admin', icon: LayoutDashboard },
    { label: 'At-Risk Intelligence', path: '/admin/at-risk', icon: AlertTriangle, badge: 'AI Action' },
    { label: 'User Directory', path: '/admin/users', icon: Users },
    { label: 'Course Builder', path: '/admin/courses', icon: Layers },
    { label: 'Question Bank (QC)', path: '/admin/question-bank', icon: Database },
    { label: 'AI Engine & Tokens', path: '/admin/ai-settings', icon: Sliders },
    { label: 'Support Desk', path: '/admin/support', icon: LifeBuoy },
    { label: 'Announcements', path: '/admin/announcements', icon: Megaphone },
    { label: 'Audit Trail Logs', path: '/admin/audit-logs', icon: History },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 p-4 flex flex-col justify-between hidden md:flex min-h-[calc(100vh-4rem)] max-h-[calc(100vh-4rem)] overflow-y-auto">
      <div className="space-y-5">
        {isAdmin ? (
          <div className="space-y-4">
            {/* Admin Header */}
            <div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold mb-2">
                <ShieldCheck className="w-4 h-4 text-amber-600" />
                <span>ADMIN PORTAL</span>
              </div>
              <div className="space-y-1">
                {adminNavItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      end={item.path === '/admin'}
                      className={({ isActive }) =>
                        cn(
                          'flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-colors',
                          isActive
                            ? 'bg-amber-100 text-amber-950 font-bold shadow-xs'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                        )
                      }
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>{item.label}</span>
                      </div>
                      {item.badge && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-200/80 text-amber-900">
                          {item.badge}
                        </span>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            </div>

            {/* Switch to Student Mode preview */}
            <div>
              <div className="px-3 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Student Mode Preview
              </div>
              <div className="space-y-0.5">
                {studentNavItems.slice(0, 5).map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      className={({ isActive }) =>
                        cn(
                          'flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                          isActive
                            ? 'bg-blue-50 text-blue-700 font-bold shadow-xs'
                            : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                        )
                      }
                    >
                      <Icon className="w-3.5 h-3.5 text-slate-400" />
                      <span>{item.label}</span>
                    </NavLink>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div>
            <div className="px-3 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Personal Learning Operating System
            </div>
            <div className="space-y-1">
              {studentNavItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors',
                        isActive
                          ? 'bg-blue-50 text-blue-700 font-bold shadow-xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      )
                    }
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className="w-4 h-4 text-slate-500 shrink-0" />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-100 text-blue-700">
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Quick Info Box */}
      <div className="mt-4 pt-3 border-t border-slate-100">
        {isAdmin ? (
          <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-amber-900">
            <p className="font-bold mb-0.5">Admin Control</p>
            <p className="text-[11px] text-amber-700 leading-relaxed mb-2">
              Review flagged AI items and inspect at-risk students.
            </p>
            <NavLink
              to="/admin/at-risk"
              className="inline-flex items-center text-xs font-bold text-amber-800 hover:text-amber-900"
            >
              Inspect At-Risk &rarr;
            </NavLink>
          </div>
        ) : (
          <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200/80 text-xs text-slate-700">
            <p className="font-bold text-blue-900 mb-0.5">Need instant help?</p>
            <p className="text-[11px] text-slate-600 leading-relaxed mb-2">
              Ask your AI Tutor or try "Explain Like I'm 10" mode.
            </p>
            <NavLink
              to="/tutor"
              className="inline-flex items-center text-xs font-bold text-blue-700 hover:text-blue-800"
            >
              Open AI Tutor &rarr;
            </NavLink>
          </div>
        )}
      </div>
    </aside>
  );
};
