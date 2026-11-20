import { AlertTriangle, CheckCircle2, RefreshCw } from 'lucide-react';
import { usePenugasan } from '@/context/PenugasanContext';

const formatTimeShort = (iso: string | null): string => {
  if (!iso) return '-';
  try {
    return new Date(iso).toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '-';
  }
};

export const DashboardDataStatusBar = () => {
  const { loadError, isUsingCache, lastUpdated, isSyncing, refreshAll } = usePenugasan();

  if (loadError || isUsingCache) {
    return (
      <div
        role="status"
        className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200/80 bg-amber-50/70 px-4 py-3 text-xs text-amber-900"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <div className="min-w-0">
            <span className="font-semibold">
              {loadError || 'Menampilkan data cache terakhir.'}
            </span>
            {lastUpdated && (
              <span className="ml-2 text-amber-700/80">
                (Terakhir sinkron: {formatTimeShort(lastUpdated)})
              </span>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={() => void refreshAll()}
          disabled={isSyncing}
          className="inline-flex items-center gap-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-60 px-3 py-1.5 text-xs font-semibold text-white transition cursor-pointer shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
          {isSyncing ? 'Memuat...' : 'Coba Lagi'}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-xs text-slate-400">
      <div className="inline-flex items-center gap-1.5">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
        <span>
          {lastUpdated
            ? `Data tersinkron • Terakhir diperbarui ${formatTimeShort(lastUpdated)}`
            : isSyncing
              ? 'Menyinkronkan data terbaru...'
              : 'Menggunakan data lokal tersimpan'}
        </span>
      </div>
      <button
        type="button"
        onClick={() => void refreshAll()}
        disabled={isSyncing}
        className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50 transition cursor-pointer"
      >
        <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
        Muat Ulang
      </button>
    </div>
  );
};

