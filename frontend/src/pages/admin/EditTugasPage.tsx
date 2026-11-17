import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { usePenugasan } from '@/context/PenugasanContext';
import { AdminEditTugasForm } from '@/components/admin/AdminEditTugasForm';
import { FileEdit, ArrowLeft } from 'lucide-react';

export const EditTugasPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryId = searchParams.get('id');
  const { tasks, pegawaiList, updateTask, deleteTask } = usePenugasan();

  const [manualTaskId, setManualTaskId] = useState<string>('');
  const selectedTaskId =
    manualTaskId && tasks.some((t) => t.id === manualTaskId)
      ? manualTaskId
      : queryId && tasks.some((t) => t.id === queryId)
        ? queryId
        : tasks[0]?.id || '';

  const currentTask = tasks.find((t) => t.id === selectedTaskId);

  if (!currentTask) {
    return (
      <div className="mx-auto max-w-4xl p-12 text-center bg-white rounded-2xl border border-slate-200">
        <FileEdit className="mx-auto h-12 w-12 text-slate-300 mb-3" />
        <h2 className="text-lg font-bold text-slate-700">Tidak Ada Data Penugasan</h2>
        <p className="text-sm text-slate-500 mt-1 mb-4">Belum ada surat tugas yang dapat diedit di sistem.</p>
        <button
          onClick={() => navigate('/admin/tugas/buat')}
          className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition"
        >
          Buat Tugas Baru
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/admin/tugas')}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
            title="Kembali"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <FileEdit className="h-6 w-6 text-blue-600" />
              Edit Surat Tugas &amp; Upload Perbaikan
            </h1>
            <p className="text-sm text-slate-500">
              Perbarui nomor surat, personil, jadwal (tanggal &amp; jam), atau unggah file perbaikan Word/PDF.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Pilih Tugas yang Diedit:</label>
        <select
          value={selectedTaskId}
          onChange={(e) => setManualTaskId(e.target.value)}
          className="bg-slate-50 border border-slate-300 rounded-xl px-4 py-2 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 max-w-md"
        >
          {tasks.map((t) => (
            <option key={t.id} value={t.id}>
              {t.nomorSurat} - {t.perihal.substring(0, 45)}...
            </option>
          ))}
        </select>
      </div>

      <AdminEditTugasForm
        key={currentTask.id}
        currentTask={currentTask}
        allTasks={tasks}
        pegawaiList={pegawaiList}
        onSaveTask={updateTask}
        onDeleteTask={deleteTask}
      />
    </div>
  );
};
