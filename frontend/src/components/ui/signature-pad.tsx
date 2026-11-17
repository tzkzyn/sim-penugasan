"use client";

import * as React from "react";
import {
  inkOnScreen,
  readStoredSignatures,
  relLuminance,
  strokePath,
  strokesToPng,
  strokesToSvg,
  toRgb,
  writeStoredSignatures,
  type Pt,
  type Stroke,
} from "@/utils/signaturePadHelpers";

export type { Stroke };
import {
  BookmarkCheck,
  Check,
  ChevronDown,
  Eraser,
  ImageUp,
  PenLine,
  RotateCcw,
  Trash2,
  Type as TypeIcon,
  Undo2,
  X,
} from "lucide-react";

/* ==========================================================================
   SignaturePad (Tanda Tangan Digital)

   Tiga cara menandatangani dokumen: gambar langsung, ketik dengan gaya skrip,
   atau unggah gambar/foto tanda tangan (dengan penghapusan latar kertas putih
   otomatis menjadi PNG transparan), serta daftar tanda tangan tersimpan.
   ========================================================================== */

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

/** Sudut membulat halus bergaya iOS, otomatis fallback ke radius standar. */
const SQUIRCLE = "[corner-shape:squircle]";

const FONT_STACK =
  '"Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';

const DEFAULT_STORAGE_KEY = "sim_penugasan_saved_signatures_v1";

/* --------------------------------------------------------------- types -- */

export type SignatureMethod = "draw" | "type" | "upload" | "saved";

export interface SignatureResult {
  /** Tab yang menghasilkan tanda tangan. */
  method: SignatureMethod;
  /** PNG transparan yang sudah dipotong rapi (2x retina). */
  png: string;
  /** Format vektor (tersedia untuk metode gambar & ketik). */
  svg?: string;
  /** Nama yang diketik (untuk metode ketik / tersimpan). */
  name?: string;
  /** Warna tinta CSS yang digunakan. */
  color: string;
  /** Waktu tanda tangan disetujui. */
  signedAt: Date;
}

/** Tanda tangan yang disimpan untuk digunakan ulang satu klik. */
export interface SavedSignature {
  id: string;
  /** PNG transparan tanda tangan. */
  png: string;
  /** Format vektor jika tersedia. */
  svg?: string;
  /** Label di bawah tanda tangan, misalnya "Tanda Tangan Lengkap". */
  label?: string;
  /** Nama penandatangan. */
  name?: string;
}

export interface Typeface {
  /** Nama jenis huruf pada pemilih. */
  name: string;
  /** Nilai CSS font-family. */
  family: string;
}

export interface Ink {
  name: string;
  value: string;
}

export interface SignaturePadProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "onSelect"> {
  /** Judul panel. */
  title?: string;
  /** Mengisi awal nama pada tab Ketik dan label kartu TTD. */
  signerName?: string;
  /** Teks pernyataan persetujuan di bawah area tanda tangan. */
  consent?: string;
  /** Tab yang dibuka pertama kali. */
  defaultMethod?: SignatureMethod;
  /** Daftar huruf skrip yang ditawarkan di tab Ketik. */
  typefaces?: Typeface[];
  /** Pilihan warna tinta pada tab Gambar & Ketik. */
  inks?: Ink[];
  /** Daftar tanda tangan tersimpan tambahan dari induk. */
  saved?: SavedSignature[];
  /** Dipanggil saat pengguna menyimpan tanda tangan baru. */
  onSaveSignature?: (signature: SavedSignature) => void;
  /** Dipanggil saat pengguna menghapus tanda tangan tersimpan. */
  onDeleteSignature?: (id: string) => void;
  /** Muat Google Fonts untuk jenis huruf tanda tangan skrip. */
  loadFonts?: boolean;
  /** Dipanggil ketika pengguna menyetujui tanda tangan. */
  onAccept?: (result: SignatureResult) => void;
  /** Dipanggil ketika panel ditutup / dibatalkan. */
  onCancel?: () => void;
  /** Tampilkan kartu status selesai setelah tanda tangan disetujui. */
  showSignedState?: boolean;
  /** Key penyimpanan localStorage per akun agar TTD tersimpan tidak bercampur antar role/akun. */
  storageKey?: string;
}

/* ------------------------------------------------------------ defaults -- */

const DEFAULT_TYPEFACES: Typeface[] = [
  { name: "Caveat", family: '"Caveat", cursive' },
  { name: "Dancing Script", family: '"Dancing Script", cursive' },
  { name: "Great Vibes", family: '"Great Vibes", cursive' },
  { name: "Sacramento", family: '"Sacramento", cursive' },
  { name: "Homemade Apple", family: '"Homemade Apple", cursive' },
];

const FONT_HREF =
  "https://fonts.googleapis.com/css2?family=Caveat:wght@600&family=Dancing+Script:wght@600&family=Great+Vibes&family=Sacramento&family=Homemade+Apple&display=swap";

const DEFAULT_INKS: Ink[] = [
  { name: "Hitam Pekat", value: "#171717" },
  { name: "Biru Dinas", value: "#1d4ed8" },
  { name: "Merah", value: "#b91c1c" },
];

const DEFAULT_CONSENT =
  "Dengan membubuhkan tanda tangan elektronik ini pada dokumen Surat Perintah Tugas / Nota Dinas, saya menyatakan bahwa tanda tangan digital ini sah dan berlaku sesuai ketentuan kedinasan.";

function useSigningFonts(enabled: boolean) {
  React.useEffect(() => {
    if (!enabled || typeof document === "undefined") return;
    if (document.querySelector('link[data-signature-faces="true"]')) return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = FONT_HREF;
    link.setAttribute("data-signature-faces", "true");
    document.head.appendChild(link);
  }, [enabled]);
}

function useReducedMotionPreference(): boolean {
  const [reduceMotion, setReduceMotion] = React.useState<boolean>(() => {
    if (typeof window === "undefined" || !window.matchMedia) return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  });

  React.useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = (e: MediaQueryListEvent) => setReduceMotion(e.matches);
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, []);

  return reduceMotion;
}

/* ---------------------------------------------------------------- theme -- */

function useOnDark(ref: React.RefObject<HTMLElement | null>) {
  const [dark, setDark] = React.useState(false);

  React.useEffect(() => {
    const read = () => {
      const el = ref.current;
      if (!el) return;
      const rgb = toRgb(getComputedStyle(el).backgroundColor);
      if (rgb) setDark(relLuminance(rgb) < 0.5);
    };
    const rafId = window.requestAnimationFrame(read);
    const mo = new MutationObserver(read);
    mo.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "data-theme"],
    });
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    mq.addEventListener?.("change", read);
    return () => {
      window.cancelAnimationFrame(rafId);
      mo.disconnect();
      mq.removeEventListener?.("change", read);
    };
  }, [ref]);

  return dark;
}

/* ============================================================ draw board == */

function DrawBoard({
  strokes,
  setStrokes,
  color,
  onDark,
  disabled,
}: {
  strokes: Stroke[];
  setStrokes: (updater: (prev: Stroke[]) => Stroke[]) => void;
  color: string;
  onDark: boolean;
  disabled?: boolean;
}) {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const liveRef = React.useRef<Stroke | null>(null);
  const lastRef = React.useRef<{ x: number; y: number; t: number; p: number } | null>(null);
  const [drawing, setDrawing] = React.useState(false);

  const SIZE = 6;

  const paint = React.useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const dpr = window.devicePixelRatio || 1;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
    const all = liveRef.current ? [...strokes, liveRef.current] : strokes;
    for (const s of all) {
      ctx.fillStyle = inkOnScreen(s.color, onDark);
      ctx.fill(new Path2D(strokePath(s)));
    }
  }, [strokes, onDark]);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const fit = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
      paint();
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(canvas);
    return () => ro.disconnect();
  }, [paint]);

  React.useEffect(paint, [paint]);

  const point = (e: React.PointerEvent<HTMLCanvasElement>): Pt => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    let p: number;
    const now = performance.now();
    const last = lastRef.current;
    if (e.pointerType === "pen" && e.pressure > 0 && e.pressure !== 0.5) {
      p = e.pressure;
    } else if (last) {
      const dt = Math.max(1, now - last.t);
      const speed = Math.hypot(x - last.x, y - last.y) / dt;
      const target = Math.max(0.28, Math.min(1, 1 - speed / 2.4));
      p = last.p + (target - last.p) * 0.45;
    } else {
      p = 0.65;
    }
    lastRef.current = { x, y, t: now, p };
    return { x, y, p };
  };

  const onDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (disabled) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    lastRef.current = null;
    liveRef.current = { points: [point(e)], color, size: SIZE };
    setDrawing(true);
    paint();
  };

  const onMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const live = liveRef.current;
    if (!live) return;
    const pt = point(e);
    const prev = live.points[live.points.length - 1];
    if (Math.hypot(pt.x - prev.x, pt.y - prev.y) < 1.1) return;
    live.points.push(pt);
    paint();
  };

  const end = () => {
    const live = liveRef.current;
    liveRef.current = null;
    lastRef.current = null;
    setDrawing(false);
    if (live && live.points.length) setStrokes((s) => [...s, live]);
  };

  const empty = strokes.length === 0 && !drawing;

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={end}
        onPointerCancel={end}
        role="img"
        aria-label="Area gambar tanda tangan"
        className={cn(
          "block h-[196px] w-full touch-none",
          disabled ? "cursor-default" : "cursor-crosshair",
        )}
      />
      <div className="pointer-events-none absolute inset-x-8 bottom-[52px] select-none">
        <div className="h-px w-full bg-black/[0.12] dark:bg-white/20" />
        <p
          aria-hidden={!empty}
          className={cn(
            "m-0 mt-2 text-center text-[12.5px] text-neutral-400 transition-opacity duration-150 dark:text-neutral-500",
            empty ? "opacity-100" : "opacity-0",
          )}
        >
          Goreskan tanda tangan Anda di atas garis ini
        </p>
      </div>
    </div>
  );
}

/* ============================================================= typeface == */

function useLevelledSizes(faces: Typeface[], capHeight: number) {
  const [sizes, setSizes] = React.useState<Record<string, number>>({});

  React.useEffect(() => {
    if (typeof document === "undefined") return;
    let cancelled = false;

    const measure = () => {
      if (cancelled) return;
      const ctx = document.createElement("canvas").getContext("2d");
      if (!ctx) return;
      const next: Record<string, number> = {};
      for (const face of faces) {
        ctx.font = `100px ${face.family}`;
        const x = ctx.measureText("x").actualBoundingBoxAscent || 45;
        next[face.name] = Math.round(Math.max(14, Math.min(26, (capHeight / x) * 100)));
      }
      if (!cancelled) setSizes(next);
    };

    const rafId = window.requestAnimationFrame(measure);
    if ("fonts" in document) {
      document.fonts.ready.then(() => {
        if (!cancelled) measure();
      });
    }
    return () => {
      cancelled = true;
      window.cancelAnimationFrame(rafId);
    };
  }, [faces, capHeight]);

  return sizes;
}

function TypefacePicker({
  faces,
  value,
  onChange,
}: {
  faces: Typeface[];
  value: Typeface;
  onChange: (t: Typeface) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const boxRef = React.useRef<HTMLDivElement | null>(null);
  const sizes = useLevelledSizes(faces, 8);

  React.useEffect(() => {
    if (!open) return;
    const away = (e: MouseEvent) => {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", away);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", away);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);

  return (
    <div ref={boxRef} className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex h-8 items-center gap-1.5 rounded-[9px] px-2.5 text-[12.5px] font-medium cursor-pointer",
          "text-neutral-600 transition-colors hover:bg-black/[0.05] hover:text-neutral-900",
          "dark:text-neutral-300 dark:hover:bg-white/[0.08] dark:hover:text-neutral-50",
          open && "bg-black/[0.05] dark:bg-white/[0.08]",
          SQUIRCLE,
        )}
      >
        <span
          style={{
            fontFamily: value.family,
            fontSize: Math.round((sizes[value.name] ?? 20) * 0.78),
          }}
          className="leading-none"
        >
          {value.name}
        </span>
        <span className={cn("flex transition-transform duration-150", open && "rotate-180")}>
          <ChevronDown aria-hidden className="h-3.5 w-3.5" />
        </span>
      </button>

      {open && (
        <ul
          role="listbox"
          className={cn(
            "absolute left-0 top-[calc(100%+6px)] z-20 m-0 flex w-[212px] list-none flex-col gap-[2px] overflow-hidden p-1",
            "rounded-[12px] border border-black/[0.07] bg-white shadow-[0_16px_36px_-14px_rgb(0_0_0/0.28)]",
            "animate-in fade-in-0 zoom-in-95 duration-150",
            "dark:border-white/[0.09] dark:bg-neutral-900",
            SQUIRCLE,
          )}
        >
          {faces.map((f) => {
            const active = f.name === value.name;
            return (
              <li key={f.name}>
                <button
                  type="button"
                  role="option"
                  aria-selected={active}
                  onClick={() => {
                    onChange(f);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex h-[34px] w-full items-center justify-between gap-2 rounded-[8px] px-2.5 text-left cursor-pointer",
                    "transition-colors hover:bg-black/[0.05] dark:hover:bg-white/[0.07]",
                    active && "bg-black/[0.05] dark:bg-white/[0.07]",
                    SQUIRCLE,
                  )}
                >
                  <span
                    style={{ fontFamily: f.family, fontSize: sizes[f.name] ?? 18 }}
                    className="truncate leading-none text-neutral-800 dark:text-neutral-100"
                  >
                    {f.name}
                  </span>
                  {active && (
                    <Check aria-hidden className="h-3.5 w-3.5 shrink-0 text-neutral-500" />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

/* ================================================================== type == */

function fitText(text: string, family: string, maxWidth: number, maxHeight: number, cap = 44) {
  const fallback = { size: cap, ascent: cap * 0.8, descent: cap * 0.2 };
  if (!text.trim() || typeof document === "undefined") return fallback;
  const ctx = document.createElement("canvas").getContext("2d");
  if (!ctx) return fallback;
  ctx.font = `100px ${family}`;
  const m = ctx.measureText(text);
  const w = m.width || 1;
  const ascent = m.actualBoundingBoxAscent || 80;
  const descent = m.actualBoundingBoxDescent || 20;
  const size = Math.max(16, Math.min(cap, (maxWidth / w) * 100, (maxHeight / (ascent + descent)) * 100));
  return { size, ascent: (ascent * size) / 100, descent: (descent * size) / 100 };
}

function TypeBoard({
  value,
  onChange,
  face,
  color,
  onDark,
  reduceMotion,
}: {
  value: string;
  onChange: (v: string) => void;
  face: Typeface;
  color: string;
  onDark: boolean;
  reduceMotion: boolean;
}) {
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const lineRef = React.useRef<HTMLDivElement | null>(null);
  const [fit, setFit] = React.useState(() => ({ size: 44, ascent: 35, descent: 9 }));
  const [focused, setFocused] = React.useState(false);

  const BOX = 124;

  React.useEffect(() => {
    const el = lineRef.current;
    if (!el) return;
    let cancelled = false;
    const measure = () => {
      if (!cancelled) {
        setFit(fitText(value, face.family, el.clientWidth - 10, BOX - 12));
      }
    };
    const rafId = window.requestAnimationFrame(measure);
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    if (typeof document !== "undefined" && "fonts" in document) {
      document.fonts.ready.then(() => {
        if (!cancelled) measure();
      });
    }
    return () => {
      cancelled = true;
      window.cancelAnimationFrame(rafId);
      ro.disconnect();
    };
  }, [value, face.family]);

  return (
    <div
      className="relative h-[196px] cursor-text px-8"
      onClick={() => inputRef.current?.focus()}
    >
      <div className="absolute inset-x-8 bottom-[52px]">
        <div
          ref={lineRef}
          style={{ height: BOX }}
          className="flex items-end justify-center"
        >
          <span
            style={{
              fontFamily: face.family,
              color: inkOnScreen(color, onDark),
              fontSize: fit.size,
              paddingBottom: Math.round(fit.descent),
            }}
            className="block whitespace-nowrap leading-none"
          >
            {value}
          </span>
          {focused && (
            <span
              aria-hidden
              style={{ height: Math.max(18, fit.ascent), marginBottom: Math.round(fit.descent) }}
              className={cn(
                "ml-[3px] w-px shrink-0 bg-neutral-400 dark:bg-neutral-500",
                !reduceMotion && "animate-pulse",
              )}
            />
          )}
        </div>
        <div className="h-px w-full bg-black/[0.12] dark:bg-white/20" />
        {!value && (
          <p className="pointer-events-none m-0 mt-2 text-center text-[12.5px] text-neutral-400 dark:text-neutral-500">
            Ketik nama lengkap Anda
          </p>
        )}
      </div>

      <input
        ref={inputRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        aria-label="Ketik tanda tangan Anda"
        maxLength={40}
        style={{ height: BOX }}
        className="absolute inset-x-8 bottom-[52px] w-auto bg-transparent text-center text-[15px] text-transparent caret-transparent outline-none"
      />
    </div>
  );
}

/* ================================================================ upload == */

async function cleanUpload(file: File): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("Gambar gagal dibaca"));
      el.src = url;
    });

    const scale = Math.min(1, 1400 / Math.max(img.width, img.height));
    const w = Math.max(1, Math.round(img.width * scale));
    const h = Math.max(1, Math.round(img.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) throw new Error("Canvas tidak tersedia");
    ctx.drawImage(img, 0, 0, w, h);

    const data = ctx.getImageData(0, 0, w, h);
    const px = data.data;
    let x0 = w;
    let y0 = h;
    let x1 = -1;
    let y1 = -1;

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4;
        const lum = 0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2];
        const alpha = Math.max(0, Math.min(255, (245 - lum) * 1.9));
        px[i + 3] = Math.min(px[i + 3], alpha);
        if (alpha > 24) {
          if (x < x0) x0 = x;
          if (y < y0) y0 = y;
          if (x > x1) x1 = x;
          if (y > y1) y1 = y;
        }
      }
    }
    ctx.putImageData(data, 0, 0);

    if (x1 < 0) return canvas.toDataURL("image/png");

    const pad = 6;
    x0 = Math.max(0, x0 - pad);
    y0 = Math.max(0, y0 - pad);
    x1 = Math.min(w - 1, x1 + pad);
    y1 = Math.min(h - 1, y1 + pad);

    const out = document.createElement("canvas");
    out.width = x1 - x0 + 1;
    out.height = y1 - y0 + 1;
    out.getContext("2d")!.drawImage(canvas, x0, y0, out.width, out.height, 0, 0, out.width, out.height);
    return out.toDataURL("image/png");
  } finally {
    URL.revokeObjectURL(url);
  }
}

const ALLOWED_UPLOAD_MIME_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
]);

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5 MB

function UploadBoard({
  image,
  setImage,
  error,
  setError,
}: {
  image: string | null;
  setImage: (v: string | null) => void;
  error: string | null;
  setError: (v: string | null) => void;
}) {
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const [over, setOver] = React.useState(false);
  const [busy, setBusy] = React.useState(false);

  const take = async (file?: File | null) => {
    if (!file) return;
    if (!ALLOWED_UPLOAD_MIME_TYPES.has(file.type.toLowerCase())) {
      setError("Format gambar harus PNG, JPG, atau WEBP (bukan SVG/berkas lain).");
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      setError("Ukuran gambar maksimal 5 MB.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      setImage(await cleanUpload(file));
    } catch {
      setError("Gambar gagal dibaca atau format tidak didukung.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex h-[196px] items-center justify-center px-6">
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="sr-only"
        onChange={(e) => take(e.target.files?.[0])}
      />

      {image ? (
        <div className="flex w-full flex-col items-center gap-2">
          <img
            src={image}
            alt="Tanda tangan yang diunggah"
            className="max-h-[118px] max-w-full object-contain dark:invert"
          />
          <div className="flex items-center gap-1.5">
            <GhostButton onClick={() => inputRef.current?.click()} icon={ImageUp}>
              Ganti
            </GhostButton>
            <GhostButton onClick={() => setImage(null)} icon={Trash2}>
              Hapus
            </GhostButton>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setOver(true);
          }}
          onDragLeave={() => setOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setOver(false);
            take(e.dataTransfer.files?.[0]);
          }}
          className={cn(
            "flex h-[156px] w-full flex-col items-center justify-center gap-2 rounded-[14px] border border-dashed cursor-pointer",
            "transition-colors duration-150",
            over
              ? "border-neutral-400 bg-black/[0.04] dark:border-white/30 dark:bg-white/[0.06]"
              : "border-neutral-300 hover:bg-black/[0.02] dark:border-white/15 dark:hover:bg-white/[0.03]",
            SQUIRCLE,
          )}
        >
          <span className={cn("flex transition-transform duration-150", over && "-translate-y-0.5")}>
            <ImageUp aria-hidden className="h-5 w-5 text-neutral-400 dark:text-neutral-500" />
          </span>
          <span className="text-[13px] font-medium text-neutral-700 dark:text-neutral-200">
            {busy ? "Memproses gambar…" : "Jatuhkan gambar TTD di sini, atau klik untuk memilih"}
          </span>
          <span className="text-[11.5px] text-neutral-400 dark:text-neutral-500">
            PNG atau JPG. Latar kertas putih otomatis dihapus agar transparan.
          </span>
          {error && <span className="text-[11.5px] text-rose-600 dark:text-rose-400">{error}</span>}
        </button>
      )}
    </div>
  );
}

/* ================================================================= saved == */

function SavedBoard({
  saved,
  selected,
  onSelect,
  onDelete,
  onDark,
}: {
  saved: SavedSignature[];
  selected: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onDark: boolean;
}) {
  if (!saved.length) {
    return (
      <div className="flex h-[196px] flex-col items-center justify-center gap-1.5 px-8 text-center">
        <BookmarkCheck aria-hidden className="h-5 w-5 text-neutral-400 dark:text-neutral-500" />
        <p className="m-0 text-[13px] font-medium text-neutral-700 dark:text-neutral-200">
          Belum ada tanda tangan tersimpan
        </p>
        <p className="m-0 text-[11.5px] text-neutral-400 dark:text-neutral-500">
          Gambar, ketik, atau unggah tanda tangan terlebih dahulu, lalu tekan Simpan TTD.
        </p>
      </div>
    );
  }

  return (
    <div className="h-[196px] overflow-y-auto p-3">
      <div className="grid grid-cols-2 gap-2">
        {saved.map((sig) => {
          const active = sig.id === selected;
          return (
            <button
              key={sig.id}
              type="button"
              aria-pressed={active}
              onClick={() => onSelect(sig.id)}
              className={cn(
                "group relative flex h-[84px] flex-col items-center justify-center gap-1 rounded-[12px] border px-3 cursor-pointer",
                "transition-colors duration-150",
                active
                  ? "border-neutral-900 bg-white dark:border-neutral-100 dark:bg-white/[0.08]"
                  : "border-black/[0.08] bg-white hover:border-black/20 dark:border-white/[0.1] dark:bg-white/[0.03] dark:hover:border-white/25",
                SQUIRCLE,
              )}
            >
              <img
                src={sig.png}
                alt={sig.label ?? "Tanda tangan tersimpan"}
                className={cn("max-h-[44px] max-w-full object-contain", onDark && "invert")}
              />
              <span className="max-w-full truncate text-[11px] text-neutral-500 dark:text-neutral-400">
                {sig.label ?? "Tanda Tangan"}
              </span>
              {active && (
                <span className="animate-in zoom-in-75 duration-150 absolute right-1.5 top-1.5 grid h-4 w-4 place-items-center rounded-full bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900">
                  <Check aria-hidden className="h-2.5 w-2.5" strokeWidth={3.5} />
                </span>
              )}

              <span
                role="button"
                tabIndex={0}
                aria-label={`Hapus ${sig.label ?? "tanda tangan"}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(sig.id);
                }}
                onKeyDown={(e) => {
                  if (e.key !== "Enter" && e.key !== " ") return;
                  e.preventDefault();
                  e.stopPropagation();
                  onDelete(sig.id);
                }}
                className={cn(
                  "absolute left-1.5 top-1.5 grid h-[22px] w-[22px] place-items-center rounded-[7px]",
                  "text-neutral-400 transition-colors duration-150",
                  "hover:bg-black/[0.06] hover:text-neutral-800",
                  "dark:text-neutral-500 dark:hover:bg-white/[0.1] dark:hover:text-neutral-100",
                  SQUIRCLE,
                )}
              >
                <Trash2 aria-hidden className="h-3.5 w-3.5" />
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ================================================================ pieces == */

function GhostButton({
  onClick,
  icon: Icon,
  children,
  disabled,
}: {
  onClick?: () => void;
  icon?: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex h-8 items-center gap-1.5 rounded-[9px] px-2.5 text-[12.5px] font-medium cursor-pointer",
        "text-neutral-600 transition-colors hover:bg-black/[0.05] hover:text-neutral-900",
        "dark:text-neutral-300 dark:hover:bg-white/[0.08] dark:hover:text-neutral-50",
        "disabled:pointer-events-none disabled:opacity-40",
        SQUIRCLE,
      )}
    >
      {Icon && <Icon aria-hidden className="h-3.5 w-3.5" />}
      {children}
    </button>
  );
}

function InkSwatches({
  inks,
  value,
  onChange,
}: {
  inks: Ink[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div role="radiogroup" aria-label="Warna tinta" className="flex items-center gap-1.5">
      {inks.map((ink) => {
        const active = ink.value === value;
        return (
          <button
            key={ink.value}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={ink.name}
            title={ink.name}
            onClick={() => onChange(ink.value)}
            className="grid h-7 w-7 place-items-center rounded-full transition-transform duration-150 hover:scale-110 cursor-pointer"
          >
            <span
              style={{ backgroundColor: ink.value }}
              className={cn(
                "grid h-[18px] w-[18px] place-items-center rounded-full",
                "ring-offset-2 ring-offset-white transition-all duration-150 dark:ring-offset-neutral-900",
                active ? "ring-2 ring-black/25 dark:ring-white/40" : "ring-0",
              )}
            >
              {active && (
                <span className="flex animate-in zoom-in-75 duration-150">
                  <Check aria-hidden className="h-2.5 w-2.5 text-white" strokeWidth={3.5} />
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}

const TABS: Array<{ id: SignatureMethod; label: string; icon: typeof PenLine }> = [
  { id: "draw", label: "Gambar", icon: PenLine },
  { id: "type", label: "Ketik", icon: TypeIcon },
  { id: "upload", label: "Unggah", icon: ImageUp },
  { id: "saved", label: "Tersimpan", icon: BookmarkCheck },
];

function Tabs({
  value,
  onChange,
  tabs,
}: {
  value: SignatureMethod;
  onChange: (m: SignatureMethod) => void;
  tabs: typeof TABS;
}) {
  return (
    <div
      role="tablist"
      aria-label="Metode tanda tangan"
      className={cn(
        "grid w-full gap-1 rounded-[12px] p-1",
        "bg-neutral-100 dark:bg-white/[0.04]",
        SQUIRCLE,
      )}
      style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}
    >
      {tabs.map((tab) => {
        const active = tab.id === value;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={active}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(tab.id)}
            onKeyDown={(e) => {
              if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
              e.preventDefault();
              const i = tabs.findIndex((t) => t.id === value);
              const next = (i + (e.key === "ArrowRight" ? 1 : tabs.length - 1)) % tabs.length;
              onChange(tabs[next].id);
            }}
            className={cn(
              "relative flex h-[32px] min-w-0 items-center justify-center gap-1.5 rounded-[9px] px-2 cursor-pointer",
              "text-[12.5px] transition-all duration-150",
              active
                ? "font-semibold text-neutral-900 dark:text-white"
                : "font-medium text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200",
              SQUIRCLE,
            )}
          >
            {active && (
              <span
                className={cn(
                  "absolute inset-0 rounded-[9px] transition-all duration-150",
                  "bg-white shadow-[0_1px_2px_rgb(0_0_0/0.14),0_0_0_1px_rgb(0_0_0/0.07)]",
                  "dark:bg-neutral-700 dark:shadow-[0_1px_3px_rgb(0_0_0/0.55),0_0_0_1px_rgb(255_255_255/0.14)]",
                  SQUIRCLE,
                )}
              />
            )}
            <tab.icon aria-hidden className="relative h-3.5 w-3.5 shrink-0" />
            <span className="relative truncate">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}

/* ================================================================== root == */

export const SignaturePad = React.forwardRef<HTMLDivElement, SignaturePadProps>(
  function SignaturePad(
    {
      title = "Tanda Tangan Digital",
      signerName = "",
      consent = DEFAULT_CONSENT,
      defaultMethod = "draw",
      typefaces = DEFAULT_TYPEFACES,
      inks = DEFAULT_INKS,
      saved = [],
      onSaveSignature,
      onDeleteSignature,
      loadFonts = true,
      onAccept,
      onCancel,
      showSignedState = true,
      storageKey = DEFAULT_STORAGE_KEY,
      className,
      style,
      ...props
    },
    ref,
  ) {
    useSigningFonts(loadFonts);
    const reduceMotion = useReducedMotionPreference();

    const rootRef = React.useRef<HTMLDivElement | null>(null);
    const setRoot = React.useCallback(
      (el: HTMLDivElement | null) => {
        rootRef.current = el;
        if (typeof ref === "function") ref(el);
        else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = el;
      },
      [ref],
    );
    const onDark = useOnDark(rootRef);

    const [method, setMethod] = React.useState<SignatureMethod>(defaultMethod);
    const [color, setColor] = React.useState(inks[0]?.value ?? "#171717");

    const [strokes, setStrokes] = React.useState<Stroke[]>([]);
    const [typed, setTyped] = React.useState(signerName);
    const [face, setFace] = React.useState<Typeface>(typefaces[0]);
    const [image, setImage] = React.useState<string | null>(null);
    const [error, setError] = React.useState<string | null>(null);

    const [storedSaved, setStoredSaved] = React.useState<SavedSignature[]>(() => readStoredSignatures(storageKey));
    const [deletedIds, setDeletedIds] = React.useState<string[]>([]);

    const library = React.useMemo(() => {
      const seen = new Set<string>();
      const merged: SavedSignature[] = [];
      for (const sig of [...storedSaved, ...saved]) {
        if (!deletedIds.includes(sig.id) && !seen.has(sig.id)) {
          seen.add(sig.id);
          merged.push(sig);
        }
      }
      return merged.slice(0, 8);
    }, [storedSaved, saved, deletedIds]);

    const [pick, setPick] = React.useState<string | null>(() => library[0]?.id ?? null);
    const [justSaved, setJustSaved] = React.useState(false);
    const [signed, setSigned] = React.useState<SignatureResult | null>(null);

    const handleMethodChange = (next: SignatureMethod) => {
      setMethod(next);
      setJustSaved(false);
    };

    const handleColorChange = (next: string) => {
      setColor(next);
      setJustSaved(false);
    };

    const handleStrokesChange = (updater: (prev: Stroke[]) => Stroke[]) => {
      setStrokes(updater);
      setJustSaved(false);
    };

    const handleTypedChange = (next: string) => {
      setTyped(next);
      setJustSaved(false);
    };

    const handleFaceChange = (next: Typeface) => {
      setFace(next);
      setJustSaved(false);
    };

    const handleImageChange = (next: string | null) => {
      setImage(next);
      setJustSaved(false);
    };

    const chosen = library.find((sig) => sig.id === pick) ?? library[0] ?? null;

    const ready =
      method === "draw"
        ? strokes.length > 0
        : method === "type"
          ? typed.trim().length > 0
          : method === "upload"
            ? !!image
            : !!chosen;

    const clear = () => {
      if (method === "draw") setStrokes([]);
      else if (method === "type") setTyped("");
      else setImage(null);
      setJustSaved(false);
    };

    const typedToPng = (): string | undefined => {
      const text = typed.trim();
      if (!text) return undefined;
      const font = `${Math.round(fitText(text, face.family, 560, 96, 64).size)}px ${face.family}`;
      const probe = document.createElement("canvas").getContext("2d");
      if (!probe) return undefined;
      probe.font = font;
      const m = probe.measureText(text);
      const w = Math.ceil(m.width) + 40;
      const h = 120;
      const scale = 2;
      const canvas = document.createElement("canvas");
      canvas.width = w * scale;
      canvas.height = h * scale;
      const ctx = canvas.getContext("2d");
      if (!ctx) return undefined;
      ctx.scale(scale, scale);
      ctx.font = font;
      ctx.fillStyle = color;
      ctx.textBaseline = "middle";
      ctx.fillText(text, 20, h / 2);
      return canvas.toDataURL("image/png");
    };

    const compose = (): SignatureResult | null => {
      const signedAt = new Date();
      let result: SignatureResult | null = null;

      if (method === "draw") {
        const png = strokesToPng(strokes);
        if (png) result = { method, png, svg: strokesToSvg(strokes), name: signerName || undefined, color, signedAt };
      } else if (method === "type") {
        const png = typedToPng();
        const text = typed.trim();
        if (png) {
          result = {
            method,
            png,
            svg: `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="120"><text x="20" y="72" font-family="${face.family.replace(/"/g, "'")}" font-size="56" fill="${color}">${text.replace(/[<&>]/g, "")}</text></svg>`,
            name: text,
            color,
            signedAt,
          };
        }
      } else if (method === "upload" && image) {
        result = { method, png: image, name: signerName || undefined, color, signedAt };
      } else if (method === "saved" && chosen) {
        result = {
          method,
          png: chosen.png,
          svg: chosen.svg,
          name: chosen.name ?? (signerName || undefined),
          color,
          signedAt,
        };
      }

      return result;
    };

    const save = () => {
      const result = compose();
      if (!result || result.method === "saved") return;
      const entry: SavedSignature = {
        id: `sig-${result.signedAt.getTime()}`,
        png: result.png,
        svg: result.svg,
        name: result.name ?? (signerName || undefined),
        label:
          result.method === "type"
            ? result.name || "TTD Ketik"
            : result.method === "upload"
              ? "TTD Unggahan"
              : signerName
                ? `TTD ${signerName.split(",")[0]}`
                : "TTD Gambar",
      };
      setStoredSaved((prev) => {
        const next = [entry, ...prev].slice(0, 8);
        writeStoredSignatures(storageKey, next);
        return next;
      });
      setPick(entry.id);
      onSaveSignature?.(entry);
      setJustSaved(true);
    };

    React.useEffect(() => {
      if (!justSaved) return;
      const t = window.setTimeout(() => setJustSaved(false), 1800);
      return () => window.clearTimeout(t);
    }, [justSaved]);

    const accept = () => {
      const result = compose();
      if (!result) return;
      onAccept?.(result);
      if (showSignedState) setSigned(result);
    };

    const reset = () => {
      setSigned(null);
      setStrokes([]);
      setImage(null);
      setError(null);
    };

    /* ------------------------------------------------------------ signed */

    if (signed && showSignedState) {
      return (
        <div
          ref={setRoot}
          style={{ "--sig-font": FONT_STACK, fontFamily: "var(--sig-font)", ...style } as React.CSSProperties}
          className={cn(
            "w-full max-w-[520px] overflow-hidden rounded-[18px] border p-5 text-neutral-950 antialiased",
            "border-black/[0.07] bg-white shadow-[0_1px_2px_rgb(0_0_0/0.05)]",
            !reduceMotion && "animate-in fade-in-0 zoom-in-95 duration-150",
            "dark:border-white/[0.08] dark:bg-neutral-900 dark:text-neutral-50",
            SQUIRCLE,
            className,
          )}
          {...props}
        >
          <div className="flex items-center gap-2">
            <span className="grid h-5 w-5 place-items-center rounded-full bg-emerald-500/12 text-emerald-600 dark:text-emerald-400">
              <Check aria-hidden className="h-3 w-3" strokeWidth={3} />
            </span>
            <span className="text-[13px] font-medium">Sudah Ditandatangani</span>
            <span className="ml-auto text-[11.5px] tabular-nums text-neutral-400 dark:text-neutral-500">
              {signed.signedAt.toLocaleString("id-ID", {
                day: "numeric",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>

          <div
            className={cn(
              "mt-4 flex h-[132px] items-end justify-center rounded-[14px] px-6 pb-4",
              "bg-neutral-100/70 dark:bg-white/[0.04]",
              SQUIRCLE,
            )}
          >
            <img
              src={signed.png}
              alt="Tanda tangan Anda"
              className="max-h-[92px] max-w-full object-contain dark:invert"
            />
          </div>

          <div className="mt-4 flex items-center justify-between">
            <div>
              <p className="m-0 text-[13px] font-medium">
                {signed.name || signerName || "Tanda Tangan Tersimpan"}
              </p>
              <p className="m-0 mt-0.5 text-[11.5px] text-neutral-500 dark:text-neutral-400">
                {signed.method === "draw"
                  ? "Digambar langsung"
                  : signed.method === "type"
                    ? "Diketik digital"
                    : signed.method === "upload"
                      ? "Diunggah dari gambar"
                      : "Tanda tangan tersimpan"}
              </p>
            </div>
            <GhostButton onClick={reset} icon={RotateCcw}>
              Tanda Tangani Ulang
            </GhostButton>
          </div>
        </div>
      );
    }

    /* ------------------------------------------------------------- panel */

    return (
      <div
        ref={setRoot}
        style={{ "--sig-font": FONT_STACK, fontFamily: "var(--sig-font)", ...style } as React.CSSProperties}
        className={cn(
          "w-full max-w-[520px] overflow-hidden rounded-[18px] border text-neutral-950 antialiased",
          "border-black/[0.07] bg-white shadow-[0_1px_2px_rgb(0_0_0/0.05)]",
          "dark:border-white/[0.08] dark:bg-neutral-900 dark:text-neutral-50",
          SQUIRCLE,
          className,
        )}
        {...props}
      >
        <div className="flex items-center justify-between px-4 pt-4">
          <h2 className="m-0 text-[15px] font-semibold tracking-[-0.01em]">{title}</h2>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Tutup"
            className={cn(
              "grid h-7 w-7 place-items-center rounded-[8px] text-neutral-400 transition-colors cursor-pointer",
              "hover:bg-black/[0.06] hover:text-neutral-800",
              "dark:text-neutral-500 dark:hover:bg-white/[0.1] dark:hover:text-neutral-100",
              SQUIRCLE,
            )}
          >
            <X aria-hidden className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-3.5 px-4">
          <Tabs value={method} onChange={handleMethodChange} tabs={TABS} />
        </div>

        <div className="mt-4 h-px bg-black/[0.06] dark:bg-white/[0.08]" />

        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <div className="min-w-0">
            {method === "type" ? (
              <TypefacePicker faces={typefaces} value={face} onChange={handleFaceChange} />
            ) : method === "draw" ? (
              <div className="flex items-center gap-0.5">
                <GhostButton
                  onClick={() => handleStrokesChange((s) => s.slice(0, -1))}
                  icon={Undo2}
                  disabled={!strokes.length}
                >
                  Urungkan
                </GhostButton>
                <GhostButton onClick={clear} icon={Eraser} disabled={!strokes.length}>
                  Bersihkan
                </GhostButton>
              </div>
            ) : method === "upload" ? (
              <span className="text-[12.5px] text-neutral-400 dark:text-neutral-500">
                Unggah foto atau pindai tanda tangan
              </span>
            ) : (
              <span className="text-[12.5px] text-neutral-400 dark:text-neutral-500">
                {library.length ? "Pilih salah satu TTD tersimpan" : "Belum ada tanda tangan tersimpan"}
              </span>
            )}
          </div>
          {(method === "draw" || method === "type") && (
            <InkSwatches inks={inks} value={color} onChange={handleColorChange} />
          )}
        </div>

        <div className="px-4">
          <div
            className={cn(
              "overflow-hidden rounded-[14px] bg-neutral-100/70 dark:bg-white/[0.04]",
              SQUIRCLE,
            )}
          >
            <div key={method} className={cn(!reduceMotion && "animate-in fade-in-0 duration-150")}>
              {method === "draw" && (
                <DrawBoard
                  strokes={strokes}
                  setStrokes={handleStrokesChange}
                  color={color}
                  onDark={onDark}
                />
              )}

              {method === "type" && (
                <TypeBoard
                  value={typed}
                  onChange={handleTypedChange}
                  face={face}
                  color={color}
                  onDark={onDark}
                  reduceMotion={reduceMotion}
                />
              )}

              {method === "upload" && (
                <UploadBoard
                  image={image}
                  setImage={handleImageChange}
                  error={error}
                  setError={setError}
                />
              )}

              {method === "saved" && (
                <SavedBoard
                  saved={library}
                  selected={chosen?.id ?? null}
                  onSelect={setPick}
                  onDelete={(id) => {
                    setDeletedIds((prev) => [...prev, id]);
                    setStoredSaved((list) => {
                      const next = list.filter((sig) => sig.id !== id);
                      writeStoredSignatures(storageKey, next);
                      return next;
                    });
                    setPick((current) => (current === id ? null : current));
                    onDeleteSignature?.(id);
                  }}
                  onDark={onDark}
                />
              )}
            </div>
          </div>
        </div>

        <p className="m-0 px-4 pb-4 pt-3 text-[11.5px] leading-relaxed text-neutral-500 dark:text-neutral-400">
          {consent}
        </p>

        <div className="h-px bg-black/[0.06] dark:bg-white/[0.08]" />

        <div className="flex items-center justify-end gap-2 px-4 py-3">
          {method !== "saved" && (
            <div className="mr-auto">
              <GhostButton
                onClick={save}
                disabled={!ready || justSaved}
                icon={justSaved ? Check : BookmarkCheck}
              >
                {justSaved ? "Tersimpan" : "Simpan TTD"}
              </GhostButton>
            </div>
          )}
          <button
            type="button"
            onClick={onCancel}
            className={cn(
              "inline-flex h-9 items-center rounded-[10px] px-3 text-[13px] font-medium cursor-pointer",
              "text-neutral-600 transition-colors hover:bg-black/[0.05] hover:text-neutral-900",
              "dark:text-neutral-300 dark:hover:bg-white/[0.08] dark:hover:text-neutral-50",
              SQUIRCLE,
            )}
          >
            Batal
          </button>
          <button
            type="button"
            onClick={accept}
            disabled={!ready}
            className={cn(
              "inline-flex h-9 items-center gap-1.5 rounded-[10px] px-3.5 text-[13px] font-medium cursor-pointer active:scale-[0.97]",
              "bg-neutral-900 text-white transition-all hover:bg-neutral-800",
              "dark:bg-neutral-50 dark:text-neutral-900 dark:hover:bg-white",
              "disabled:pointer-events-none disabled:opacity-35",
              SQUIRCLE,
            )}
          >
            <Check aria-hidden className="h-3.5 w-3.5" strokeWidth={2.75} />
            Gunakan &amp; Tanda Tangani
          </button>
        </div>
      </div>
    );
  },
);

export default SignaturePad;

export { SignaturePad as Component };

