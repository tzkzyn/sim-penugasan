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
  Sparkles,
  CheckCircle2,
  Plus,
  AlertTriangle,
  ChevronDown,
} from 'lucide-react';
import {
  ApprovalTemplateA4Editor,
  ApprovalTemplateListSection,
} from '@/components/approval/ApprovalTemplateSections';

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
  const [isPrefillOpen, setIsPrefillOpen] = useState(false);

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
        <ApprovalTemplateA4Editor
          editorRef={editorRef}
          kontenHtml={kontenHtml}
          sertakanKopResmi={sertakanKopResmi}
          onKontenChange={setKontenHtml}
          onExecFormat={execFormat}
          onInsertToken={insertTokenAtCursor}
        />
      </div>

      {/* Daftar Template Tersimpan / Terkirim ke User */}
      <ApprovalTemplateListSection
        templates={templates}
        onEdit={handleLoadTemplateForEdit}
        onDownload={downloadTemplateDocx}
        onToggleActive={toggleTemplateActive}
        onDelete={deleteTemplate}
      />
    </div>
  );
};

