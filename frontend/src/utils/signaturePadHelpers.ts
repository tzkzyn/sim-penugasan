export interface Pt {
  x: number;
  y: number;
  p: number;
}

export interface Stroke {
  points: Pt[];
  color: string;
  size: number;
}

export interface StoredSignatureRecord {
  id: string;
  png: string;
  svg?: string;
  label?: string;
}

export function readStoredSignatures<T extends StoredSignatureRecord = StoredSignatureRecord>(key: string): T[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is T =>
        typeof item === "object" &&
        item !== null &&
        typeof (item as StoredSignatureRecord).id === "string" &&
        typeof (item as StoredSignatureRecord).png === "string",
    );
  } catch {
    return [];
  }
}

export function writeStoredSignatures<T extends StoredSignatureRecord>(key: string, list: T[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(list.slice(0, 8)));
  } catch {
    // Abaikan kuota penyimpanan penuh
  }
}

export function toRgb(css: string): [number, number, number] | null {
  if (typeof document === "undefined") return null;
  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 1;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, 1, 1);
  ctx.fillStyle = css;
  ctx.fillRect(0, 0, 1, 1);
  const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
  return [r, g, b];
}

export const relLuminance = ([r, g, b]: [number, number, number]) =>
  (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;

export function inkOnScreen(color: string, dark: boolean): string {
  if (!dark) return color;
  const rgb = toRgb(color);
  if (!rgb || relLuminance(rgb) > 0.5) return color;
  const mix = (v: number) => Math.round(v + (255 - v) * 0.72);
  return `rgb(${mix(rgb[0])} ${mix(rgb[1])} ${mix(rgb[2])})`;
}

const num = (n: number) => Math.round(n * 100) / 100;

function smooth(points: Pt[]): Pt[] {
  if (points.length < 3) return points;
  const out: Pt[] = [points[0]];
  for (let i = 1; i < points.length - 1; i++) {
    const a = points[i - 1];
    const b = points[i];
    const c = points[i + 1];
    out.push({
      x: (a.x + b.x * 2 + c.x) / 4,
      y: (a.y + b.y * 2 + c.y) / 4,
      p: (a.p + b.p * 2 + c.p) / 4,
    });
  }
  out.push(points[points.length - 1]);
  return out;
}

const easeOut = (t: number) => 1 - (1 - t) * (1 - t);

function side(points: Array<[number, number]>, continued = false): string {
  const [first, ...rest] = points;
  let d = `${continued ? "L" : "M"} ${num(first[0])} ${num(first[1])}`;
  for (let i = 0; i < rest.length - 1; i++) {
    const [x, y] = rest[i];
    const [nx, ny] = rest[i + 1];
    d += ` Q ${num(x)} ${num(y)} ${num((x + nx) / 2)} ${num((y + ny) / 2)}`;
  }
  const last = rest[rest.length - 1];
  if (last) d += ` L ${num(last[0])} ${num(last[1])}`;
  return d;
}

export function strokePath(stroke: Stroke): string {
  const pts = smooth(stroke.points);
  const base = stroke.size / 2;

  if (pts.length === 1) {
    const { x, y, p } = pts[0];
    const r = num(base * (0.4 + 0.6 * p));
    return `M ${num(x - r)} ${num(y)} a ${r} ${r} 0 1 0 ${num(r * 2)} 0 a ${r} ${r} 0 1 0 ${num(-r * 2)} 0 Z`;
  }

  const len: number[] = [0];
  for (let i = 1; i < pts.length; i++) {
    len.push(len[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
  }
  const total = len[len.length - 1];
  const taper = Math.min(stroke.size * 3.5, total / 2);

  const left: Array<[number, number]> = [];
  const right: Array<[number, number]> = [];

  for (let i = 0; i < pts.length; i++) {
    const prev = pts[Math.max(0, i - 1)];
    const next = pts[Math.min(pts.length - 1, i + 1)];
    let dx = next.x - prev.x;
    let dy = next.y - prev.y;
    const d = Math.hypot(dx, dy) || 1;
    dx /= d;
    dy /= d;

    const fromStart = taper > 0 ? Math.min(1, len[i] / taper) : 1;
    const fromEnd = taper > 0 ? Math.min(1, (total - len[i]) / taper) : 1;
    const r = base * (0.32 + 0.68 * pts[i].p) * easeOut(Math.min(fromStart, fromEnd));

    left.push([pts[i].x - dy * r, pts[i].y + dx * r]);
    right.push([pts[i].x + dy * r, pts[i].y - dx * r]);
  }

  return `${side(left)} ${side(right.reverse(), true)} Z`;
}

export function bounds(strokes: Stroke[], pad = 10) {
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  for (const s of strokes) {
    const r = s.size / 2;
    for (const pt of s.points) {
      x0 = Math.min(x0, pt.x - r);
      y0 = Math.min(y0, pt.y - r);
      x1 = Math.max(x1, pt.x + r);
      y1 = Math.max(y1, pt.y + r);
    }
  }
  if (!isFinite(x0)) return null;
  return { x: x0 - pad, y: y0 - pad, w: x1 - x0 + pad * 2, h: y1 - y0 + pad * 2 };
}

export function strokesToSvg(strokes: Stroke[]): string | undefined {
  const b = bounds(strokes);
  if (!b) return undefined;
  const paths = strokes
    .map(
      (s) =>
        `<path d="${strokePath({ ...s, points: s.points.map((p) => ({ ...p, x: p.x - b.x, y: p.y - b.y })) })}" fill="${s.color}"/>`,
    )
    .join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${num(b.w)}" height="${num(b.h)}" viewBox="0 0 ${num(b.w)} ${num(b.h)}">${paths}</svg>`;
}

export function strokesToPng(strokes: Stroke[], scale = 2): string | undefined {
  const b = bounds(strokes);
  if (!b) return undefined;
  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil(b.w * scale);
  canvas.height = Math.ceil(b.h * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) return undefined;
  ctx.scale(scale, scale);
  ctx.translate(-b.x, -b.y);
  for (const s of strokes) {
    ctx.fillStyle = s.color;
    ctx.fill(new Path2D(strokePath(s)));
  }
  return canvas.toDataURL("image/png");
}

