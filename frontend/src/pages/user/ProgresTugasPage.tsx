import { useState, useMemo } from 'react';
import { usePenugasan } from '@/context/PenugasanContext';
import { Link } from 'react-router-dom';
import {
  FileText,
  Clock,
  Calendar,
  MapPin,
  Search,
  Eye,
  TrendingUp,
  ArrowRight
} from 'lucide-react';
import type { AjuanSuratTugas } from '@/types';

export const ProgresTugasPage = () => {
  const { tasks } = usePenugasan();

  const [selectedTahun, setSelectedTahun] = useState<string>('2026');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [detailModal, setDetailModal] = useState<AjuanSuratTugas | null>(null);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Helper calculate progress percentage based on date
  const getTaskProgress = (mulaiStr: string, selesaiStr: string) => {
    const start = new Date(mulaiStr).getTime();
    const end = new Date(selesaiStr).getTime();
    const now = today.getTime();

    if (now < start) return { percent: 0, statusLabel: 'Terjadwal', color: 'bg-amber-500' };
    if (now > end) return { percent: 100, statusLabel: 'Selesai', color: 'bg-emerald-500' };

    const totalDays = Math.max(end - start, 1);
    const elapsed = Math.max(now - start, 0);
    const percent = Math.min(Math.max(Math.round((elapsed / totalDays) * 100), 15), 90);
    return { percent, statusLabel: 'Sedang Berlangsung', color: 'bg-blue-600' };
  };

  // Filter tasks for this view: Tasks that are in approved or active state
  const relevantTasks = useMemo(() => {
    return tasks.filter((t) => {
      // Filter year
      if (selectedTahun !== 'ALL') {
        const taskYear = new Date(t.tanggalMulai).getFullYear().toString();
        if (taskYear !== selectedTahun) return false;
      }

      // Filter status
      const progress = getTaskProgress(t.tanggalMulai, t.tanggalSelesai);
      if (selectedStatus === 'BERLANGSUNG' && progress.statusLabel !== 'Sedang Berlangsung') return false;
      if (selectedStatus === 'TERJADWAL' && progress.statusLabel !== 'Terjadwal') return false;
      if (selectedStatus === 'SELESAI' && progress.statusLabel !== 'Selesai') return false;

      // Filter search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = t.perihal.toLowerCase().includes(q);
        const matchNomor = t.nomorSurat.toLowerCase().includes(q);
        const matchLokasi = (t.lokasiPenugasan || '').toLowerCase().includes(q);
        return matchTitle || matchNomor || matchLokasi;
      }

      return true;
    });
  }, [tasks, selectedTahun, selectedStatus, searchQuery]);

  // Statistics
  const stats = useMemo(() => {
    let aktif = 0;
    let terjadwal = 0;
    let selesai = 0;

    tasks.forEach((t) => {
      const p = getTaskProgress(t.tanggalMulai, t.tanggalSelesai);
      if (p.statusLabel === 'Sedang Berlangsung') aktif++;
      else if (p.statusLabel === 'Terjadwal') terjadwal++;
      else if (p.statusLabel === 'Selesai') selesai++;
    });

    return { aktif, terjadwal, selesai, total: tasks.length };
  }, [tasks]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-6 w-6 text-blue-600" />
              <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Progres Surat Tugas Pegawai</h1>
            </div>
            <p className="mt-1 text-sm text-slate-500">
              Pantau perkembangan dan realisasi pelaksanaan surat tugas yang sedang aktif di lapangan.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/user/tugas/pengajuan"
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 transition"
            >
              <FileText className="h-4 w-4" /> Ajukan Surat Tugas Baru
            </Link>
          </div>
        </div>

        {/* Quick Progress Metrics */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4">
            <span className="text-xs font-semibold text-blue-600 block">Sedang Berlangsung</span>
            <span className="text-2xl font-extrabold text-blue-900 mt-1 block">{stats.aktif}</span>
            <span className="text-[11px] text-blue-600 mt-0.5 block">Tugas aktif di lapangan</span>
          </div>

          <div className="rounded-xl border border-amber-100 bg-amber-50/60 p-4">
            <span className="text-xs font-semibold text-amber-600 block">Terjadwal Mendatang</span>
            <span className="text-2xl font-extrabold text-amber-900 mt-1 block">{stats.terjadwal}</span>
            <span className="text-[11px] text-amber-600 mt-0.5 block">Menunggu tanggal mulai</span>
          </div>

          <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-4">
            <span className="text-xs font-semibold text-emerald-600 block">Selesai Dilaksanakan</span>
            <span className="text-2xl font-extrabold text-emerald-900 mt-1 block">{stats.selesai}</span>
            <span className="text-[11px] text-emerald-600 mt-0.5 block">Pelaksanaan tuntas</span>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <span className="text-xs font-semibold text-slate-600 block">Total Surat Tugas</span>
            <span className="text-2xl font-extrabold text-slate-900 mt-1 block">{stats.total}</span>
            <span className="text-[11px] text-slate-500 mt-0.5 block">Tercatat di sistem</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nomor surat, perihal tugas, atau kota lokasi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 py-2 text-sm text-slate-700 outline-none focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <select
              value={selectedTahun}
              onChange={(e) => setSelectedTahun(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs font-medium text-slate-700 outline-none focus:border-blue-500 focus:bg-white"
            >
              <option value="2026">Tahun 2026</option>
              <option value="2025">Tahun 2025</option>
              <option value="2024">Tahun 2024</option>
              <option value="ALL">Semua Tahun</option>
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs font-medium text-slate-700 outline-none focus:border-blue-500 focus:bg-white"
            >
              <option value="ALL">Semua Progres</option>
              <option value="BERLANGSUNG">Sedang Berlangsung</option>
              <option value="TERJADWAL">Terjadwal</option>
              <option value="SELESAI">Selesai</option>
            </select>
          </div>
        </div>
      </div>

      {/* Progres Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        <div className="border-b border-slate-200 bg-slate-50/70 px-6 py-4 flex items-center justify-between">
          <h2 className="font-bold text-slate-800 text-sm">Daftar Progres Pelaksanaan Surat Tugas</h2>
          <span className="text-xs text-slate-500 font-medium">Menampilkan {relevantTasks.length} tugas</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50/40 text-xs font-semibold text-slate-500">
              <tr>
                <th className="px-6 py-3.5">Nomor & Perihal Surat Tugas</th>
                <th className="px-6 py-3.5">Lokasi Tugas</th>
                <th className="px-6 py-3.5">Jadwal & Durasi</th>
                <th className="px-6 py-3.5">Progres Pelaksanaan</th>
                <th className="px-6 py-3.5 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {relevantTasks.map((task) => {
                const prog = getTaskProgress(task.tanggalMulai, task.tanggalSelesai);
                const assignedCount = task.pegawaiDitugaskan?.length || 1;

                return (
                  <tr key={task.id} className="hover:bg-slate-50/70 transition">
                    <td className="px-6 py-4 max-w-sm">
                      <div className="space-y-1">
                        <span className="font-semibold text-slate-800 block hover:text-blue-600 transition cursor-pointer" onClick={() => setDetailModal(task)}>
                          {task.perihal}
                        </span>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 font-medium">
                            {task.nomorSurat}
                          </span>
                          <span>•</span>
                          <span className="text-blue-700 font-medium">{task.unitKerja}</span>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-start gap-1.5 text-xs text-slate-600 max-w-xs">
                        <MapPin className="h-3.5 w-3.5 text-rose-500 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium text-slate-800">{task.lokasiPenugasan}</p>
                          {task.lokasiSpesifik && (
                            <p className="text-slate-400 text-[11px] truncate">{task.lokasiSpesifik}</p>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-xs text-slate-600 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 font-medium text-slate-700">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        <span>{task.tanggalMulai} s/d {task.tanggalSelesai}</span>
                      </div>
                      <span className="text-[11px] text-slate-400 block mt-0.5">
                        {assignedCount} Pegawai Bertugas
                      </span>
                    </td>

                    <td className="px-6 py-4 min-w-[180px]">
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className={`inline-flex items-center gap-1 font-semibold ${
                            prog.statusLabel === 'Sedang Berlangsung' ? 'text-blue-700' :
                            prog.statusLabel === 'Selesai' ? 'text-emerald-700' : 'text-amber-700'
                          }`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${prog.color}`} />
                            {prog.statusLabel}
                          </span>
                          <span className="font-mono font-bold text-slate-600">{prog.percent}%</span>
                        </div>

                        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${prog.color}`}
                            style={{ width: `${prog.percent}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-center whitespace-nowrap">
                      <button
                        onClick={() => setDetailModal(task)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-xs hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 transition"
                      >
                        <Eye className="h-3.5 w-3.5" /> Detail
                      </button>
                    </td>
                  </tr>
                );
              })}

              {relevantTasks.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="mx-auto max-w-sm space-y-2">
                      <Clock className="mx-auto h-8 w-8 text-slate-300" />
                      <p className="font-semibold text-slate-700 text-sm">Tidak ada progres surat tugas</p>
                      <p className="text-xs text-slate-400">
                        Belum ada data penugasan pada filter periode ini atau penugasan belum dibuat.
                      </p>
                      <Link
                        to="/user/tugas/pengajuan"
                        className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline pt-2"
                      >
                        Buat pengajuan surat tugas baru <ArrowRight className="h-3 w-3" />
                      </Link>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Detail Progres */}
      {detailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-blue-600">Detail Progres Penugasan</span>
                <h3 className="text-lg font-bold text-slate-800">{detailModal.nomorSurat}</h3>
              </div>
              <button
                onClick={() => setDetailModal(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <span className="text-slate-400 font-medium">Perihal Tugas:</span>
                <p className="text-sm font-semibold text-slate-800 mt-0.5">{detailModal.perihal}</p>
              </div>

              {detailModal.deskripsi && (
                <div>
                  <span className="text-slate-400 font-medium">Deskripsi Kegiatan:</span>
                  <p className="text-slate-700 mt-0.5 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    {detailModal.deskripsi}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div>
                  <span className="text-slate-400 font-medium">Tanggal Mulai:</span>
                  <p className="font-semibold text-slate-800 mt-0.5">{detailModal.tanggalMulai}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Tanggal Selesai:</span>
                  <p className="font-semibold text-slate-800 mt-0.5">{detailModal.tanggalSelesai}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Lokasi:</span>
                  <p className="font-semibold text-slate-800 mt-0.5">{detailModal.lokasiPenugasan}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Unit Kerja:</span>
                  <p className="font-semibold text-blue-700 mt-0.5">{detailModal.unitKerja}</p>
                </div>
              </div>

              <div>
                <span className="text-slate-400 font-medium block mb-1.5">Pegawai Bertugas:</span>
                <div className="space-y-1.5 max-h-36 overflow-y-auto">
                  {detailModal.pegawaiDitugaskan?.map((peg) => (
                    <div key={peg.id} className="flex items-center gap-2 rounded-lg border border-slate-200 p-2 bg-white">
                      <div className="h-6 w-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-[10px]">
                        {peg.nama.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-800 truncate">{peg.nama}</p>
                        <p className="text-[10px] text-slate-400">NIP. {peg.nip}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
              <button
                onClick={() => setDetailModal(null)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Tutup
              </button>
              <Link
                to={`/user/pemetaan`}
                className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 flex items-center gap-1.5"
              >
                <MapPin className="h-3.5 w-3.5" /> Lihat di Peta
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
