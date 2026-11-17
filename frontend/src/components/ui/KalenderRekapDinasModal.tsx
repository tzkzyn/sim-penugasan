import { useState, useMemo } from 'react';
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  isSameMonth,
  isSameDay,
  addDays,
} from 'date-fns';
import { id } from 'date-fns/locale';
import type { AjuanSuratTugas, Pegawai } from '@/types';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  X,
  Users,
  CalendarDays,
} from 'lucide-react';

interface KalenderRekapDinasModalProps {
  isOpen: boolean;
  onClose: () => void;
  pegawai: Pegawai | null;
  tasks: AjuanSuratTugas[];
}

const toIsoDateString = (d: Date): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const KalenderRekapDinasModal = ({
  isOpen,
  onClose,
  pegawai,
  tasks,
}: KalenderRekapDinasModalProps) => {
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // Filter tasks belonging to active duties (exclude DITOLAK)
  const activeTasks = useMemo(() => {
    return tasks.filter((t) => t.status !== 'DITOLAK');
  }, [tasks]);

  // Tasks in current viewed month
  const monthTasks = useMemo(() => {
    const monthStartIso = toIsoDateString(startOfMonth(currentMonth));
    const monthEndIso = toIsoDateString(endOfMonth(currentMonth));

    return activeTasks.filter((t) => {
      const start = (t.tanggalMulai || '').slice(0, 10);
      const end = (t.tanggalSelesai || t.tanggalMulai || '').slice(0, 10);
      return start <= monthEndIso && monthStartIso <= end;
    });
  }, [activeTasks, currentMonth]);

  // Map each date string to list of tasks
  const tasksByDateMap = useMemo(() => {
    const map = new Map<string, AjuanSuratTugas[]>();
    for (const t of activeTasks) {
      if (!t.tanggalMulai) continue;
      const startStr = t.tanggalMulai.slice(0, 10);
      const endStr = (t.tanggalSelesai || t.tanggalMulai).slice(0, 10);

      // Iterate dates
      let cur = new Date(startStr);
      const end = new Date(endStr);
      while (cur <= end) {
        const iso = toIsoDateString(cur);
        const existing = map.get(iso) || [];
        if (!existing.some((item) => item.id === t.id)) {
          existing.push(t);
        }
        map.set(iso, existing);
        cur = addDays(cur, 1);
      }
    }
    return map;
  }, [activeTasks]);

  // Tasks for the specifically selected date
  const selectedDateIso = toIsoDateString(selectedDate);
  const tasksOnSelectedDate = tasksByDateMap.get(selectedDateIso) || [];

  if (!isOpen) return null;

  const renderHeader = () => {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <CalendarDays className="w-6 h-6 text-blue-600" />
            <span>Kalender Rekap Penugasan Dinas</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Jadwal dan frekuensi dinas resmi untuk akun <strong>{pegawai?.nama || 'Pegawai'}</strong> ({pegawai?.nip || '-'})
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              const now = new Date();
              setCurrentMonth(now);
              setSelectedDate(now);
            }}
            className="px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors cursor-pointer"
          >
            Bulan Ini
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Tutup Kalender"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  };

  const renderCalendarGrid = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const days = [];
    const weekDays = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

    let day = startDate;

    while (day <= endDate) {
      days.push(day);
      day = addDays(day, 1);
    }

    return (
      <div className="space-y-2">
        {/* Month Navigation */}
        <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-200">
          <button
            type="button"
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="p-1.5 rounded-lg text-slate-600 hover:bg-white hover:shadow-xs transition-all cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="text-center">
            <h3 className="text-base font-bold text-slate-800">
              {format(currentMonth, 'MMMM yyyy', { locale: id })}
            </h3>
            <span className="text-[11px] font-medium text-slate-500">
              {monthTasks.length} penugasan dinas di bulan ini
            </span>
          </div>
          <button
            type="button"
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="p-1.5 rounded-lg text-slate-600 hover:bg-white hover:shadow-xs transition-all cursor-pointer"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Day Name Header */}
        <div className="grid grid-cols-7 gap-1 text-center font-bold text-xs text-slate-400 py-1">
          {weekDays.map((d, i) => (
            <div key={i} className={i >= 5 ? 'text-rose-400' : ''}>
              {d}
            </div>
          ))}
        </div>

        {/* Calendar Cells */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((d) => {
            const iso = toIsoDateString(d);
            const isCurrentM = isSameMonth(d, currentMonth);
            const isToday = isSameDay(d, new Date());
            const isSelected = isSameDay(d, selectedDate);
            const taskList = tasksByDateMap.get(iso) || [];
            const hasTasks = taskList.length > 0;

            return (
              <button
                key={iso}
                type="button"
                onClick={() => setSelectedDate(d)}
                className={`relative min-h-[64px] p-1.5 rounded-xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                  isSelected
                    ? 'border-blue-600 bg-blue-50/80 ring-2 ring-blue-500/20 shadow-xs'
                    : isToday
                      ? 'border-blue-300 bg-white shadow-xs'
                      : hasTasks
                        ? 'border-blue-200 bg-blue-50/40 hover:bg-blue-50'
                        : isCurrentM
                          ? 'border-slate-200 bg-white hover:border-slate-300'
                          : 'border-slate-100 bg-slate-50/50 text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full ${
                      isSelected
                        ? 'bg-blue-600 text-white'
                        : isToday
                          ? 'bg-blue-100 text-blue-700 font-extrabold'
                          : isCurrentM
                            ? 'text-slate-700'
                            : 'text-slate-300'
                    }`}
                  >
                    {format(d, 'd')}
                  </span>
                  {hasTasks && (
                    <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                  )}
                </div>

                {hasTasks && (
                  <div className="mt-1">
                    <span className="inline-block text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-blue-600 text-white truncate max-w-full">
                      {taskList.length} Dinas
                    </span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-5xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 max-h-[92vh] flex flex-col">
        {renderHeader()}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 overflow-y-auto pr-1">
          {/* Sisi Kiri: Kalender Grid */}
          <div className="lg:col-span-7 space-y-4">
            {renderCalendarGrid()}

            {/* Indikator Legenda */}
            <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-slate-600 border-t border-slate-100">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-md bg-blue-600" />
                <span>Hari Berpenugasan</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-blue-100 border border-blue-400" />
                <span>Hari Ini</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-md border-2 border-blue-600 bg-blue-50" />
                <span>Tanggal Terpilih</span>
              </div>
            </div>
          </div>

          {/* Sisi Kanan: Rincian Tugas pada Tanggal Terpilih & Daftar Bulan Ini */}
          <div className="lg:col-span-5 space-y-5 flex flex-col justify-between">
            <div className="space-y-4">
              {/* Header Box Tanggal Terpilih */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Jadwal Penugasan Terpilih
                  </span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                    {tasksOnSelectedDate.length} Surat Tugas
                  </span>
                </div>
                <h4 className="text-base font-extrabold text-slate-900">
                  {format(selectedDate, 'EEEE, d MMMM yyyy', { locale: id })}
                </h4>
              </div>

              {/* Rincian Tugas Pada Hari Terpilih */}
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                {tasksOnSelectedDate.length > 0 ? (
                  tasksOnSelectedDate.map((task) => {
                    const isApproved = task.status === 'SURAT_TERBIT';
                    return (
                      <div
                        key={task.id}
                        className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs space-y-2.5 hover:border-blue-300 transition-all"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono text-xs font-bold text-blue-700">
                            {task.nomorSurat}
                          </span>
                          <span
                            className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                              isApproved
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {isApproved ? 'Surat Terbit' : task.status}
                          </span>
                        </div>

                        <h5 className="text-sm font-bold text-slate-900 leading-snug">
                          {task.perihal}
                        </h5>

                        <div className="space-y-1.5 text-xs text-slate-600">
                          <div className="flex items-start gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                            <span>
                              {task.lokasiSpesifik
                                ? `${task.lokasiSpesifik}, ${task.lokasiPenugasan}`
                                : task.lokasiPenugasan}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                            <span>
                              {task.tanggalMulai} s/d {task.tanggalSelesai || task.tanggalMulai}
                              {task.jamMulai ? ` (${task.jamMulai} - ${task.jamSelesai || 'Selesai'})` : ''}
                            </span>
                          </div>
                          {task.pegawaiDitugaskan && task.pegawaiDitugaskan.length > 1 && (
                            <div className="flex items-center gap-1.5">
                              <Users className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                              <span>{task.pegawaiDitugaskan.length} personil dalam tim</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-xs text-slate-400">
                    <CalendarIcon className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    Tidak ada agenda dinas resmi yang dijadwalkan pada tanggal ini.
                  </div>
                )}
              </div>
            </div>

            {/* Ringkasan Akumulasi Bulan Berjalan */}
            <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-4 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-blue-900">
                <span>Rekapitulasi {format(currentMonth, 'MMMM yyyy', { locale: id })}</span>
                <span className="px-2 py-0.5 rounded-full bg-blue-600 text-white text-[11px]">
                  {monthTasks.length} Penugasan
                </span>
              </div>
              <p className="text-xs text-blue-700">
                Anda memiliki <strong>{monthTasks.length} kali kegiatan dinas</strong> yang tercatat di sistem pada bulan ini.
              </p>
            </div>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
          >
            Tutup Kalender
          </button>
        </div>
      </div>
    </div>
  );
};
