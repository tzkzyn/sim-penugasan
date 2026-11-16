import React, { useRef } from 'react';
import type { AjuanSuratTugas } from '@/types';
import { Printer, X, ShieldCheck, QrCode } from 'lucide-react';

interface CetakSuratTugasModalProps {
  surat: AjuanSuratTugas | null;
  isOpen: boolean;
  onClose: () => void;
}

export const CetakSuratTugasModal: React.FC<CetakSuratTugasModalProps> = ({
  surat,
  isOpen,
  onClose,
}) => {
  const printAreaRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !surat) return null;

  const handlePrint = () => {
    window.print();
  };

  const formatTanggalIndo = (tglStr?: string) => {
    if (!tglStr) return '-';
    try {
      return new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(new Date(tglStr));
    } catch {
      return tglStr;
    }
  };

  const daftarPegawai = surat.pegawaiDitugaskan && surat.pegawaiDitugaskan.length > 0
    ? surat.pegawaiDitugaskan
    : [surat.pengaju];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs overflow-y-auto">
      {/* Controls Container (Hidden on Print) */}
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8 print:m-0 print:border-none print:shadow-none print:rounded-none">
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50 print:hidden">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Pratinjau & Cetak Surat Perintah Tugas (SPT)</h3>
              <p className="text-xs text-slate-500">Nomor: {surat.nomorSurat}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition cursor-pointer"
            >
              <Printer className="w-4 h-4" /> Cetak / Simpan PDF
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-xl transition cursor-pointer"
              title="Tutup"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Paper A4 Container */}
        <div className="p-6 md:p-12 overflow-y-auto max-h-[80vh] print:max-h-none print:p-0 bg-slate-100 print:bg-white flex justify-center">
          <div
            ref={printAreaRef}
            id="printable-spt-document"
            className="w-full max-w-[210mm] min-h-[297mm] bg-white text-slate-900 p-8 sm:p-12 shadow-md print:shadow-none print:p-8 font-serif leading-relaxed text-sm print:m-0"
          >
            {/* KOP SURAT RESMI */}
            <div className="border-b-4 border-double border-slate-900 pb-4 text-center relative">
              <div className="flex items-center justify-center gap-4">
                <img
                  src={`${import.meta.env.BASE_URL}logo-kemendikdasmen.ico`}
                  alt="Logo Instansi"
                  className="w-16 h-16 object-contain"
                />
                <div>
                  <h4 className="text-xs font-bold tracking-widest uppercase">Pemerintah Daerah Daerah Istimewa Yogyakarta</h4>
                  <h2 className="text-lg font-black tracking-wider uppercase text-slate-900">
                    Dinas Komunikasi dan Informatika
                  </h2>
                  <p className="text-[11px] font-sans text-slate-600 mt-0.5">
                    Unit Kerja: {surat.unitKerja || 'Fastingkom'} • Jalan Brigjen Katamso, Yogyakarta 55152
                  </p>
                  <p className="text-[10px] font-sans text-slate-500">
                    Telepon: (0274) 562345 • Laman: https://diskominfo.jogjaprov.go.id • Pos-el: diskominfo@jogjaprov.go.id
                  </p>
                </div>
              </div>
            </div>

            {/* JUDUL SURAT */}
            <div className="text-center my-6">
              <h3 className="font-bold text-base tracking-widest uppercase underline underline-offset-4">
                Surat Perintah Tugas
              </h3>
              <p className="text-xs font-mono mt-1 font-semibold text-slate-700">
                Nomor: {surat.nomorSurat}
              </p>
            </div>

            {/* DASAR PENUGASAN */}
            <div className="space-y-3 mb-6 text-xs text-justify">
              <div className="flex items-start gap-4">
                <span className="font-bold min-w-[100px]">Dasar</span>
                <span className="min-w-[10px]">:</span>
                <div className="space-y-1 flex-1">
                  <p>1. Peraturan Daerah tentang Struktur Organisasi dan Tata Kerja Instansi Pemerintah;</p>
                  <p>2. Kebutuhan operasional pelaksanaan agenda tugas lapangan dan monitoring kedinasan;</p>
                  <p>3. Disposisi pimpinan terkait pelaksanaan kegiatan: <strong>{surat.perihal}</strong>.</p>
                </div>
              </div>
            </div>

            {/* MEMERINTAHKAN */}
            <div className="text-center my-4 font-bold tracking-widest text-xs uppercase">
              MEMERINTAHKAN:
            </div>

            {/* KEPADA (TABEL PEGAWAI DITUGASKAN) */}
            <div className="space-y-2 mb-6">
              <div className="flex items-start gap-4 text-xs font-bold">
                <span className="min-w-[100px]">Kepada</span>
                <span className="min-w-[10px]">:</span>
                <span>Daftar Pegawai Terlampir di Bawah Ini:</span>
              </div>

              <div className="overflow-x-auto mt-2">
                <table className="w-full border-collapse border border-slate-900 text-[11px]">
                  <thead>
                    <tr className="bg-slate-100 font-bold text-slate-900 text-center">
                      <th className="border border-slate-900 p-2 w-8">No</th>
                      <th className="border border-slate-900 p-2">Nama Pegawai & Gelar</th>
                      <th className="border border-slate-900 p-2">NIP</th>
                      <th className="border border-slate-900 p-2">Pangkat / Gol.</th>
                      <th className="border border-slate-900 p-2">Jabatan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {daftarPegawai.map((peg, idx) => (
                      <tr key={peg.id || idx}>
                        <td className="border border-slate-900 p-2 text-center font-bold">{idx + 1}</td>
                        <td className="border border-slate-900 p-2 font-bold">{peg.nama}</td>
                        <td className="border border-slate-900 p-2 font-mono text-center">{peg.nip}</td>
                        <td className="border border-slate-900 p-2 text-center">{peg.pangkatGolongan || 'Penata Muda / III/a'}</td>
                        <td className="border border-slate-900 p-2">{peg.jabatan || 'Pelaksana Teknis'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* UNTUK (RINCIAN TUGAS) */}
            <div className="space-y-3 mb-8 text-xs text-justify">
              <div className="flex items-start gap-4">
                <span className="font-bold min-w-[100px]">Untuk</span>
                <span className="min-w-[10px]">:</span>
                <div className="space-y-2 flex-1">
                  <p>
                    1. Melaksanakan penugasan dinas dengan perihal: <strong>{surat.perihal}</strong>.
                  </p>
                  <p>
                    2. Lokasi Tujuan: <strong>{surat.lokasiPenugasan}</strong> {surat.lokasiSpesifik ? `(${surat.lokasiSpesifik})` : ''}.
                  </p>
                  <p>
                    3. Waktu Pelaksanaan: Terhitung mulai tanggal <strong>{formatTanggalIndo(surat.tanggalMulai)}</strong> sampai dengan tanggal <strong>{formatTanggalIndo(surat.tanggalSelesai)}</strong>.
                  </p>
                  <p>
                    4. Melaporkan hasil pelaksanaan tugas kedinasan secara tertulis dan terverifikasi kepada pimpinan setelah selesai melaksanakan tugas.
                  </p>
                  {surat.deskripsi && (
                    <p className="italic text-slate-700 bg-slate-50 p-2 border border-slate-200 rounded">
                      Keterangan Tambahan: {surat.deskripsi}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* PENUTUP & TANDA TANGAN */}
            <div className="mt-8 pt-4 flex justify-between items-end text-xs">
              {/* QR Verification */}
              <div className="space-y-1.5 flex flex-col items-center border border-slate-300 p-3 rounded-lg bg-slate-50 w-44 text-center">
                <div className="flex items-center gap-1 font-bold text-[10px] text-blue-900">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                  <span>DIVERIFIKASI DIGITAL</span>
                </div>
                <div className="w-20 h-20 bg-white border border-slate-300 flex items-center justify-center p-1">
                  <QrCode className="w-16 h-16 text-slate-800" />
                </div>
                <p className="text-[9px] text-slate-500 font-mono">
                  ID: {surat.id.slice(0, 12)}
                </p>
              </div>

              {/* Tanda Tangan Pejabat */}
              <div className="text-center w-64 space-y-1">
                <p>Ditetapkan di Yogyakarta</p>
                <p>Pada tanggal {formatTanggalIndo(surat.tanggalMulai)}</p>
                <p className="font-bold uppercase mt-2">
                  An. KEPALA DINAS KOMUNIKASI DAN INFORMATIKA
                </p>
                <p className="font-semibold text-slate-700">
                  Koordinator Bidang / Pembimbing Teknis
                </p>

                {/* Stempel & Paraf Box */}
                <div className="h-20 flex items-center justify-center my-1 relative">
                  <span className="text-[10px] text-slate-400 italic">
                    [ Ditandatangani Secara Elektronik (TTE) ]
                  </span>
                </div>

                <p className="font-bold underline text-sm">
                  Hj. Anita Purnamasari, S.Kom., M.T.
                </p>
                <p className="font-mono text-xs">
                  NIP. 198106142006042011
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
