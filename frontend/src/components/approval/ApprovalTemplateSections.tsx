import { useState, type RefObject } from 'react';
import type { TemplateSuratResmi } from '@/types';
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  ChevronDown,
  Download,
  Edit3,
  Italic,
  Plus,
  Power,
  Trash2,
  Underline,
  UploadCloud,
} from 'lucide-react';

const VARIABLE_TOKENS = [
  { token: '{{NOMOR_SURAT}}', label: 'Nomor Surat' },
  { token: '{{TABEL_PEGAWAI}}', label: 'Blok Data Pegawai' },
  { token: '{{NAMA_PEGAWAI}}', label: 'Nama Pegawai' },
  { token: '{{NIP}}', label: 'NIP' },
  { token: '{{PANGKAT}}', label: 'Pangkat/Gol' },
  { token: '{{JABATAN}}', label: 'Jabatan' },
  { token: '{{PERIHAL}}', label: 'Perihal' },
  { token: '{{TANGGAL}}', label: 'Tanggal' },
  { token: '{{LOKASI}}', label: 'Lokasi' },
  { token: '{{DASAR_SURAT}}', label: 'Dasar Surat' },
  { token: '{{BIAYA}}', label: 'Sumber Biaya' },
  { token: '{{NAMA_KEPALA}}', label: 'Nama Kepala' },
];

interface ApprovalTemplateA4EditorProps {
  editorRef: RefObject<HTMLDivElement | null>;
  kontenHtml: string;
  sertakanKopResmi: boolean;
  onKontenChange: (html: string) => void;
  onExecFormat: (command: string) => void;
  onInsertToken: (token: string) => void;
}

export function ApprovalTemplateA4Editor({
  editorRef,
  kontenHtml,
  sertakanKopResmi,
  onKontenChange,
  onExecFormat,
  onInsertToken,
}: ApprovalTemplateA4EditorProps) {
  const [isVarMenuOpen, setIsVarMenuOpen] = useState(false);
  const [kopImgError, setKopImgError] = useState(false);
  const [footerImgError, setFooterImgError] = useState(false);

  const normalizedBaseUrl = import.meta.env.BASE_URL.endsWith('/')
    ? import.meta.env.BASE_URL
    : `${import.meta.env.BASE_URL}/`;

  return (
    <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-100 shadow-[0_6px_24px_-6px_rgba(30,64,175,0.08)] overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/80 bg-white px-4 py-2.5">
        <span className="text-xs font-bold text-slate-800">
          Editor Template Kertas A4
        </span>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsVarMenuOpen((prev) => !prev)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-[#EEF3FB] px-2.5 py-1.5 text-[11px] font-semibold text-[#1D4ED8] hover:bg-blue-100 transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Sisipkan Variabel</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isVarMenuOpen ? 'rotate-180' : ''}`} />
            </button>
            {isVarMenuOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setIsVarMenuOpen(false)} />
                <div className="absolute right-0 top-full z-40 mt-1.5 w-72 rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
                  <p className="px-2 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 mb-1.5">
                    Klik untuk menyisipkan ke posisi kursor
                  </p>
                  <div className="grid grid-cols-2 gap-1">
                    {VARIABLE_TOKENS.map((item) => (
                      <button
                        key={item.token}
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                          onInsertToken(item.token);
                          setIsVarMenuOpen(false);
                        }}
                        className="text-left rounded-lg px-2 py-1.5 text-[11px] font-medium text-slate-700 hover:bg-[#EEF3FB] hover:text-[#1D4ED8] transition cursor-pointer truncate"
                        title={item.token}
                      >
                        + {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="flex items-center gap-0.5 rounded-lg border border-slate-200 bg-slate-50/70 p-0.5">
            <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => onExecFormat('bold')} className="p-1.5 rounded hover:bg-white text-slate-600 hover:text-[#1D4ED8] cursor-pointer" title="Bold"><Bold className="w-3.5 h-3.5" /></button>
            <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => onExecFormat('italic')} className="p-1.5 rounded hover:bg-white text-slate-600 hover:text-[#1D4ED8] cursor-pointer" title="Italic"><Italic className="w-3.5 h-3.5" /></button>
            <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => onExecFormat('underline')} className="p-1.5 rounded hover:bg-white text-slate-600 hover:text-[#1D4ED8] cursor-pointer" title="Underline"><Underline className="w-3.5 h-3.5" /></button>
            <div className="mx-1 h-4 w-px bg-slate-200" />
            <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => onExecFormat('justifyLeft')} className="p-1.5 rounded hover:bg-white text-slate-600 hover:text-[#1D4ED8] cursor-pointer" title="Rata Kiri"><AlignLeft className="w-3.5 h-3.5" /></button>
            <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => onExecFormat('justifyCenter')} className="p-1.5 rounded hover:bg-white text-slate-600 hover:text-[#1D4ED8] cursor-pointer" title="Rata Tengah"><AlignCenter className="w-3.5 h-3.5" /></button>
            <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => onExecFormat('justifyRight')} className="p-1.5 rounded hover:bg-white text-slate-600 hover:text-[#1D4ED8] cursor-pointer" title="Rata Kanan"><AlignRight className="w-3.5 h-3.5" /></button>
            <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => onExecFormat('justifyFull')} className="p-1.5 rounded hover:bg-white text-slate-600 hover:text-[#1D4ED8] cursor-pointer" title="Justify"><AlignJustify className="w-3.5 h-3.5" /></button>
          </div>
        </div>
      </div>

      <div className="max-h-[70vh] overflow-y-auto bg-slate-100/90 p-4 sm:p-6 flex justify-center">
        <div className="relative a4-paper-sheet w-full max-w-[210mm] min-h-[297mm] bg-white px-7 py-8 sm:px-11 sm:py-10 shadow-[0_10px_30px_-10px_rgba(15,23,42,0.12)] ring-1 ring-slate-200/90">
          {sertakanKopResmi && (
            <div className="mb-4 select-none pointer-events-none">
              {!kopImgError ? (
                <img
                  src={`${normalizedBaseUrl}kop-kemendikdasmen.png`}
                  alt="Kop Surat Kemendikdasmen"
                  onError={() => setKopImgError(true)}
                  className="w-full h-auto block"
                />
              ) : (
                <div className="flex items-center gap-3 border-b-2 border-slate-800 pb-2.5 text-left">
                  <svg viewBox="0 0 64 64" className="h-12 w-12 shrink-0" aria-hidden="true">
                    <circle cx="32" cy="32" r="29" fill="#0EA5E9" stroke="#0369A1" strokeWidth="2.5" />
                    <path d="M32 14l5 10 11 1.6-8 7.8 1.9 11-9.9-5.2-9.9 5.2 1.9-11-8-7.8 11-1.6z" fill="#FFFFFF" />
                  </svg>
                  <div className="leading-tight">
                    <p className="text-[11px] font-bold uppercase text-slate-900">
                      Kementerian Pendidikan Dasar dan Menengah
                    </p>
                    <p className="text-[10px] font-semibold text-slate-700">
                      Balai Besar Pengembangan Penjaminan Mutu Pendidikan Vokasi Bidang Mesin dan Teknik Industri
                    </p>
                    <p className="text-[9px] text-slate-500">
                      Jalan Pasantren Km. 2, Cibabat, Cimahi Utara, Cimahi, Jawa Barat 40513
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {!kontenHtml.trim() && (
            <div className="pointer-events-none absolute inset-x-10 top-16 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/70 px-6 py-14 text-center font-sans">
              <UploadCloud className="h-8 w-8 text-blue-500 mb-2" />
              <p className="text-sm font-bold text-slate-700">Kertas Template Masih Kosong</p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm">
                Unggah file <strong>.docx</strong> di panel kiri untuk menampilkan isi dokumen asli di sini, atau klik kertas ini untuk mengetik langsung.
              </p>
            </div>
          )}

          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            onInput={(e) => onKontenChange(e.currentTarget.innerHTML)}
            className="relative z-10 outline-none min-h-[220mm]"
          />

          {sertakanKopResmi && (
            <div className="mt-8 select-none pointer-events-none">
              {!footerImgError ? (
                <img
                  src={`${normalizedBaseUrl}footer-bsre.jpg`}
                  alt="Catatan Kaki BSrE"
                  onError={() => setFooterImgError(true)}
                  className="w-full h-auto block"
                />
              ) : (
                <div className="border-t border-slate-300 pt-2 text-[9px] text-slate-500">
                  Dokumen ini telah ditandatangani secara elektronik menggunakan sertifikat elektronik yang diterbitkan oleh Balai Besar Sertifikasi Elektronik (BSrE), BSSN.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface ApprovalTemplateListSectionProps {
  templates: TemplateSuratResmi[];
  onEdit: (tpl: TemplateSuratResmi) => void;
  onDownload: (tpl: TemplateSuratResmi) => Promise<boolean | void>;
  onToggleActive: (id: string) => Promise<void> | void;
  onDelete: (id: string) => Promise<void> | void;
}

export function ApprovalTemplateListSection({
  templates,
  onEdit,
  onDownload,
  onToggleActive,
  onDelete,
}: ApprovalTemplateListSectionProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-[0_6px_24px_-6px_rgba(30,64,175,0.08)] space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <h3 className="text-base font-bold text-slate-800">
          Daftar Template Surat Terkirim ({templates.length})
        </h3>
        <span className="text-xs text-slate-500">
          Template berstatus <strong>Aktif</strong> langsung tampil di akun User (Pegawai).
        </span>
      </div>

      {templates.length === 0 ? (
        <p className="text-xs text-slate-400 py-6 text-center">
          Belum ada template yang dikirim oleh Approval. Unggah file <code>.docx</code> atau edit kertas A4 di atas lalu klik <strong>Kirim Template ke User</strong>.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((tpl) => (
            <div
              key={tpl.id}
              className="rounded-xl border border-slate-100 bg-[#F8FAFD] p-4 flex flex-col justify-between gap-3"
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                      tpl.aktif
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {tpl.aktif ? 'Aktif di User' : 'Nonaktif'}
                  </span>
                  <span className="text-[11px] text-slate-400">{tpl.diperbaruiPada}</span>
                </div>
                <h4 className="font-bold text-sm text-slate-800">{tpl.namaTemplate}</h4>
                {tpl.fileNamaAsli && (
                  <p className="text-[11px] text-[#1D4ED8] font-medium">
                    Sumber File: {tpl.fileNamaAsli}
                  </p>
                )}
                {tpl.deskripsi && (
                  <p className="text-xs text-slate-500 line-clamp-2">{tpl.deskripsi}</p>
                )}
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-slate-200/70">
                <button
                  type="button"
                  onClick={() => onEdit(tpl)}
                  className="flex-1 inline-flex items-center justify-center gap-1 rounded-lg bg-white border border-slate-200 px-2.5 py-1.5 text-xs font-bold text-[#1D4ED8] hover:bg-blue-50 cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" /> Edit
                </button>
                {(tpl.hasFileDocx || tpl.fileDocxDataUrl || tpl.fileNamaAsli) && (
                  <button
                    type="button"
                    onClick={() => void onDownload(tpl)}
                    className="inline-flex items-center justify-center gap-1 rounded-lg bg-white border border-blue-200 px-2.5 py-1.5 text-xs font-bold text-blue-700 hover:bg-blue-50 cursor-pointer"
                    title="Unduh file .docx asli"
                  >
                    <Download className="w-3.5 h-3.5" /> Unduh
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onToggleActive(tpl.id)}
                  className="inline-flex items-center justify-center gap-1 rounded-lg bg-white border border-slate-200 px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 cursor-pointer"
                  title={tpl.aktif ? 'Nonaktifkan' : 'Aktifkan'}
                >
                  <Power className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(tpl.id)}
                  className="inline-flex items-center justify-center gap-1 rounded-lg bg-white border border-rose-200 px-2.5 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50 cursor-pointer"
                  title="Hapus Template"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

