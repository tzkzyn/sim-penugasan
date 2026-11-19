import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Captcha } from '@/components/ui/captcha';
import {
  ShieldCheck,
  User,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  KeyRound,
  ShieldAlert,
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [userCaptcha, setUserCaptcha] = useState('');
  const [generatedCaptcha, setGeneratedCaptcha] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // If already authenticated, allow instant navigation
  React.useEffect(() => {
    if (isAuthenticated && !successMsg) {
      // do not auto redirect immediately if user just reached page to re-login, but can navigate
    }
  }, [isAuthenticated, successMsg]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    // 1. Validasi Input dasar
    if (!username.trim()) {
      setErrorMsg('Silakan masukkan Username atau NIP Anda.');
      return;
    }
    if (!password.trim()) {
      setErrorMsg('Silakan masukkan Password Anda.');
      return;
    }
    if (!userCaptcha.trim()) {
      setErrorMsg('Silakan masukkan kode CAPTCHA keamanan.');
      return;
    }

    // 2. Validasi CAPTCHA (case insensitive)
    if (userCaptcha.trim().toLowerCase() !== generatedCaptcha.toLowerCase()) {
      setErrorMsg('Kode CAPTCHA tidak cocok! Silakan coba lagi.');
      return;
    }

    // 3. Proses Login
    setIsLoading(true);
    setTimeout(() => {
      const res = login(username, password);
      setIsLoading(false);

      if (res.success) {
        setSuccessMsg('Otentikasi Berhasil! Mengalihkan ke Dashboard...');
        setTimeout(() => {
          navigate('/');
        }, 1000);
      } else {
        setErrorMsg(res.message || 'Gagal login. Periksa kembali kredensial Anda.');
      }
    }, 600);
  };


  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-white">
      {/* KIRI: Panel Gambar login.jpg penuh (warna asli, tanpa efek siluet) */}
      <div className="relative hidden lg:flex lg:w-1/2 overflow-hidden bg-slate-900">
        <img
          src={`${import.meta.env.BASE_URL}login.jpg`}
          alt="Ilustrasi SIM-Penugasan"
          className="absolute inset-0 h-full w-full object-cover object-center select-none"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-slate-950/20 to-transparent"
        />
        <div className="relative z-10 flex flex-col justify-between p-10 xl:p-12 text-white w-full">
          <div className="inline-flex items-center gap-3 self-start rounded-2xl bg-slate-950/65 px-4 py-2.5 backdrop-blur-md ring-1 ring-white/20 shadow-lg">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm">
              <img
                src={`${import.meta.env.BASE_URL}logo-bmti.png`}
                alt="Logo Kemendikdasmen"
                className="h-7 w-7 object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
              <ShieldCheck className="h-6 w-6 text-[#1D4ED8] hidden" />
            </div>
            <div>
              <p className="text-sm font-black tracking-wide text-white">SIM-PENUGASAN</p>
              <p className="text-xs text-slate-200">BBPPMPV BMTI • Kemendikdasmen</p>
            </div>
          </div>

          <div className="max-w-md space-y-2.5">
            <span className="inline-block rounded-full border border-white/25 bg-white/10 px-3 py-1 text-[11px] font-semibold backdrop-blur-xs">
              Portal Kedinasan Terpadu
            </span>
            <h1 className="text-3xl font-black leading-tight tracking-tight">
              Manajemen Surat Tugas &amp; Presensi Pegawai
            </h1>
            <p className="text-sm text-blue-100/90 leading-relaxed">
              Ajukan, pantau, dan kelola persetujuan surat tugas serta presensi kehadiran dalam satu sistem yang rapi dan terintegrasi.
            </p>
          </div>
        </div>
      </div>

      {/* KANAN: Form Login Rapi & Profesional (tanpa login Google) */}
      <div className="flex-1 flex items-center justify-center px-6 py-10 sm:px-10 bg-white">
        <div className="w-full max-w-[400px] space-y-6">
          {/* Header Mobile Logo */}
          <div className="flex lg:hidden items-center justify-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EEF3FB] text-[#1D4ED8]">
              <img
                src={`${import.meta.env.BASE_URL}logo-bmti.png`}
                alt="Logo"
                className="h-6 w-6 object-contain"
              />
            </div>
            <span className="text-sm font-black text-slate-800 tracking-tight">SIM-PENUGASAN</span>
          </div>

          <div className="text-center space-y-1.5">
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Masuk</h2>
            <p className="text-sm text-slate-500">
              Selamat datang kembali! Silakan masuk untuk melanjutkan.
            </p>
          </div>

          {/* Banner Messages */}
          {errorMsg && (
            <div className="flex items-start gap-2.5 p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-2xl animate-in fade-in slide-in-from-top-2">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="flex items-center gap-2.5 p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-2xl font-medium animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Field Username */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username atau NIP"
                aria-label="Username atau NIP"
                className="w-full pl-11 pr-4 py-3 text-sm bg-slate-50/70 border border-slate-300 rounded-full text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-500/10 focus:bg-white transition-all"
              />
            </div>

            {/* Field Password */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                aria-label="Password"
                className="w-full pl-11 pr-11 py-3 text-sm bg-slate-50/70 border border-slate-300 rounded-full text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-500/10 focus:bg-white transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <div className="flex items-center justify-end px-1">
              <Link
                to="/auth/forgot-password"
                className="text-xs font-medium text-slate-500 hover:text-[#1D4ED8] underline underline-offset-2 transition-colors"
              >
                Lupa password?
              </Link>
            </div>

            {/* Field CAPTCHA Security */}
            <div className="pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-blue-600" />
                  Verifikasi Keamanan (CAPTCHA)
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                <Captcha onCaptchaChange={setGeneratedCaptcha} />

                <div>
                  <input
                    type="text"
                    value={userCaptcha}
                    onChange={(e) => setUserCaptcha(e.target.value)}
                    placeholder="Ketik kode"
                    aria-label="Kode CAPTCHA"
                    className="w-full px-4 py-2.5 text-sm bg-slate-50/70 border border-slate-300 rounded-full text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-500/10 focus:bg-white uppercase font-mono tracking-wider text-center transition-all"
                    maxLength={6}
                  />
                </div>
              </div>
            </div>

            {/* Tombol Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-[#1E3A8A] to-[#2563EB] hover:from-[#172E6E] hover:to-[#1D4ED8] text-white font-bold text-sm rounded-full shadow-lg shadow-blue-600/25 hover:shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Memverifikasi...</span>
                </>
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  <span>Masuk</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Buttons */}
          <div className="pt-4 border-t border-slate-100 text-center">
            <p className="text-[11px] font-medium text-slate-400 mb-2.5">Akun Demo Pengujian Cepat</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setUsername('superadmin');
                  setPassword('password123');
                  setUserCaptcha(generatedCaptcha);
                  setErrorMsg(null);
                }}
                className="inline-flex items-center justify-center px-3 py-2 text-xs text-blue-700 hover:text-blue-900 bg-blue-50/80 hover:bg-blue-100 border border-blue-200/80 rounded-full font-semibold transition cursor-pointer"
              >
                Super Admin
              </button>
              <button
                type="button"
                onClick={() => {
                  setUsername('approval');
                  setPassword('password123');
                  setUserCaptcha(generatedCaptcha);
                  setErrorMsg(null);
                }}
                className="inline-flex items-center justify-center px-3 py-2 text-xs text-amber-700 hover:text-amber-900 bg-amber-50/80 hover:bg-amber-100 border border-amber-200/80 rounded-full font-semibold transition cursor-pointer"
              >
                Approval
              </button>
              <button
                type="button"
                onClick={() => {
                  setUsername('admin');
                  setPassword('password123');
                  setUserCaptcha(generatedCaptcha);
                  setErrorMsg(null);
                }}
                className="inline-flex items-center justify-center px-3 py-2 text-xs text-indigo-700 hover:text-indigo-900 bg-indigo-50/80 hover:bg-indigo-100 border border-indigo-200/80 rounded-full font-semibold transition cursor-pointer"
              >
                Admin TU
              </button>
              <button
                type="button"
                onClick={() => {
                  setUsername('user');
                  setPassword('password123');
                  setUserCaptcha(generatedCaptcha);
                  setErrorMsg(null);
                }}
                className="inline-flex items-center justify-center px-3 py-2 text-xs text-emerald-700 hover:text-emerald-900 bg-emerald-50/80 hover:bg-emerald-100 border border-emerald-200/80 rounded-full font-semibold transition cursor-pointer"
              >
                User (Pegawai)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
