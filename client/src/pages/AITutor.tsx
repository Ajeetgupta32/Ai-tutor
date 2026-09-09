import React, { useEffect, useState, useRef } from 'react';
import API from '../lib/api.js';
import { Navbar } from '../components/layout/Navbar.js';
import { Sidebar } from '../components/layout/Sidebar.js';
import { Button } from '../components/ui/Button.js';
import { useToast } from '../context/ToastContext.js';
import {
  GraduationCap,
  Send,
  Plus,
  Trash2,
  Edit2,
  Sparkles,
  BookOpen,
  HelpCircle,
  ListOrdered,
  FileText,
  Zap,
  Check,
  MessageSquare,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Copy,
  Smile,
  CheckCircle2,
} from 'lucide-react';
import { Conversation, Message } from '../types/index.js';

export const AITutor: React.FC = () => {
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loadingMsg, setLoadingMsg] = useState(false);

  // Settings
  const [subjectName, setSubjectName] = useState('Computer Science & Tech');
  const [level, setLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('intermediate');
  const [language, setLanguage] = useState<'en' | 'hi'>('en');

  // Voice recording & TTS states
  const [isRecording, setIsRecording] = useState(false);
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  // Editing title state
  const [editingTitleId, setEditingTitleId] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');

  const fetchConversations = async () => {
    try {
      const res = await API.get('/tutor/conversations');
      if (res.data.success) {
        setConversations(res.data.data.conversations);
        if (res.data.data.conversations.length > 0 && !activeConvId) {
          setActiveConvId(res.data.data.conversations[0]._id);
        }
      }
    } catch (err) {
      // ignore
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (!activeConvId) return;

    const fetchMessages = async () => {
      try {
        const res = await API.get(`/tutor/conversations/${activeConvId}/messages`);
        if (res.data.success) {
          setMessages(res.data.data.messages);
        }
      } catch (err) {
        // ignore
      }
    };
    fetchMessages();
  }, [activeConvId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loadingMsg]);

  // Web Speech API for voice input
  const toggleVoiceInput = () => {
    if (isRecording) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsRecording(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast('info', 'Voice recognition is not supported by your current browser.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = language === 'hi' ? 'hi-IN' : 'en-US';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsRecording(true);
        toast('info', 'Listening... speak your question now.');
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
        setIsRecording(false);
      };

      recognition.onerror = (event: any) => {
        console.error('Speech error', event);
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error(err);
      setIsRecording(false);
    }
  };

  // Text-To-Speech for AI messages
  const handleSpeak = (msgId: string, text: string) => {
    if (!('speechSynthesis' in window)) {
      toast('info', 'Text-to-speech audio is not supported in this browser.');
      return;
    }

    if (speakingMsgId === msgId) {
      window.speechSynthesis.cancel();
      setSpeakingMsgId(null);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text.replace(/[*#`]/g, ''));
    utterance.lang = language === 'hi' ? 'hi-IN' : 'en-US';
    utterance.rate = 1.0;

    utterance.onend = () => setSpeakingMsgId(null);
    utterance.onerror = () => setSpeakingMsgId(null);

    setSpeakingMsgId(msgId);
    window.speechSynthesis.speak(utterance);
  };

  const handleCopyMessage = (msgId: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMsgId(msgId);
    toast('success', 'Explanation copied to clipboard');
    setTimeout(() => setCopiedMsgId(null), 2000);
  };

  const handleNewConversation = async () => {
    try {
      const res = await API.post('/tutor/conversations', {
        title: 'New AI Tutor Session',
        subjectName,
        level,
      });
      if (res.data.success) {
        const newConv = res.data.data.conversation;
        setConversations([newConv, ...conversations]);
        setActiveConvId(newConv._id);
        setMessages([]);
        toast('success', 'New chat session started');
      }
    } catch (err: any) {
      toast('error', 'Error starting new chat');
    }
  };

  const handleSendMessage = async (mode: string = 'default', customText?: string) => {
    const textToSend = customText || input;
    if (!textToSend.trim() || loadingMsg) return;

    setInput('');
    setLoadingMsg(true);

    let convId = activeConvId;

    // If no conversation is active, automatically create one on the fly
    if (!convId) {
      try {
        const titleSnippet = textToSend.slice(0, 32) + (textToSend.length > 32 ? '...' : '');
        const createRes = await API.post('/tutor/conversations', {
          title: titleSnippet,
          subjectName,
          level,
        });
        if (createRes.data.success) {
          const newConv = createRes.data.data.conversation;
          convId = newConv._id || newConv.id;
          setActiveConvId(convId);
          setConversations((prev) => [newConv, ...prev.filter((c) => c._id !== convId)]);
        } else {
          toast('error', 'Could not initialize chat session');
          setLoadingMsg(false);
          return;
        }
      } catch (err: any) {
        toast('error', 'Failed to create chat session: ' + (err.response?.data?.message || err.message));
        setLoadingMsg(false);
        return;
      }
    }

    if (!convId) {
      setLoadingMsg(false);
      return;
    }

    const tempUserMsg: Message = {
      _id: 'temp_' + Math.random().toString(),
      conversationId: convId,
      sender: 'user',
      content: textToSend,
      language,
      mode,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      const res = await API.post(`/tutor/conversations/${convId}/messages`, {
        content: textToSend,
        mode,
        language,
      });
      if (res.data.success) {
        setMessages((prev) => [
          ...prev.filter((m) => m._id !== tempUserMsg._id),
          res.data.data.userMessage,
          res.data.data.assistantMessage,
        ]);
        fetchConversations();
      } else {
        toast('error', res.data.message || 'AI Tutor did not respond');
      }
    } catch (err: any) {
      toast('error', err.response?.data?.message || 'Failed to send message to AI Tutor');
    } finally {
      setLoadingMsg(false);
    }
  };

  const handleDeleteConversation = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await API.delete(`/tutor/conversations/${id}`);
      setConversations(conversations.filter((c) => c._id !== id));
      if (activeConvId === id) {
        const remaining = conversations.filter((c) => c._id !== id);
        setActiveConvId(remaining.length > 0 ? remaining[0]._id : null);
        setMessages([]);
      }
      toast('info', 'Chat conversation deleted');
    } catch (err) {
      toast('error', 'Failed to delete conversation');
    }
  };

  const handleRename = async (id: string, e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    try {
      await API.put(`/tutor/conversations/${id}`, { title: newTitle });
      setConversations(conversations.map((c) => (c._id === id ? { ...c, title: newTitle } : c)));
      setEditingTitleId(null);
      toast('success', 'Conversation renamed');
    } catch (err) {
      toast('error', 'Failed to rename');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      <Navbar />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar />

        <div className="flex-1 flex flex-col lg:flex-row h-[calc(100vh-4rem)]">
          {/* Conversation History Sidebar */}
          <div className="w-full lg:w-72 bg-white border-r border-slate-200 p-4 flex flex-col gap-4 shadow-xs">
            <Button onClick={handleNewConversation} className="w-full justify-center">
              <Plus className="w-4 h-4 mr-1.5" /> New Session
            </Button>

            {/* Config controls */}
            <div className="space-y-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Subject</label>
                <select
                  value={subjectName}
                  onChange={(e) => setSubjectName(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-800 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none"
                >
                  <option value="Computer Science & Tech">Computer Science & Tech</option>
                  <option value="Mathematics & Logic">Mathematics & Logic</option>
                  <option value="Physics & Engineering">Physics & Engineering</option>
                  <option value="Business & Finance">Business & Finance</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Learning Level</label>
                <div className="grid grid-cols-3 gap-1">
                  {(['beginner', 'intermediate', 'advanced'] as const).map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setLevel(lvl)}
                      className={`px-2 py-1 rounded-lg text-[11px] capitalize font-semibold transition-colors ${
                        level === lvl
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {lvl.slice(0, 5)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Language</label>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => setLanguage('en')}
                    className={`flex-1 py-1 rounded-lg text-xs font-semibold transition-colors ${
                      language === 'en'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    English
                  </button>
                  <button
                    type="button"
                    onClick={() => setLanguage('hi')}
                    className={`flex-1 py-1 rounded-lg text-xs font-semibold transition-colors ${
                      language === 'hi'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Hindi (हिंदी)
                  </button>
                </div>
              </div>
            </div>

            {/* Conversation List */}
            <div className="flex-1 overflow-y-auto space-y-1 pr-1">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1">
                Chat History
              </div>
              {conversations.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-400">
                  No previous sessions yet
                </div>
              ) : (
                conversations.map((conv) => (
                  <div
                    key={conv._id}
                    onClick={() => setActiveConvId(conv._id)}
                    className={`group flex items-center justify-between p-2.5 rounded-xl cursor-pointer text-xs transition-all ${
                      activeConvId === conv._id
                        ? 'bg-blue-50 text-blue-800 font-semibold border border-blue-200 shadow-xs'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    {editingTitleId === conv._id ? (
                      <form onSubmit={(e) => handleRename(conv._id, e)} className="flex-1 flex items-center gap-1">
                        <input
                          value={newTitle}
                          onChange={(e) => setNewTitle(e.target.value)}
                          className="w-full bg-white px-2 py-1 border border-blue-500 rounded-md text-xs text-slate-900"
                          autoFocus
                        />
                        <button type="submit" className="text-blue-600 p-1">
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      </form>
                    ) : (
                      <div className="flex items-center gap-2 truncate flex-1">
                        <MessageSquare className="w-3.5 h-3.5 flex-shrink-0 text-blue-500" />
                        <span className="truncate">{conv.title}</span>
                      </div>
                    )}

                    <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingTitleId(conv._id);
                          setNewTitle(conv.title);
                        }}
                        className="p-1 text-slate-400 hover:text-slate-700"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => handleDeleteConversation(conv._id, e)}
                        className="p-1 text-slate-400 hover:text-rose-600"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Main Chat Area */}
          <div className="flex-1 flex flex-col h-full bg-slate-50">
            {/* Teacher Actions Toolbar */}
            <div className="p-3 border-b border-slate-200 bg-white flex flex-wrap gap-2 items-center shadow-xs">
              <span className="text-xs text-slate-500 font-semibold mr-1">Modes:</span>

              {/* ELI10 Mode */}
              <button
                onClick={() => {
                  const prompt = input.trim() || (messages.length > 0 ? "Explain the previous concept like I'm 10 years old with a fun analogy." : "Explain how algorithms work like I'm 10 years old.");
                  handleSendMessage('eli10', prompt);
                }}
                className="px-3 py-1.5 rounded-lg bg-pink-50 hover:bg-pink-100 text-pink-700 border border-pink-200 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
              >
                <Smile className="w-3.5 h-3.5 text-pink-600" /> Explain Like I'm 10
              </button>

              <button
                onClick={() => {
                  const prompt = input.trim() || (messages.length > 0 ? "Explain the previous concept simply with no unnecessary jargon." : "Explain what data structures are simply.");
                  handleSendMessage('explain', prompt);
                }}
                className="px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <BookOpen className="w-3.5 h-3.5 text-blue-600" /> Explain Simply
              </button>

              <button
                onClick={() => {
                  const prompt = input.trim() || (messages.length > 0 ? "Give me a real-world analogy for the previous topic." : "Give me a real-world analogy for how databases store data.");
                  handleSendMessage('analogy', prompt);
                }}
                className="px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Zap className="w-3.5 h-3.5 text-amber-600" /> Real Analogy
              </button>

              <button
                onClick={() => {
                  const prompt = input.trim() || (messages.length > 0 ? "Break down the previous topic step-by-step." : "Give me a step-by-step breakdown of how web servers handle requests.");
                  handleSendMessage('stepByStep', prompt);
                }}
                className="px-3 py-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <ListOrdered className="w-3.5 h-3.5 text-purple-600" /> Step-by-Step
              </button>

              <button
                onClick={() => {
                  const prompt = input.trim() || (messages.length > 0 ? "Summarize the key takeaways of what we just discussed." : "Summarize the key principles of modern software engineering.");
                  handleSendMessage('summarize', prompt);
                }}
                className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <FileText className="w-3.5 h-3.5 text-emerald-600" /> Summarize
              </button>

              <button
                onClick={() => {
                  const prompt = input.trim() || (messages.length > 0 ? "Quiz me with 2 quick practice questions on what we just discussed." : "Quiz me with 2 quick questions on fundamental programming concepts.");
                  handleSendMessage('quizMe', prompt);
                }}
                className="px-3 py-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <HelpCircle className="w-3.5 h-3.5 text-sky-600" /> Quiz Me!
              </button>
            </div>

            {/* Chat Messages Stream */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 max-w-lg mx-auto">
                  <div className="w-16 h-16 rounded-3xl bg-blue-100 text-blue-700 flex items-center justify-center mb-4 shadow-sm">
                    <GraduationCap className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-extrabold text-slate-900 mb-1.5">EduMentor AI Tutor</h3>
                  <p className="text-slate-600 text-sm mb-6 leading-relaxed">
                    Ask doubts via voice or text, get ELI10 breakdowns, or practice concepts.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full">
                    <button
                      onClick={() => handleSendMessage('eli10', "Explain how Recursion works like I'm 10 years old.")}
                      className="p-3 rounded-xl bg-white border border-pink-200 text-left text-xs text-pink-900 hover:border-pink-400 hover:shadow-xs transition-all"
                    >
                      🍭 "Explain Recursion like I'm 10"
                    </button>
                    <button
                      onClick={() => handleSendMessage('analogy', 'Give me an easy real-world analogy for how APIs work.')}
                      className="p-3 rounded-xl bg-white border border-slate-200 text-left text-xs text-slate-700 hover:border-blue-300 hover:shadow-xs transition-all"
                    >
                      🔌 "Real-world analogy for how APIs work"
                    </button>
                  </div>
                </div>
              ) : (
                messages.map((m) => (
                  <div
                    key={m._id}
                    className={`flex flex-col gap-1 max-w-3xl ${m.sender === 'user' ? 'ml-auto items-end' : 'mr-auto items-start'}`}
                  >
                    <div className={`flex gap-3 ${m.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                          m.sender === 'user'
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'bg-blue-100 text-blue-700 border border-blue-200'
                        }`}
                      >
                        {m.sender === 'user' ? 'You' : <GraduationCap className="w-4 h-4" />}
                      </div>

                      <div
                        className={`p-4 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                          m.sender === 'user'
                            ? 'bg-blue-600 text-white rounded-tr-xs shadow-xs'
                            : 'bg-white border border-slate-200/90 text-slate-800 rounded-tl-xs shadow-xs'
                        }`}
                      >
                        {m.content}
                      </div>
                    </div>

                    {/* Actions for Assistant Message: Speak & Copy */}
                    {m.sender === 'assistant' && (
                      <div className="flex items-center gap-2 pl-11 text-xs text-slate-400">
                        <button
                          onClick={() => handleSpeak(m._id, m.content)}
                          className="flex items-center gap-1 hover:text-blue-600 transition-colors"
                          title="Read aloud"
                        >
                          {speakingMsgId === m._id ? (
                            <>
                              <VolumeX className="w-3.5 h-3.5 text-rose-500" />
                              <span className="text-[11px] text-rose-500 font-semibold">Stop Audio</span>
                            </>
                          ) : (
                            <>
                              <Volume2 className="w-3.5 h-3.5" />
                              <span className="text-[11px]">Listen</span>
                            </>
                          )}
                        </button>
                        <span>•</span>
                        <button
                          onClick={() => handleCopyMessage(m._id, m.content)}
                          className="flex items-center gap-1 hover:text-blue-600 transition-colors"
                        >
                          {copiedMsgId === m._id ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                              <span className="text-[11px] text-emerald-600 font-semibold">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span className="text-[11px]">Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}

              {loadingMsg && (
                <div className="flex gap-3 max-w-3xl mr-auto">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center">
                    <GraduationCap className="w-4 h-4 animate-bounce" />
                  </div>
                  <div className="p-3.5 rounded-2xl bg-white border border-slate-200 text-slate-500 text-xs flex items-center gap-2 shadow-xs">
                    <Sparkles className="w-4 h-4 text-blue-600 animate-spin" />
                    <span>EduMentor AI is preparing your personalized explanation...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Floating Input Bar with Voice Support */}
            <div className="p-4 bg-white border-t border-slate-200">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex gap-2 max-w-4xl mx-auto items-center"
              >
                {/* Voice Input Button */}
                <button
                  type="button"
                  onClick={toggleVoiceInput}
                  title={isRecording ? 'Stop recording' : 'Voice Input'}
                  className={`p-2.5 rounded-xl border transition-all ${
                    isRecording
                      ? 'bg-rose-500 text-white border-rose-600 animate-pulse'
                      : 'bg-slate-50 text-slate-600 border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>

                <input
                  placeholder="Ask any concept, question, formula, or topic..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-xs"
                />
                <Button type="submit" isLoading={loadingMsg} className="px-5">
                  <Send className="w-4 h-4 mr-1" /> Send
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
