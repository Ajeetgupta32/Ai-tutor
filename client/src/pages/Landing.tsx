import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Bot, FileText, CheckCircle2, ArrowRight, GraduationCap, Award, BookOpen } from 'lucide-react';
import { Button } from '../components/ui/Button.js';
import { Navbar } from '../components/layout/Navbar.js';

export const Landing: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-16 pb-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto text-center flex-1 flex flex-col justify-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold mb-6 mx-auto shadow-xs">
          <Sparkles className="w-4 h-4 text-blue-600" /> Powered by Google Gemini AI
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight max-w-4xl mx-auto leading-tight text-slate-900">
          Your Intelligent Personal <span className="text-blue-600">AI Tutor</span> & Study Companion
        </h1>

        <p className="mt-5 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto font-normal leading-relaxed">
          Master computer science, mathematics, physics, and more with instant step-by-step tutoring, automated practice quizzes, and document note summarization.
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-3.5">
          <Link to="/register">
            <Button size="lg" className="px-6 py-3 text-base shadow-sm">
              Get Started Free <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </Link>
          <Link to="/login">
            <Button size="lg" variant="outline" className="px-6 py-3 text-base">
              Sign In
            </Button>
          </Link>
        </div>

        {/* Feature Cards Grid */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:border-blue-300 hover:shadow-md transition-all">
            <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4 border border-blue-100">
              <Bot className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold mb-2 text-slate-900">Adaptive AI Tutor</h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              Tailored explanations for beginner, intermediate, and advanced levels with real-world analogies, step-by-step breakdowns, and Hindi support.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:border-blue-300 hover:shadow-md transition-all">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4 border border-emerald-100">
              <Award className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold mb-2 text-slate-900">Smart Quiz Generator</h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              Generate custom quizzes across any subject and topic. Receive instant grading, detailed explanations, and performance metrics.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:border-blue-300 hover:shadow-md transition-all">
            <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-4 border border-purple-100">
              <BookOpen className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold mb-2 text-slate-900">Document Q&A & Notes</h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              Upload PDF documents or study notes. Automatically extract key topics, summarize chapters, and ask questions directly from your materials.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-6 px-4 text-center text-xs text-slate-500 bg-white">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© 2026 EduMentor AI — Academic Learning Portal</p>
          <div className="flex gap-3 text-slate-500 font-medium">
            <span>React</span>
            <span>•</span>
            <span>Node.js</span>
            <span>•</span>
            <span>PostgreSQL</span>
            <span>•</span>
            <span>Google Gemini AI</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
