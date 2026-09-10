import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import API from '../api/axios.js';
import { Navbar } from '../components/layout/Navbar.js';
import { Sidebar } from '../components/layout/Sidebar.js';
import { Card } from '../components/ui/Card.js';
import { Button } from '../components/ui/Button.js';
import { Badge } from '../components/ui/Badge.js';
import { Preloader } from '../components/ui/Preloader.js';
import { FileQuestion, Play, Sparkles } from 'lucide-react';
import { Quiz } from '../types/index.js';

export const MyQuizzes: React.FC = () => {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        const res = await API.get('/quizzes');
        if (res.data?.success) {
          const raw = res.data.data?.quizzes || res.data.data || res.data.quizzes || [];
          setQuizzes(Array.isArray(raw) ? raw : []);
        }
      } catch (err) {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    fetchQuizzes();
  }, []);

  if (loading) {
    return <Preloader message="Loading your quizzes..." subMessage="Fetching your practice tests" />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      <Navbar />

      <div className="flex-1 flex">
        <Sidebar />

        <main className="flex-1 p-5 sm:p-8 max-w-6xl mx-auto w-full space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">My Quizzes</h1>
              <p className="text-xs sm:text-sm text-slate-500">
                Browse and practice your AI-generated quizzes
              </p>
            </div>

            <Link to="/quiz-generator">
              <Button>
                <Sparkles className="w-4 h-4 mr-1.5" /> Generate New Quiz
              </Button>
            </Link>
          </div>

          {quizzes.length === 0 ? (
            <Card className="p-12 text-center border-dashed border-slate-300 bg-white">
              <FileQuestion className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-900 mb-1">No Quizzes Created Yet</h3>
              <p className="text-xs text-slate-500 mb-5 max-w-sm mx-auto">
                Use our AI Quiz Generator to create custom practice tests for any subject or topic!
              </p>
              <Link to="/quiz-generator">
                <Button>Generate Your First Quiz</Button>
              </Link>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {(Array.isArray(quizzes) ? quizzes : []).map((q) => (
                <Card key={q._id} hoverEffect className="flex flex-col justify-between p-5 bg-white border border-slate-200">
                  <div>
                    <div className="flex items-center justify-between mb-2.5">
                      <Badge variant="primary">{q.subjectName}</Badge>
                      <Badge variant="outline" className="capitalize">
                        {q.difficulty}
                      </Badge>
                    </div>

                    <h3 className="font-bold text-sm sm:text-base text-slate-900 mb-1.5 line-clamp-2">
                      {q.title}
                    </h3>
                    <p className="text-xs text-slate-500 mb-3.5">Topic: {q.topicName}</p>

                    <div className="flex items-center gap-3 text-xs text-slate-400 mb-5">
                      <span>{q.questionCount} Questions</span>
                      <span>•</span>
                      <span className="capitalize">{q.questionType.replace('_', ' ')}</span>
                    </div>
                  </div>

                  <Link to={`/quiz-player/${q._id}`}>
                    <Button variant="primary" className="w-full">
                      <Play className="w-4 h-4 mr-1.5" /> Start Quiz
                    </Button>
                  </Link>
                </Card>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
