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
  Database,
  Search,
  Plus,
  CheckCircle2,
  XCircle,
  Sparkles,
} from 'lucide-react';
import { QuestionBankItem } from '../types/index.js';

export const AdminQuestionBank: React.FC = () => {
  const { toast } = useToast();
  const [questions, setQuestions] = useState<QuestionBankItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // New question form
  const [showModal, setShowModal] = useState(false);
  const [questionText, setQuestionText] = useState('');
  const [subjectName, setSubjectName] = useState('Computer Science & Tech');
  const [topicName, setTopicName] = useState('General');
  const [difficulty, setDifficulty] = useState('intermediate');
  const [optionA, setOptionA] = useState('');
  const [optionB, setOptionB] = useState('');
  const [optionC, setOptionC] = useState('');
  const [optionD, setOptionD] = useState('');
  const [correctAnswer, setCorrectAnswer] = useState('');
  const [explanation, setExplanation] = useState('');

  const fetchQuestions = async () => {
    try {
      const res = await API.get('/admin/question-bank');
      if (res.data?.success) {
        const raw = res.data.data?.questions || res.data.data || [];
        setQuestions(Array.isArray(raw) ? raw : []);
      }
    } catch (e) {
      toast('error', 'Failed to fetch question bank');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, []);

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      await API.patch(`/admin/question-bank/${id}/status`, { status: newStatus });
      setQuestions((prev) => (Array.isArray(prev) ? prev : []).map((q) => (q.id === id ? { ...q, status: newStatus as any } : q)));
      toast('success', `Question ${newStatus}`);
    } catch (e) {
      toast('error', 'Failed to update status');
    }
  };

  const handleCreateQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionText.trim() || !optionA || !optionB || !correctAnswer) {
      toast('error', 'Please fill in question, options, and correct answer');
      return;
    }

    try {
      const options = [optionA, optionB, optionC, optionD].filter(Boolean);
      const res = await API.post('/admin/question-bank', {
        questionText,
        subjectName,
        topicName,
        difficulty,
        options,
        correctAnswer,
        explanation,
      });

      if (res.data.success) {
        toast('success', 'Question added to question bank');
        setShowModal(false);
        setQuestionText('');
        fetchQuestions();
      }
    } catch (e) {
      toast('error', 'Failed to create question');
    }
  };

  if (loading) {
    return <Preloader message="Loading question bank..." subMessage="Fetching AI quality control metrics & review queues" />;
  }

  const questionList = Array.isArray(questions) ? questions : [];
  const filtered = questionList.filter((q) => {
    const matchesSearch =
      (q.questionText || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (q.subjectName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (q.topicName || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || q.status === statusFilter;
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
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
                  <Database className="w-6 h-6" />
                </div>
                <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  Question Bank & AI Quality Control
                </h1>
              </div>
              <p className="text-sm text-slate-600">
                Review and approve assessment questions, filter by topic, and maintain pedagogical standards.
              </p>
            </div>

            <Button onClick={() => setShowModal(true)}>
              <Plus className="w-4 h-4 mr-1.5" /> Add Question
            </Button>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {(['all', 'approved', 'pending_review', 'rejected'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-xl text-xs capitalize font-semibold transition-colors ${
                    statusFilter === st
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {st.replace('_', ' ')}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                placeholder="Search questions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-xs"
              />
            </div>
          </div>

          {/* Questions List */}
          {filtered.length === 0 ? (
            <Card className="p-12 text-center border-dashed border-slate-300">
              <Database className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <h4 className="text-base font-bold text-slate-800">No questions found</h4>
              <p className="text-xs text-slate-500 mt-1 mb-4">
                Add manually created questions or review AI generated quiz items.
              </p>
              <Button onClick={() => setShowModal(true)}>
                <Plus className="w-4 h-4 mr-1.5" /> Add Question
              </Button>
            </Card>
          ) : (
            <div className="space-y-4">
              {filtered.map((q) => (
                <Card key={q.id} className="p-6 space-y-3 bg-white">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3 border-b border-slate-100">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-blue-600">{q.subjectName}</span>
                        <span>•</span>
                        <span className="text-xs font-semibold text-slate-500">{q.topicName}</span>
                        <span>•</span>
                        <Badge variant="outline" className="capitalize text-[10px]">
                          {q.difficulty}
                        </Badge>
                      </div>
                      <h4 className="font-extrabold text-base text-slate-900">{q.questionText}</h4>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Badge
                        variant={
                          q.status === 'approved'
                            ? 'success'
                            : q.status === 'rejected'
                            ? 'danger'
                            : 'warning'
                        }
                        className="capitalize text-xs"
                      >
                        {q.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>

                  {/* Options */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {(Array.isArray(q.options) ? q.options : []).map((opt, idx) => (
                      <div
                        key={idx}
                        className={`p-2.5 rounded-xl border ${
                          opt === q.correctAnswer
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-bold'
                            : 'bg-slate-50 border-slate-200 text-slate-700'
                        }`}
                      >
                        {opt}
                      </div>
                    ))}
                  </div>

                  {q.explanation && (
                    <p className="text-xs text-slate-500 italic bg-blue-50/50 p-2.5 rounded-xl border border-blue-100">
                      Explanation: {q.explanation}
                    </p>
                  )}

                  <div className="pt-2 flex justify-end gap-2">
                    {q.status !== 'approved' && (
                      <Button
                        size="sm"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-7 px-3"
                        onClick={() => handleUpdateStatus(q.id, 'approved')}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Approve
                      </Button>
                    )}
                    {q.status !== 'rejected' && (
                      <Button
                        size="sm"
                        variant="danger"
                        className="text-xs h-7 px-3"
                        onClick={() => handleUpdateStatus(q.id, 'rejected')}
                      >
                        <XCircle className="w-3.5 h-3.5 mr-1" /> Reject
                      </Button>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* New Question Modal */}
          {showModal && (
            <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl border border-slate-200 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h3 className="font-extrabold text-base text-slate-900">Add Question to Bank</h3>
                  <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-700">
                    ✕
                  </button>
                </div>

                <form onSubmit={handleCreateQuestion} className="space-y-3 text-xs">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Question Text</label>
                    <textarea
                      rows={3}
                      placeholder="Write the question prompt..."
                      value={questionText}
                      onChange={(e) => setQuestionText(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">Subject</label>
                      <input
                        value={subjectName}
                        onChange={(e) => setSubjectName(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">Topic</label>
                      <input
                        value={topicName}
                        onChange={(e) => setTopicName(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-slate-700 font-bold">Options (4 choices)</label>
                    <input
                      placeholder="Option A"
                      value={optionA}
                      onChange={(e) => setOptionA(e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                      required
                    />
                    <input
                      placeholder="Option B"
                      value={optionB}
                      onChange={(e) => setOptionB(e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                      required
                    />
                    <input
                      placeholder="Option C"
                      value={optionC}
                      onChange={(e) => setOptionC(e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                    />
                    <input
                      placeholder="Option D"
                      value={optionD}
                      onChange={(e) => setOptionD(e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Correct Answer (Must match exactly)</label>
                    <input
                      placeholder="Paste the exact correct answer text"
                      value={correctAnswer}
                      onChange={(e) => setCorrectAnswer(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Explanation</label>
                    <textarea
                      rows={2}
                      placeholder="Why is this correct?"
                      value={explanation}
                      onChange={(e) => setExplanation(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">Save Question</Button>
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
