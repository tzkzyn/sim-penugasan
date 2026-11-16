import { useState } from 'react';
import { Network, Plus, Users, FileText, Phone, Mail, Edit3 } from 'lucide-react';
import { dummyPegawaiList } from '@/data/dummyData';
import { usePenugasan } from '@/context/PenugasanContext';

interface BidangUnit {
  kode: string;
  nama: string;
  deskripsi: string;
  koordinator: string;
  nipKoordinator: string;
  kontak: string;
  email: string;
  warna: string;
}

const initialBidangList: BidangUnit[] = [
  {
    kode: 'RBI',
    nama: 'Reformasi Birokrasi & Inovasi (RBI)',
    deskripsi: 'Pengawalan zona integritas, akuntabilitas kinerja instansi, serta tata kelola organisasi birokrasi.',
    koordinator: 'Kepala Subbagian',
    nipKoordinator: '198711042012021005',
    kontak: '-',
    email: 'rbi@pemda.go.id',
    warna: 'from-blue-600 to-indigo-600',
  },
  {
    kode: 'Fastingkom',
    nama: 'Fasilitas & Peningkatan Mutu (Fastingkom)',
    deskripsi: 'Pemberdayaan prasarana teknologi informasi, sistem otomasi data penugasan, dan pendampingan daerah.',
    koordinator: '-',
    nipKoordinator: '-',
    kontak: '-',
    email: 'fastingkom@pemda.go.id',
    warna: 'from-emerald-600 to-teal-600',
  },
  {
    kode: 'Kepeg',
    nama: 'Kepegawaian & Tata Laksana (Kepeg)',
    deskripsi: 'Manajemen aparatur sipil negara, pemantauan presensi dan izin cuti, serta penegakan disiplin pegawai.',
    koordinator: '-',
    nipKoordinator: '-',
    kontak: '-',
    email: 'kepeg@pemda.go.id',
    warna: 'from-amber-600 to-orange-600',
  },
  {
    kode: 'PM',
    nama: 'Penjaminan Mutu & Standarisasi (PM)',
    deskripsi: 'Audit mutu internal berkala, evaluasi kepatuhan SOP surat tugas, dan penjaminan kualitas hasil penugasan.',
    koordinator: '-',
    nipKoordinator: '-',
    kontak: '-',
    email: 'pm@pemda.go.id',
    warna: 'from-purple-600 to-pink-600',
  },
];

export const BidangPage = () => {
  const [bidangList] = useState<BidangUnit[]>(initialBidangList);
  const { tasks } = usePenugasan();

  const getPersonnelCount = (kode: string) => {
    return dummyPegawaiList.filter((p) => p.unitKerja === kode).length;
  };

  const getActiveTaskCount = (kode: string) => {
    return tasks.filter((t) => t.unitKerja === kode && t.status === 'SURAT_TERBIT').length;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Network className="h-6 w-6 text-purple-600" />
            Struktur Bidang & Unit Kerja (POKJA)
          </h1>
          <p className="text-sm text-slate-500">
            Daftar divisi kerja, koordinator penanggung jawab, personil pegawai, dan beban tugas dinas.
          </p>
        </div>
        <button
          onClick={() => alert('Form penambahan unit kerja baru siap diintegrasikan.')}
          className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-purple-700 transition cursor-pointer"
        >
          <Plus className="h-4 w-4" /> Tambah Unit Kerja
        </button>
      </div>

      {/* Grid of Bidang */}
      <div className="grid gap-6 md:grid-cols-2">
        {bidangList.map((bidang) => {
          const staffCount = getPersonnelCount(bidang.kode);
          const taskCount = getActiveTaskCount(bidang.kode);

          return (
            <div
              key={bidang.kode}
              className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div>
                <div className={`p-5 bg-gradient-to-r ${bidang.warna} text-white`}>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold bg-white/20 px-3 py-1 rounded-full uppercase tracking-wider backdrop-blur-xs">
                      Unit: {bidang.kode}
                    </span>
                    <button
                      onClick={() => alert(`Pengaturan divisi ${bidang.kode} dibuka.`)}
                      className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition cursor-pointer"
                      title="Edit Bidang"
                    >
                      <Edit3 className="h-4 w-4 text-white" />
                    </button>
                  </div>
                  <h3 className="font-bold text-lg mt-2 text-white">{bidang.nama}</h3>
                  <p className="text-xs text-white/80 mt-1 line-clamp-2 leading-relaxed">
                    {bidang.deskripsi}
                  </p>
                </div>

                <div className="p-5 space-y-4">
                  {/* Coordinator */}
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Koordinator Unit</p>
                    <p className="font-bold text-slate-800 text-sm mt-0.5">{bidang.koordinator}</p>
                    <p className="text-xs text-slate-500">NIP: {bidang.nipKoordinator}</p>
                    <div className="flex flex-wrap items-center gap-4 mt-2 pt-2 border-t border-slate-200/60 text-xs text-slate-600">
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3 text-slate-400" /> {bidang.kontak}
                      </span>
                      <span className="flex items-center gap-1">
                        <Mail className="h-3 w-3 text-slate-400" /> {bidang.email}
                      </span>
                    </div>
                  </div>

                  {/* Metrics */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl border border-slate-200 bg-white p-3 text-center">
                      <div className="flex items-center justify-center gap-1 text-slate-500 text-xs font-medium mb-1">
                        <Users className="h-4 w-4 text-blue-600" /> Pegawai
                      </div>
                      <p className="text-xl font-bold text-slate-800">{staffCount} Orang</p>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-white p-3 text-center">
                      <div className="flex items-center justify-center gap-1 text-slate-500 text-xs font-medium mb-1">
                        <FileText className="h-4 w-4 text-emerald-600" /> Tugas Aktif
                      </div>
                      <p className="text-xl font-bold text-emerald-600">{taskCount} Tugas</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 px-5 py-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-600">
                <span>Status Divisi: <strong className="text-emerald-600">Aktif Beroperasi</strong></span>
                <span className="text-blue-600 hover:underline cursor-pointer">Lihat Anggota Unit →</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
