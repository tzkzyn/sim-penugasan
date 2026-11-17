import { useState } from 'react';
import {
  UploadCloud,
  FileText,
  CheckCircle,
  AlertCircle,
  X,
  ArrowLeft,
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { usePenugasan } from '@/context/PenugasanContext';

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED_EXTENSIONS = ['.pdf', '.doc', '.docx'];

const readFileAsDataUrl = (selectedFile: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Format hasil pembacaan berkas tidak valid.'));
      }
    };
    reader.onerror = () => {
      reject(new Error('Gagal membaca berkas dokumen.'));
    };
    reader.readAsDataURL(selectedFile);
  });

export const UploadSuratPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { myTasks: tasks, updateTask } = usePenugasan();

  const queryId = searchParams.get('id') || '';
  const [manualSelection, setManualSelection] = useState<{
    queryId: string;
    value: string;
  } | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [catatan, setCatatan] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const selectedTask =
    manualSelection && manualSelection.queryId === queryId
      ? manualSelection.value
      : queryId && tasks.some((t) => t.id === queryId)
        ? queryId
        : '';

  const activeTask = tasks.find((t) => t.id === selectedTask);

  const handleSelectFile = (candidate: File | null) => {
    setErrorMsg('');
    if (!candidate) return;

    const lowerName = candidate.name.toLowerCase();
    const hasAllowedExt = ALLOWED_EXTENSIONS.some((ext) =>
      lowerName.endsWith(ext),
    );
    if (!hasAllowedExt) {
      setErrorMsg(
        'Format berkas tidak didukung. Hanya menerima file PDF, DOC, atau DOCX.',
      );
      return;
    }

    if (candidate.size > MAX_FILE_SIZE_BYTES) {
      setErrorMsg('Ukuran berkas melebihi batas maksimal 10 MB.');
      return;
    }

    setFile(candidate);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleSelectFile(e.dataTransfer.files[0]);
    }
  };

  const handleUpload = async () => {
    setErrorMsg('');
    if (!file || !selectedTask) {
      setErrorMsg(
        'Silakan pilih surat tugas dan lampirkan file dokumen terlebih dahulu.',
      );
      return;
    }

    const targetTask = tasks.find((t) => t.id === selectedTask);
    if (!targetTask) {
      setErrorMsg('Surat tugas yang dipilih tidak ditemukan pada akun Anda.');
      return;
    }

    setIsUploading(true);
    try {
      const dataUrl = await readFileAsDataUrl(file);
      await updateTask(selectedTask, {
        fileLaporanUrl: dataUrl,
        fileLaporanNama: file.name,
        fileDraftUrl: dataUrl,
        catatanLaporan: catatan.trim() || undefined,
        tanggalLaporan: new Date().toISOString().substring(0, 10),
      });

      setIsSuccess(true);
      setTimeout(() => {
        navigate('/user/tugas/laporan');
      }, 800);
    } catch (err) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : 'Terjadi kesalahan saat menyimpan berkas laporan.',
      );
      setIsSuccess(false);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
        <button
          onClick={() => navigate(-1)}
          className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Upload Dokumen Surat Tugas Pegawai</h1>
          <p className="text-sm text-slate-500">Unggah berkas laporan pelaksanaan tugas atau bukti pendukung.</p>
        </div>
      </div>

      {errorMsg && (
        <div className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          <AlertCircle className="h-5 w-5 shrink-0 text-rose-600 mt-0.5" />
          <p className="flex-1">{errorMsg}</p>
        </div>
      )}

      {isSuccess && (
        <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          <CheckCircle className="h-5 w-5 shrink-0 text-emerald-600 mt-0.5" />
          <p className="flex-1">
            Berkas <strong>{file?.name}</strong> berhasil disimpan! Mengalihkan ke halaman Laporan...
          </p>
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Pilih Surat Tugas</label>
          <select
            value={selectedTask}
            onChange={(e) => {
              setManualSelection({ queryId, value: e.target.value });
              setErrorMsg('');
            }}
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm bg-slate-50 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">-- Pilih Surat Penugasan Anda --</option>
            {tasks.map((t) => (
              <option key={t.id} value={t.id}>
                {t.nomorSurat} - {t.perihal}
              </option>
            ))}
          </select>
          {activeTask?.fileLaporanNama && (
            <p className="mt-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
              Berkas laporan saat ini: <strong>{activeTask.fileLaporanNama}</strong>. Mengunggah berkas baru akan menggantikan dokumen sebelumnya.
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Unggah File Laporan / Surat (PDF/DOCX)</label>
          {!file ? (
            <div
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className="relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-10 hover:border-blue-400 hover:bg-blue-50/30 transition cursor-pointer"
            >
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={(e) =>
                  handleSelectFile(e.target.files ? e.target.files[0] : null)
                }
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <div className="rounded-full bg-white p-3 shadow-xs mb-3 text-blue-600">
                <UploadCloud className="h-8 w-8" />
              </div>
              <p className="text-sm font-bold text-slate-700">Klik atau seret file ke area ini</p>
              <p className="text-xs text-slate-400 mt-1">Mendukung format PDF, DOC, DOCX (Maks. 10MB)</p>
            </div>
          ) : (
            <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 p-4">
              <div className="flex items-center gap-3">
                <FileText className="h-6 w-6 text-emerald-600" />
                <div>
                  <p className="text-sm font-bold text-emerald-900">{file.name}</p>
                  <p className="text-xs text-emerald-600">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setFile(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-white hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Catatan Tambahan (Opsional)</label>
          <textarea
            rows={3}
            value={catatan}
            onChange={(e) => setCatatan(e.target.value)}
            placeholder="Tuliskan keterangan mengenai dokumen yang diunggah..."
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm bg-slate-50 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="flex justify-end pt-3">
          <button
            type="button"
            onClick={handleUpload}
            disabled={!file || !selectedTask || isUploading || isSuccess}
            className={`flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold transition ${
              file && selectedTask && !isUploading && !isSuccess
                ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-500/20 cursor-pointer'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
          >
            <CheckCircle className="h-4 w-4" />
            {isUploading || isSuccess
              ? 'Sedang Mengunggah...'
              : 'Simpan & Kirim Dokumen'}
          </button>
        </div>
      </div>
    </div>
  );
};
