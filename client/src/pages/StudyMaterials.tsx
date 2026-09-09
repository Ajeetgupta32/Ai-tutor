import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios.js';
import { Navbar } from '../components/layout/Navbar.js';
import { Sidebar } from '../components/layout/Sidebar.js';
import { Card } from '../components/ui/Card.js';
import { Button } from '../components/ui/Button.js';
import { Input } from '../components/ui/Input.js';
import { Badge } from '../components/ui/Badge.js';
import { Preloader } from '../components/ui/Preloader.js';
import { useToast } from '../context/ToastContext.js';
import { FileText, Upload, Bot, BrainCircuit, Sparkles, Send, File, BookOpen } from 'lucide-react';
import { StudyMaterial } from '../types/index.js';

export const StudyMaterials: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [materials, setMaterials] = useState<StudyMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMaterial, setSelectedMaterial] = useState<StudyMaterial | null>(null);

  // Upload Form State
  const [title, setTitle] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [rawText, setRawText] = useState('');
  const [uploading, setUploading] = useState(false);

  // Grounded Chat State
  const [question, setQuestion] = useState('');
  const [chatAnswer, setChatAnswer] = useState('');
  const [asking, setAsking] = useState(false);

  const fetchMaterials = async () => {
    try {
      const res = await API.get('/materials');
      if (res.data.success) {
        setMaterials(res.data.data.materials);
        if (res.data.data.materials.length > 0 && !selectedMaterial) {
          setSelectedMaterial(res.data.data.materials[0]);
        }
      }
    } catch (err) {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMaterials();
  }, []);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file && !rawText.trim()) {
      toast('error', 'Please attach a PDF/TXT file or paste text content');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    if (title) formData.append('title', title);
    if (file) formData.append('file', file);
    if (rawText) formData.append('text', rawText);

    try {
      const res = await API.post('/materials/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data.success) {
        toast('success', 'Study Material Processed Successfully!');
        setTitle('');
        setFile(null);
        setRawText('');
        fetchMaterials();
      }
    } catch (err: any) {
      toast('error', 'Upload failed', err.response?.data?.message || 'Error processing document');
    } finally {
      setUploading(false);
    }
  };

  const handleAskQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMaterial || !question.trim() || asking) return;

    setAsking(true);
    setChatAnswer('');
    try {
      const res = await API.post(`/materials/${selectedMaterial._id}/chat`, { question });
      if (res.data.success) {
        setChatAnswer(res.data.data.answer);
      }
    } catch (err: any) {
      toast('error', 'Error asking AI question');
    } finally {
      setAsking(false);
    }
  };

  const handleGenerateQuizFromNotes = async (materialId: string) => {
    toast('info', 'Generating Quiz from Notes...', 'Extracting key concepts');
    try {
      const res = await API.post(`/materials/${materialId}/generate-quiz`, {
        questionCount: 5,
        difficulty: 'intermediate',
      });
      if (res.data.success) {
        toast('success', 'Quiz Ready!', 'Redirecting to Quiz Player');
        navigate(`/quiz-player/${res.data.data.quiz._id}`);
      }
    } catch (err: any) {
      toast('error', 'Failed to generate quiz from material');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col">
      <Navbar />

      <div className="flex-1 flex">
        <Sidebar />

        <main className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full space-y-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Study Materials & Notes AI</h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Upload lecture notes, PDFs, or chapters to ask grounded questions, summarize content, and auto-generate custom quizzes
            </p>
          </div>

          {/* Top Upload Section */}
          <Card className="p-6">
            <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Upload className="w-5 h-5 text-blue-600" /> Upload PDF or Notes Document
            </h3>

            <form onSubmit={handleUpload} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Document Title (Optional)"
                  placeholder="e.g. Chapter 4 - Operating System Concurrency"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Attach File (.pdf, .txt)</label>
                  <input
                    type="file"
                    accept=".pdf,.txt"
                    onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-700 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Or Paste Text Notes Directly
                </label>
                <textarea
                  rows={3}
                  placeholder="Paste lecture notes or chapter summary here..."
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>

              <Button type="submit" isLoading={uploading}>
                <Sparkles className="w-4 h-4 mr-2" /> Upload & Extract Concepts
              </Button>
            </form>
          </Card>

          {/* Materials Explorer & Grounded Q&A Workspace */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Saved Documents */}
            <div className="space-y-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" /> Saved Documents ({materials.length})
              </h3>

              {loading ? (
                <Preloader fullScreen={false} message="Loading documents..." subMessage="" />
              ) : materials.length === 0 ? (
                <Card className="p-6 text-center text-xs text-slate-400">
                  No study documents uploaded yet. Upload a PDF or text above!
                </Card>
              ) : (
                <div className="space-y-2">
                  {materials.map((m) => (
                    <div
                      key={m._id}
                      onClick={() => setSelectedMaterial(m)}
                      className={`p-4 rounded-xl cursor-pointer border transition-all ${
                        selectedMaterial?._id === m._id
                          ? 'bg-blue-50/80 border-blue-400 text-blue-950 shadow-sm'
                          : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-sm truncate text-slate-900">{m.title}</span>
                        <Badge variant="secondary" className="uppercase text-[10px]">
                          {m.fileType}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-500 line-clamp-2 mt-1">{m.summary}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right: Document Workspace (Summary & Grounded Chat) */}
            <div className="lg:col-span-2 space-y-6">
              {selectedMaterial ? (
                <>
                  <Card className="p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-4 border-b border-slate-100">
                      <div>
                        <h3 className="text-xl font-bold text-slate-900">{selectedMaterial.title}</h3>
                        <span className="text-xs text-slate-400">
                          Uploaded on {new Date(selectedMaterial.uploadedAt).toLocaleDateString()}
                        </span>
                      </div>

                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleGenerateQuizFromNotes(selectedMaterial._id)}
                      >
                        <BrainCircuit className="w-4 h-4 mr-1.5 text-blue-600" /> Quiz from Notes
                      </Button>
                    </div>

                    <div className="space-y-4">
                      <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-100">
                        <h4 className="font-bold text-xs text-blue-800 uppercase tracking-wider mb-2">
                          AI Key Summary
                        </h4>
                        <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                          {selectedMaterial.summary}
                        </p>
                      </div>

                      <div>
                        <h4 className="font-semibold text-xs text-slate-500 uppercase tracking-wider mb-2">
                          Key Topics Extracted
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {selectedMaterial.keyTopics.map((kt, idx) => (
                            <Badge key={idx} variant="primary">
                              {kt}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </Card>

                  {/* Grounded Note AI Chat */}
                  <Card className="p-6">
                    <h3 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-2">
                      <Bot className="w-5 h-5 text-blue-600" /> Ask Questions About This Document
                    </h3>
                    <p className="text-xs text-slate-500 mb-4">
                      Questions will be answered directly using context from "{selectedMaterial.title}"
                    </p>

                    <form onSubmit={handleAskQuestion} className="flex gap-2 mb-4">
                      <Input
                        placeholder="e.g. What is the main algorithm mentioned in section 2?"
                        value={question}
                        onChange={(e) => setQuestion(e.target.value)}
                      />
                      <Button type="submit" isLoading={asking}>
                        <Send className="w-4 h-4" />
                      </Button>
                    </form>

                    {chatAnswer && (
                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-800 whitespace-pre-wrap leading-relaxed shadow-sm">
                        <div className="font-bold text-blue-700 mb-2 flex items-center gap-1.5">
                          <Sparkles className="w-4 h-4 text-blue-600" /> Answer:
                        </div>
                        {chatAnswer}
                      </div>
                    )}
                  </Card>
                </>
              ) : (
                <Card className="p-12 text-center text-xs text-slate-400">
                  Select a document from the left list to view summary and ask questions
                </Card>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
