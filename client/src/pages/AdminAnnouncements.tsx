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
  Megaphone,
  Plus,
  Trash2,
  Send,
  Calendar,
  Users,
} from 'lucide-react';
import { Announcement } from '../types/index.js';

export const AdminAnnouncements: React.FC = () => {
  const { toast } = useToast();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [priority, setPriority] = useState('normal');
  const [targetRole, setTargetRole] = useState('all');
  const [publishing, setPublishing] = useState(false);

  const fetchAnnouncements = async () => {
    try {
      const res = await API.get('/announcements/all');
      if (res.data?.success) {
        const raw = res.data.data?.announcements || res.data.data || res.data.announcements || [];
        setAnnouncements(Array.isArray(raw) ? raw : []);
      }
    } catch (e) {
      toast('error', 'Failed to fetch announcements');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setPublishing(true);
    try {
      const res = await API.post('/announcements', {
        title,
        content,
        priority,
        targetRole,
      });

      if (res.data.success) {
        toast('success', 'Announcement published and notifications sent!');
        setShowModal(false);
        setTitle('');
        setContent('');
        fetchAnnouncements();
      }
    } catch (e) {
      toast('error', 'Failed to publish announcement');
    } finally {
      setPublishing(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await API.delete(`/announcements/${id}`);
      setAnnouncements((prev) => prev.filter((a) => a.id !== id));
      toast('info', 'Announcement deleted');
    } catch (e) {
      toast('error', 'Failed to delete');
    }
  };

  if (loading) {
    return <Preloader message="Loading announcements..." subMessage="Fetching system broadcast alerts" />;
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
                  <Megaphone className="w-6 h-6" />
                </div>
                <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  System Announcements & Broadcasts
                </h1>
              </div>
              <p className="text-sm text-slate-600">
                Publish system-wide notifications, exam schedules, and curriculum updates.
              </p>
            </div>

            <Button onClick={() => setShowModal(true)}>
              <Plus className="w-4 h-4 mr-1.5" /> Publish Announcement
            </Button>
          </div>

          {/* Announcements List */}
          {announcements.length === 0 ? (
            <Card className="p-12 text-center border-dashed border-slate-300">
              <Megaphone className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <h4 className="text-base font-bold text-slate-800">No active announcements</h4>
            </Card>
          ) : (
            <div className="space-y-4">
              {(Array.isArray(announcements) ? announcements : []).map((a) => (
                <Card key={a.id} className="p-6 space-y-3 bg-white">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge
                          variant={
                            a.priority === 'urgent' || a.priority === 'high'
                              ? 'danger'
                              : 'primary'
                          }
                          className="capitalize text-[10px]"
                        >
                          {a.priority}
                        </Badge>
                        <span>•</span>
                        <span className="text-xs text-slate-400 font-semibold">Target: {a.targetRole}</span>
                        <span>•</span>
                        <span className="text-xs text-slate-400">{new Date(a.createdAt).toLocaleDateString()}</span>
                      </div>
                      <h4 className="font-extrabold text-base text-slate-900">{a.title}</h4>
                    </div>

                    <button
                      onClick={() => handleDelete(a.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 self-start sm:self-auto"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">{a.content}</p>
                </Card>
              ))}
            </div>
          )}

          {/* Publish Modal */}
          {showModal && (
            <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h3 className="font-extrabold text-base text-slate-900">Publish System Announcement</h3>
                  <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-700">
                    ✕
                  </button>
                </div>

                <form onSubmit={handleCreateAnnouncement} className="space-y-3 text-xs">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Title</label>
                    <input
                      placeholder="e.g. Midterm Assessment Timelines Released"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">Target Audience</label>
                      <select
                        value={targetRole}
                        onChange={(e) => setTargetRole(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm"
                      >
                        <option value="all">All Users</option>
                        <option value="student">Students Only</option>
                        <option value="teacher">Teachers Only</option>
                        <option value="admin">Admins Only</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-700 font-bold mb-1">Priority</label>
                      <select
                        value={priority}
                        onChange={(e) => setPriority(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm"
                      >
                        <option value="normal">Normal</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Announcement Message</label>
                    <textarea
                      rows={4}
                      placeholder="Write your announcement details..."
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm leading-relaxed"
                      required
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" isLoading={publishing}>
                      <Send className="w-4 h-4 mr-1" /> Publish Broadcast
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
