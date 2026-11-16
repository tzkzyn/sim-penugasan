import { useState } from 'react';
import { usePenugasan } from '@/context/PenugasanContext';
import { CheckCircle2, Clock, XCircle, MapPin, Calendar } from 'lucide-react';

export const StatusApprovalPage = () => {
  const { tasks } = usePenugasan();
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');

  const ajuanList = tasks.filter((item) => {
    if (filter === 'PENDING')
      return item.status === 'VERIFIKASI_SUBBAGIAN' || item.status === 'PERSETUJUAN_PIMPINAN';
    if (filter === 'APPROVED') return item.status === 'SURAT_TERBIT';
    if (filter === 'REJECTED') return item.status === 'DITOLAK';
    return true;
  });

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-black text-slate-800">Status Persetujuan Surat Tugas Saya</h1>
        <p className="text-sm text-slate-500">Pantau proses verifikasi dan persetujuan surat tugas yang telah Anda ajukan.</p>
      </div>

      <div className="flex gap-2 border-b border-slate-200 pb-3">
        {(['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
              filter === tab
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {tab === 'ALL' && 'Semua Ajuan'}
            {tab === 'PENDING' && 'Dalam Proses Verifikasi'}
            {tab === 'APPROVED' && 'Telah Disetujui (Terbit)'}
            {tab === 'REJECTED' && 'Ditolak'}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {ajuanList.map((item) => {
          const isPending =
            item.status === 'VERIFIKASI_SUBBAGIAN' || item.status === 'PERSETUJUAN_PIMPINAN';
          const isApproved = item.status === 'SURAT_TERBIT';
          const isRejected = item.status === 'DITOLAK';

          return (
            <div
              key={item.id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4 hover:border-slate-300 transition-all"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <span className="font-bold text-slate-800 text-base">{item.nomorSurat}</span>
                  <p className="text-sm font-semibold text-slate-700 mt-0.5">{item.perihal}</p>
                </div>
                <div>
                  {isApproved && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 border border-emerald-200">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Surat Terbit
                    </span>
                  )}
                  {isPending && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700 border border-amber-200">
                      <Clock className="h-3.5 w-3.5" /> Menunggu Persetujuan
                    </span>
                  )}
                  {isRejected && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-3 py-1 text-xs font-bold text-rose-700 border border-rose-200">
                      <XCircle className="h-3.5 w-3.5" /> Ditolak
                    </span>
                  )}
                </div>
              </div>

              {/* Progress Steps */}
              <div className="grid grid-cols-4 gap-2 pt-2 border-t border-slate-100 text-center">
                <div className="space-y-1">
                  <div className="h-1.5 w-full rounded-full bg-blue-600" />
                  <p className="text-[11px] font-bold text-blue-600">1. Draft Dibuat</p>
                </div>
                <div className="space-y-1">
                  <div className={`h-1.5 w-full rounded-full ${item.status !== 'DRAFT' ? 'bg-blue-600' : 'bg-slate-200'}`} />
                  <p className="text-[11px] font-medium text-slate-600">2. Verifikasi Subbag</p>
                </div>
                <div className="space-y-1">
                  <div className={`h-1.5 w-full rounded-full ${isApproved ? 'bg-blue-600' : isRejected ? 'bg-rose-500' : 'bg-slate-200'}`} />
                  <p className="text-[11px] font-medium text-slate-600">3. Persetujuan Pimpinan</p>
                </div>
                <div className="space-y-1">
                  <div className={`h-1.5 w-full rounded-full ${isApproved ? 'bg-emerald-600' : 'bg-slate-200'}`} />
                  <p className={`text-[11px] font-medium ${isApproved ? 'text-emerald-700 font-bold' : 'text-slate-400'}`}>
                    4. Surat Terbit
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-slate-400" /> {item.lokasiPenugasan}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-slate-400" /> {item.tanggalMulai} s.d {item.tanggalSelesai}
                  </span>
                </div>
                <span className="font-semibold text-slate-600">Unit Kerja: {item.unitKerja}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
