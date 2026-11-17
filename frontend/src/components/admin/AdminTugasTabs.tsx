import React, { useState } from 'react';
import { usePenugasan } from '@/context/PenugasanContext';
import type { AjuanSuratTugas, Pegawai } from '@/types';
import {
  FileText,
  Calendar,
  Activity,
  ChevronDown,
  Printer,
  Download,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { format, isToday, isThisWeek, isThisMonth } from 'date-fns';
import { id } from 'date-fns/locale';

const hasLaporan = (task: AjuanSuratTugas): boolean =>
  Boolean(task.fileLaporanUrl || task.fileDraftUrl);

const downloadLaporanTugas = (task: AjuanSuratTugas) => {
  const fileUrl = task.fileLaporanUrl || task.fileDraftUrl;
  if (!fileUrl) return;
  const isSafeUrl =
    fileUrl.startsWith('data:') ||
    fileUrl.startsWith('blob:') ||
    fileUrl.startsWith('https://') ||
    fileUrl.startsWith('http://') ||
    fileUrl.startsWith('/');
  if (!isSafeUrl) return;
  const safeNomor = (task.nomorSurat || task.id).replace(/[^a-zA-Z0-9._-]/g, '_');
  const fileName = task.fileLaporanNama || `Laporan_${safeNomor}.pdf`;
  const link = document.createElement('a');
  link.href = fileUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const formatDate = (dateStr: string) => format(new Date(dateStr), 'dd MMMM yyyy', { locale: id });

const StatusBadge = ({ status }: { status: string }) => {
  const styles: Record<string, string> = {
    DRAFT: 'bg-slate-100 text-slate-700 ring-slate-600/10',
    VERIFIKASI_SUBBAGIAN: 'bg-amber-50 text-amber-700 ring-amber-600/10',
    PERSETUJUAN_PIMPINAN: 'bg-blue-50 text-blue-700 ring-blue-600/10',
    SURAT_TERBIT: 'bg-emerald-50 text-emerald-700 ring-emerald-600/10',
    DITOLAK: 'bg-rose-100 text-rose-800 ring-2 ring-rose-400 font-bold',
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${styles[status] || styles.DRAFT}`}>
      {status === 'DITOLAK' && <span className="h-2 w-2 rounded-full bg-rose-600 animate-pulse" />}
      {status === 'DITOLAK' ? 'Ditolak (Perhatian Khusus)' : status.replace(/_/g, ' ')}
    </span>
  );
};

const PegawaiTooltip = ({ pegawaiList }: { pegawaiList: Pegawai[] }) => {
  const [isOpen, setIsOpen] = useState(false);

  if (!pegawaiList || pegawaiList.length === 0) return <span className="text-slate-400">-</span>;

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        onBlur={() => setTimeout(() => setIsOpen(false), 200)}
        className="flex items-center gap-1 hover:bg-slate-100 px-2 py-1 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-100"
      >
        <span className="font-medium text-slate-700">{pegawaiList[0].nama}</span>
        {pegawaiList.length > 1 && (
          <span className="text-xs bg-blue-100 text-blue-700 font-bold px-1.5 py-0.5 rounded-full shadow-sm">
            +{pegawaiList.length - 1}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-2 left-0 w-max max-w-xs bg-white border border-slate-200 shadow-xl rounded-2xl p-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="absolute -top-2 left-6 w-4 h-4 bg-white border-t border-l border-slate-200 transform rotate-45"></div>
          <div className="relative z-10">
            <h4 className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider border-b border-slate-100 pb-1">Pegawai Ditugaskan</h4>
            <ul className="space-y-2 max-h-48 overflow-y-auto pr-2">
              {pegawaiList.map((p) => (
                <li key={p.id} className="flex items-center gap-2 text-sm text-slate-700">
                  <img src={p.fotoAvatar} alt={p.nama} className="w-6 h-6 rounded-full object-cover border border-slate-200" />
                  <span className="font-medium">{p.nama}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

const GenericTaskTable = ({
  tasks,
  emptyMsg,
  onPrint,
}: {
  tasks: AjuanSuratTugas[];
  emptyMsg: string;
  onPrint?: (task: AjuanSuratTugas) => void;
}) => (
  <div className="overflow-x-auto">
    <table className="w-full text-left text-sm">
      <thead className="bg-[#F8FAFD] text-slate-500 text-[11px] font-bold uppercase tracking-wider border-b border-slate-100">
        <tr>
          <th className="px-5 py-3.5">Nomor &amp; Perihal</th>
          <th className="px-5 py-3.5">Jadwal Pelaksanaan</th>
          <th className="px-5 py-3.5">Pegawai Ditugaskan</th>
          <th className="px-5 py-3.5">Status &amp; Laporan</th>
          <th className="px-5 py-3.5 text-right">Aksi</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        {tasks.map((t) => {
          const uploaded = hasLaporan(t);
          return (
            <tr key={t.id} className="hover:bg-slate-50/70 transition">
              <td className="px-5 py-4 align-top max-w-sm">
                <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200/80 inline-block mb-1">
                  {t.nomorSurat}
                </span>
                <p className="font-semibold text-slate-800 line-clamp-2 leading-snug" title={t.perihal}>
                  {t.perihal}
                </p>
              </td>
              <td className="px-5 py-4 align-top text-xs text-slate-600 whitespace-nowrap">
                <p className="font-semibold text-slate-800">
                  {formatDate(t.tanggalMulai)}
                </p>
                <p className="text-slate-400 mt-0.5">
                  s/d {formatDate(t.tanggalSelesai)}
                </p>
              </td>
              <td className="px-5 py-4 align-top">
                <PegawaiTooltip pegawaiList={t.pegawaiDitugaskan} />
              </td>
              <td className="px-5 py-4 align-top">
                <div className="flex flex-col items-start gap-1.5">
                  <StatusBadge status={t.status} />
                  {uploaded ? (
                    <div className="inline-flex flex-col gap-0.5">
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 w-fit">
                        <CheckCircle2 className="h-3 w-3" /> Berkas Lengkap
                      </span>
                      {t.fileLaporanNama && (
                        <span
                          className="max-w-[160px] truncate text-[11px] text-slate-500"
                          title={t.fileLaporanNama}
                        >
                          {t.fileLaporanNama}
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">
                      <Clock className="h-3 w-3" /> Belum Diunggah
                    </span>
                  )}
                </div>
              </td>
              <td className="px-5 py-4 align-top text-right whitespace-nowrap">
                <div className="flex items-center justify-end gap-2">
                  {uploaded && (
                    <button
                      type="button"
                      onClick={() => downloadLaporanTugas(t)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-semibold transition cursor-pointer"
                      title="Unduh berkas laporan pegawai"
                    >
                      <Download className="w-3.5 h-3.5" /> Unduh
                    </button>
                  )}
                  {onPrint && (
                    <button
                      type="button"
                      onClick={() => onPrint(t)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-semibold transition cursor-pointer"
                      title="Cetak Surat Perintah Tugas"
                    >
                      <Printer className="w-3.5 h-3.5" /> Cetak
                    </button>
                  )}
                </div>
              </td>
            </tr>
          );
        })}
        {tasks.length === 0 && (
          <tr>
            <td colSpan={5} className="px-6 py-10 text-center text-slate-400">
              {emptyMsg}
            </td>
          </tr>
        )}
      </tbody>
    </table>
  </div>
);

export const PegawaiPenugasanTab = () => {
  const { tasks, pegawaiList } = usePenugasan();
  const activeTasks = tasks.filter((t) => t.status === 'SURAT_TERBIT' || t.status === 'PERSETUJUAN_PIMPINAN');
  const pegawaiWithTasks = pegawaiList.map((pegawai) => {
    const pTasks = activeTasks.filter((t) => t.pegawaiDitugaskan.some((p) => p.id === pegawai.id));
    return { ...pegawai, activeTasks: pTasks };
  }).filter((p) => p.activeTasks.length > 0);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
          <tr>
            <th className="px-6 py-4 font-semibold">Pegawai</th>
            <th className="px-6 py-4 font-semibold">Unit Kerja</th>
            <th className="px-6 py-4 font-semibold">Tugas Aktif</th>
            <th className="px-6 py-4 font-semibold">Jumlah Tugas</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {pegawaiWithTasks.map((p) => (
            <tr key={p.id} className="hover:bg-slate-50 transition">
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <img src={p.fotoAvatar} alt={p.nama} className="h-10 w-10 rounded-full object-cover border border-slate-200" />
                  <div>
                    <p className="font-semibold text-slate-800">{p.nama}</p>
                    <p className="text-xs text-slate-500">NIP. {p.nip}</p>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4"><span className="text-blue-700 bg-blue-50 px-2 py-1 rounded-md text-xs font-medium">{p.unitKerja}</span></td>
              <td className="px-6 py-4">
                <ul className="list-disc list-inside text-slate-600 space-y-1">
                  {p.activeTasks.map((t) => <li key={t.id} className="truncate max-w-xs" title={t.perihal}>{t.nomorSurat}</li>)}
                </ul>
              </td>
              <td className="px-6 py-4 font-semibold text-slate-700">{p.activeTasks.length} Tugas</td>
            </tr>
          ))}
          {pegawaiWithTasks.length === 0 && <tr><td colSpan={4} className="px-6 py-8 text-center text-slate-500">Tidak ada pegawai yang sedang bertugas.</td></tr>}
        </tbody>
      </table>
    </div>
  );
};

export const LaporanPenugasanTab = ({
  onPrint,
}: {
  onPrint?: (task: AjuanSuratTugas) => void;
}) => {
  const { tasks, pegawaiList } = usePenugasan();
  const [expandedPegawaiId, setExpandedPegawaiId] = useState<string | null>(null);

  const pegawaiWithTasks = pegawaiList.map((pegawai) => {
    const pTasks = tasks.filter((t) => t.pegawaiDitugaskan.some((p) => p.id === pegawai.id));
    return { ...pegawai, allTasks: pTasks };
  }).filter((p) => p.allTasks.length > 0);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
          <tr>
            <th className="px-6 py-4 font-semibold">Pegawai</th>
            <th className="px-6 py-4 font-semibold">Unit Kerja</th>
            <th className="px-6 py-4 font-semibold text-center">Total Penugasan</th>
            <th className="px-6 py-4 font-semibold text-right">Aksi</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {pegawaiWithTasks.map((p) => (
            <React.Fragment key={p.id}>
              <tr
                className={`hover:bg-slate-50 transition cursor-pointer ${expandedPegawaiId === p.id ? 'bg-blue-50/50' : ''}`}
                onClick={() => setExpandedPegawaiId(expandedPegawaiId === p.id ? null : p.id)}
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <img src={p.fotoAvatar} alt={p.nama} className="h-10 w-10 rounded-full object-cover border border-slate-200" />
                    <div>
                      <p className="font-semibold text-slate-800">{p.nama}</p>
                      <p className="text-xs text-slate-500">NIP. {p.nip}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-blue-700 bg-blue-50 px-2 py-1 rounded-md text-xs font-medium">{p.unitKerja}</span>
                </td>
                <td className="px-6 py-4 text-center font-semibold text-slate-700">
                  <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full text-xs">{p.allTasks.length} Penugasan</span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex justify-end">
                    <button type="button" className="text-blue-600 hover:text-blue-800 font-medium text-xs flex items-center gap-1 bg-white border border-blue-200 px-3 py-1.5 rounded-lg shadow-sm hover:bg-blue-50 transition-colors">
                      {expandedPegawaiId === p.id ? 'Tutup Detail' : 'Lihat Detail'}
                      <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${expandedPegawaiId === p.id ? 'rotate-180' : ''}`} />
                    </button>
                  </div>
                </td>
              </tr>
              {expandedPegawaiId === p.id && (
                <tr className="bg-slate-50 border-b border-slate-200">
                  <td colSpan={4} className="p-0">
                    <div className="p-6">
                      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                        <div className="px-5 py-3 border-b border-slate-200 bg-white flex justify-between items-center">
                          <h4 className="font-bold text-slate-700">Rincian Penugasan: {p.nama}</h4>
                        </div>
                        <GenericTaskTable tasks={p.allTasks} emptyMsg="Belum ada penugasan." onPrint={onPrint} />
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
          {pegawaiWithTasks.length === 0 && (
            <tr>
              <td colSpan={4} className="px-6 py-8 text-center text-slate-500">Belum ada data laporan penugasan pegawai.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

const MONTHS = [
  { value: 'ALL', label: 'Semua Bulan' },
  { value: '1', label: 'Januari' },
  { value: '2', label: 'Februari' },
  { value: '3', label: 'Maret' },
  { value: '4', label: 'April' },
  { value: '5', label: 'Mei' },
  { value: '6', label: 'Juni' },
  { value: '7', label: 'Juli' },
  { value: '8', label: 'Agustus' },
  { value: '9', label: 'September' },
  { value: '10', label: 'Oktober' },
  { value: '11', label: 'November' },
  { value: '12', label: 'Desember' },
];

export const PeriodePenugasanTab = () => {
  const { tasks } = usePenugasan();
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState<string>(String(currentDate.getMonth() + 1));
  const [selectedYear, setSelectedYear] = useState<string>(String(currentDate.getFullYear()));

  const filteredTasks = tasks.filter((t) => {
    const taskDate = new Date(t.tanggalMulai);
    const matchMonth = selectedMonth === 'ALL' || String(taskDate.getMonth() + 1) === selectedMonth;
    const matchYear = selectedYear === 'ALL' || String(taskDate.getFullYear()) === selectedYear;
    return matchMonth && matchYear;
  });

  const sortedTasks = [...filteredTasks].sort((a, b) => new Date(b.tanggalMulai).getTime() - new Date(a.tanggalMulai).getTime());
  const availableYears = Array.from(new Set(tasks.map((t) => new Date(t.tanggalMulai).getFullYear()))).sort().reverse();
  const years = ['ALL', ...availableYears.map(String)];
  if (!availableYears.includes(currentDate.getFullYear()) && !years.includes(String(currentDate.getFullYear()))) {
    years.splice(1, 0, String(currentDate.getFullYear()));
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
        <h3 className="font-semibold text-slate-800">Filter Periode Penugasan</h3>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="w-full sm:w-auto bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium cursor-pointer"
          >
            {MONTHS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="w-full sm:w-auto bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium cursor-pointer"
          >
            {years.map((y) => <option key={y} value={y}>{y === 'ALL' ? 'Semua Tahun' : y}</option>)}
          </select>
        </div>
      </div>
      <GenericTaskTable tasks={sortedTasks} emptyMsg="Tidak ada data penugasan pada periode ini." />
    </div>
  );
};

export const PivotPenugasanTab = () => {
  const { tasks } = usePenugasan();
  const units = Array.from(new Set(tasks.map((t) => t.unitKerja)));
  const statuses = ['DRAFT', 'VERIFIKASI_SUBBAGIAN', 'PERSETUJUAN_PIMPINAN', 'SURAT_TERBIT', 'DITOLAK'];

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-center text-sm border border-slate-200 rounded-xl overflow-hidden">
        <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
          <tr>
            <th className="px-6 py-4 font-semibold text-left border-r border-slate-200">Unit Kerja</th>
            {statuses.map((s) => <th key={s} className="px-4 py-4 font-semibold border-r border-slate-200">{s.replace(/_/g, ' ')}</th>)}
            <th className="px-6 py-4 font-bold bg-blue-50 text-blue-800">Total</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {units.map((unit) => {
            const unitTasks = tasks.filter((t) => t.unitKerja === unit);
            return (
              <tr key={unit} className="hover:bg-slate-50">
                <td className="px-6 py-4 font-medium text-left border-r border-slate-200">{unit}</td>
                {statuses.map((status) => (
                  <td key={status} className="px-4 py-4 border-r border-slate-200 text-slate-600">
                    {unitTasks.filter((t) => t.status === status).length || '-'}
                  </td>
                ))}
                <td className="px-6 py-4 font-bold bg-blue-50/50 text-blue-800">{unitTasks.length}</td>
              </tr>
            );
          })}
          {units.length === 0 && (
            <tr>
              <td colSpan={statuses.length + 2} className="px-6 py-8 text-center text-slate-500">Belum ada unit kerja dengan data penugasan.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export const PenugasanBerlangsungTab = ({ onPrint }: { onPrint?: (t: AjuanSuratTugas) => void }) => {
  const { tasks } = usePenugasan();
  const [filter, setFilter] = useState<'ALL' | 'TODAY' | 'WEEK' | 'MONTH'>('ALL');

  const filteredTasks = tasks.filter((t) => {
    if (t.status !== 'SURAT_TERBIT') return false;
    const taskStart = new Date(t.tanggalMulai);
    if (filter === 'TODAY') return isToday(taskStart);
    if (filter === 'WEEK') return isThisWeek(taskStart);
    if (filter === 'MONTH') return isThisMonth(taskStart);
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
        <h3 className="font-semibold text-slate-800">Filter Penugasan Berlangsung</h3>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as 'ALL' | 'TODAY' | 'WEEK' | 'MONTH')}
          className="w-full sm:w-auto bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium cursor-pointer"
        >
          <option value="ALL">Semua</option>
          <option value="TODAY">Hari Ini</option>
          <option value="WEEK">Minggu Ini</option>
          <option value="MONTH">Bulan Ini</option>
        </select>
      </div>
      <GenericTaskTable tasks={filteredTasks} emptyMsg="Tidak ada penugasan berlangsung pada kategori ini." onPrint={onPrint} />
    </div>
  );
};

export const DraftPenugasanTab = ({ onPrint }: { onPrint?: (t: AjuanSuratTugas) => void }) => {
  const { tasks } = usePenugasan();
  return <GenericTaskTable tasks={tasks.filter((t) => t.status === 'DRAFT')} emptyMsg="Tidak ada draft penugasan." onPrint={onPrint} />;
};

export const BlokirPenugasanTab = ({ onPrint }: { onPrint?: (t: AjuanSuratTugas) => void }) => {
  const { tasks } = usePenugasan();
  return <GenericTaskTable tasks={tasks.filter((t) => t.status === 'DITOLAK')} emptyMsg="Tidak ada penugasan yang diblokir atau ditolak." onPrint={onPrint} />;
};

export const RekapPenugasanTab = ({ onPrint }: { onPrint?: (t: AjuanSuratTugas) => void }) => {
  const { tasks } = usePenugasan();
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState<string>(String(currentDate.getMonth() + 1));
  const [selectedYear, setSelectedYear] = useState<string>(String(currentDate.getFullYear()));

  const filteredTasks = tasks.filter((t) => {
    const taskDate = new Date(t.tanggalMulai);
    const matchMonth = selectedMonth === 'ALL' || String(taskDate.getMonth() + 1) === selectedMonth;
    const matchYear = selectedYear === 'ALL' || String(taskDate.getFullYear()) === selectedYear;
    return matchMonth && matchYear;
  });

  const counts = {
    total: filteredTasks.length,
    selesai: filteredTasks.filter((t) => t.status === 'SURAT_TERBIT').length,
    proses: filteredTasks.filter((t) => t.status === 'VERIFIKASI_SUBBAGIAN' || t.status === 'PERSETUJUAN_PIMPINAN').length,
    draft: filteredTasks.filter((t) => t.status === 'DRAFT').length,
  };

  const availableYears = Array.from(new Set(tasks.map((t) => new Date(t.tanggalMulai).getFullYear()))).sort().reverse();
  const years = ['ALL', ...availableYears.map(String)];
  if (!availableYears.includes(currentDate.getFullYear()) && !years.includes(String(currentDate.getFullYear()))) {
    years.splice(1, 0, String(currentDate.getFullYear()));
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
        <h3 className="font-semibold text-slate-800">Filter Periode Rekapitulasi</h3>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="w-full sm:w-auto bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium cursor-pointer"
          >
            {MONTHS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="w-full sm:w-auto bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium cursor-pointer"
          >
            {years.map((y) => <option key={y} value={y}>{y === 'ALL' ? 'Semua Tahun' : y}</option>)}
          </select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Total Penugasan', value: counts.total, icon: FileText, color: 'text-blue-600', bg: 'bg-blue-100' },
          { label: 'Selesai / Terbit', value: counts.selesai, icon: Calendar, color: 'text-emerald-600', bg: 'bg-emerald-100' },
          { label: 'Dalam Proses', value: counts.proses, icon: Activity, color: 'text-amber-600', bg: 'bg-amber-100' },
          { label: 'Draft', value: counts.draft, icon: FileText, color: 'text-slate-600', bg: 'bg-slate-100' },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4">
              <div className={`rounded-lg p-3 ${stat.bg} ${stat.color}`}>
                <stat.icon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                <p className="text-2xl font-bold text-slate-800">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-200 overflow-hidden bg-white">
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
          <h3 className="text-base font-bold text-slate-800">Daftar Penugasan</h3>
          <span className="text-xs font-semibold bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full">{filteredTasks.length} Data</span>
        </div>
        <GenericTaskTable tasks={filteredTasks} emptyMsg="Tidak ada data penugasan pada periode ini." onPrint={onPrint} />
      </div>
    </div>
  );
};

