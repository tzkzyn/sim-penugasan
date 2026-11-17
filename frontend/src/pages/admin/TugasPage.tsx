import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import type { AjuanSuratTugas } from '@/types';
import { FileText } from 'lucide-react';
import { CetakSuratTugasModal } from '@/components/ui/CetakSuratTugasModal';
import {
  BlokirPenugasanTab,
  DraftPenugasanTab,
  LaporanPenugasanTab,
  PegawaiPenugasanTab,
  PenugasanBerlangsungTab,
  PeriodePenugasanTab,
  PivotPenugasanTab,
  RekapPenugasanTab,
} from '@/components/admin/AdminTugasTabs';

export const TugasPage = () => {
  const [searchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'rekap';
  const [suratToPrint, setSuratToPrint] = useState<AjuanSuratTugas | null>(null);
  const navigate = useNavigate();

  const renderContent = () => {
    switch (activeTab) {
      case 'rekap': return <RekapPenugasanTab onPrint={setSuratToPrint} />;
      case 'pegawai': return <PegawaiPenugasanTab />;
      case 'laporan': return <LaporanPenugasanTab onPrint={setSuratToPrint} />;
      case 'periode': return <PeriodePenugasanTab />;
      case 'pivot': return <PivotPenugasanTab />;
      case 'berlangsung': return <PenugasanBerlangsungTab onPrint={setSuratToPrint} />;
      case 'draft': return <DraftPenugasanTab onPrint={setSuratToPrint} />;
      case 'blokir': return <BlokirPenugasanTab onPrint={setSuratToPrint} />;
      default: return null;
    }
  };

  return (
    <div className="p-2 sm:p-4 space-y-5 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_6px_24px_-6px_rgba(30,64,175,0.08)]">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-[#EEF3FB] text-[#1D4ED8] flex items-center justify-center shrink-0">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">Manajemen Penugasan</h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Pantau rekap, progres pelaksanaan, dan berkas laporan surat tugas.
            </p>
          </div>
        </div>
        <button
          onClick={() => navigate('/admin/tugas/buat')}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-[#1D4ED8] px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-blue-600/20 hover:bg-[#1E40AF] transition cursor-pointer shrink-0"
        >
          + Buat Tugas Baru
        </button>
      </div>

      <div className="rounded-2xl border border-slate-100 bg-white p-5 sm:p-6 shadow-[0_6px_24px_-6px_rgba(30,64,175,0.08)]">
        {renderContent()}
      </div>

      <CetakSuratTugasModal
        surat={suratToPrint}
        isOpen={Boolean(suratToPrint)}
        onClose={() => setSuratToPrint(null)}
      />
    </div>
  );
};
