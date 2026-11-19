import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { usePenugasan } from '@/context/PenugasanContext';
import {
  Activity,
  Search,
  Filter,
  Calendar,
  MapPin,
  Clock,
  ArrowRight,
  TrendingUp,
  ShieldCheck
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { id } from 'date-fns/locale';

export const MonitoringTugasPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const basePrefix = isSuperAdmin ? '/super-admin' : '/admin';
  const { tasks } = usePenugasan();
  const [searchTerm, setSearchTerm] = useState('');
  const [unitFilter, setUnitFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const matchSearch =
        task.perihal.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.nomorSurat.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.lokasiPenugasan.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.pegawaiDitugaskan.some((p) => p.nama.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchUnit = unitFilter === 'ALL' || task.unitKerja === unitFilter;
      const matchStatus = statusFilter === 'ALL' || task.status === statusFilter;

      return matchSearch && matchUnit && matchStatus;
    });
  }, [tasks, searchTerm, unitFilter, statusFilter]);

  // Statistics
  const stats = useMemo(() => {
    const total = tasks.length;
    const active = tasks.filter((t) => t.status === 'SURAT_TERBIT').length;
    const pending = tasks.filter((t) => t.status === 'VERIFIKASI_SUBBAGIAN' || t.status === 'PERSETUJUAN_PIMPINAN').length;
    const draft = tasks.filter((t) => t.status === 'DRAFT').length;
    return { total, active, pending, draft };
  }, [tasks]);

  // Calculate progress percentage based on date or status
  const [nowMs] = useState(() => Date.now());
  const calculateProgress = (task: typeof tasks[0]) => {
    if (task.status === 'SURAT_TERBIT') {
      const start = new Date(task.tanggalMulai).getTime();
      const end = new Date(task.tanggalSelesai).getTime();
      if (nowMs <= start) return 20;
      if (nowMs >= end) return 100;
      const pct = Math.round(((nowMs - start) / (end - start)) * 100);
      return Math.min(Math.max(pct, 25), 90);
    }
    if (task.status === 'PERSETUJUAN_PIMPINAN') return 60;
    if (task.status === 'VERIFIKASI_SUBBAGIAN') return 40;
    return 15;
  };

  return (
    <div className="p-2 sm:p-4 max-w-7xl mx-auto space-y-5">
      {/* Title & Action */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between px-1 pt-1">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-[#ECF2FF] text-[#5D87FF] flex items-center justify-center shrink-0">
            {isSuperAdmin ? <ShieldCheck className="h-4 w-4" /> : <Activity className="h-4 w-4" />}
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900">
              {isSuperAdmin ? 'Monitoring Penugasan Global (Super Admin)' : 'Monitoring Real-Time Penugasan'}
            </h1>
            <p className="text-xs text-slate-500">
              {isSuperAdmin
                ? 'Audit dan pantau pergerakan dinas seluruh pegawai dan surat tugas lintas unit kerja.'
                : 'Pantau progres operasional surat tugas, lokasi tim lapangan, dan persentase realisasi.'}
            </p>
          </div>
        </div>
        <button
          onClick={() => navigate(`${basePrefix}/tugas/buat`)}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#5D87FF] px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#4A75F2] transition cursor-pointer shrink-0"
        >
          Buat Tugas Baru
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Penugasan</p>
              <p className="text-2xl font-bold text-slate-800 mt-1">{stats.total}</p>
            </div>
            <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
              <TrendingUp className="h-6 w-6" />
            </div>
          </div>
          <p className="text-[11px] text-slate-400 mt-3">Akumulasi seluruh surat tugas tercatat</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Sedang Bertugas</p>
              <p className="text-2xl font-bold text-emerald-600 mt-1">{stats.active}</p>
            </div>
            <div className="rounded-xl bg-emerald-50 p-3 text-emerald-600">
              <Activity className="h-6 w-6" />
            </div>
          </div>
          <p className="text-[11px] text-slate-400 mt-3">Surat terbit & tim aktif di lokasi</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Proses Persetujuan</p>
              <p className="text-2xl font-bold text-amber-600 mt-1">{stats.pending}</p>
            </div>
            <div className="rounded-xl bg-amber-50 p-3 text-amber-600">
              <Clock className="h-6 w-6" />
            </div>
          </div>
          <p className="text-[11px] text-slate-400 mt-3">Menunggu verifikasi kasubag/pimpinan</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Draft Tugas</p>
              <p className="text-2xl font-bold text-slate-700 mt-1">{stats.draft}</p>
            </div>
            <div className="rounded-xl bg-slate-100 p-3 text-slate-600">
              <Calendar className="h-6 w-6" />
            </div>
          </div>
          <p className="text-[11px] text-slate-400 mt-3">Rancangan penugasan belum diajukan</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari perihal, nomor surat, lokasi, atau nama pegawai..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 pl-1">
            <Filter className="h-3.5 w-3.5" /> Filter:
          </div>
          <select
            value={unitFilter}
            onChange={(e) => setUnitFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
          >
            <option value="ALL">Semua Unit Kerja</option>
            <option value="RBI">RBI</option>
            <option value="Fastingkom">Fastingkom</option>
            <option value="Kepeg">Kepeg</option>
            <option value="PM">PM</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
          >
            <option value="ALL">Semua Status</option>
            <option value="SURAT_TERBIT">Surat Terbit (Aktif)</option>
            <option value="PERSETUJUAN_PIMPINAN">Persetujuan Pimpinan</option>
            <option value="VERIFIKASI_SUBBAGIAN">Verifikasi Subbagian</option>
            <option value="DRAFT">Draft</option>
          </select>
        </div>
      </div>

      {/* Task Monitoring Cards Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {filteredTasks.length > 0 ? (
          filteredTasks.map((task) => {
            const progress = calculateProgress(task);
            const totalDays = differenceInDays(new Date(task.tanggalSelesai), new Date(task.tanggalMulai)) + 1;

            return (
              <div
                key={task.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg">
                      {task.nomorSurat}
                    </span>
                    <span
                      className={`text-[11px] font-bold px-2.5 py-1 rounded-md ${
                        task.status === 'SURAT_TERBIT'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : task.status === 'PERSETUJUAN_PIMPINAN'
                          ? 'bg-purple-50 text-purple-700 border border-purple-200'
                          : task.status === 'VERIFIKASI_SUBBAGIAN'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {task.status.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-800 text-base mt-3 line-clamp-2">
                    {task.perihal}
                  </h3>

                  <div className="mt-3 space-y-2 text-xs text-slate-600">
                    <div className="flex items-center gap-2 text-slate-500">
                      <MapPin className="h-4 w-4 text-rose-500 shrink-0" />
                      <span className="truncate">{task.lokasiPenugasan}</span>
                      {task.lokasiSpesifik && <span className="text-slate-400">({task.lokasiSpesifik})</span>}
                    </div>

                    <div className="flex items-center gap-2 text-slate-500">
                      <Calendar className="h-4 w-4 text-blue-500 shrink-0" />
                      <span>
                        {format(new Date(task.tanggalMulai), 'dd MMM', { locale: id })} -{' '}
                        {format(new Date(task.tanggalSelesai), 'dd MMM yyyy', { locale: id })} ({totalDays} Hari)
                      </span>
                    </div>
                  </div>

                  {/* Assigned Personnel */}
                  <div className="mt-4 pt-3 border-t border-slate-100">
                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                      Tim Ditugaskan ({task.pegawaiDitugaskan.length} Pegawai):
                    </p>
                    <div className="flex items-center gap-2 flex-wrap">
                      {task.pegawaiDitugaskan.slice(0, 3).map((p) => (
                        <div
                          key={p.id}
                          className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-full py-1 px-2.5 text-xs font-medium text-slate-700"
                        >
                          <img
                            src={p.fotoAvatar}
                            alt={p.nama}
                            className="h-5 w-5 rounded-full object-cover border border-slate-300"
                          />
                          <span className="truncate max-w-[120px]">{p.nama}</span>
                        </div>
                      ))}
                      {task.pegawaiDitugaskan.length > 3 && (
                        <span className="text-xs font-semibold text-slate-500">
                          +{task.pegawaiDitugaskan.length - 3} lainnya
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-4">
                    <div className="flex justify-between items-center text-xs mb-1">
                      <span className="font-semibold text-slate-600">Progres Penugasan</span>
                      <span className="font-bold text-blue-600">{progress}%</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          progress === 100
                            ? 'bg-emerald-500'
                            : progress >= 60
                            ? 'bg-blue-600'
                            : 'bg-amber-500'
                        }`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] font-medium text-slate-400">Unit: {task.unitKerja}</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => navigate(`${basePrefix}/tugas/edit?id=${task.id}`)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 transition cursor-pointer"
                    >
                      Kelola Tugas <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center text-slate-400">
            <Activity className="mx-auto h-10 w-10 text-slate-300 mb-3" />
            <p className="text-base font-semibold text-slate-600">Tidak ada penugasan yang sesuai</p>
            <p className="text-xs text-slate-400 mt-1">Coba sesuaikan kata kunci pencarian atau filter unit kerja.</p>
          </div>
        )}
      </div>
    </div>
  );
};
