import { useCallback, useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import type { PresensiItem, UnitKerjaType } from '@/types';
import {
  CalendarCheck,
  User,
  Users,
  Clock,
  CheckCircle2,
  Calendar as CalendarIcon,
  ArrowUpRight,
} from 'lucide-react';
import { UserPresensiPegawaiLainTab } from '@/components/user/UserPresensiPegawaiLainTab';

type AttendanceStatus = 'HADIR' | 'TERLAMBAT' | 'IZIN' | 'SAKIT' | 'ALFA';

export const AbsensiPage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'PRIBADI' | 'PEGAWAI_LAIN'>('PRIBADI');
  const [tanggalHariIni, setTanggalHariIni] = useState(() => new Date());

  // Perbarui tanggal secara berkala
  useEffect(() => {
    const timer = window.setInterval(() => setTanggalHariIni(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  // State Riwayat Presensi (Live dari localStorage)
  const [riwayatPresensi, setRiwayatPresensi] = useState<PresensiItem[]>(() => {
    try {
      const saved = localStorage.getItem('sim_riwayat_presensi');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // ignore
    }
    return [];
  });

  // State Simulasi Absen Hari Ini
  const [sudahAbsenMasuk, setSudahAbsenMasuk] = useState(false);
  const [jamMasukSimulasi, setJamMasukSimulasi] = useState<string | null>(null);
  const [sudahAbsenPulang, setSudahAbsenPulang] = useState(false);
  const [jamPulangSimulasi, setJamPulangSimulasi] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Muat status absensi hari ini untuk user yang login
  const todayDateStr = useMemo(() => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }, []);

  const loadAttendanceState = useCallback(() => {
    try {
      const saved = localStorage.getItem('sim_riwayat_presensi');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setRiwayatPresensi(parsed);
        }
      }

      const todaySaved = localStorage.getItem(`sim_presensi_today_${user?.nip || 'default'}_${todayDateStr}`);
      if (todaySaved) {
        const parsed = JSON.parse(todaySaved);
        if (parsed.sudahMasuk) {
          setSudahAbsenMasuk(true);
          setJamMasukSimulasi(parsed.jamMasuk);
        }
        if (parsed.sudahPulang) {
          setSudahAbsenPulang(true);
          setJamPulangSimulasi(parsed.jamPulang);
        }
      }
    } catch {
      // ignore
    }
  }, [user, todayDateStr]);

  useEffect(() => {
    const initTimer = window.setTimeout(loadAttendanceState, 0);
    const handleStorageChange = () => loadAttendanceState();
    window.addEventListener('storage', handleStorageChange);
    const interval = setInterval(loadAttendanceState, 3000);
    return () => {
      window.clearTimeout(initTimer);
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [loadAttendanceState]);

  // Handle Absen Masuk Click
  const handleAbsenMasuk = () => {
    if (sudahAbsenMasuk) return;
    const now = new Date();
    const timeNow = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    const isLate = now.getHours() > 8 || (now.getHours() === 8 && now.getMinutes() > 0);
    const status: AttendanceStatus = isLate ? 'TERLAMBAT' : 'HADIR';

    const newRecord: PresensiItem = {
      id: `absen-${user?.nip || 'user'}-${Date.now()}`,
      pegawaiId: user?.nip || '199204152015032001',
      nama: user?.nama || 'Pegawai Pelaksana',
      nip: user?.nip || '199204152015032001',
      unitKerja: (user?.unitKerja || 'RBI') as UnitKerjaType,
      tanggal: todayDateStr,
      jamMasuk: timeNow,
      lokasiPresensiMasuk: 'Kantor Instansi (On-Site)',
      status,
      keterangan: isLate ? 'Presensi terlambat' : 'Tepat waktu',
    };

    const nextList = [newRecord, ...riwayatPresensi.filter(r => !(r.tanggal === todayDateStr && r.nip === user?.nip))];
    setRiwayatPresensi(nextList);
    setSudahAbsenMasuk(true);
    setJamMasukSimulasi(timeNow);

    try {
      localStorage.setItem('sim_riwayat_presensi', JSON.stringify(nextList));
      localStorage.setItem(
        `sim_presensi_today_${user?.nip || 'default'}_${todayDateStr}`,
        JSON.stringify({
          sudahMasuk: true,
          jamMasuk: timeNow,
          sudahPulang: false,
          jamPulang: null,
        })
      );
      window.dispatchEvent(new Event('storage'));
    } catch {
      // ignore
    }

    setToastMessage(`Presensi Masuk berhasil dicatat pada pukul ${timeNow} (${status}).`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Handle Absen Pulang Click
  const handleAbsenPulang = () => {
    if (!sudahAbsenMasuk || sudahAbsenPulang) return;
    const now = new Date();
    const timeNow = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

    const nextList = riwayatPresensi.map((item) => {
      if (item.tanggal === todayDateStr && item.nip === (user?.nip || '199204152015032001')) {
        return {
          ...item,
          jamKeluar: timeNow,
          lokasiPresensiKeluar: 'Kantor Instansi (On-Site)',
        };
      }
      return item;
    });

    setRiwayatPresensi(nextList);
    setSudahAbsenPulang(true);
    setJamPulangSimulasi(timeNow);

    try {
      localStorage.setItem('sim_riwayat_presensi', JSON.stringify(nextList));
      const todaySaved = localStorage.getItem(`sim_presensi_today_${user?.nip || 'default'}_${todayDateStr}`);
      const parsed = todaySaved ? JSON.parse(todaySaved) : {};
      localStorage.setItem(
        `sim_presensi_today_${user?.nip || 'default'}_${todayDateStr}`,
        JSON.stringify({
          ...parsed,
          sudahPulang: true,
          jamPulang: timeNow,
        })
      );
      window.dispatchEvent(new Event('storage'));
    } catch {
      // ignore
    }

    setToastMessage(`Presensi Pulang berhasil dicatat pada pukul ${timeNow}. Selamat beristirahat!`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Riwayat Presensi Saya (Pribadi)
  const myAttendanceList = useMemo(() => {
    if (!user?.nip) return riwayatPresensi;
    return riwayatPresensi.filter((r) => r.nip === user.nip);
  }, [riwayatPresensi, user]);

  // Statistik Real-time Presensi Saya
  const totalHadirCount = myAttendanceList.filter((r) => r.status === 'HADIR').length;
  const totalTerlambatCount = myAttendanceList.filter((r) => r.status === 'TERLAMBAT').length;
  const totalIzinCount = myAttendanceList.filter((r) => r.status === 'IZIN' || r.status === 'SAKIT').length;
  const totalHariRekap = totalHadirCount + totalTerlambatCount + totalIzinCount;
  const persentaseKehadiranReal = totalHariRekap > 0
    ? Math.round(((totalHadirCount + totalTerlambatCount) / totalHariRekap) * 100)
    : 100;

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <CalendarCheck className="w-7 h-7 text-blue-600" />
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Manajemen Presensi & Kehadiran</h1>
          </div>
          <p className="text-slate-500 text-sm mt-1">
            Rekap presensi harian, clock-in/out kehadiran, serta pemantauan log presensi pegawai.
          </p>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center bg-slate-100 p-1.5 rounded-xl text-xs sm:text-sm font-medium w-fit">
          <button
            onClick={() => setActiveTab('PRIBADI')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all cursor-pointer ${
              activeTab === 'PRIBADI' ? 'bg-white text-blue-700 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Presensi Saya</span>
          </button>
          <button
            onClick={() => setActiveTab('PEGAWAI_LAIN')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all cursor-pointer ${
              activeTab === 'PEGAWAI_LAIN' ? 'bg-white text-blue-700 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Presensi Pegawai Lain</span>
          </button>
        </div>
      </div>

      {toastMessage && (
        <div className="flex items-center gap-2 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* SUB-MENU 1: PRESENSI PRIBADI */}
      {activeTab === 'PRIBADI' && (
        <div className="space-y-6">
          {/* Card Form Action Presensi Hari Ini */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 text-white p-6 rounded-2xl shadow-lg shadow-blue-500/15 space-y-4 flex flex-col justify-between">
              <div>
                <span className="text-xs font-semibold bg-white/20 px-3 py-1 rounded-full text-white backdrop-blur-xs">
                  Status Presensi Hari Ini
                </span>
                <h3 className="text-xl font-extrabold mt-3">
                  {tanggalHariIni.toLocaleDateString('id-ID', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </h3>
              </div>

              <div className="bg-white/10 backdrop-blur-md p-4 rounded-xl space-y-2 border border-white/20">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-blue-100">Jam Masuk:</span>
                  <span className="font-mono font-bold text-sm">{jamMasukSimulasi || '-'}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-blue-100">Jam Pulang:</span>
                  <span className="font-mono font-bold text-sm">{sudahAbsenPulang ? jamPulangSimulasi : '-'}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  disabled={sudahAbsenMasuk}
                  onClick={handleAbsenMasuk}
                  className={`py-2.5 px-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    sudahAbsenMasuk
                      ? 'bg-emerald-500/30 text-white border border-emerald-400/40 cursor-not-allowed'
                      : 'bg-emerald-500 hover:bg-emerald-400 text-white shadow-md'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{sudahAbsenMasuk ? 'Sudah Masuk' : 'Absen Masuk'}</span>
                </button>

                <button
                  disabled={!sudahAbsenMasuk || sudahAbsenPulang}
                  onClick={handleAbsenPulang}
                  className={`py-2.5 px-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    sudahAbsenPulang
                      ? 'bg-amber-500/30 text-white border border-amber-400/40 cursor-not-allowed'
                      : sudahAbsenMasuk
                      ? 'bg-amber-500 hover:bg-amber-400 text-white shadow-md'
                      : 'bg-white/20 text-white/50 cursor-not-allowed'
                  }`}
                >
                  <Clock className="w-4 h-4" />
                  <span>{sudahAbsenPulang ? 'Sudah Pulang' : 'Absen Pulang'}</span>
                </button>
              </div>
            </div>

            {/* Statistik Quick Summary */}
            <div className="md:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div className="mt-4">
                  <span className="text-2xl font-extrabold text-slate-800">{totalHadirCount} Hari</span>
                  <p className="text-xs text-slate-500 mt-1">Hadir Tepat Waktu</p>
                </div>
              </div>

              <div className={`p-5 rounded-2xl border shadow-xs flex flex-col justify-between ${
                totalTerlambatCount > 0 ? 'bg-rose-50/40 border-rose-300 ring-1 ring-rose-200' : 'bg-white border-slate-200'
              }`}>
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold ${
                  totalTerlambatCount > 0 ? 'bg-rose-100 text-rose-600' : 'bg-amber-50 text-amber-600'
                }`}>
                  <Clock className="w-5 h-5" />
                </div>
                <div className="mt-4">
                  <span className={`text-2xl font-extrabold ${totalTerlambatCount > 0 ? 'text-rose-700' : 'text-slate-800'}`}>
                    {totalTerlambatCount} Hari
                  </span>
                  <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                    Terlambat Presensi
                    {totalTerlambatCount > 0 && (
                      <span className="text-[10px] font-bold text-rose-600 bg-rose-100 px-1.5 py-0.5 rounded-full">
                        Perhatian
                      </span>
                    )}
                  </p>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <CalendarIcon className="w-5 h-5" />
                </div>
                <div className="mt-4">
                  <span className="text-2xl font-extrabold text-slate-800">{totalIzinCount} Hari</span>
                  <p className="text-xs text-slate-500 mt-1">Izin / Sakit Resmi</p>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                  <ArrowUpRight className="w-5 h-5" />
                </div>
                <div className="mt-4">
                  <span className="text-2xl font-extrabold text-indigo-700">{persentaseKehadiranReal}%</span>
                  <p className="text-xs text-slate-500 mt-1">Tingkat Kehadiran</p>
                </div>
              </div>
            </div>
          </div>

          {/* DETAIL RIWAYAT PRESENSI PRIBADI */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-600" />
              Detail Riwayat Presensi Pribadi (Log Harian)
            </h3>

            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full min-w-[640px] text-left text-xs sm:text-sm">
                <thead className="bg-slate-50 text-slate-700 font-bold uppercase text-[11px] border-b border-slate-200">
                  <tr>
                    <th className="whitespace-nowrap px-4 py-3">Tanggal</th>
                    <th className="whitespace-nowrap px-4 py-3">Jam Masuk</th>
                    <th className="whitespace-nowrap px-4 py-3">Jam Keluar</th>
                    <th className="min-w-[280px] px-4 py-3">Status & Keterangan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {myAttendanceList.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50">
                      <td className="whitespace-nowrap px-4 py-3 font-mono font-bold text-slate-800">{log.tanggal}</td>
                      <td className="whitespace-nowrap px-4 py-3 font-mono font-semibold text-emerald-700">{log.jamMasuk}</td>
                      <td className="whitespace-nowrap px-4 py-3 font-mono font-semibold text-amber-700">{log.jamKeluar || '-'}</td>
                      <td className="min-w-[280px] whitespace-normal break-words px-4 py-3">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded text-[11px] font-bold ${
                            log.status === 'HADIR'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : log.status === 'TERLAMBAT'
                              ? 'bg-rose-100 text-rose-800 border border-rose-300 ring-1 ring-rose-400 font-extrabold'
                              : log.status === 'ALFA'
                              ? 'bg-red-200 text-red-900 border border-red-500 ring-2 ring-red-500 font-black'
                              : log.status === 'IZIN'
                              ? 'bg-blue-100 text-blue-800 border border-blue-200'
                              : 'bg-rose-100 text-rose-800 border border-rose-200'
                          }`}
                        >
                          {log.status}
                        </span>
                        {log.keterangan && <p className="text-[11px] text-slate-500 mt-0.5">{log.keterangan}</p>}
                      </td>
                    </tr>
                  ))}
                  {myAttendanceList.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-slate-400">
                        Belum ada data riwayat presensi yang tercatat. Silakan lakukan Absen Masuk di atas.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-MENU 2: PRESENSI PEGAWAI LAIN */}
      {activeTab === 'PEGAWAI_LAIN' && (
        <UserPresensiPegawaiLainTab riwayatPresensi={riwayatPresensi} />
      )}
    </div>
  );
};
