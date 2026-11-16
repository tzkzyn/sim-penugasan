import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Briefcase, Mail, Building2, UserCircle, Activity } from 'lucide-react';
import { dummyPegawaiList } from '@/data/dummyData';
import { usePenugasan } from '@/context/PenugasanContext';

export const DetailPegawaiPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { tasks } = usePenugasan();
  
  const pegawai = dummyPegawaiList.find(p => p.id === id);

  if (!pegawai) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center space-y-4 text-center">
        <UserCircle className="h-16 w-16 text-slate-400" />
        <div>
          <h2 className="text-xl font-bold text-slate-800">Pegawai Tidak Ditemukan</h2>
          <p className="mt-1 text-slate-500">ID Pegawai tidak terdaftar di sistem.</p>
        </div>
        <button 
          onClick={() => navigate(-1)}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Kembali
        </button>
      </div>
    );
  }

  // Derive real activities dynamically from tasks assigned to this pegawai
  const pegawaiTasks = tasks.filter(t => t.pegawaiDitugaskan.some(p => p.id === pegawai.id));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 border-b border-slate-200 pb-4">
        <button 
          onClick={() => navigate(-1)}
          className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Profil Pegawai</h1>
          <p className="text-sm text-slate-500">Detail informasi dan riwayat aktifitas pegawai.</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Left Column: Biodata Card */}
        <div className="md:col-span-1 space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col items-center text-center">
              <img 
                src={pegawai.fotoAvatar} 
                alt={pegawai.nama} 
                className="h-28 w-28 rounded-full border-4 border-slate-50 object-cover shadow-sm"
              />
              <h2 className="mt-4 text-xl font-bold text-slate-800">{pegawai.nama}</h2>
              <p className="font-medium text-slate-500">NIP. {pegawai.nip}</p>
              
              <span className={`mt-3 inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${
                pegawai.role === 'SUPER_ADMIN' || pegawai.role === 'ADMIN'
                  ? 'bg-purple-50 text-purple-700 ring-purple-700/10'
                  : 'bg-emerald-50 text-emerald-700 ring-emerald-600/10'
              }`}>
                {pegawai.role}
              </span>
            </div>

            <div className="mt-6 space-y-4 border-t border-slate-100 pt-6">
              <div className="flex items-start gap-3">
                <Briefcase className="mt-0.5 h-5 w-5 text-slate-400" />
                <div>
                  <p className="text-xs font-medium text-slate-500">Jabatan</p>
                  <p className="text-sm font-medium text-slate-800">{pegawai.jabatan}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Building2 className="mt-0.5 h-5 w-5 text-slate-400" />
                <div>
                  <p className="text-xs font-medium text-slate-500">Unit Kerja</p>
                  <p className="text-sm font-medium text-slate-800">{pegawai.unitKerja}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Mail className="mt-0.5 h-5 w-5 text-slate-400" />
                <div>
                  <p className="text-xs font-medium text-slate-500">Email</p>
                  <p className="text-sm font-medium text-slate-800 break-all">{pegawai.email}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Activity Table */}
        <div className="md:col-span-2">
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden h-full flex flex-col">
            <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-50/50 px-6 py-4">
              <Activity className="h-5 w-5 text-blue-600" />
              <h3 className="font-bold text-slate-800">Riwayat Aktifitas Terakhir</h3>
            </div>
            
            <div className="flex-1 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-white text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 font-semibold">Waktu</th>
                    <th className="px-6 py-3 font-semibold">Tindakan</th>
                    <th className="px-6 py-3 font-semibold">Keterkaitan</th>
                    <th className="px-6 py-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {pegawaiTasks.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50/50 transition">
                      <td className="px-6 py-4 whitespace-nowrap text-slate-500 text-xs">{t.tanggalMulai} s/d {t.tanggalSelesai}</td>
                      <td className="px-6 py-4 font-medium text-slate-800 text-xs">Penugasan Dinas Lapangan</td>
                      <td className="px-6 py-4 text-slate-600 text-xs">
                        <span className="font-mono font-bold text-blue-600">{t.nomorSurat}</span> - {t.perihal}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                          t.status === 'SURAT_TERBIT' ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/10' :
                          t.status === 'PERSETUJUAN_PIMPINAN' ? 'bg-purple-50 text-purple-700 ring-purple-600/10' :
                          'bg-amber-50 text-amber-700 ring-amber-600/10'
                        }`}>
                          {t.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {pegawaiTasks.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-xs text-slate-400">
                        Belum ada riwayat aktivitas penugasan untuk pegawai ini.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
