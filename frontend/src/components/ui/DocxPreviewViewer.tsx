import { useEffect, useRef, useState } from 'react';
import { renderAsync } from 'docx-preview';
import { AlertCircle, Loader2 } from 'lucide-react';

interface DocxPreviewViewerProps {
  fileUrl: string;
  fileName?: string;
}

/**
 * Merender berkas .docx secara langsung di browser menggunakan docx-preview
 * agar tata letak, tabel, dan margin dokumen tampil rapi tanpa perlu mengunduh.
 */
export const DocxPreviewViewer = ({ fileUrl, fileName }: DocxPreviewViewerProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [errorDetail, setErrorDetail] = useState('');

  useEffect(() => {
    let cancelled = false;

    const renderDocx = async () => {
      const container = containerRef.current;
      if (!container) return;

      setStatus('loading');
      setErrorDetail('');
      container.innerHTML = '';

      try {
        const res = await fetch(fileUrl);
        if (!res.ok) {
          throw new Error('Berkas tidak dapat dimuat.');
        }
        const blob = await res.blob();
        if (cancelled) return;

        await renderAsync(blob, container, undefined, {
          className: 'docx-preview-page',
          inWrapper: true,
          ignoreWidth: false,
          ignoreHeight: false,
          ignoreFonts: false,
          breakPages: true,
          renderHeaders: true,
          renderFooters: true,
          renderFootnotes: true,
          renderEndnotes: true,
          useBase64URL: true,
        });

        if (!cancelled) {
          setStatus('ready');
        }
      } catch (err) {
        if (!cancelled) {
          setStatus('error');
          setErrorDetail(
            err instanceof Error
              ? err.message
              : 'Format dokumen tidak didukung untuk pratinjau langsung (misal .doc lama).',
          );
        }
      }
    };

    void renderDocx();

    return () => {
      cancelled = true;
    };
  }, [fileUrl]);

  return (
    <div className="relative rounded-xl border border-slate-200 bg-slate-100/80 overflow-hidden">
      {status === 'loading' && (
        <div className="flex flex-col items-center justify-center py-12 text-slate-500 gap-2">
          <Loader2 className="h-6 w-6 animate-spin text-[#5D87FF]" />
          <p className="text-xs font-medium">Memuat pratinjau {fileName || 'dokumen Word'}...</p>
        </div>
      )}

      {status === 'error' && (
        <div className="flex flex-col items-center justify-center py-10 px-6 text-center gap-2">
          <AlertCircle className="h-8 w-8 text-amber-500" />
          <p className="text-sm font-semibold text-slate-800">Pratinjau dokumen tidak tersedia</p>
          <p className="text-xs text-slate-500 max-w-md">
            {errorDetail} Silakan klik <strong>Unduh Berkas</strong> untuk membukanya di Microsoft Word / LibreOffice.
          </p>
        </div>
      )}

      <div
        ref={containerRef}
        className={`max-h-[65vh] overflow-auto p-3 ${status === 'ready' ? 'block' : 'hidden'}`}
      />
    </div>
  );
};

