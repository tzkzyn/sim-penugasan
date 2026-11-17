import type { AjuanSuratTugas } from '@/types';
import {
  CheckCircle2,
  Clock,
  Download,
  FileCheck,
  FileText,
  Hourglass,
  Printer,
  Users,
  X,
} from 'lucide-react';

interface SuperAdminStatusBadgeProps {
  status: AjuanSuratTugas['status'];
}

export function SuperAdminStatusBadge({ status }: SuperAdminStatusBadgeProps) {
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
}

interface SuperAdminWorkflowTabProps {
  filteredAjuan: AjuanSuratTugas[];
  selectedAjuan: AjuanSuratTugas | null;
  onSelectAjuan: (item: AjuanSuratTugas) => void;
}

export function SuperAdminWorkflowTab({
  filteredAjuan,
  selectedAjuan,
  onSelectAjuan,
}: SuperAdminWorkflowTabProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
        <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
          <FileCheck className="w-5 h-5 text-blue-600" />
          Pilih Ajuan Surat Tugas
        </h3>
        <p className="text-xs text-slate-500">Klik ajuan di bawah untuk meninjau alur draft &amp; persetujuan secara mendalam.</p>
        <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
          {filteredAjuan.map((item) => (
            <div
              key={item.id}
              onClick={() => onSelectAjuan(item)}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                selectedAjuan?.id === item.id
                  ? 'border-blue-500 bg-blue-50/50 shadow-xs'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-mono font-bold text-blue-700">{item.nomorSurat}</span>
                <SuperAdminStatusBadge status={item.status} />
              </div>
              <h4 className="font-semibold text-slate-800 text-xs line-clamp-1">{item.perihal}</h4>
              <p className="text-[11px] text-slate-500 mt-1">{item.unitKerja} • {item.lokasiPenugasan}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        {selectedAjuan ? (
          <div className="space-y-6">
            <div className="pb-4 border-b border-slate-100 flex items-start justify-between">
              <div>
                <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded border border-blue-200">
                  {selectedAjuan.nomorSurat}
                </span>
                <h3 className="text-lg font-bold text-slate-800 mt-2">{selectedAjuan.perihal}</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Pengaju: <span className="font-semibold text-slate-700">{selectedAjuan.pengaju.nama}</span> ({selectedAjuan.unitKerja})
                </p>
              </div>
              <div>
                <SuperAdminStatusBadge status={selectedAjuan.status} />
              </div>
            </div>

            <div>
              <h4 className="font-bold text-sm text-slate-800 mb-4">Tahapan Alur Persetujuan Draft ST:</h4>
              <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {selectedAjuan.workflow.map((step, idx) => {
                  const isDone = step.status === 'COMPLETED';
                  const isInProgress = step.status === 'IN_PROGRESS';

                  return (
                    <div key={idx} className="relative flex items-start gap-4">
                      <div
                        className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center border-2 bg-white text-xs ${
                          isDone
                            ? 'border-emerald-500 text-emerald-600'
                            : isInProgress
                              ? 'border-blue-500 text-blue-600 animate-pulse'
                              : 'border-slate-300 text-slate-400'
                        }`}
                      >
                        {isDone ? (
                          <CheckCircle2 className="w-4 h-4 fill-emerald-500 text-white" />
                        ) : isInProgress ? (
                          <Clock className="w-4 h-4 text-blue-600" />
                        ) : (
                          <div className="w-1.5 h-1.5 bg-slate-300 rounded-full" />
                        )}
                      </div>

                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 w-full space-y-1">
                        <div className="flex items-center justify-between">
                          <h5 className="font-bold text-sm text-slate-800">{step.label}</h5>
                          {step.tanggal && <span className="text-[11px] text-slate-400 font-mono">{step.tanggal}</span>}
                        </div>
                        <p className="text-xs text-slate-600">
                          Pelaksana: <span className="font-semibold text-slate-800">{step.actor}</span>
                        </p>
                        {step.catatan && (
                          <p className="text-xs text-slate-500 bg-white p-2.5 rounded-lg border border-slate-200 mt-2 italic">
                            &quot;{step.catatan}&quot;
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-16 text-slate-400 space-y-2">
            <FileText className="w-12 h-12 mx-auto stroke-1 text-slate-300" />
            <p className="text-sm font-medium">Pilih surat tugas di sebelah kiri untuk melihat alur persetujuan lengkap.</p>
          </div>
        )}
      </div>
    </div>
  );
}

interface SuperAdminPegawaiModalProps {
  ajuan: AjuanSuratTugas | null;
  onClose: () => void;
}

export function SuperAdminPegawaiModal({ ajuan, onClose }: SuperAdminPegawaiModalProps) {
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
            className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
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
            className="rounded-xl bg-slate-800 px-5 py-2 text-xs font-bold text-white transition-colors hover:bg-slate-900"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}

interface SuperAdminWorkflowDetailModalProps {
  ajuan: AjuanSuratTugas | null;
  isOpen: boolean;
  hasLaporan: boolean;
  onClose: () => void;
  onDownloadLaporan: (ajuan: AjuanSuratTugas) => void;
  onOpenPrint: (ajuan: AjuanSuratTugas) => void;
}

export function SuperAdminWorkflowDetailModal({
  ajuan,
  isOpen,
  hasLaporan,
  onClose,
  onDownloadLaporan,
  onOpenPrint,
}: SuperAdminWorkflowDetailModalProps) {
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
            className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="bg-blue-50/70 p-4 rounded-xl border border-blue-200 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs font-bold text-blue-700">{ajuan.nomorSurat}</span>
            <SuperAdminStatusBadge status={ajuan.status} />
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
                  {w.catatan && <p className="text-xs text-slate-500 bg-white p-2 rounded border border-slate-200">{w.catatan}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Berkas Laporan Pelaksanaan Tugas
          </p>
          {hasLaporan ? (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="space-y-0.5 min-w-0">
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700">
                  <CheckCircle2 className="w-3 h-3" /> Berkas Lengkap
                </span>
                <p className="text-xs font-semibold text-slate-800 truncate pt-1">
                  {ajuan.fileLaporanNama || 'Dokumen Laporan Tugas'}
                </p>
                {ajuan.tanggalLaporan && (
                  <p className="text-[11px] text-slate-500">
                    Diunggah: {ajuan.tanggalLaporan}
                  </p>
                )}
                {ajuan.catatanLaporan && (
                  <p className="text-xs text-slate-600 italic">
                    &quot;{ajuan.catatanLaporan}&quot;
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => onDownloadLaporan(ajuan)}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition cursor-pointer shrink-0"
              >
                <Download className="w-3.5 h-3.5" /> Unduh Laporan Tugas
              </button>
            </div>
          ) : (
            <p className="text-xs text-slate-500">
              Belum ada berkas laporan pelaksanaan yang diunggah pegawai.
            </p>
          )}
        </div>

        <div className="pt-2 flex justify-between items-center">
          <button
            type="button"
            onClick={() => onOpenPrint(ajuan)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-md"
          >
            <Printer className="w-4 h-4" /> Cetak Surat Tugas Resmi
          </button>
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

