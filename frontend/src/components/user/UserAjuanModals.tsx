import type { AjuanSuratTugas } from '@/types';
import {
  CheckCircle2,
  Clock,
  FileCheck,
  FileEdit,
  FileText,
  Hourglass,
  Printer,
  Users,
  X,
} from 'lucide-react';

export const AjuanStatusBadge = ({ status }: { status: AjuanSuratTugas['status'] }) => {
  const statusIsApproved = status === 'SURAT_TERBIT';
  const statusIsRejected = status === 'DITOLAK';
  const label = statusIsApproved ? 'Diapprove' : statusIsRejected ? 'Dibatalkan' : 'Diproses';
  const classes = statusIsApproved
    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
    : statusIsRejected
      ? 'bg-rose-100 text-rose-800 border border-rose-300'
      : 'bg-slate-100 text-slate-700 border border-slate-300';

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${classes}`}>
      {statusIsApproved ? (
        <CheckCircle2 className="w-3.5 h-3.5" />
      ) : statusIsRejected ? (
        <X className="w-3.5 h-3.5 text-rose-600" />
      ) : (
        <Hourglass className="w-3.5 h-3.5" />
      )}
      {label}
    </span>
  );
};

interface PegawaiDitugaskanModalProps {
  ajuan: AjuanSuratTugas | null;
  onClose: () => void;
}

export const PegawaiDitugaskanModal = ({ ajuan, onClose }: PegawaiDitugaskanModalProps) => {
  if (!ajuan) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="flex items-center gap-2 text-lg font-bold text-slate-800">
              <Users className="h-5 w-5 text-blue-600" />
              Daftar Pegawai Ditugaskan
            </h3>
            <p className="mt-1 text-xs text-slate-500">{ajuan.nomorSurat}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
            aria-label="Tutup daftar pegawai"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[60vh] space-y-3 overflow-y-auto">
          {ajuan.pegawaiDitugaskan.map((pegawai, index) => (
            <div key={pegawai.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-start gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                  {index + 1}
                </span>
                <div className="min-w-0 space-y-1 text-sm">
                  <p className="font-bold text-slate-800">{pegawai.nama}</p>
                  <p className="text-xs text-slate-600">NIP: {pegawai.nip}</p>
                  <p className="text-xs font-semibold text-blue-700">Unit Kerja: {pegawai.unitKerja}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end border-t border-slate-100 pt-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-slate-800 px-5 py-2 text-xs font-bold text-white transition-colors hover:bg-slate-900 cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

interface WorkflowDetailModalProps {
  ajuan: AjuanSuratTugas | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenPrint: (ajuan: AjuanSuratTugas) => void;
  onOpenEdit: (ajuan: AjuanSuratTugas) => void;
}

export const WorkflowDetailModal = ({
  ajuan,
  isOpen,
  onClose,
  onOpenPrint,
  onOpenEdit,
}: WorkflowDetailModalProps) => {
  if (!isOpen || !ajuan) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-5 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-blue-600" />
            Alur Draft &amp; Track Record Persetujuan
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
            aria-label="Tutup detail alur"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="bg-blue-50/70 p-4 rounded-xl border border-blue-200 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs font-bold text-blue-700">{ajuan.nomorSurat}</span>
            <AjuanStatusBadge status={ajuan.status} />
          </div>
          <h4 className="font-bold text-slate-900 text-sm">{ajuan.perihal}</h4>
          <p className="text-xs text-slate-600">{ajuan.deskripsi}</p>
        </div>

        <div className="space-y-4">
          <h4 className="font-bold text-sm text-slate-800">Riwayat Tahapan Persetujuan:</h4>
          <div className="space-y-3">
            {ajuan.workflow.map((w, idx) => (
              <div key={idx} className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50/50">
                {w.status === 'COMPLETED' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
                ) : w.status === 'IN_PROGRESS' ? (
                  <Clock className="w-5 h-5 text-blue-600 mt-0.5 shrink-0 animate-pulse" />
                ) : (
                  <div className="w-5 h-5 rounded-full border-2 border-slate-300 mt-0.5 shrink-0" />
                )}
                <div className="w-full space-y-1">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                    <span>{w.label}</span>
                    <span className="text-slate-400 font-normal">{w.tanggal || 'Menunggu'}</span>
                  </div>
                  <p className="text-xs text-slate-600">Aktor: {w.actor}</p>
                  {w.catatan && (
                    <p className="text-xs text-slate-500 bg-white p-2 rounded border border-slate-200">{w.catatan}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2 rounded-xl border border-blue-200 bg-blue-50/40 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-blue-600" />
              Naskah Dokumen Kertas A4 (Ala MS Word / Google Docs)
            </span>
            <button
              type="button"
              onClick={() => {
                onOpenPrint(ajuan);
                onClose();
              }}
              className="inline-flex items-center gap-1.5 text-xs text-white bg-blue-600 hover:bg-blue-700 font-bold px-3 py-1.5 rounded-lg transition cursor-pointer shadow-xs"
            >
              <FileEdit className="w-3.5 h-3.5" />
              Buka &amp; Edit di Kertas A4
            </button>
          </div>
          <p className="text-xs text-slate-600">
            {ajuan.dokumenDraftText
              ? 'Naskah dokumen A4 kustom telah tersimpan. Klik tombol di kanan untuk mengedit, mengunduh Word (.doc), atau mencetaknya.'
              : 'Menggunakan format naskah resmi SPT standar A4. Klik tombol di kanan untuk menyesuaikan isi surat atau langsung mencetaknya.'}
          </p>
        </div>

        <div className="pt-2 flex flex-wrap justify-between items-center gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onOpenPrint(ajuan);
                onClose();
              }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-md"
            >
              <Printer className="w-4 h-4" /> Buka &amp; Cetak Kertas A4
            </button>
            <button
              type="button"
              onClick={() => {
                onOpenEdit(ajuan);
                onClose();
              }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-md"
            >
              <FileEdit className="w-4 h-4" /> Edit &amp; Kirim Ulang
            </button>
          </div>
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
};

