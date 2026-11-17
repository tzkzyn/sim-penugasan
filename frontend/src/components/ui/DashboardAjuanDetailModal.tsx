import type { AjuanSuratTugas } from '@/types';
import { CheckCircle2, FileCheck, X } from 'lucide-react';

interface DashboardAjuanDetailModalProps {
  ajuan: AjuanSuratTugas | null;
  isOpen: boolean;
  onClose: () => void;
  formatLokasiDisplay: (lokasi: string) => string;
}

export function DashboardAjuanDetailModal({
  ajuan,
  isOpen,
  onClose,
  formatLokasiDisplay,
}: DashboardAjuanDetailModalProps) {
  if (!isOpen || !ajuan) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-5 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-blue-600" />
            Detail Ajuan Surat Tugas
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="bg-blue-50/70 p-4 rounded-xl border border-blue-200 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs font-bold text-blue-700">{ajuan.nomorSurat}</span>
            <span className="text-xs text-slate-500">{ajuan.unitKerja}</span>
          </div>
          <h4 className="font-bold text-slate-900 text-sm">{ajuan.perihal}</h4>
          <p className="text-xs text-slate-600">{ajuan.deskripsi}</p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 p-4 bg-slate-50">
            <div className="text-[11px] font-semibold uppercase text-slate-500 mb-2">Tanggal Penugasan</div>
            <div className="text-sm font-semibold text-slate-800">{ajuan.tanggalMulai} s/d {ajuan.tanggalSelesai}</div>
          </div>
          <div className="rounded-2xl border border-slate-200 p-4 bg-slate-50">
            <div className="text-[11px] font-semibold uppercase text-slate-500 mb-2">Lokasi</div>
            <div className="text-sm font-semibold text-slate-800">{formatLokasiDisplay(ajuan.lokasiPenugasan)}</div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 p-4 bg-slate-50">
            <div className="text-[11px] font-semibold uppercase text-slate-500 mb-3">Pegawai Ditugaskan</div>
            <div className="space-y-2">
              {ajuan.pegawaiDitugaskan.map((p) => (
                <div key={p.id} className="rounded-xl bg-white border border-slate-200 p-3 text-sm font-medium text-slate-800">
                  {p.nama} • {p.jabatan}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 p-4 bg-slate-50">
            <div className="text-[11px] font-semibold uppercase text-slate-500 mb-3">Riwayat Workflow</div>
            <div className="space-y-3">
              {ajuan.workflow.map((w, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 bg-white">
                  {w.status === 'COMPLETED' ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-slate-300 mt-0.5 shrink-0" />
                  )}
                  <div className="w-full space-y-1">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                      <span>{w.label}</span>
                      <span className="text-slate-400 font-normal">{w.tanggal || 'Menunggu'}</span>
                    </div>
                    <p className="text-xs text-slate-600">Aktor: {w.actor}</p>
                    {w.catatan && <p className="text-xs text-slate-500 bg-slate-50 p-2 rounded border border-slate-200">{w.catatan}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}

