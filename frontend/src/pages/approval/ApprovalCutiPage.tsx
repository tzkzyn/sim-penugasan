import { useState, useEffect, useMemo } from 'react';
import {
  CalendarCheck,
  Check,
  X,
  Calendar,
  Clock,
  AlertCircle,
  Building2,
  CheckCircle2,
  XCircle,
  Search,
  UserCheck
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import type { PresensiItem } from '@/types';

export interface PengajuanCutiItem {
  id: string | number;
  nama: string;
  nip: string;
  unitKerja: string;
  jabatan?: string;
  jenis: 'CUTI' | 'IZIN' | 'SAKIT' | 'DINAS_LUAR';
  mulai: string;
  selesai: string;
  alasan: string;
  dokumenLampiran?: string;
  status: 'MENUNGGU' | 'DISETUJUI' | 'DITOLAK';
  tanggalPengajuan: string;
  disetujuiOleh?: string;
  disetujuiPada?: string;
  catatanPenolakan?: string;
}

const formatTanggalDisplay = (tanggal: string) => {
  try {
    return new Intl.DateTimeFormat('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(new Date(`${tanggal}T00:00:00`));
  } catch {
    return tanggal;
  }
};

export const ApprovalCutiPage = () => {
  const { user } = useAuth();
  const [pengajuanList, setPengajuanList] = useState<PengajuanCutiItem[]>(() => {
    try {
      const saved = localStorage.getItem('sim_pengajuan_cuti');
      if (saved) {
        const raw = JSON.parse(saved);
        if (Array.isArray(raw)) {
          return raw.filter(
            (r: any) => r.id !== 101 && !r.alasan?.includes('Keperluan Keluarga')
          );
        }
      }
      return [];
    } catch {
      return [];
    }
  });

  const [filterStatus, setFilterStatus] = useState<'ALL' | 'MENUNGGU' | 'DISETUJUI' | 'DITOLAK'>('ALL');
  const [filterUnit, setFilterUnit] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  // Sync dengan localStorage secara real-time
  const loadData = () => {
    try {
      const saved = localStorage.getItem('sim_pengajuan_cuti');
      if (saved) {
        const raw = JSON.parse(saved);
        if (Array.isArray(raw)) {
          const cleaned = raw.filter(
            (r: any) => r.id !== 101 && !r.alasan?.includes('Keperluan Keluarga')
          );
          setPengajuanList(cleaned);
        }
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    loadData();
    const handleStorageChange = () => loadData();
    window.addEventListener('storage', handleStorageChange);
    const interval = setInterval(loadData, 2500);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  const saveToStorage = (list: PengajuanCutiItem[]) => {
    setPengajuanList(list);
    try {
      localStorage.setItem('sim_pengajuan_cuti', JSON.stringify(list));
      window.dispatchEvent(new Event('storage'));
    } catch {
      // ignore
    }
  };

  const syncToAttendanceHistory = (item: PengajuanCutiItem) => {
    try {
      const savedAttendance = localStorage.getItem('sim_riwayat_presensi');
      const attendanceList: PresensiItem[] = savedAttendance ? JSON.parse(savedAttendance) : [];

      // Masukkan presensi izin/cuti untuk rentang tanggal
      const newAttendanceRecord: PresensiItem = {
        id: `absen-cuti-${item.id}-${Date.now()}`,
        pegawaiId: String(item.nip || item.id),
        nama: item.nama,
        nip: item.nip,
        unitKerja: (item.unitKerja || 'RBI') as any,
        tanggal: item.mulai,
        jamMasuk: '-',
        lokasiPresensiMasuk: item.jenis === 'DINAS_LUAR' ? 'Lokasi Penugasan Luar' : 'Izin / Cuti Resmi',
        status: item.jenis === 'SAKIT' ? 'SAKIT' : item.jenis === 'CUTI' ? 'IZIN' : 'IZIN',
        keterangan: `${item.jenis}: ${item.alasan} (Disetujui oleh ${user?.nama || 'Pimpinan'})`,
      };

      const updated = [newAttendanceRecord, ...attendanceList];
      localStorage.setItem('sim_riwayat_presensi', JSON.stringify(updated));
      window.dispatchEvent(new Event('storage'));
    } catch {
      // ignore
    }
  };

  const handleApprove = (id: string | number) => {
    const targetItem = pengajuanList.find((p) => String(p.id) === String(id));
    if (!targetItem) return;

    const now = new Date().toLocaleString('id-ID', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });

    const updated = pengajuanList.map((item) => {
      if (String(item.id) === String(id)) {
        return {
          ...item,
          status: 'DISETUJUI' as const,
          disetujuiOleh: user?.nama || 'Pimpinan',
          disetujuiPada: now,
          catatanPenolakan: undefined,
        };
      }
      return item;
    });

    saveToStorage(updated);
    syncToAttendanceHistory(targetItem);

    setFeedbackMessage(`Pengajuan ${targetItem.jenis} atas nama ${targetItem.nama} BERHASIL DISETUJUI.`);
    setTimeout(() => setFeedbackMessage(null), 4000);
  };

  const handleReject = (id: string | number) => {
    const targetItem = pengajuanList.find((p) => String(p.id) === String(id));
    if (!targetItem) return;

    const alasanTolak = prompt(
      `Masukkan alasan penolakan permohonan ${targetItem.jenis} untuk ${targetItem.nama}:`,
      'Tidak memenuhi syarat ketentuan dinas'
    );

    if (alasanTolak === null) return; // Batal klik Cancel

    const now = new Date().toLocaleString('id-ID', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });

    const updated = pengajuanList.map((item) => {
      if (String(item.id) === String(id)) {
        return {
          ...item,
          status: 'DITOLAK' as const,
          disetujuiOleh: user?.nama || 'Pimpinan',
          disetujuiPada: now,
          catatanPenolakan: alasanTolak.trim() || 'Ditolak oleh atasan.',
        };
      }
      return item;
    });

    saveToStorage(updated);
    setFeedbackMessage(`Pengajuan ${targetItem.jenis} atas nama ${targetItem.nama} telah DITOLAK.`);
    setTimeout(() => setFeedbackMessage(null), 4000);
  };

  const filteredList = useMemo(() => {
    return pengajuanList.filter((item) => {
      const matchesStatus = filterStatus === 'ALL' || item.status === filterStatus;
      const matchesUnit = filterUnit === 'ALL' || item.unitKerja?.toLowerCase() === filterUnit.toLowerCase();
      const matchesSearch =
        item.nama?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.nip?.includes(searchQuery) ||
        item.alasan?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesStatus && matchesUnit && matchesSearch;
    });
  }, [pengajuanList, filterStatus, filterUnit, searchQuery]);

  const pendingCount = pengajuanList.filter((p) => p.status === 'MENUNGGU').length;
  const approvedCount = pengajuanList.filter((p) => p.status === 'DISETUJUI').length;
  const rejectedCount = pengajuanList.filter((p) => p.status === 'DITOLAK').length;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <CalendarCheck className="w-7 h-7 text-blue-600" />
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Verifikasi & Approval Izin / Cuti</h1>
          </div>
          <p className="text-slate-500 text-sm mt-1">
            Tinjau dan proses persetujuan pengajuan izin, sakit, cuti tahunan, serta dinas luar pegawai.
          </p>
        </div>

        {pendingCount > 0 && (
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs font-bold">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{pendingCount} Permohonan Butuh Persetujuan</span>
          </div>
        )}
      </div>

      {feedbackMessage && (
        <div className="flex items-center gap-2 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{feedbackMessage}</span>
        </div>
      )}

      {/* Ringkasan Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button
          onClick={() => setFilterStatus('MENUNGGU')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            filterStatus === 'MENUNGGU'
              ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-400/30'
              : 'bg-white border-slate-200 hover:border-amber-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Menunggu Approval</span>
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-amber-800">{pendingCount}</span>
            <span className="text-[11px] text-slate-400 block mt-0.5">Permohonan belum ditindaklanjuti</span>
          </div>
        </button>

        <button
          onClick={() => setFilterStatus('DISETUJUI')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            filterStatus === 'DISETUJUI'
              ? 'bg-emerald-50 border-emerald-400 ring-2 ring-emerald-400/30'
              : 'bg-white border-slate-200 hover:border-emerald-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Telah Disetujui</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-emerald-800">{approvedCount}</span>
            <span className="text-[11px] text-slate-400 block mt-0.5">Izin/Cuti resmi disahkan</span>
          </div>
        </button>

        <button
          onClick={() => setFilterStatus('DITOLAK')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            filterStatus === 'DITOLAK'
              ? 'bg-rose-50 border-rose-400 ring-2 ring-rose-400/30'
              : 'bg-white border-slate-200 hover:border-rose-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Ditolak</span>
            <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-rose-800">{rejectedCount}</span>
            <span className="text-[11px] text-slate-400 block mt-0.5">Permohonan tidak di-ACC</span>
          </div>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari nama pegawai, NIP, atau alasan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 outline-none focus:border-blue-500 w-64"
            />
          </div>

          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
            <Building2 className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={filterUnit}
              onChange={(e) => setFilterUnit(e.target.value)}
              className="bg-transparent text-xs text-slate-700 font-medium outline-none cursor-pointer"
            >
              <option value="ALL">Semua Unit Kerja</option>
              <option value="RBI">Unit RBI</option>
              <option value="Fastingkom">Unit Fastingkom</option>
              <option value="Kepeg">Unit Kepegawaian</option>
              <option value="PM">Unit PM</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
          {[
            { key: 'ALL', label: 'Semua' },
            { key: 'MENUNGGU', label: 'Menunggu' },
            { key: 'DISETUJUI', label: 'Disetujui' },
            { key: 'DITOLAK', label: 'Ditolak' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilterStatus(tab.key as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                filterStatus === tab.key ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Daftar Pengajuan Card List */}
      <div className="space-y-4">
        {filteredList.map((item) => (
          <div
            key={item.id}
            className={`bg-white rounded-2xl border p-5 shadow-xs transition-all flex flex-col md:flex-row md:items-center justify-between gap-5 ${
              item.status === 'MENUNGGU' ? 'border-amber-300 hover:shadow-md' : 'border-slate-200'
            }`}
          >
            <div className="space-y-3 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-bold text-base text-slate-800">{item.nama}</span>
                <span className="text-xs text-slate-400">NIP: {item.nip}</span>
                <span className="text-xs font-semibold bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-md border border-blue-200">
                  {item.unitKerja}
                </span>
                <span
                  className={`text-xs font-bold px-2.5 py-0.5 rounded-md ${
                    item.jenis === 'CUTI'
                      ? 'bg-purple-50 text-purple-700 border border-purple-200'
                      : item.jenis === 'SAKIT'
                      ? 'bg-rose-50 text-rose-700 border border-rose-200'
                      : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                  }`}
                >
                  {item.jenis === 'CUTI' ? 'Cuti Tahunan' : item.jenis === 'SAKIT' ? 'Izin Sakit' : 'Izin Tidak Masuk'}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600">
                <span className="flex items-center gap-1.5 text-slate-700 font-medium">
                  <Calendar className="w-3.5 h-3.5 text-blue-500" />
                  Periode: <strong className="text-slate-900">{formatTanggalDisplay(item.mulai)} s/d {formatTanggalDisplay(item.selesai)}</strong>
                </span>
                <span className="flex items-center gap-1.5 text-slate-400">
                  <Clock className="w-3.5 h-3.5" />
                  Diajukan: {item.tanggalPengajuan || 'Baru Saja'}
                </span>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs text-slate-700 space-y-1">
                <p className="font-semibold text-slate-500 text-[11px] uppercase tracking-wider">Keterangan / Alasan:</p>
                <p className="italic">"{item.alasan}"</p>
              </div>

              {item.catatanPenolakan && item.status === 'DITOLAK' && (
                <div className="bg-rose-50 p-3 rounded-xl border border-rose-200 text-xs text-rose-800 space-y-1">
                  <p className="font-bold text-rose-600 text-[11px] uppercase tracking-wider">Alasan Penolakan Atasan:</p>
                  <p>"{item.catatanPenolakan}"</p>
                </div>
              )}

              {item.disetujuiOleh && (
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>
                    Diproses oleh: <strong>{item.disetujuiOleh}</strong> ({item.disetujuiPada || '-'})
                  </span>
                </div>
              )}
            </div>

            {/* Tombol Aksi Persetujuan */}
            <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
              {item.status === 'MENUNGGU' ? (
                <>
                  <button
                    onClick={() => handleReject(item.id)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-rose-300 bg-rose-50 px-4 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100 hover:border-rose-400 transition cursor-pointer"
                  >
                    <X className="w-4 h-4" /> Tolak
                  </button>
                  <button
                    onClick={() => handleApprove(item.id)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 shadow-md shadow-emerald-600/20 transition cursor-pointer"
                  >
                    <Check className="w-4 h-4" /> Setujui (ACC)
                  </button>
                </>
              ) : (
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-extrabold ${
                    item.status === 'DISETUJUI'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-rose-50 text-rose-700 border border-rose-200'
                  }`}
                >
                  {item.status === 'DISETUJUI' ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" /> Disetujui
                    </>
                  ) : (
                    <>
                      <XCircle className="w-3.5 h-3.5" /> Ditolak
                    </>
                  )}
                </span>
              )}
            </div>
          </div>
        ))}

        {filteredList.length === 0 && (
          <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-12 text-center text-slate-400 space-y-2">
            <CalendarCheck className="mx-auto w-10 h-10 text-slate-300" />
            <p className="text-sm font-semibold text-slate-600">Tidak ada pengajuan izin / cuti pada filter ini</p>
            <p className="text-xs text-slate-400">
              Pengajuan baru yang dikirimkan pegawai akan langsung muncul di antrean ini untuk diverifikasi.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
