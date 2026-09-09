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
  LifeBuoy,
  Plus,
  MessageSquare,
  CheckCircle2,
  Clock,
  Send,
  AlertCircle,
} from 'lucide-react';
import { SupportTicket } from '../types/index.js';

export const Support: React.FC = () => {
  const { toast } = useToast();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [showModal, setShowModal] = useState(false);
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('general');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchTickets = async () => {
    try {
      const res = await API.get('/support/tickets');
      if (res.data.success) {
        setTickets(res.data.data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleSubmitTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) {
      toast('error', 'Please fill out subject and description');
      return;
    }

    setSubmitting(true);
    try {
      const res = await API.post('/support/tickets', {
        subject,
        category,
        priority,
        description,
      });

      if (res.data.success) {
        setTickets([res.data.data, ...tickets]);
        setShowModal(false);
        setSubject('');
        setDescription('');
        toast('success', 'Support ticket submitted!');
      }
    } catch (e) {
      toast('error', 'Failed to submit ticket');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <Preloader message="Loading support desk..." subMessage="Fetching ticket history and resolutions" />;
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
                <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                  <LifeBuoy className="w-6 h-6" />
                </div>
                <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Support & Help Desk</h1>
              </div>
              <p className="text-sm text-slate-600">
                Have a doubt, question clarification, or technical problem? Submit a ticket to the academic support team.
              </p>
            </div>

            <Button onClick={() => setShowModal(true)}>
              <Plus className="w-4 h-4 mr-1.5" /> Submit Support Ticket
            </Button>
          </div>

          {/* Tickets List */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Your Support Tickets</h3>

            {tickets.length === 0 ? (
              <Card className="p-12 text-center border-dashed border-slate-300">
                <LifeBuoy className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                <h4 className="text-base font-bold text-slate-800">No support tickets found</h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-4">
                  Need assistance with study materials, AI tutor answers, or your profile? We're here to help.
                </p>
                <Button onClick={() => setShowModal(true)}>
                  <Plus className="w-4 h-4 mr-1.5" /> Open a Ticket
                </Button>
              </Card>
            ) : (
              <div className="space-y-4">
                {tickets.map((t) => (
                  <Card key={t.id} className="p-6 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-slate-400">{t.ticketId}</span>
                          <h4 className="font-extrabold text-base text-slate-900">{t.subject}</h4>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                          <span className="capitalize font-medium">{t.category}</span>
                          <span>•</span>
                          <span>{new Date(t.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            t.status === 'resolved'
                              ? 'success'
                              : t.status === 'in_progress'
                              ? 'warning'
                              : 'primary'
                          }
                          className="capitalize text-xs"
                        >
                          {t.status.replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>

                    <div className="text-xs text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-200">
                      <span className="font-bold text-slate-800 block mb-1">Your Inquiry:</span>
                      <p className="whitespace-pre-wrap leading-relaxed">{t.description}</p>
                    </div>

                    {t.adminReply ? (
                      <div className="text-xs text-indigo-950 bg-indigo-50/80 p-4 rounded-xl border border-indigo-200 space-y-1">
                        <div className="flex items-center gap-1.5 font-bold text-indigo-900">
                          <MessageSquare className="w-3.5 h-3.5" /> Support Response:
                        </div>
                        <p className="whitespace-pre-wrap leading-relaxed">{t.adminReply}</p>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-xs text-slate-400 italic">
                        <Clock className="w-3.5 h-3.5" /> Awaiting response from academic support team
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* New Ticket Modal */}
          {showModal && (
            <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h3 className="font-extrabold text-base text-slate-900">Submit Support Ticket</h3>
                  <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-700">
                    ✕
                  </button>
                </div>

                <form onSubmit={handleSubmitTicket} className="space-y-3.5 text-xs">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Subject</label>
                    <input
                      placeholder="Brief summary of your question or issue"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">Category</label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm"
                      >
                        <option value="general">General Inquiry</option>
                        <option value="quiz">Quiz / Question Doubt</option>
                        <option value="ai_tutor">AI Tutor Quality</option>
                        <option value="technical">Technical Bug</option>
                        <option value="account">Account & Data</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-700 font-bold mb-1">Priority</label>
                      <select
                        value={priority}
                        onChange={(e: any) => setPriority(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Detailed Description</label>
                    <textarea
                      rows={4}
                      placeholder="Explain your doubt, paste the question, or describe what happened..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm leading-relaxed"
                      required
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" isLoading={submitting}>
                      <Send className="w-4 h-4 mr-1" /> Submit Ticket
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
