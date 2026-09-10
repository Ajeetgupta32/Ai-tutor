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
  Award,
  ShieldCheck,
  CheckCircle2,
  Printer,
  Search,
  ExternalLink,
  GraduationCap,
  Sparkles,
} from 'lucide-react';
import { Certificate } from '../types/index.js';

export const Certificates: React.FC = () => {
  const { toast } = useToast();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);

  // Verification state
  const [verifyCode, setVerifyCode] = useState('');
  const [verificationResult, setVerificationResult] = useState<any | null>(null);
  const [verifying, setVerifying] = useState(false);

  // Active view certificate modal
  const [activeCert, setActiveCert] = useState<Certificate | null>(null);

  const fetchCertificates = async () => {
    try {
      const res = await API.get('/certificates');
      if (res.data?.success) {
        const raw = res.data.data?.certificates || res.data.data || [];
        setCertificates(Array.isArray(raw) ? raw : []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCertificates();
  }, []);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyCode.trim()) return;

    setVerifying(true);
    setVerificationResult(null);
    try {
      const res = await API.get(`/certificates/verify/${verifyCode.trim().toUpperCase()}`);
      if (res.data.success) {
        setVerificationResult(res.data.data);
      }
    } catch (err: any) {
      toast('error', 'No certificate found matching this verification code.');
    } finally {
      setVerifying(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return <Preloader message="Loading verified certificates..." subMessage="Checking cryptography hashes and credentials" />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      <Navbar />

      <div className="flex-1 flex">
        <Sidebar />

        <main className="flex-1 p-5 sm:p-8 max-w-7xl mx-auto w-full space-y-6">
          {/* Header */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-1 max-w-2xl">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center font-bold">
                  <Award className="w-6 h-6" />
                </div>
                <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  Verified Academic Certificates
                </h1>
              </div>
              <p className="text-sm text-slate-600">
                Issued automatically whenever you score 80% or above on any adaptive assessment. Every certificate has a unique cryptographic verification code.
              </p>
            </div>
          </div>

          {/* Verification Search Bar */}
          <Card className="p-5 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <h3 className="text-xs font-extrabold uppercase text-blue-900 mb-2 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-blue-600" /> Public Certificate Verification
            </h3>
            <form onSubmit={handleVerify} className="flex gap-2 max-w-xl">
              <input
                placeholder="Enter Certificate ID or Verification Code (e.g. CERT-...)"
                value={verifyCode}
                onChange={(e) => setVerifyCode(e.target.value)}
                className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs uppercase focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
              <Button type="submit" size="sm" isLoading={verifying}>
                <Search className="w-3.5 h-3.5 mr-1" /> Verify
              </Button>
            </form>

            {verificationResult && (
              <div className="mt-4 p-4 rounded-2xl bg-white border border-emerald-300 shadow-xs text-xs space-y-1.5 animate-in fade-in">
                <div className="flex items-center gap-1.5 text-emerald-700 font-extrabold text-sm">
                  <CheckCircle2 className="w-4 h-4" /> Authenticity Verified by EduMentor AI
                </div>
                <p className="text-slate-700 font-medium">
                  Recipient: <span className="font-bold text-slate-900">{verificationResult.recipientName}</span>
                </p>
                <p className="text-slate-700 font-medium">
                  Course / Exam: <span className="font-bold text-slate-900">{verificationResult.title}</span> ({verificationResult.subjectName})
                </p>
                <p className="text-slate-700 font-medium">
                  Score: <span className="font-extrabold text-emerald-600">{verificationResult.score}%</span> • Issued on {new Date(verificationResult.issuedAt).toLocaleDateString()}
                </p>
              </div>
            )}
          </Card>

          {/* Earned Certificates Grid */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Your Earned Credentials</h3>

            {certificates.length === 0 ? (
              <Card className="p-12 text-center border-dashed border-slate-300">
                <Award className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                <h4 className="text-base font-bold text-slate-800">No certificates earned yet</h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-4">
                  Score 80% or higher in any practice quiz or curriculum challenge to unlock your verified certificate.
                </p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {(Array.isArray(certificates) ? certificates : []).map((cert) => (
                  <Card
                    key={cert.id}
                    className="p-6 bg-white border border-slate-200 shadow-xs flex flex-col justify-between space-y-4 hover:border-amber-400 transition-all"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 font-bold">
                          <Award className="w-5 h-5" />
                        </div>
                        <Badge variant="success" className="text-xs">
                          {cert.score}% Score
                        </Badge>
                      </div>

                      <h4 className="font-extrabold text-base text-slate-900 mb-1">{cert.title}</h4>
                      <span className="text-xs font-semibold text-blue-600 block mb-2">{cert.subjectName}</span>
                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-500 space-y-1">
                        <div>
                          <span className="font-bold text-slate-700">ID: </span>
                          <span className="font-mono text-slate-900">{cert.certificateId}</span>
                        </div>
                        <div>
                          <span className="font-bold text-slate-700">Code: </span>
                          <span className="font-mono text-slate-900">{cert.verificationCode}</span>
                        </div>
                        <div>
                          <span className="font-bold text-slate-700">Issued: </span>
                          <span>{new Date(cert.issuedAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between mt-4">
                      <Button size="sm" onClick={() => setActiveCert(cert)} className="text-xs h-8 px-3">
                        View & Print Certificate
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Printable Certificate Modal */}
          {activeCert && (
            <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl max-w-3xl w-full p-8 shadow-2xl border-4 border-amber-500/20 space-y-6 animate-in fade-in">
                {/* Certificate Frame */}
                <div className="p-8 border-4 border-double border-amber-600/60 rounded-2xl bg-amber-50/20 text-center space-y-4">
                  <div className="flex items-center justify-center gap-2">
                    <GraduationCap className="w-8 h-8 text-blue-600" />
                    <span className="text-xl font-extrabold text-slate-900">
                      EduMentor <span className="text-blue-600">AI</span>
                    </span>
                  </div>

                  <h2 className="text-xs font-bold uppercase tracking-widest text-amber-700">
                    Certificate of Academic Mastery
                  </h2>

                  <p className="text-xs text-slate-500">This officially certifies that</p>
                  <h3 className="text-2xl font-black text-slate-900 border-b-2 border-slate-300 pb-2 max-w-md mx-auto">
                    {activeCert.user?.name || 'EduMentor Scholar'}
                  </h3>

                  <p className="text-xs text-slate-600 max-w-lg mx-auto leading-relaxed">
                    has successfully passed the comprehensive assessment in{' '}
                    <span className="font-bold text-slate-900">{activeCert.title}</span> ({activeCert.subjectName}) with a verified score of{' '}
                    <span className="font-black text-amber-600">{activeCert.score}%</span>.
                  </p>

                  <div className="pt-6 grid grid-cols-2 gap-4 max-w-md mx-auto text-left text-[11px] border-t border-slate-200 text-slate-500">
                    <div>
                      <span className="font-bold block text-slate-800">Verification Hash</span>
                      <span className="font-mono text-slate-900">{activeCert.verificationCode}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold block text-slate-800">Issue Date</span>
                      <span>{new Date(activeCert.issuedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2.5">
                  <Button variant="outline" onClick={() => setActiveCert(null)}>
                    Close
                  </Button>
                  <Button onClick={handlePrint}>
                    <Printer className="w-4 h-4 mr-1.5" /> Print / Save PDF
                  </Button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
