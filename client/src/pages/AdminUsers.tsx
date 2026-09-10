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
  Users,
  Search,
  ShieldCheck,
  Trash2,
  Eye,
  Award,
  Calendar,
  CheckCircle2,
  X,
  Target,
  Zap,
} from 'lucide-react';
import { User } from '../types/index.js';

export const AdminUsers: React.FC = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  // Detailed profile state
  const [selectedUserDetail, setSelectedUserDetail] = useState<any | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const fetchUsers = async () => {
    try {
      const res = await API.get('/admin/users');
      if (res.data?.success) {
        const raw = res.data.data?.users || res.data.data || [];
        setUsers(Array.isArray(raw) ? raw : []);
      }
    } catch (e) {
      toast('error', 'Failed to fetch user directory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleInspectUser = async (userId: string) => {
    setLoadingDetail(true);
    try {
      const res = await API.get(`/admin/users/${userId}`);
      if (res.data.success) {
        setSelectedUserDetail(res.data.data);
      }
    } catch (e) {
      toast('error', 'Failed to load user profile details');
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleUpdateRole = async (userId: string, newRole: string) => {
    try {
      await API.put(`/admin/users/${userId}/role`, { role: newRole });
      toast('success', 'User role updated');
      fetchUsers();
    } catch (e) {
      toast('error', 'Failed to update role');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      await API.delete(`/admin/users/${userId}`);
      toast('info', 'User deleted');
      fetchUsers();
    } catch (e) {
      toast('error', 'Failed to delete user');
    }
  };

  if (loading) {
    return <Preloader message="Loading user directory..." subMessage="Fetching student profiles and permissions" />;
  }

  const userList = Array.isArray(users) ? users : [];
  const filtered = userList.filter((u) => {
    const matchesSearch =
      (u.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

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
                <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                  <Users className="w-6 h-6" />
                </div>
                <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  User Directory & Deep Inspection
                </h1>
              </div>
              <p className="text-sm text-slate-600">
                Manage roles, inspect student quiz attempt histories, learning DNA, and earned certificates.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold"
              >
                <option value="all">All Roles</option>
                <option value="student">Students</option>
                <option value="admin">Administrators</option>
                <option value="teacher">Teachers</option>
                <option value="support">Support</option>
              </select>

              <div className="relative flex-1 sm:w-60">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                />
              </div>
            </div>
          </div>

          {/* Users Table */}
          <Card className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold text-[10px]">
                  <tr>
                    <th className="px-4 py-3">User</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">XP / Streak</th>
                    <th className="px-4 py-3">Avg Score</th>
                    <th className="px-4 py-3">Quizzes</th>
                    <th className="px-4 py-3">Joined</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((u) => (
                    <tr key={u.id || u._id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs">
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block">{u.name}</span>
                            <span className="text-[11px] text-slate-400">{u.email}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <select
                          value={u.role}
                          onChange={(e) => handleUpdateRole(u.id || u._id!, e.target.value)}
                          className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 capitalize"
                        >
                          <option value="student">Student</option>
                          <option value="teacher">Teacher</option>
                          <option value="content_manager">Content Manager</option>
                          <option value="support">Support</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="font-bold text-indigo-600">{u.xp || 0} XP</span>
                        <span className="text-[11px] text-slate-400 block">{u.studyStreak}d streak</span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`font-bold ${
                            u.averageScore >= 80
                              ? 'text-emerald-600'
                              : u.averageScore >= 60
                              ? 'text-amber-600'
                              : 'text-rose-600'
                          }`}
                        >
                          {u.averageScore}%
                        </span>
                      </td>
                      <td className="px-4 py-3.5 font-semibold text-slate-800">{u.totalQuizCount}</td>
                      <td className="px-4 py-3.5 text-slate-400">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3.5 text-right space-x-1.5">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs px-2.5"
                          onClick={() => handleInspectUser(u.id || u._id!)}
                        >
                          <Eye className="w-3.5 h-3.5 mr-1" /> Inspect
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          className="h-7 px-2"
                          onClick={() => handleDeleteUser(u.id || u._id!)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Detailed Inspection Drawer */}
          {selectedUserDetail && (
            <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="font-extrabold text-lg text-slate-900">{selectedUserDetail.name}</h3>
                    <p className="text-xs text-slate-500">{selectedUserDetail.email}</p>
                  </div>
                  <button onClick={() => setSelectedUserDetail(null)} className="text-slate-400 hover:text-slate-700">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-3 text-xs">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-slate-400 font-bold uppercase block text-[10px]">Average Score</span>
                    <span className="text-xl font-black text-indigo-600">{selectedUserDetail.averageScore}%</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-slate-400 font-bold uppercase block text-[10px]">Total XP</span>
                    <span className="text-xl font-black text-amber-600">{selectedUserDetail.xp || 0} XP</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-slate-400 font-bold uppercase block text-[10px]">Certificates</span>
                    <span className="text-xl font-black text-emerald-600">
                      {selectedUserDetail.certificates?.length || 0}
                    </span>
                  </div>
                </div>

                {/* Recent Quiz Attempts */}
                <div className="space-y-2 text-xs">
                  <h4 className="font-bold text-slate-800">Recent Quiz Attempts</h4>
                  {selectedUserDetail.quizAttempts?.length === 0 ? (
                    <p className="text-slate-400 italic">No quiz attempts logged.</p>
                  ) : (
                    <div className="space-y-1.5 max-h-40 overflow-y-auto">
                      {(Array.isArray(selectedUserDetail.quizAttempts) ? selectedUserDetail.quizAttempts : []).map((qa: any) => (
                        <div
                          key={qa.id}
                          className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between"
                        >
                          <span className="font-semibold text-slate-800">{qa.quiz?.title || 'Quiz'}</span>
                          <span className="font-extrabold text-blue-600">{qa.percentage}%</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex justify-end pt-2">
                  <Button onClick={() => setSelectedUserDetail(null)}>Close Profile</Button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
