import { useState, useEffect } from 'react';
import {
  CheckCircle2,
  FilePlus2,
  Send,
  Calendar,
  Clock,
  UploadCloud,
  FileText,
  AlertCircle,
  XCircle,
  UserCheck
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

type JenisPengajuan = 'CUTI' | 'IZIN' | 'SAKIT' | 'DINAS_LUAR';

interface PengajuanCuti {
  id: string | number;
  nama: string;
  nip: string;
  unitKerja: string;
  jabatan?: string;
  jenis: JenisPengajuan;
  mulai: string;
  selesai: string;
  alasan: string;
  dokumenLampiran?: string;
  status: 'MENUNGGU' | 'DISETUJUI' | 'DITOLAK';
  tanggalPengajuan: string;
  disetujuiOleh?: string;
  disetujuiPada?: string;
  catatanPenolakan?: string;
}

const formatTanggal = (tanggal: string) => {
  try {
    return new Intl.DateTimeFormat('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }).format(new Date(`${tanggal}T00:00:00`));
  } catch {
    return tanggal;
  }
};

const tanggalHariIni = () => {
  const sekarang = new Date();
  const tahun = sekarang.getFullYear();
  const bulan = String(sekarang.getMonth() + 1).padStart(2, '0');
  const tanggal = String(sekarang.getDate()).padStart(2, '0');
  return `${tahun}-${bulan}-${tanggal}`;
};

export const CutiPage = () => {
  const { user } = useAuth();
  const [jenis, setJenis] = useState<JenisPengajuan>('CUTI');
  const [tanggalMulai, setTanggalMulai] = useState('');
  const [tanggalSelesai, setTanggalSelesai] = useState('');
  const [alasan, setAlasan] = useState('');
  const [lampiranNama, setLampiranNama] = useState<string>('');
  const [pengajuan, setPengajuan] = useState<PengajuanCuti[]>(() => {
    try {
      const saved = localStorage.getItem('sim_pengajuan_cuti');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter(
            (p: any) => p.id !== 101 && !p.alasan?.includes('Keperluan Keluarga')
          );
        }
      }
      return [];
    } catch {
      return [];
    }
  });

  const [pesan, setPesan] = useState('');
  const [errorPesan, setErrorPesan] = useState('');
  const hariIni = tanggalHariIni();

  // Real-time synchronization dengan data pengajuan
  const syncFromStorage = () => {
    try {
      const saved = localStorage.getItem('sim_pengajuan_cuti');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const valid = parsed.filter(
            (p: any) => p.id !== 101 && !p.alasan?.includes('Keperluan Keluarga')
          );
          setPengajuan(valid);
        }
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    syncFromStorage();
    const handleStorage = () => syncFromStorage();
    window.addEventListener('storage', handleStorage);
    const interval = setInterval(syncFromStorage, 2500);
    return () => {
      window.removeEventListener('storage', handleStorage);
      clearInterval(interval);
    };
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLampiranNama(file.name);
    }
  };

  const kirimPengajuan = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPesan('');
    setErrorPesan('');

    if (tanggalMulai < hariIni || tanggalSelesai < hariIni) {
      setErrorPesan('Tanggal permohonan tidak boleh menggunakan tanggal yang sudah lewat.');
      return;
    }
    if (tanggalSelesai < tanggalMulai) {
      setErrorPesan('Tanggal selesai tidak boleh lebih awal dari tanggal mulai.');
      return;
    }
    if (!alasan.trim()) {
      setErrorPesan('Harap isi alasan permohonan secara lengkap.');
      return;
    }

    const tglSekarang = new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

    const itemBaru: PengajuanCuti = {
      id: `cuti-${Date.now()}`,
      nama: user?.nama || 'Pegawai Pelaksana',
      nip: user?.nip || '199204152015032001',
      unitKerja: user?.unitKerja || 'RBI',
      jabatan: user?.jabatan || 'Staf Pelaksana',
      jenis,
      mulai: tanggalMulai,
      selesai: tanggalSelesai,
      alasan: alasan.trim(),
      dokumenLampiran: lampiranNama || undefined,
      status: 'MENUNGGU',
      tanggalPengajuan: tglSekarang,
    };

    const updated = [itemBaru, ...pengajuan];
    setPengajuan(updated);

    try {
      localStorage.setItem('sim_pengajuan_cuti', JSON.stringify(updated));
      window.dispatchEvent(new Event('storage'));
    } catch {
      // ignore
    }

    setTanggalMulai('');
    setTanggalSelesai('');
    setAlasan('');
    setLampiranNama('');
    setPesan(`Permohonan ${jenis === 'CUTI' ? 'Cuti' : 'Izin'} berhasil dikirim ke atasan. Mohon menunggu proses ACC verifikasi.`);
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex items-center gap-2">
          <Calendar className="h-6 w-6 text-blue-600" />
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Pengajuan Izin & Cuti Pegawai</h1>
        </div>
        <p className="mt-1 text-sm text-slate-500">
          Kirim permohonan izin tidak masuk, sakit, atau cuti tahunan ke atasan dan pantau status persetujuannya secara langsung.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        {/* Form Pengajuan */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
            <FilePlus2 className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-bold text-slate-800">Form Permohonan Izin / Cuti</h2>
          </div>

          <form onSubmit={kirimPengajuan} className="mt-5 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Jenis Pengajuan</label>
              <select
                value={jenis}
                onChange={(e) => setJenis(e.target.value as JenisPengajuan)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500 cursor-pointer"
              >
                <option value="CUTI">Cuti Tahunan (Hak 12 Hari Kerja)</option>
                <option value="IZIN">Izin Keperluan Mendesak / Kepentingan Pribadi</option>
                <option value="SAKIT">Izin Sakit (Disertai Surat Keterangan Dokter)</option>
                <option value="DINAS_LUAR">Izin Dinas Luar / Tugas Lapangan</option>
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Tanggal Mulai</label>
                <input
                  required
                  type="date"
                  min={hariIni}
                  value={tanggalMulai}
                  onChange={(e) => setTanggalMulai(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500 cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Tanggal Selesai</label>
                <input
                  required
                  type="date"
                  min={tanggalMulai || hariIni}
                  value={tanggalSelesai}
                  onChange={(e) => setTanggalSelesai(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500 cursor-pointer"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Alasan & Uraian Keterangan</label>
              <textarea
                required
                rows={3}
                value={alasan}
                onChange={(e) => setAlasan(e.target.value)}
                placeholder="Tuliskan secara jelas keperluan izin atau cuti Anda..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Unggah Dokumen Lampiran */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Dokumen Pendukung / Surat Keterangan (Opsional)
              </label>
              <div className="flex items-center gap-3">
                <label className="inline-flex items-center gap-2 px-4 py-2 border border-slate-200 bg-slate-50 rounded-xl text-xs font-medium text-slate-700 hover:bg-slate-100 cursor-pointer transition">
                  <UploadCloud className="w-4 h-4 text-blue-600" />
                  <span>{lampiranNama ? 'Ganti File' : 'Pilih File (PDF/JPG)'}</span>
                  <input
                    type="file"
                    className="hidden"
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    onChange={handleFileUpload}
                  />
                </label>
                {lampiranNama ? (
                  <span className="text-xs text-blue-600 font-semibold flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5" /> {lampiranNama}
                  </span>
                ) : (
                  <span className="text-xs text-slate-400">Belum ada file dipilih</span>
                )}
              </div>
            </div>

            {errorPesan && (
              <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs font-medium text-rose-800">
                <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                <span>{errorPesan}</span>
              </div>
            )}

            {pesan && (
              <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs font-medium text-emerald-800">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>{pesan}</span>
              </div>
            )}

            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 transition cursor-pointer"
            >
              <Send className="h-4 w-4" /> Kirim Permohonan ke Atasan
            </button>
          </form>
        </section>

        {/* Status Riwayat Pengajuan */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-lg font-bold text-slate-800">Status & Riwayat Permohonan</h2>
              <p className="mt-0.5 text-xs text-slate-500">
                Daftar permohonan Anda dan status verifikasi persetujuan pimpinan.
              </p>
            </div>

            <div className="mt-5 space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {pengajuan.map((item) => (
                <div
                  key={item.id}
                  className={`rounded-xl border p-4 space-y-2.5 transition-all ${
                    item.status === 'DISETUJUI'
                      ? 'bg-emerald-50/40 border-emerald-200'
                      : item.status === 'DITOLAK'
                      ? 'bg-rose-50/40 border-rose-200'
                      : 'bg-slate-50/70 border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 text-sm">
                      {item.jenis === 'CUTI'
                        ? 'Cuti Tahunan'
                        : item.jenis === 'SAKIT'
                        ? 'Izin Sakit'
                        : 'Izin Tidak Masuk'}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                        item.status === 'DISETUJUI'
                          ? 'bg-emerald-100 text-emerald-800'
                          : item.status === 'DITOLAK'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {item.status === 'DISETUJUI' && <CheckCircle2 className="w-3 h-3" />}
                      {item.status === 'DITOLAK' && <XCircle className="w-3 h-3" />}
                      {item.status === 'MENUNGGU' && <Clock className="w-3 h-3" />}
                      {item.status}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-slate-600">
                    <Clock className="h-3.5 w-3.5 text-blue-500" />
                    <span>
                      {formatTanggal(item.mulai)} s/d {formatTanggal(item.selesai)}
                    </span>
                  </div>

                  <p className="text-xs text-slate-700 bg-white p-2.5 rounded-lg border border-slate-100">
                    "{item.alasan}"
                  </p>

                  {item.dokumenLampiran && (
                    <div className="text-[11px] text-blue-600 flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5" />
                      <span>Lampiran: {item.dokumenLampiran}</span>
                    </div>
                  )}

                  {/* Feedback dari Atasan */}
                  {item.disetujuiOleh && (
                    <div className="text-[11px] text-slate-500 flex items-center gap-1 pt-1 border-t border-slate-200/60">
                      <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>
                        Diverifikasi oleh: <strong>{item.disetujuiOleh}</strong>
                      </span>
                    </div>
                  )}

                  {item.catatanPenolakan && item.status === 'DITOLAK' && (
                    <div className="text-[11px] text-rose-700 bg-rose-50 p-2 rounded-md border border-rose-200">
                      <strong>Catatan Penolakan:</strong> {item.catatanPenolakan}
                    </div>
                  )}
                </div>
              ))}

              {pengajuan.length === 0 && (
                <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-xs text-slate-400 space-y-1">
                  <Calendar className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="font-semibold text-slate-600">Belum ada riwayat permohonan</p>
                  <p>Isi form di samping untuk mengirimkan permohonan izin atau cuti baru.</p>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
