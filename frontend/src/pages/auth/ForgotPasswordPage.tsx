import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  KeyRound,
  Mail,
  Send,
  ShieldCheck,
} from 'lucide-react';
import { sendPasswordResetEmail } from '@/utils/emailService';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      setErrorMsg('Masukkan alamat email terdaftar yang valid.');
      return;
    }

    setIsSending(true);
    const resetCode = String(Math.floor(100000 + Math.random() * 900000));
    const result = await sendPasswordResetEmail({
      to_email: trimmedEmail,
      to_name: trimmedEmail.split('@')[0] || 'Pengguna',
      reset_code: resetCode,
    });
    setIsSending(false);

    if (result.sent) {
      setSuccessMsg(
        `Email instruksi reset password berhasil dikirim ke ${trimmedEmail}. Silakan periksa Kotak Masuk atau folder Spam.`
      );
    } else {
      setErrorMsg(result.reason || 'Gagal mengirim email reset password.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFD] px-4 py-10">
      <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-[0_8px_30px_-10px_rgba(15,23,42,0.12)] border border-slate-200/80 w-full max-w-md space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#ECF2FF] text-[#5D87FF] flex items-center justify-center shrink-0">
            <KeyRound className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900">Pemulihan Akses Akun</h1>
            <p className="text-xs text-slate-500">Kirim instruksi reset password ke email Anda</p>
          </div>
        </div>

        {errorMsg && (
          <div className="flex items-start gap-2.5 p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="flex items-start gap-2.5 p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-3">
          <div>
            <label htmlFor="reset-email" className="block text-xs font-semibold text-slate-700 mb-1.5">
              Alamat Email Terdaftar
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="reset-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@instansi.go.id"
                className="w-full rounded-xl border border-slate-300 bg-slate-50/70 pl-10 pr-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-[#5D87FF] focus:bg-white focus:ring-2 focus:ring-[#5D87FF]/20"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSending}
            className="w-full inline-flex items-center justify-center gap-2 bg-[#5D87FF] hover:bg-[#4B74E8] disabled:opacity-60 text-white py-2.5 px-4 rounded-xl text-sm font-semibold transition-colors cursor-pointer"
          >
            <Send className="w-4 h-4" />
            {isSending ? 'Mengirim Email...' : 'Kirim Email Reset Password'}
          </button>
        </form>

        <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-4 space-y-1.5 text-xs text-slate-600">
          <p className="font-bold text-slate-800 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-[#5D87FF]" />
            Alternatif Jika Email Tidak Aktif / Tidak Masuk
          </p>
          <p className="leading-relaxed">
            Hubungi <strong>Super Admin</strong> dengan menyebutkan <strong>Nama Lengkap</strong> dan <strong>NIP</strong> untuk reset kata sandi langsung melalui menu <em>Kelola Akun</em>.
          </p>
        </div>

        <Link
          to="/auth/login"
          className="w-full inline-flex items-center justify-center gap-2 border border-slate-200 hover:bg-slate-50 text-slate-700 py-2.5 px-4 rounded-xl text-sm font-semibold transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Halaman Login
        </Link>
      </div>
    </div>
  );
};
