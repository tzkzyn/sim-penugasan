import React, { useRef, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { usePenugasan } from '@/context/PenugasanContext';
import type { KategoriTemplateSurat, TemplatePrefillData, TemplateSuratResmi } from '@/types';
import { parseDocxFileToTemplate } from '@/utils/docxImport';
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
} from 'lucide-react';

const DEFAULT_STARTER_TEMPLATE_HTML = `<div style="text-align:center;margin:18px 0 22px 0;">
  <div style="font-size:14pt;font-weight:700;letter-spacing:1px;text-transform:uppercase;">SURAT TUGAS</div>
  <div style="font-size:11pt;margin-top:4px;">Nomor {{NOMOR_SURAT}}</div>
</div>
<div style="text-align:justify;line-height:1.65;margin-bottom:10px;">
  Kepala Balai Besar Pengembangan Penjaminan Mutu Pendidikan Vokasi Bidang Mesin dan Teknik Industri (BBPPMPV BMTI) menugasi
</div>
<div>{{TABEL_PEGAWAI}}</div>
<div style="text-align:justify;line-height:1.65;margin-bottom:12px;">
  sebagai {{PERIHAL}}. Kegiatan akan diselenggarakan pada tanggal {{TANGGAL}} di {{LOKASI}}. {{DASAR_SURAT}}
</div>
<div style="text-align:justify;line-height:1.65;margin-bottom:14px;">
  {{BIAYA}}
</div>
<div style="text-align:justify;line-height:1.65;margin-bottom:28px;">
  Surat tugas ini dibuat untuk dilaksanakan dengan penuh tanggung jawab dan yang bersangkutan diharapkan membuat laporan.
</div>
<table class="spt-layout-table" width="100%" style="width:100%;border-collapse:collapse;margin-top:24px;">
  <tr>
    <td width="58%" style="width:58%;">&nbsp;</td>
    <td width="42%" style="width:42%;text-align:left;line-height:1.5;">
      <div>{{TANGGAL}}</div>
      <div style="margin-top:2px;">Kepala,</div>
      <div style="height:55px;">&nbsp;</div>
      <div style="font-weight:700;">{{NAMA_KEPALA}}</div>
    </td>
  </tr>
</table>`;

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
  const { templates, saveTemplate, deleteTemplate, toggleTemplateActive } = usePenugasan();
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [namaTemplate, setNamaTemplate] = useState('');
  const [deskripsi, setDeskripsi] = useState('');
  const [kategoriTemplate, setKategoriTemplate] = useState<KategoriTemplateSurat>('INDIVIDU');
  const [fileNamaAsli, setFileNamaAsli] = useState('');
  const [sertakanKopResmi, setSertakanKopResmi] = useState(true);
  const [kontenHtml, setKontenHtml] = useState(DEFAULT_STARTER_TEMPLATE_HTML);
  const [prefillData, setPrefillData] = useState<TemplatePrefillData>({});
  const [statusFeedback, setStatusFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isParsingDocx, setIsParsingDocx] = useState(false);

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
    setSertakanKopResmi(true);
    setPrefillData({});
    setStatusFeedback(null);
    syncEditorContent(DEFAULT_STARTER_TEMPLATE_HTML);
  };

  const handleUploadDocx = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setStatusFeedback(null);
    setIsParsingDocx(true);
    try {
      const parsed = await parseDocxFileToTemplate(file);
      setFileNamaAsli(file.name);
      if (!namaTemplate.trim()) {
        setNamaTemplate(file.name.replace(/\.docx$/i, '').replace(/[_-]+/g, ' '));
      }
      setPrefillData(parsed.prefillData);
      syncEditorContent(parsed.kontenHtml);
      setStatusFeedback({
        type: 'success',
        text: `Berhasil membaca isi file "${file.name}". Anda dapat mengedit teks di kertas A4 sebelum mengirim ke User.`,
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

  const handleSaveAndSend = (e: React.FormEvent) => {
    e.preventDefault();
    setStatusFeedback(null);

    if (!namaTemplate.trim()) {
      setStatusFeedback({ type: 'error', text: 'Nama template wajib diisi terlebih dahulu.' });
      return;
    }

    const latestHtml = editorRef.current ? editorRef.current.innerHTML : kontenHtml;
    const saved = saveTemplate({
      id: editingId || undefined,
      namaTemplate: namaTemplate.trim(),
      deskripsi: deskripsi.trim() || undefined,
      kategoriTemplate,
      fileNamaAsli: fileNamaAsli || undefined,
      kontenHtml: latestHtml,
      sertakanKopResmi,
      prefillData,
      dibuatOleh: user?.nama || 'Pejabat Approval',
      aktif: true,
    });

    setEditingId(saved.id);
    setStatusFeedback({
      type: 'success',
      text: `Template "${saved.namaTemplate}" berhasil dikirim & aktif untuk seluruh akun User (Pegawai).`,
    });
  };

  const handleLoadTemplateForEdit = (tpl: TemplateSuratResmi) => {
    setEditingId(tpl.id);
    setNamaTemplate(tpl.namaTemplate);
    setDeskripsi(tpl.deskripsi || '');
    setKategoriTemplate(tpl.kategoriTemplate);
    setFileNamaAsli(tpl.fileNamaAsli || '');
    setSertakanKopResmi(tpl.sertakanKopResmi);
    setPrefillData(tpl.prefillData || {});
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
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <form
          onSubmit={handleSaveAndSend}
          className="lg:col-span-5 bg-white rounded-2xl border border-slate-100 p-5 shadow-[0_6px_24px_-6px_rgba(30,64,175,0.08)] space-y-4"
        >
          {/* Upload .docx Box */}
          <div className="rounded-2xl border-2 border-dashed border-blue-200 bg-[#F8FAFD] p-4 text-center space-y-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".docx"
              onChange={handleUploadDocx}
              className="hidden"
            />
            <div className="mx-auto w-10 h-10 rounded-xl bg-[#EEF3FB] text-[#1D4ED8] flex items-center justify-center">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800">
                Unggah File Template MS Word (.docx)
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Isi file Word akan diekstrak ke kertas A4 di sebelah kanan agar bisa Anda edit dulu sebelum dikirim ke User.
              </p>
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isParsingDocx}
              className="inline-flex items-center gap-2 rounded-full bg-[#1D4ED8] hover:bg-[#1E40AF] px-4 py-2 text-xs font-bold text-white shadow-sm transition cursor-pointer disabled:opacity-60"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              {isParsingDocx ? 'Membaca .docx...' : 'Pilih File .docx'}
            </button>
            {fileNamaAsli && (
              <p className="text-[11px] font-semibold text-emerald-700">
                File dimuat: {fileNamaAsli}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Nama Template Surat
            </label>
            <input
              type="text"
              required
              value={namaTemplate}
              onChange={(e) => setNamaTemplate(e.target.value)}
              placeholder="Contoh: Surat Tugas Uji Kompetensi Eksternal"
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Kategori Format Default
              </label>
              <select
                value={kategoriTemplate}
                onChange={(e) => setKategoriTemplate(e.target.value as KategoriTemplateSurat)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-800 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="INDIVIDU">Individu (1 Orang)</option>
                <option value="BERDUA">Berdua (2 Orang)</option>
                <option value="KELOMPOK">Kelompok (Tim)</option>
              </select>
            </div>
            <div className="flex items-end pb-1">
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={sertakanKopResmi}
                  onChange={(e) => setSertakanKopResmi(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 accent-blue-600"
                />
                Sertakan Kop Resmi &amp; Footer BSrE
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Catatan / Keterangan Template (Opsional)
            </label>
            <textarea
              rows={2}
              value={deskripsi}
              onChange={(e) => setDeskripsi(e.target.value)}
              placeholder="Panduan singkat penggunaan template bagi pegawai..."
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          {/* Data Bawaan / Terdeteksi dari File */}
          <div className="rounded-xl border border-slate-100 bg-[#F8FAFD] p-3.5 space-y-2.5">
            <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#1D4ED8]" />
              Nilai Bawaan Template (Otomatis Terisi &amp; Dapat Diubah User)
            </p>
            <p className="text-[11px] text-slate-500">
              Jika file sudah memuat nama pegawai, nomor, atau perihal tertentu, nilai di bawah akan tampil langsung di User dan ikut ter-update saat User mengganti inputannya:
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
                placeholder="Nama Pegawai bawaan (jika ada)"
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

          <button
            type="submit"
            className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-[#1D4ED8] hover:bg-[#1E40AF] px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-blue-600/20 transition cursor-pointer"
          >
            <Send className="w-4 h-4" />
            {editingId ? 'Perbarui & Kirim Template ke User' : 'Kirim Template ke User'}
          </button>
        </form>

        {/* Right: Interactive A4 Editor */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-100 shadow-[0_6px_24px_-6px_rgba(30,64,175,0.08)] overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 bg-[#F8FAFD] px-4 py-2.5">
            <span className="text-xs font-bold text-slate-700">
              Editor Template Kertas A4 (Bisa Diedit Langsung)
            </span>
            <div className="flex items-center gap-0.5 rounded-lg border border-slate-200 bg-white p-0.5">
              <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => execFormat('bold')} className="p-1.5 rounded hover:bg-slate-100 text-slate-700 cursor-pointer" title="Bold"><Bold className="w-3.5 h-3.5" /></button>
              <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => execFormat('italic')} className="p-1.5 rounded hover:bg-slate-100 text-slate-700 cursor-pointer" title="Italic"><Italic className="w-3.5 h-3.5" /></button>
              <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => execFormat('underline')} className="p-1.5 rounded hover:bg-slate-100 text-slate-700 cursor-pointer" title="Underline"><Underline className="w-3.5 h-3.5" /></button>
              <div className="mx-1 h-4 w-px bg-slate-200" />
              <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => execFormat('justifyLeft')} className="p-1.5 rounded hover:bg-slate-100 text-slate-700 cursor-pointer" title="Rata Kiri"><AlignLeft className="w-3.5 h-3.5" /></button>
              <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => execFormat('justifyCenter')} className="p-1.5 rounded hover:bg-slate-100 text-slate-700 cursor-pointer" title="Rata Tengah"><AlignCenter className="w-3.5 h-3.5" /></button>
              <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => execFormat('justifyRight')} className="p-1.5 rounded hover:bg-slate-100 text-slate-700 cursor-pointer" title="Rata Kanan"><AlignRight className="w-3.5 h-3.5" /></button>
              <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => execFormat('justifyFull')} className="p-1.5 rounded hover:bg-slate-100 text-slate-700 cursor-pointer" title="Justify"><AlignJustify className="w-3.5 h-3.5" /></button>
            </div>
          </div>

          {/* Variabel Otomatis Bar */}
          <div className="border-b border-slate-100 bg-blue-50/40 px-4 py-2 flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-bold text-[#1E40AF] mr-1">Sisipkan Variabel Otomatis:</span>
            {VARIABLE_TOKENS.map((item) => (
              <button
                key={item.token}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => insertTokenAtCursor(item.token)}
                className="rounded-full border border-blue-200 bg-white px-2.5 py-0.5 text-[11px] font-semibold text-[#1D4ED8] hover:bg-blue-100 transition cursor-pointer"
                title={`Sisipkan ${item.token}`}
              >
                + {item.label}
              </button>
            ))}
          </div>

          <div className="max-h-[70vh] overflow-y-auto bg-slate-200/70 p-4 sm:p-6 flex justify-center">
            <div className="a4-paper-sheet w-full max-w-[210mm] min-h-[297mm] bg-white px-8 py-9 sm:px-12 sm:py-11 shadow-xl border border-slate-300">
              {sertakanKopResmi && (
                <div className="mb-4 select-none pointer-events-none">
                  <img
                    src={`${import.meta.env.BASE_URL}kop-kemendikdasmen.png`}
                    alt="Kop Surat Kemendikdasmen"
                    className="w-full h-auto block"
                  />
                </div>
              )}

              <div
                ref={editorRef}
                contentEditable
                suppressContentEditableWarning
                onInput={(e) => setKontenHtml(e.currentTarget.innerHTML)}
                dangerouslySetInnerHTML={{ __html: DEFAULT_STARTER_TEMPLATE_HTML }}
                className="outline-none min-h-[160mm]"
              />

              {sertakanKopResmi && (
                <div className="mt-8 select-none pointer-events-none">
                  <img
                    src={`${import.meta.env.BASE_URL}footer-bsre.jpg`}
                    alt="Catatan Kaki BSrE"
                    className="w-full h-auto block"
                  />
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

