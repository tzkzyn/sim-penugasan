import { useState } from 'react';
import { CheckSquare, Search, Plus, PenTool, CheckCircle2, UserCheck, Mail } from 'lucide-react';
import { dummyPegawaiList } from '@/data/dummyData';
import { usePenugasan } from '@/context/PenugasanContext';

interface ApprovalOfficer {
  id: string;
  nama: string;
  nip: string;
  jabatan: string;
  email: string;
  unitKerja: string;
  spesimenTtd: boolean;
  statusAkses: 'AKTIF' | 'NONAKTIF';
  totalDisetujui: number;
}

export const ApprovalPage = () => {
  const { tasks } = usePenugasan();
  const approvedCount = tasks.filter((t) => t.status === 'SURAT_TERBIT').length;

  const [officers, setOfficers] = useState<ApprovalOfficer[]>(() => {
    return dummyPegawaiList
      .filter((p) => p.role === 'APPROVAL')
      .map((p) => ({
        id: p.id,
        nama: p.nama,
        nip: p.nip,
        jabatan: p.jabatan,
        email: p.email || 'approval@pemda.go.id',
        unitKerja: p.unitKerja,
        spesimenTtd: true,
        statusAkses: 'AKTIF',
        totalDisetujui: approvedCount,
      }));
  });
  const [searchTerm, setSearchTerm] = useState('');

  const toggleStatus = (id: string) => {
    setOfficers((prev) =>
      prev.map((off) =>
        off.id === id
          ? { ...off, statusAkses: off.statusAkses === 'AKTIF' ? 'NONAKTIF' : 'AKTIF' }
          : off
      )
    );
  };

  const handleTestTtd = (nama: string) => {
    alert(`Spesimen tanda tangan digital untuk "${nama}" terverifikasi valid dan aktif.`);
  };

  const filteredOfficers = officers.filter(
    (off) =>
      off.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      off.nip.includes(searchTerm) ||
      off.jabatan.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <CheckSquare className="h-6 w-6 text-purple-600" />
            Manajemen Pejabat Penandatangan (Approval)
          </h1>
          <p className="text-sm text-slate-500">
            Daftar pejabat pimpinan yang berwenang memberikan verifikasi dan persetujuan surat tugas resmi.
          </p>
        </div>
        <button
          onClick={() => alert('Form registrasi pejabat penandatangan baru siap diintegrasikan.')}
          className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-purple-700 transition cursor-pointer"
        >
          <Plus className="h-4 w-4" /> Tambah Pejabat Approval
        </button>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama pejabat, NIP, atau jabatan..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20"
          />
        </div>
      </div>

      {/* Grid of Approval Officers */}
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {filteredOfficers.map((officer) => (
          <div
            key={officer.id}
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-3">
                <div className="h-12 w-12 rounded-2xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-700 font-bold shrink-0">
                  <UserCheck className="h-6 w-6" />
                </div>
                <button
                  onClick={() => toggleStatus(officer.id)}
                  className={`px-2.5 py-1 rounded-full text-xs font-bold cursor-pointer transition ${
                    officer.statusAkses === 'AKTIF'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-rose-50 text-rose-700 border border-rose-200'
                  }`}
                >
                  {officer.statusAkses}
                </button>
              </div>

              <h3 className="font-bold text-slate-800 text-base mt-4">{officer.nama}</h3>
              <p className="text-xs text-purple-700 font-semibold mt-0.5">{officer.jabatan}</p>
              <p className="text-xs text-slate-400 mt-0.5">NIP: {officer.nip}</p>

              <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 text-xs text-slate-600">
                <div className="flex items-center gap-1.5 text-slate-500">
                  <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{officer.email}</span>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-slate-400">Unit Organisasi:</span>
                  <span className="font-semibold text-slate-700">{officer.unitKerja}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Surat Disetujui:</span>
                  <span className="font-bold text-blue-600">{officer.totalDisetujui} Surat</span>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                <CheckCircle2 className="h-3.5 w-3.5" /> Tanda Tangan Siap
              </span>
              <button
                onClick={() => handleTestTtd(officer.nama)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-purple-600 hover:text-purple-800 transition cursor-pointer"
              >
                <PenTool className="h-3.5 w-3.5" /> Uji TTD Digital
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
