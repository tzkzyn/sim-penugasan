import { useState } from 'react';
import { UploadCloud, FileText, CheckCircle, X, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usePenugasan } from '@/context/PenugasanContext';

export const UploadSuratPage = () => {
  const navigate = useNavigate();
  const { tasks } = usePenugasan();
  const [selectedTask, setSelectedTask] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [catatan, setCatatan] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleUpload = () => {
    if (!file || !selectedTask) {
      alert('Silakan pilih tugas dan lampirkan file dokumen terlebih dahulu.');
      return;
    }

    setIsSuccess(true);
    setTimeout(() => {
      alert(`Dokumen "${file.name}" berhasil diunggah untuk tugas terpilih!`);
      navigate('/user/tugas');
    }, 800);
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

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Pilih Surat Tugas</label>
          <select
            value={selectedTask}
            onChange={(e) => setSelectedTask(e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm bg-slate-50 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">-- Pilih Surat Penugasan Anda --</option>
            {tasks.map((t) => (
              <option key={t.id} value={t.id}>
                {t.nomorSurat} - {t.perihal}
              </option>
            ))}
          </select>
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
                onChange={(e) => e.target.files && setFile(e.target.files[0])}
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
            onClick={handleUpload}
            disabled={!file || !selectedTask || isSuccess}
            className={`flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold transition ${
              file && selectedTask && !isSuccess
                ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-500/20 cursor-pointer'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
          >
            <CheckCircle className="h-4 w-4" />
            {isSuccess ? 'Sedang Mengunggah...' : 'Simpan & Kirim Dokumen'}
          </button>
        </div>
      </div>
    </div>
  );
};
