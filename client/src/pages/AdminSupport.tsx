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
  MessageSquare,
  CheckCircle2,
  Clock,
  Search,
  Send,
  X,
} from 'lucide-react';
import { SupportTicket } from '../types/index.js';

export const AdminSupport: React.FC = () => {
  const { toast } = useToast();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Reply modal
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [replyText, setReplyText] = useState('');
  const [ticketStatus, setTicketStatus] = useState('resolved');
  const [saving, setSaving] = useState(false);

  const fetchTickets = async () => {
    try {
      const res = await API.get('/support/admin/tickets');
      if (res.data?.success) {
        const raw = res.data.data?.tickets || res.data.data || [];
        setTickets(Array.isArray(raw) ? raw : []);
      }
    } catch (e) {
      toast('error', 'Failed to fetch tickets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket) return;

    setSaving(true);
    try {
      const res = await API.patch(`/support/admin/tickets/${selectedTicket.id}`, {
        adminReply: replyText,
        status: ticketStatus,
      });

      if (res.data.success) {
        toast('success', 'Reply sent to student!');
        setSelectedTicket(null);
        setReplyText('');
        fetchTickets();
      }
    } catch (e) {
      toast('error', 'Failed to update ticket');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <Preloader message="Loading admin support queue..." subMessage="Fetching open inquiries and SLA metrics" />;
  }

  const ticketList = Array.isArray(tickets) ? tickets : [];
  const filtered = ticketList.filter((t) => {
    const matchesSearch =
      (t.subject || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.ticketId || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.description || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    return matchesSearch && matchesStatus;
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
                <div className="w-10 h-10 rounded-2xl bg-sky-100 text-sky-600 flex items-center justify-center font-bold">
                  <LifeBuoy className="w-6 h-6" />
                </div>
                <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  Academic Support & Inquiry Desk
                </h1>
              </div>
              <p className="text-sm text-slate-600">
                Answer student doubts, resolve question disputes, and track support ticket resolutions.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <input
                placeholder="Search tickets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs w-56"
              />
            </div>
          </div>

          {/* Status Filter Tabs */}
          <div className="flex items-center gap-2">
            {(['all', 'open', 'in_progress', 'resolved'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-xl text-xs capitalize font-semibold transition-colors ${
                  statusFilter === st
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {st.replace('_', ' ')}
              </button>
            ))}
          </div>

          {/* Tickets Table */}
          {filtered.length === 0 ? (
            <Card className="p-12 text-center border-dashed border-slate-300">
              <LifeBuoy className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <h4 className="text-base font-bold text-slate-800">No support tickets found</h4>
            </Card>
          ) : (
            <div className="space-y-4">
              {filtered.map((t) => (
                <Card key={t.id} className="p-6 space-y-3 bg-white">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3 border-b border-slate-100">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-xs font-bold text-slate-400">{t.ticketId}</span>
                        <span>•</span>
                        <span className="text-xs font-semibold text-sky-700 capitalize">{t.category}</span>
                        <span>•</span>
                        <span className="text-xs text-slate-400">{t.user?.name} ({t.user?.email})</span>
                      </div>
                      <h4 className="font-extrabold text-base text-slate-900">{t.subject}</h4>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Badge
                        variant={
                          t.status === 'resolved'
                            ? 'success'
                            : t.status === 'in_progress'
                            ? 'warning'
                            : 'danger'
                        }
                        className="capitalize text-xs"
                      >
                        {t.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>

                  <p className="text-xs text-slate-700 bg-slate-50 p-3.5 rounded-xl border border-slate-200 whitespace-pre-wrap">
                    {t.description}
                  </p>

                  {t.adminReply && (
                    <div className="text-xs text-indigo-950 bg-indigo-50/80 p-3.5 rounded-xl border border-indigo-200">
                      <span className="font-bold block text-indigo-900 mb-0.5">Admin Response:</span>
                      <p>{t.adminReply}</p>
                    </div>
                  )}

                  <div className="pt-2 flex justify-end">
                    <Button
                      size="sm"
                      onClick={() => {
                        setSelectedTicket(t);
                        setReplyText(t.adminReply || '');
                        setTicketStatus(t.status === 'open' ? 'resolved' : t.status);
                      }}
                      className="text-xs h-7 px-3"
                    >
                      <MessageSquare className="w-3.5 h-3.5 mr-1" /> Reply / Update Ticket
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Reply Modal */}
          {selectedTicket && (
            <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h3 className="font-extrabold text-base text-slate-900">
                    Reply to {selectedTicket.user?.name}
                  </h3>
                  <button onClick={() => setSelectedTicket(null)} className="text-slate-400 hover:text-slate-700">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleReplySubmit} className="space-y-3.5 text-xs">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Status</label>
                    <select
                      value={ticketStatus}
                      onChange={(e) => setTicketStatus(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold"
                    >
                      <option value="open">Open</option>
                      <option value="in_progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Support Response Message</label>
                    <textarea
                      rows={4}
                      placeholder="Write your explanation or solution for the student..."
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm"
                      required
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <Button type="button" variant="outline" onClick={() => setSelectedTicket(null)}>
                      Cancel
                    </Button>
                    <Button type="submit" isLoading={saving}>
                      <Send className="w-4 h-4 mr-1" /> Send Reply
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
