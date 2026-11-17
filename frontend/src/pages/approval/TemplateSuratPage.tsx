import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { usePenugasan } from '@/context/PenugasanContext';
import type { KategoriTemplateSurat, TemplatePrefillData, TemplateSuratResmi } from '@/types';
import { DEFAULT_STARTER_TEMPLATE_HTML, parseDocxFileToTemplate } from '@/utils/docxImport';
import { MAX_UPLOAD_FILE_BYTES, readFileAsDataUrl } from '@/utils/penugasanHelpers';
import {
  FileText,
  UploadCloud,
  Send,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Sparkles,
  CheckCircle2,
  Trash2,
  Edit3,
  Power,
  Plus,
  AlertTriangle,
  ChevronDown,
  Download,
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

export const TemplateSuratPage = () => {
  const { user } = useAuth();
  const { templates, saveTemplate, deleteTemplate, toggleTemplateActive, downloadTemplateDocx } = usePenugasan();
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [namaTemplate, setNamaTemplate] = useState('');
  const [deskripsi, setDeskripsi] = useState('');
  const [kategoriTemplate, setKategoriTemplate] = useState<KategoriTemplateSurat>('INDIVIDU');
  const [fileNamaAsli, setFileNamaAsli] = useState('');
  const [fileDocxDataUrl, setFileDocxDataUrl] = useState('');
  const [sertakanKopResmi, setSertakanKopResmi] = useState(false);
  const [kontenHtml, setKontenHtml] = useState('');
  const [prefillData, setPrefillData] = useState<TemplatePrefillData>({});
  const [statusFeedback, setStatusFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isParsingDocx, setIsParsingDocx] = useState(false);
  const [isVarMenuOpen, setIsVarMenuOpen] = useState(false);
  const [isPrefillOpen, setIsPrefillOpen] = useState(false);
  const [kopImgError, setKopImgError] = useState(false);
  const [footerImgError, setFooterImgError] = useState(false);

  const normalizedBaseUrl = import.meta.env.BASE_URL.endsWith('/')
    ? import.meta.env.BASE_URL
    : `${import.meta.env.BASE_URL}/`;

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== kontenHtml && !kontenHtml) {
      editorRef.current.innerHTML = '';
    }
  }, [kontenHtml]);

  const syncEditorContent = (nextHtml: string) => {
    setKontenHtml(nextHtml);
    if (editorRef.current) {
      editorRef.current.innerHTML = nextHtml;
    }
  };

  const handleResetToNew = () => {
    setEditingId(null);
    setNamaTemplate('');
    setDeskripsi('');
    setKategoriTemplate('INDIVIDU');
    setFileNamaAsli('');
    setFileDocxDataUrl('');
    setSertakanKopResmi(false);
    setPrefillData({});
    setIsPrefillOpen(false);
    setStatusFeedback(null);
    syncEditorContent('');
  };

  const handleUploadDocx = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (file.size > MAX_UPLOAD_FILE_BYTES) {
      setStatusFeedback({
        type: 'error',
        text: 'Ukuran file .docx melebihi batas maksimal 10 MB.',
      });
      return;
    }

    setStatusFeedback(null);
    setIsParsingDocx(true);
    try {
      const [parsed, docxDataUrl] = await Promise.all([
        parseDocxFileToTemplate(file),
        readFileAsDataUrl(file),
      ]);
      setFileNamaAsli(file.name);
      setFileDocxDataUrl(docxDataUrl);
      if (!namaTemplate.trim()) {
        setNamaTemplate(file.name.replace(/\.docx$/i, '').replace(/[_-]+/g, ' '));
      }
      setSertakanKopResmi(true);
      setPrefillData(parsed.prefillData);
      if (Object.values(parsed.prefillData).some((v) => Boolean(v))) {
        setIsPrefillOpen(true);
      }
      syncEditorContent(DEFAULT_STARTER_TEMPLATE_HTML);
      setStatusFeedback({
        type: 'success',
        text: `File "${file.name}" berhasil dilampirkan untuk diunduh User, dan format surat standar A4 telah dimuat rapi.`,
      });
    } catch (err) {
      setStatusFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'Gagal membaca file .docx.',
      });
    } finally {
      setIsParsingDocx(false);
    }
  };

  const execFormat = (cmd: string) => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    document.execCommand(cmd, false);
    setKontenHtml(editorRef.current.innerHTML);
  };

  const insertTokenAtCursor = (token: string) => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    const ok = document.execCommand('insertText', false, token);
    if (!ok) {
      editorRef.current.innerHTML += ` ${token}`;
    }
    setKontenHtml(editorRef.current.innerHTML);
  };

  const handleSaveAndSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusFeedback(null);

    if (!namaTemplate.trim()) {
      setStatusFeedback({ type: 'error', text: 'Nama template wajib diisi terlebih dahulu.' });
      return;
    }

    const latestHtml = editorRef.current ? editorRef.current.innerHTML : kontenHtml;
    if (!latestHtml.replace(/<[^>]+>/g, '').trim() && !latestHtml.includes('<img')) {
      setStatusFeedback({
        type: 'error',
        text: 'Kertas template masih kosong. Unggah file .docx atau ketik isi surat di kertas A4 terlebih dahulu.',
      });
      return;
    }

    const result = await saveTemplate({
      id: editingId || undefined,
      namaTemplate: namaTemplate.trim(),
      deskripsi: deskripsi.trim() || undefined,
      kategoriTemplate,
      fileNamaAsli: fileNamaAsli || undefined,
      fileDocxDataUrl: fileDocxDataUrl || undefined,
      hasFileDocx: Boolean(fileDocxDataUrl || fileNamaAsli),
      kontenHtml: latestHtml,
      sertakanKopResmi,
      prefillData,
      dibuatOleh: user?.nama || 'Pejabat Approval',
      aktif: true,
    });

    setEditingId(result.data.id);
    setStatusFeedback({
      type: 'success',
      text: result.persistedToDb
        ? `Template "${result.data.namaTemplate}" berhasil disimpan ke database PostgreSQL & aktif untuk seluruh User.`
        : `Template "${result.data.namaTemplate}" aktif untuk User (tersimpan di penyimpanan lokal karena server backend belum aktif).`,
    });
  };

  const handleLoadTemplateForEdit = (tpl: TemplateSuratResmi) => {
    setEditingId(tpl.id);
    setNamaTemplate(tpl.namaTemplate);
    setDeskripsi(tpl.deskripsi || '');
    setKategoriTemplate(tpl.kategoriTemplate);
    setFileNamaAsli(tpl.fileNamaAsli || '');
    setFileDocxDataUrl(tpl.fileDocxDataUrl || '');
    setSertakanKopResmi(tpl.sertakanKopResmi);
    setPrefillData(tpl.prefillData || {});
    setIsPrefillOpen(Boolean(tpl.prefillData && Object.values(tpl.prefillData).some(Boolean)));
    setStatusFeedback(null);
    syncEditorContent(tpl.kontenHtml);
  };

  return (
    <div className="p-2 sm:p-4 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_6px_24px_-6px_rgba(30,64,175,0.08)]">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-[#EEF3FB] text-[#1D4ED8] flex items-center justify-center shrink-0">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">
              Kirim &amp; Kelola Template Surat Tugas
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Unggah file <code>.docx</code> dari Word atau sunting langsung di kertas A4, lalu kirim ke User agar otomatis terisi saat pengajuan.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleResetToNew}
          className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-[#EEF3FB] px-4 py-2 text-xs font-bold text-[#1D4ED8] hover:bg-blue-100 transition cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          Buat Template Baru
        </button>
      </div>

      {statusFeedback && (
        <div
          className={`flex items-center gap-2.5 rounded-2xl border px-4 py-3 text-xs font-semibold ${
            statusFeedback.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
              : 'border-rose-200 bg-rose-50 text-rose-800'
          }`}
        >
          {statusFeedback.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          ) : (
            <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
          )}
          <span>{statusFeedback.text}</span>
        </div>
      )}

      {/* Main Split Workspace: Upload & Settings (Left) + Live A4 Editor (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        <form
          onSubmit={handleSaveAndSend}
          className="lg:col-span-5 bg-white rounded-2xl border border-slate-100 p-5 shadow-[0_6px_24px_-6px_rgba(30,64,175,0.08)] space-y-4"
        >
          {/* Upload .docx Compact Bar */}
          <div className="flex items-center justify-between gap-3 rounded-xl border border-dashed border-blue-200 bg-[#F8FAFD] px-3.5 py-3">
            <input
              ref={fileInputRef}
              type="file"
              accept=".docx"
              onChange={handleUploadDocx}
              className="hidden"
            />
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-[#EEF3FB] text-[#1D4ED8] flex items-center justify-center shrink-0">
                <UploadCloud className="w-4.5 h-4.5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-800 truncate">
                  Impor dari MS Word (.docx)
                </p>
                <p className="text-[11px] text-slate-500 truncate">
                  {fileNamaAsli ? `Dimuat: ${fileNamaAsli}` : 'Ekstrak isi file ke editor kertas A4'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isParsingDocx}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#1D4ED8] hover:bg-[#1E40AF] px-3 py-1.5 text-xs font-semibold text-white shadow-xs transition cursor-pointer disabled:opacity-60 shrink-0"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              {isParsingDocx ? 'Membaca...' : 'Pilih File'}
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Nama Template Surat
              </label>
              <input
                type="text"
                required
                value={namaTemplate}
                onChange={(e) => setNamaTemplate(e.target.value)}
                placeholder="Contoh: Surat Tugas Uji Kompetensi Eksternal"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs sm:text-sm text-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Kategori Format Default
              </label>
              <select
                value={kategoriTemplate}
                onChange={(e) => setKategoriTemplate(e.target.value as KategoriTemplateSurat)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-800 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
              >
                <option value="INDIVIDU">Individu (1 Orang)</option>
                <option value="BERDUA">Berdua (2 Orang)</option>
                <option value="KELOMPOK">Kelompok (Tim)</option>
              </select>
            </div>

            <label className="flex items-center justify-between gap-3 rounded-xl border border-slate-200/80 bg-[#F8FAFD] px-3.5 py-2.5 cursor-pointer">
              <span className="text-xs font-semibold text-slate-700">
                Sertakan Kop Resmi Kemendikdasmen &amp; Footer BSrE
              </span>
              <input
                type="checkbox"
                checked={sertakanKopResmi}
                onChange={(e) => setSertakanKopResmi(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 accent-blue-600 shrink-0"
              />
            </label>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Catatan / Keterangan Template (Opsional)
              </label>
              <textarea
                rows={2}
                value={deskripsi}
                onChange={(e) => setDeskripsi(e.target.value)}
                placeholder="Panduan singkat penggunaan template bagi pegawai..."
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
              />
            </div>
          </div>

          {/* Nilai Bawaan (Collapsible agar panel kiri tetap ringkas & clean) */}
          <div className="rounded-xl border border-slate-200/80 bg-[#F8FAFD] overflow-hidden">
            <button
              type="button"
              onClick={() => setIsPrefillOpen((prev) => !prev)}
              aria-expanded={isPrefillOpen}
              className="w-full flex items-center justify-between gap-2 px-3.5 py-2.5 text-left hover:bg-slate-100/70 transition-colors cursor-pointer"
            >
              <span className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#1D4ED8]" />
                Nilai Bawaan Otomatis (Opsional)
              </span>
              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isPrefillOpen ? 'rotate-180' : ''}`} />
            </button>
            {isPrefillOpen && (
              <div className="px-3.5 pb-3.5 pt-1 space-y-2 border-t border-slate-200/60">
                <p className="text-[11px] text-slate-500">
                  Diisi otomatis bila file membawa data awal; User tetap dapat mengubahnya di form.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={prefillData.nomorSurat || ''}
                    onChange={(e) => setPrefillData({ ...prefillData, nomorSurat: e.target.value })}
                    placeholder="Nomor Surat bawaan"
                    className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs"
                  />
                  <input
                    type="text"
                    value={prefillData.namaPegawai || ''}
                    onChange={(e) => setPrefillData({ ...prefillData, namaPegawai: e.target.value })}
                    placeholder="Nama Pegawai bawaan"
                    className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs"
                  />
                  <input
                    type="text"
                    value={prefillData.perihal || ''}
                    onChange={(e) => setPrefillData({ ...prefillData, perihal: e.target.value })}
                    placeholder="Perihal bawaan"
                    className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs sm:col-span-2"
                  />
                  <input
                    type="text"
                    value={prefillData.lokasiSpesifik || ''}
                    onChange={(e) => setPrefillData({ ...prefillData, lokasiSpesifik: e.target.value })}
                    placeholder="Lokasi bawaan"
                    className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs sm:col-span-2"
                  />
                </div>
              </div>
            )}
          </div>

          <button
            type="submit"
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#1D4ED8] hover:bg-[#1E40AF] px-5 py-2.5 text-sm font-bold text-white shadow-sm transition cursor-pointer"
          >
            <Send className="w-4 h-4" />
            {editingId ? 'Perbarui & Kirim Template ke User' : 'Kirim Template ke User'}
          </button>
        </form>

        {/* Right: Interactive A4 Editor */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-100 shadow-[0_6px_24px_-6px_rgba(30,64,175,0.08)] overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/80 bg-white px-4 py-2.5">
            <span className="text-xs font-bold text-slate-800">
              Editor Template Kertas A4
            </span>

            <div className="flex flex-wrap items-center gap-2">
              {/* Dropdown Variabel Ringkas (menggantikan 12 pill yang menumpuk 3 baris) */}
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
                              insertTokenAtCursor(item.token);
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
                <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => execFormat('bold')} className="p-1.5 rounded hover:bg-white text-slate-600 hover:text-[#1D4ED8] cursor-pointer" title="Bold"><Bold className="w-3.5 h-3.5" /></button>
                <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => execFormat('italic')} className="p-1.5 rounded hover:bg-white text-slate-600 hover:text-[#1D4ED8] cursor-pointer" title="Italic"><Italic className="w-3.5 h-3.5" /></button>
                <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => execFormat('underline')} className="p-1.5 rounded hover:bg-white text-slate-600 hover:text-[#1D4ED8] cursor-pointer" title="Underline"><Underline className="w-3.5 h-3.5" /></button>
                <div className="mx-1 h-4 w-px bg-slate-200" />
                <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => execFormat('justifyLeft')} className="p-1.5 rounded hover:bg-white text-slate-600 hover:text-[#1D4ED8] cursor-pointer" title="Rata Kiri"><AlignLeft className="w-3.5 h-3.5" /></button>
                <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => execFormat('justifyCenter')} className="p-1.5 rounded hover:bg-white text-slate-600 hover:text-[#1D4ED8] cursor-pointer" title="Rata Tengah"><AlignCenter className="w-3.5 h-3.5" /></button>
                <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => execFormat('justifyRight')} className="p-1.5 rounded hover:bg-white text-slate-600 hover:text-[#1D4ED8] cursor-pointer" title="Rata Kanan"><AlignRight className="w-3.5 h-3.5" /></button>
                <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => execFormat('justifyFull')} className="p-1.5 rounded hover:bg-white text-slate-600 hover:text-[#1D4ED8] cursor-pointer" title="Justify"><AlignJustify className="w-3.5 h-3.5" /></button>
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
                onInput={(e) => setKontenHtml(e.currentTarget.innerHTML)}
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
      </div>

      {/* Daftar Template Tersimpan / Terkirim ke User */}
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
                    onClick={() => handleLoadTemplateForEdit(tpl)}
                    className="flex-1 inline-flex items-center justify-center gap-1 rounded-lg bg-white border border-slate-200 px-2.5 py-1.5 text-xs font-bold text-[#1D4ED8] hover:bg-blue-50 cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" /> Edit
                  </button>
                  {(tpl.hasFileDocx || tpl.fileDocxDataUrl || tpl.fileNamaAsli) && (
                    <button
                      type="button"
                      onClick={() => void downloadTemplateDocx(tpl)}
                      className="inline-flex items-center justify-center gap-1 rounded-lg bg-white border border-blue-200 px-2.5 py-1.5 text-xs font-bold text-blue-700 hover:bg-blue-50 cursor-pointer"
                      title="Unduh file .docx asli"
                    >
                      <Download className="w-3.5 h-3.5" /> Unduh
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => toggleTemplateActive(tpl.id)}
                    className="inline-flex items-center justify-center gap-1 rounded-lg bg-white border border-slate-200 px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 cursor-pointer"
                    title={tpl.aktif ? 'Nonaktifkan' : 'Aktifkan'}
                  >
                    <Power className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteTemplate(tpl.id)}
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
    </div>
  );
};

