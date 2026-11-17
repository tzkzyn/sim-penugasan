import type { AjuanSuratTugas } from '@/types';
import { CheckCircle2, Download, X } from 'lucide-react';

interface AdminAjuanDetailModalProps {
  ajuan: AjuanSuratTugas | null;
  statusMap: Record<string, { label: string; color: string }>;
  hasLaporan: (task: AjuanSuratTugas) => boolean;
  onDownloadLaporan: (task: AjuanSuratTugas) => void;
  onClose: () => void;
}

export function AdminAjuanDetailModal({
  ajuan,
  statusMap,
  hasLaporan,
  onDownloadLaporan,
  onClose,
}: AdminAjuanDetailModalProps) {
  if (!ajuan) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50 sticky top-0">
          <h3 className="font-bold text-slate-800">Detail Ajuan</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5 space-y-5">
          {/* Profil Pengaju */}
          <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
            <img
              src={ajuan.pengaju.fotoAvatar || `${import.meta.env.BASE_URL}pp-navbar-2.jpg`}
              alt={ajuan.pengaju.nama}
              className="w-14 h-14 rounded-xl object-cover border-2 border-blue-200 shadow-sm"
            />
            <div>
              <h4 className="font-bold text-slate-800">{ajuan.pengaju.nama}</h4>
              <p className="text-xs text-slate-500 font-mono">NIP. {ajuan.pengaju.nip}</p>
              <div className="flex items-center gap-2 mt-1 text-xs text-slate-600">
                <span>{ajuan.pengaju.unitKerja}</span>
                <span className="text-slate-300">•</span>
                <span>{ajuan.pengaju.jabatan}</span>
              </div>
            </div>
          </div>

          {/* Info Ajuan */}
          <div className="space-y-3">
            <div>
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Perihal / Nama Ajuan</p>
              <p className="text-sm text-slate-800 font-medium">{ajuan.perihal}</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Keterangan</p>
              <p className="text-sm text-slate-700">{ajuan.deskripsi}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Nomor Surat</p>
                <p className="text-sm text-slate-800 font-mono">{ajuan.nomorSurat}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Status Saat Ini</p>
                <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider border ${statusMap[ajuan.status]?.color || 'bg-slate-100'}`}>
                  {statusMap[ajuan.status]?.label || ajuan.status}
                </span>
              </div>
              <div>
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Tanggal Mulai</p>
                <p className="text-sm text-slate-800">{ajuan.tanggalMulai}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Tanggal Selesai</p>
                <p className="text-sm text-slate-800">{ajuan.tanggalSelesai}</p>
              </div>
              <div className="col-span-2">
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Lokasi Penugasan</p>
                <p className="text-sm text-slate-800">{ajuan.lokasiPenugasan} — {ajuan.lokasiSpesifik}</p>
              </div>
            </div>
          </div>

          {/* Berkas Laporan Pelaksanaan Tugas */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Berkas Laporan Pelaksanaan Tugas
            </p>
            {hasLaporan(ajuan) ? (
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
                  <Download className="w-3.5 h-3.5" /> Unduh Berkas Laporan
                </button>
              </div>
            ) : (
              <p className="text-xs text-slate-500">
                Belum ada berkas laporan pelaksanaan yang diunggah pegawai.
              </p>
            )}
          </div>

          {/* Workflow Timeline */}
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-3">Status Workflow</p>
            <div className="space-y-0">
              {ajuan.workflow.map((step, i) => {
                const isCompleted = step.status === 'COMPLETED';
                const isActive = step.status === 'IN_PROGRESS';
                const isRejected = step.status === 'REJECTED';
                return (
                  <div key={i} className="flex items-start gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`w-3 h-3 rounded-full border-2 mt-1 ${
                        isCompleted ? 'bg-emerald-500 border-emerald-500' :
                        isActive ? 'bg-blue-500 border-blue-500 animate-pulse' :
                        isRejected ? 'bg-red-500 border-red-500' :
                        'bg-white border-slate-300'
                      }`} />
                      {i < ajuan.workflow.length - 1 && (
                        <div className={`w-0.5 h-8 ${isCompleted ? 'bg-emerald-300' : 'bg-slate-200'}`} />
                      )}
                    </div>
                    <div className="pb-4">
                      <p className={`text-sm font-semibold ${isCompleted ? 'text-emerald-700' : isActive ? 'text-blue-700' : isRejected ? 'text-red-700' : 'text-slate-400'}`}>
                        {step.label}
                      </p>
                      <p className="text-xs text-slate-500">{step.actor}{step.tanggal ? ` — ${step.tanggal}` : ''}</p>
                      {step.catatan && <p className="text-xs text-slate-600 mt-0.5 italic">{step.catatan}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface AdminAjuanEditModalProps {
  ajuan: AjuanSuratTugas | null;
  form: { perihal: string; deskripsi: string };
  onChangeForm: (next: { perihal: string; deskripsi: string }) => void;
  onSave: () => void;
  onClose: () => void;
}

export function AdminAjuanEditModal({
  ajuan,
  form,
  onChangeForm,
  onSave,
  onClose,
}: AdminAjuanEditModalProps) {
  if (!ajuan) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
          <h3 className="font-bold text-slate-800">Edit Ajuan</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Perihal / Nama Ajuan</label>
            <input
              type="text"
              value={form.perihal}
              onChange={(e) => onChangeForm({ ...form, perihal: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Keterangan / Deskripsi</label>
            <textarea
              rows={4}
              value={form.deskripsi}
              onChange={(e) => onChangeForm({ ...form, deskripsi: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
            />
          </div>
          <button
            type="button"
            onClick={onSave}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl text-sm font-semibold transition-colors"
          >
            Simpan Perubahan
          </button>
        </div>
      </div>
    </div>
  );
}

