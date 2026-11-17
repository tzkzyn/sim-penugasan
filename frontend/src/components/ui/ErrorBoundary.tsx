import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw, RotateCcw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

/**
 * Menangkap runtime error tak terduga agar aplikasi tidak menampilkan layar putih kosong
 * dan pengguna dapat memulihkan sesi atau memuat ulang halaman dengan aman.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error instanceof Error ? error.message : String(error),
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('Terjadi kesalahan tampilan aplikasi:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleResetLocalCache = () => {
    try {
      localStorage.removeItem('sim_penugasan_live_tasks');
      localStorage.removeItem('sim_pengajuan_cuti');
      localStorage.removeItem('sim_penugasan_approval_templates');
    } catch {
      // Abaikan kegagalan akses storage
    }
    window.location.reload();
  };

  render(): ReactNode {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div className="min-h-screen bg-[#F3F6FB] flex items-center justify-center p-6">
        <div className="max-w-lg w-full bg-white rounded-2xl border border-slate-200 shadow-xl p-6 sm:p-8 space-y-5 text-center">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-black text-slate-900">Halaman Mengalami Gangguan</h1>
            <p className="text-sm text-slate-600">
              Terjadi kesalahan saat merender halaman. Anda dapat memuat ulang atau membersihkan cache data sementara.
            </p>
          </div>
          {this.state.errorMessage && (
            <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 text-left text-xs font-mono text-rose-700 break-words">
              {this.state.errorMessage}
            </div>
          )}
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-1">
            <button
              type="button"
              onClick={this.handleReload}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#1D4ED8] hover:bg-[#1E40AF] text-white text-sm font-bold transition-colors cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              Muat Ulang Halaman
            </button>
            <button
              type="button"
              onClick={this.handleResetLocalCache}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              Reset Cache Data Lokal
            </button>
          </div>
        </div>
      </div>
    );
  }
}

