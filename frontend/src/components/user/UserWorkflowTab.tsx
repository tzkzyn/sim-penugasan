import type { AjuanSuratTugas } from '@/types';
import { AjuanStatusBadge } from '@/components/user/UserAjuanModals';
import { CheckCircle2, Clock, FileCheck, FileText } from 'lucide-react';

interface UserWorkflowTabProps {
  filteredAjuan: AjuanSuratTugas[];
  selectedAjuan: AjuanSuratTugas | null;
  onSelectAjuan: (item: AjuanSuratTugas) => void;
}

export function UserWorkflowTab({
  filteredAjuan,
  selectedAjuan,
  onSelectAjuan,
}: UserWorkflowTabProps) {
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
                <AjuanStatusBadge status={item.status} />
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
              <div><AjuanStatusBadge status={selectedAjuan.status} /></div>
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

