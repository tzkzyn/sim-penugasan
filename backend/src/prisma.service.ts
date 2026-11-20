import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import postgres from 'postgres';

export type UnitKerjaBackend = 'RBI' | 'Fastingkom' | 'Kepeg' | 'PM';
export type RoleBackend =
  'SUPER_ADMIN' | 'ADMIN' | 'PEGAWAI' | 'APPROVAL' | 'USER';

export interface PegawaiEntity {
  id: string;
  nama: string;
  nip: string;
  unitKerja: UnitKerjaBackend;
  jabatan: string;
  pangkatGolongan?: string;
  telepon?: string;
  email?: string;
  fotoAvatar?: string;
  username?: string;
  password?: string;
  role: RoleBackend;
}

export interface SuratTugasEntity {
  id: string;
  nomorSurat: string;
  perihal: string;
  unitKerja: string;
  tanggalMulai: string;
  tanggalSelesai: string;
  lokasiPenugasan: string;
  status: string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

export interface TemplateSuratEntity {
  id: string;
  namaTemplate: string;
  deskripsi?: string;
  kategoriTemplate: string;
  fileNamaAsli?: string;
  fileDocxDataUrl?: string;
  hasFileDocx?: boolean;
  kontenHtml: string;
  sertakanKopResmi: boolean;
  prefillData?: Record<string, unknown>;
  dibuatOleh: string;
  diperbaruiPada: string;
  aktif: boolean;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

export interface PengajuanCutiEntity {
  id: string;
  nama: string;
  nip: string;
  unitKerja: string;
  jabatan?: string;
  jenis: 'CUTI' | 'IZIN' | 'SAKIT' | 'DINAS_LUAR';
  mulai: string;
  selesai: string;
  alasan: string;
  dokumenLampiran?: string;
  status: 'MENUNGGU' | 'DISETUJUI' | 'DITOLAK';
  tanggalPengajuan: string;
  disetujuiOleh?: string;
  disetujuiPada?: string;
  catatanPenolakan?: string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

export interface PokjaEntity {
  id: string;
  kode: string;
  nama: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface NotifikasiEntity {
  id: string;
  targetRole: string;
  title: string;
  desc: string;
  time: string;
  unread: boolean;
  category: string;
  createdAt?: string;
  updatedAt?: string;
}

const VALID_UNITS = new Set<UnitKerjaBackend>([
  'RBI',
  'Fastingkom',
  'Kepeg',
  'PM',
]);

const VALID_ROLES = new Set<RoleBackend>([
  'SUPER_ADMIN',
  'ADMIN',
  'PEGAWAI',
  'APPROVAL',
  'USER',
]);

const DEFAULT_PEGAWAI_SEED: PegawaiEntity[] = [
  {
    id: 'peg-01',
    nama: 'Taryadi',
    nip: '2350081041',
    unitKerja: 'RBI',
    jabatan: 'Super Admin',
    pangkatGolongan: 'Penata Muda / III/a',
    telepon: '081234567890',
    email: 'taryadi@pemda.go.id',
    fotoAvatar: '/kp-26-sim-penugasan/pp-navbar-2.jpg',
    username: 'taryadi',
    password: 'password123',
    role: 'SUPER_ADMIN',
  },
  {
    id: 'peg-02',
    nama: 'Admin Operasional',
    nip: '198503122010011002',
    unitKerja: 'RBI',
    jabatan: 'Administrator Sistem',
    pangkatGolongan: 'Penata / III/c',
    telepon: '081234567891',
    email: 'admin@pemda.go.id',
    fotoAvatar:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150',
    username: 'admin',
    password: 'password123',
    role: 'ADMIN',
  },
  {
    id: 'peg-03',
    nama: 'Hj. Anita Purnamasari, S.Kom., M.T.',
    nip: '198106142006042011',
    unitKerja: 'Fastingkom',
    jabatan: 'Koordinator Bidang & Pembimbing Teknis',
    pangkatGolongan: 'Pembina / IV/a',
    telepon: '081322334455',
    email: 'anita.purnamasari@pemda.go.id',
    fotoAvatar:
      'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=150',
    username: 'anita.purnamasari',
    password: 'password123',
    role: 'APPROVAL',
  },
  {
    id: 'peg-04',
    nama: 'Drs. H. Mulyadi, M.Si.',
    nip: '197805122002121003',
    unitKerja: 'RBI',
    jabatan: 'Kepala Subbagian Umum & Kepegawaian',
    pangkatGolongan: 'Penata Tingkat I / III/d',
    telepon: '081298765432',
    email: 'mulyadi@pemda.go.id',
    fotoAvatar:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150',
    username: 'mulyadi',
    password: 'password123',
    role: 'APPROVAL',
  },
  {
    id: 'peg-05',
    nama: 'Rahmat Hidayat, S.STP.',
    nip: '199008202014031002',
    unitKerja: 'Kepeg',
    jabatan: 'Analis Kepegawaian Ahli Muda',
    pangkatGolongan: 'Penata / III/c',
    telepon: '081211223344',
    email: 'rahmat.hidayat@pemda.go.id',
    fotoAvatar:
      'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=150',
    username: 'rahmat.hidayat',
    password: 'password123',
    role: 'ADMIN',
  },
  {
    id: 'peg-06',
    nama: 'Siti Nurhaliza, S.E.',
    nip: '199312052019032008',
    unitKerja: 'PM',
    jabatan: 'Pengelola Penugasan & Program',
    pangkatGolongan: 'Penata Muda Tingkat I / III/b',
    telepon: '081399887766',
    email: 'siti.nurhaliza@pemda.go.id',
    fotoAvatar:
      'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150',
    username: 'siti.nurhaliza',
    password: 'password123',
    role: 'USER',
  },
  {
    id: 'peg-07',
    nama: 'Budi Santoso, S.Kom.',
    nip: '199507102020121004',
    unitKerja: 'Fastingkom',
    jabatan: 'Pranata Komputer Ahli Pertama',
    pangkatGolongan: 'Penata Muda / III/a',
    telepon: '081244556677',
    email: 'budi.santoso@pemda.go.id',
    fotoAvatar:
      'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=150',
    username: 'budi.santoso',
    password: 'password123',
    role: 'USER',
  },
  {
    id: 'peg-08',
    nama: 'Pegawai Pelaksana',
    nip: '199204152015032001',
    unitKerja: 'RBI',
    jabatan: 'Pelaksana Teknis Lapangan',
    pangkatGolongan: 'Pengatur / II/c',
    telepon: '081355667788',
    email: 'pegawai@pemda.go.id',
    fotoAvatar:
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150',
    username: 'pegawai',
    password: 'password123',
    role: 'USER',
  },
];

interface PegawaiDbRow {
  id: string;
  nama: string;
  nip: string;
  unit_kerja: string;
  jabatan: string;
  pangkat_golongan: string | null;
  telepon: string | null;
  email: string | null;
  foto_avatar: string | null;
  username: string | null;
  password: string | null;
  role: string;
}

const resolveBackendRoot = (): string => {
  const candidates = [
    path.resolve(__dirname, '..'),
    path.resolve(__dirname, '../..'),
    process.cwd(),
  ];
  for (const dir of candidates) {
    if (fs.existsSync(path.join(dir, 'package.json'))) {
      return dir;
    }
  }
  return process.cwd();
};

const asText = (value: unknown, fallback = ''): string =>
  typeof value === 'string' ? value : fallback;

const normalizeUnitKerja = (value: unknown): UnitKerjaBackend => {
  if (typeof value === 'string' && VALID_UNITS.has(value as UnitKerjaBackend)) {
    return value as UnitKerjaBackend;
  }
  return 'RBI';
};

const normalizeRole = (value: unknown): RoleBackend => {
  if (typeof value === 'string') {
    const upper = value.trim().toUpperCase();
    if (VALID_ROLES.has(upper as RoleBackend)) {
      return upper as RoleBackend;
    }
  }
  return 'USER';
};

const deriveUsername = (
  email?: string,
  nama?: string,
  nip?: string,
): string => {
  if (email?.includes('@')) {
    const prefix = email
      .split('@')[0]
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9._-]/g, '');
    if (prefix) return prefix;
  }
  if (nama?.trim()) {
    const slug = nama
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '.')
      .replace(/^\.+|\.+$/g, '');
    if (slug) return slug;
  }
  return (nip || `user.${Date.now()}`).trim().toLowerCase();
};

const mapRowToPegawai = (row: PegawaiDbRow): PegawaiEntity => ({
  id: row.id,
  nama: row.nama,
  nip: row.nip,
  unitKerja: normalizeUnitKerja(row.unit_kerja),
  jabatan: row.jabatan,
  pangkatGolongan: row.pangkat_golongan ?? undefined,
  telepon: row.telepon ?? undefined,
  email: row.email ?? undefined,
  fotoAvatar: row.foto_avatar ?? undefined,
  username: row.username ?? undefined,
  password: row.password ?? 'password123',
  role: normalizeRole(row.role),
});

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private pgSql: postgres.Sql | null = null;
  private pgReady = false;
  private initPromise: Promise<void> | null = null;
  private inMemoryTasks: SuratTugasEntity[] = [];
  private inMemoryPegawai: PegawaiEntity[] = [...DEFAULT_PEGAWAI_SEED];
  private inMemoryTemplates: TemplateSuratEntity[] = [];
  private inMemoryCuti: PengajuanCutiEntity[] = [];
  private inMemoryPokja: PokjaEntity[] = [];
  private inMemoryNotifikasi: NotifikasiEntity[] = [];
  private readonly backendRoot: string;
  private readonly tasksStorageFile: string;
  private readonly pegawaiStorageFile: string;
  private readonly templatesStorageFile: string;
  private readonly cutiStorageFile: string;
  private readonly pokjaStorageFile: string;
  private readonly notifikasiStorageFile: string;

  constructor() {
    this.backendRoot = resolveBackendRoot();
    dotenv.config({ path: path.join(this.backendRoot, '.env') });
    this.tasksStorageFile = path.join(this.backendRoot, 'tasks_storage.json');
    this.pegawaiStorageFile = path.join(
      this.backendRoot,
      'pegawai_storage.json',
    );
    this.templatesStorageFile = path.join(
      this.backendRoot,
      'templates_storage.json',
    );
    this.cutiStorageFile = path.join(this.backendRoot, 'cuti_storage.json');
    this.pokjaStorageFile = path.join(this.backendRoot, 'pokja_storage.json');
    this.notifikasiStorageFile = path.join(
      this.backendRoot,
      'notifikasi_storage.json',
    );
    this.loadTaskStorage();
    this.loadPegawaiStorage();
    this.loadTemplateStorage();
    this.loadCutiStorage();
    this.loadPokjaStorage();
    this.loadNotifikasiStorage();
  }

  private loadTaskStorage() {
    try {
      if (fs.existsSync(this.tasksStorageFile)) {
        const data = fs.readFileSync(this.tasksStorageFile, 'utf-8');
        const parsed: unknown = JSON.parse(data);
        if (Array.isArray(parsed)) {
          this.inMemoryTasks = parsed as SuratTugasEntity[];
        }
      }
    } catch {
      this.inMemoryTasks = [];
    }
  }

  private saveTaskStorage() {
    try {
      fs.writeFileSync(
        this.tasksStorageFile,
        JSON.stringify(this.inMemoryTasks, null, 2),
        'utf-8',
      );
    } catch (e) {
      console.error('[Storage] Gagal menyimpan tasks_storage.json:', e);
    }
  }

  private loadPegawaiStorage() {
    try {
      if (fs.existsSync(this.pegawaiStorageFile)) {
        const data = fs.readFileSync(this.pegawaiStorageFile, 'utf-8');
        const parsed: unknown = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.inMemoryPegawai = parsed as PegawaiEntity[];
          return;
        }
      }
    } catch {
      // use seed
    }
    this.inMemoryPegawai = [...DEFAULT_PEGAWAI_SEED];
  }

  private savePegawaiStorage() {
    try {
      fs.writeFileSync(
        this.pegawaiStorageFile,
        JSON.stringify(this.inMemoryPegawai, null, 2),
        'utf-8',
      );
    } catch (e) {
      console.error('[Storage] Gagal menyimpan pegawai_storage.json:', e);
    }
  }

  private loadTemplateStorage() {
    try {
      if (fs.existsSync(this.templatesStorageFile)) {
        const data = fs.readFileSync(this.templatesStorageFile, 'utf-8');
        const parsed: unknown = JSON.parse(data);
        if (Array.isArray(parsed)) {
          this.inMemoryTemplates = parsed as TemplateSuratEntity[];
        }
      }
    } catch {
      this.inMemoryTemplates = [];
    }
  }

  private saveTemplateStorage() {
    try {
      fs.writeFileSync(
        this.templatesStorageFile,
        JSON.stringify(this.inMemoryTemplates, null, 2),
        'utf-8',
      );
    } catch (e) {
      console.error('[Storage] Gagal menyimpan templates_storage.json:', e);
    }
  }

  private loadCutiStorage() {
    try {
      if (fs.existsSync(this.cutiStorageFile)) {
        const data = fs.readFileSync(this.cutiStorageFile, 'utf-8');
        const parsed: unknown = JSON.parse(data);
        if (Array.isArray(parsed)) {
          this.inMemoryCuti = parsed as PengajuanCutiEntity[];
        }
      }
    } catch {
      this.inMemoryCuti = [];
    }
  }

  private saveCutiStorage() {
    try {
      fs.writeFileSync(
        this.cutiStorageFile,
        JSON.stringify(this.inMemoryCuti, null, 2),
        'utf-8',
      );
    } catch (e) {
      console.error('[Storage] Gagal menyimpan cuti_storage.json:', e);
    }
  }

  private loadPokjaStorage() {
    try {
      if (fs.existsSync(this.pokjaStorageFile)) {
        const data = fs.readFileSync(this.pokjaStorageFile, 'utf-8');
        const parsed: unknown = JSON.parse(data);
        if (Array.isArray(parsed)) {
          this.inMemoryPokja = parsed as PokjaEntity[];
        }
      }
    } catch {
      this.inMemoryPokja = [];
    }
  }

  private savePokjaStorage() {
    try {
      fs.writeFileSync(
        this.pokjaStorageFile,
        JSON.stringify(this.inMemoryPokja, null, 2),
        'utf-8',
      );
    } catch (e) {
      console.error('[Storage] Gagal menyimpan pokja_storage.json:', e);
    }
  }

  private loadNotifikasiStorage() {
    try {
      if (fs.existsSync(this.notifikasiStorageFile)) {
        const data = fs.readFileSync(this.notifikasiStorageFile, 'utf-8');
        const parsed: unknown = JSON.parse(data);
        if (Array.isArray(parsed)) {
          this.inMemoryNotifikasi = parsed as NotifikasiEntity[];
        }
      }
    } catch {
      this.inMemoryNotifikasi = [];
    }
  }

  private saveNotifikasiStorage() {
    try {
      fs.writeFileSync(
        this.notifikasiStorageFile,
        JSON.stringify(this.inMemoryNotifikasi, null, 2),
        'utf-8',
      );
    } catch (e) {
      console.error('[Storage] Gagal menyimpan notifikasi_storage.json:', e);
    }
  }

  async onModuleInit() {
    await this.ensureInitialized();
  }

  async onModuleDestroy() {
    if (this.pgSql) {
      try {
        await this.pgSql.end({ timeout: 3 });
      } catch {
        // ignore close errors
      }
    }
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.initPromise) {
      this.initPromise = this.initPostgreSQL();
    }
    await this.initPromise;
  }

  private async initPostgreSQL(): Promise<void> {
    const databaseUrl = process.env.DATABASE_URL?.trim();
    if (!databaseUrl || !/^postgres(ql)?:\/\//i.test(databaseUrl)) {
      console.warn(
        '[PostgreSQL] DATABASE_URL PostgreSQL tidak dikonfigurasi. Menggunakan fallback JSON storage lokal.',
      );
      return;
    }

    try {
      const parsedUrl = new URL(databaseUrl);
      parsedUrl.searchParams.delete('schema');
      const sql = postgres(parsedUrl.toString(), {
        max: 10,
        connect_timeout: 5,
        idle_timeout: 20,
        onnotice: () => {},
      });

      await sql`SELECT 1`;

      await sql`
        CREATE TABLE IF NOT EXISTS pegawai (
          id VARCHAR(64) PRIMARY KEY,
          nama VARCHAR(200) NOT NULL,
          nip VARCHAR(64) NOT NULL UNIQUE,
          unit_kerja VARCHAR(50) NOT NULL,
          jabatan VARCHAR(200) NOT NULL,
          pangkat_golongan VARCHAR(100),
          telepon VARCHAR(50),
          email VARCHAR(150),
          foto_avatar TEXT,
          username VARCHAR(100),
          password VARCHAR(255) NOT NULL DEFAULT 'password123',
          role VARCHAR(50) NOT NULL DEFAULT 'USER',
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;

      await sql`
        ALTER TABLE pegawai
          ADD COLUMN IF NOT EXISTS password VARCHAR(255) NOT NULL DEFAULT 'password123'
      `;

      await sql`
        UPDATE pegawai
        SET username = LOWER(SPLIT_PART(email, '@', 1))
        WHERE (username IS NULL OR username = '')
          AND email IS NOT NULL
          AND email LIKE '%@%'
      `;

      await sql`
        CREATE TABLE IF NOT EXISTS surat_tugas (
          id VARCHAR(64) PRIMARY KEY,
          nomor_surat VARCHAR(120) NOT NULL,
          perihal VARCHAR(255) NOT NULL,
          unit_kerja VARCHAR(50) NOT NULL,
          tanggal_mulai VARCHAR(20) NOT NULL,
          tanggal_selesai VARCHAR(20) NOT NULL,
          lokasi_penugasan VARCHAR(255) NOT NULL,
          status VARCHAR(50) NOT NULL DEFAULT 'DRAFT',
          payload JSONB NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;

      await sql`
        CREATE TABLE IF NOT EXISTS template_surat (
          id VARCHAR(64) PRIMARY KEY,
          nama_template VARCHAR(255) NOT NULL,
          kategori_template VARCHAR(50) NOT NULL DEFAULT 'INDIVIDU',
          aktif BOOLEAN NOT NULL DEFAULT TRUE,
          payload JSONB NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;

      await sql`
        CREATE TABLE IF NOT EXISTS pengajuan_cuti (
          id VARCHAR(64) PRIMARY KEY,
          nip VARCHAR(64) NOT NULL,
          nama VARCHAR(200) NOT NULL,
          unit_kerja VARCHAR(50) NOT NULL,
          jenis VARCHAR(30) NOT NULL,
          mulai VARCHAR(20) NOT NULL,
          selesai VARCHAR(20) NOT NULL,
          status VARCHAR(30) NOT NULL DEFAULT 'MENUNGGU',
          payload JSONB NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;

      await sql`
        CREATE TABLE IF NOT EXISTS pokja (
          id VARCHAR(64) PRIMARY KEY,
          kode VARCHAR(50) NOT NULL UNIQUE,
          nama VARCHAR(200) NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;

      await sql`
        CREATE TABLE IF NOT EXISTS notifikasi (
          id VARCHAR(64) PRIMARY KEY,
          target_role VARCHAR(30) NOT NULL,
          title VARCHAR(255) NOT NULL,
          description TEXT NOT NULL,
          time_label VARCHAR(100) NOT NULL,
          unread BOOLEAN NOT NULL DEFAULT TRUE,
          category VARCHAR(50) NOT NULL DEFAULT 'SISTEM',
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;

      const [{ total: pegawaiCount }] = await sql<[{ total: number }]>`
        SELECT COUNT(*)::int AS total FROM pegawai
      `;

      if (pegawaiCount === 0) {
        const seedSource =
          this.inMemoryPegawai.length > 0
            ? this.inMemoryPegawai
            : DEFAULT_PEGAWAI_SEED;
        for (const p of seedSource) {
          const seedUsername =
            p.username?.trim().toLowerCase() ||
            deriveUsername(p.email, p.nama, p.nip);
          await sql`
            INSERT INTO pegawai (
              id, nama, nip, unit_kerja, jabatan, pangkat_golongan,
              telepon, email, foto_avatar, username, password, role
            ) VALUES (
              ${p.id},
              ${p.nama},
              ${p.nip},
              ${normalizeUnitKerja(p.unitKerja)},
              ${p.jabatan},
              ${p.pangkatGolongan ?? null},
              ${p.telepon ?? null},
              ${p.email ?? null},
              ${p.fotoAvatar ?? null},
              ${seedUsername},
              ${p.password || 'password123'},
              ${normalizeRole(p.role)}
            )
            ON CONFLICT (id) DO NOTHING
          `;
        }
      }

      const [{ total: taskCount }] = await sql<[{ total: number }]>`
        SELECT COUNT(*)::int AS total FROM surat_tugas
      `;

      if (taskCount === 0 && this.inMemoryTasks.length > 0) {
        for (const task of this.inMemoryTasks) {
          const id =
            typeof task.id === 'string' && task.id.trim()
              ? task.id.trim()
              : `st-${Date.now()}`;
          await sql`
            INSERT INTO surat_tugas (
              id, nomor_surat, perihal, unit_kerja, tanggal_mulai,
              tanggal_selesai, lokasi_penugasan, status, payload
            ) VALUES (
              ${id},
              ${asText(task.nomorSurat)},
              ${asText(task.perihal)},
              ${asText(task.unitKerja, 'RBI')},
              ${asText(task.tanggalMulai)},
              ${asText(task.tanggalSelesai)},
              ${asText(task.lokasiPenugasan)},
              ${asText(task.status, 'DRAFT')},
              ${sql.json(task as postgres.JSONValue)}
            )
            ON CONFLICT (id) DO NOTHING
          `;
        }
      }

      this.pgSql = sql;
      this.pgReady = true;
      console.log(
        '[PostgreSQL] Terkoneksi dan tabel pegawai & surat_tugas siap digunakan.',
      );
    } catch (error) {
      this.pgReady = false;
      if (this.pgSql) {
        try {
          await this.pgSql.end({ timeout: 1 });
        } catch {
          // ignore
        }
        this.pgSql = null;
      }
      const message = error instanceof Error ? error.message : String(error);
      console.warn(
        `[PostgreSQL] Tidak dapat terhubung (${message}). Menggunakan fallback JSON storage lokal.`,
      );
    }
  }

  private parsePayloadRow(payload: unknown): SuratTugasEntity {
    if (typeof payload === 'string') {
      return JSON.parse(payload) as SuratTugasEntity;
    }
    return payload as SuratTugasEntity;
  }

  get pegawai() {
    return {
      findMany: async (): Promise<PegawaiEntity[]> => {
        await this.ensureInitialized();
        if (this.pgReady && this.pgSql) {
          const rows = await this.pgSql<PegawaiDbRow[]>`
            SELECT
              id, nama, nip, unit_kerja, jabatan, pangkat_golongan,
              telepon, email, foto_avatar, username, password, role
            FROM pegawai
            ORDER BY created_at ASC, id ASC
          `;
          return rows.map(mapRowToPegawai);
        }
        this.loadPegawaiStorage();
        return [...this.inMemoryPegawai];
      },

      findUnique: async (args: {
        where: { id: string };
      }): Promise<PegawaiEntity | null> => {
        await this.ensureInitialized();
        if (this.pgReady && this.pgSql) {
          const rows = await this.pgSql<PegawaiDbRow[]>`
            SELECT
              id, nama, nip, unit_kerja, jabatan, pangkat_golongan,
              telepon, email, foto_avatar, username, password, role
            FROM pegawai
            WHERE id = ${args.where.id}
            LIMIT 1
          `;
          return rows[0] ? mapRowToPegawai(rows[0]) : null;
        }
        this.loadPegawaiStorage();
        return this.inMemoryPegawai.find((p) => p.id === args.where.id) || null;
      },

      create: async (args: {
        data: Partial<PegawaiEntity>;
      }): Promise<PegawaiEntity> => {
        await this.ensureInitialized();
        const nama = (args.data.nama || '').trim();
        const nip = (args.data.nip || '').trim();
        const jabatan = (args.data.jabatan || '').trim();
        const email = args.data.email?.trim() || undefined;
        const username =
          args.data.username?.trim().toLowerCase() ||
          deriveUsername(email, nama, nip);
        const rawPassword =
          args.data.password !== undefined ? args.data.password.trim() : '';

        if (!nama || !nip) {
          throw new BadRequestException('Nama dan NIP pegawai wajib diisi.');
        }
        if (!jabatan) {
          throw new BadRequestException('Jabatan pegawai wajib diisi.');
        }
        if (rawPassword && rawPassword.length < 6) {
          throw new BadRequestException('Password akun minimal 6 karakter.');
        }

        const newPegawai: PegawaiEntity = {
          id:
            typeof args.data.id === 'string' && args.data.id.trim()
              ? args.data.id.trim()
              : `peg-${Date.now()}`,
          nama,
          nip,
          unitKerja: normalizeUnitKerja(args.data.unitKerja),
          jabatan,
          pangkatGolongan: args.data.pangkatGolongan?.trim() || undefined,
          telepon: args.data.telepon?.trim() || undefined,
          email,
          fotoAvatar:
            args.data.fotoAvatar?.trim() ||
            '/kp-26-sim-penugasan/pp-navbar-2.jpg',
          username,
          password: rawPassword || 'password123',
          role: normalizeRole(args.data.role),
        };

        if (this.pgReady && this.pgSql) {
          const existingNip = await this.pgSql<{ id: string }[]>`
            SELECT id FROM pegawai WHERE nip = ${newPegawai.nip} LIMIT 1
          `;
          if (existingNip.length > 0) {
            throw new ConflictException(
              `NIP ${newPegawai.nip} sudah terdaftar di database.`,
            );
          }

          if (newPegawai.username) {
            const existingUser = await this.pgSql<{ id: string }[]>`
              SELECT id FROM pegawai
              WHERE LOWER(username) = ${newPegawai.username.toLowerCase()}
              LIMIT 1
            `;
            if (existingUser.length > 0) {
              throw new ConflictException(
                `Username "${newPegawai.username}" sudah digunakan oleh pegawai lain.`,
              );
            }
          }

          const rows = await this.pgSql<PegawaiDbRow[]>`
            INSERT INTO pegawai (
              id, nama, nip, unit_kerja, jabatan, pangkat_golongan,
              telepon, email, foto_avatar, username, password, role
            ) VALUES (
              ${newPegawai.id},
              ${newPegawai.nama},
              ${newPegawai.nip},
              ${newPegawai.unitKerja},
              ${newPegawai.jabatan},
              ${newPegawai.pangkatGolongan ?? null},
              ${newPegawai.telepon ?? null},
              ${newPegawai.email ?? null},
              ${newPegawai.fotoAvatar ?? null},
              ${newPegawai.username ?? null},
              ${newPegawai.password ?? 'password123'},
              ${newPegawai.role}
            )
            RETURNING
              id, nama, nip, unit_kerja, jabatan, pangkat_golongan,
              telepon, email, foto_avatar, username, password, role
          `;
          return mapRowToPegawai(rows[0]);
        }

        this.loadPegawaiStorage();
        if (this.inMemoryPegawai.some((p) => p.nip === newPegawai.nip)) {
          throw new ConflictException(
            `NIP ${newPegawai.nip} sudah terdaftar di database.`,
          );
        }
        if (
          newPegawai.username &&
          this.inMemoryPegawai.some(
            (p) =>
              p.username?.toLowerCase() === newPegawai.username?.toLowerCase(),
          )
        ) {
          throw new ConflictException(
            `Username "${newPegawai.username}" sudah digunakan oleh pegawai lain.`,
          );
        }
        this.inMemoryPegawai.push(newPegawai);
        this.savePegawaiStorage();
        return newPegawai;
      },

      update: async (args: {
        where: { id: string };
        data: Partial<PegawaiEntity>;
      }): Promise<PegawaiEntity> => {
        await this.ensureInitialized();
        const existing = await this.pegawai.findUnique({
          where: { id: args.where.id },
        });
        if (!existing) {
          throw new NotFoundException('Data pegawai tidak ditemukan.');
        }

        const nextNama =
          args.data.nama !== undefined
            ? args.data.nama.trim() || existing.nama
            : existing.nama;
        const nextNip =
          args.data.nip !== undefined
            ? args.data.nip.trim() || existing.nip
            : existing.nip;
        const nextJabatan =
          args.data.jabatan !== undefined
            ? args.data.jabatan.trim() || existing.jabatan
            : existing.jabatan;
        const nextEmail =
          args.data.email !== undefined
            ? args.data.email.trim() || undefined
            : existing.email;
        const nextUsername =
          args.data.username !== undefined
            ? args.data.username.trim().toLowerCase() || existing.username
            : existing.username;
        const trimmedPassword =
          args.data.password !== undefined ? args.data.password.trim() : '';
        if (trimmedPassword && trimmedPassword.length < 6) {
          throw new BadRequestException('Password akun minimal 6 karakter.');
        }
        const nextPassword =
          trimmedPassword || existing.password || 'password123';

        const updated: PegawaiEntity = {
          ...existing,
          id: existing.id,
          nama: nextNama,
          nip: nextNip,
          unitKerja:
            args.data.unitKerja !== undefined
              ? normalizeUnitKerja(args.data.unitKerja)
              : existing.unitKerja,
          jabatan: nextJabatan,
          pangkatGolongan:
            args.data.pangkatGolongan !== undefined
              ? args.data.pangkatGolongan.trim() || undefined
              : existing.pangkatGolongan,
          telepon:
            args.data.telepon !== undefined
              ? args.data.telepon.trim() || undefined
              : existing.telepon,
          email: nextEmail,
          fotoAvatar:
            args.data.fotoAvatar !== undefined
              ? args.data.fotoAvatar.trim() || existing.fotoAvatar
              : existing.fotoAvatar,
          username: nextUsername,
          password: nextPassword,
          role:
            args.data.role !== undefined
              ? normalizeRole(args.data.role)
              : existing.role,
        };

        if (this.pgReady && this.pgSql) {
          const duplicateNip = await this.pgSql<{ id: string }[]>`
            SELECT id FROM pegawai
            WHERE nip = ${updated.nip} AND id <> ${updated.id}
            LIMIT 1
          `;
          if (duplicateNip.length > 0) {
            throw new ConflictException(
              `NIP ${updated.nip} sudah digunakan oleh pegawai lain.`,
            );
          }

          if (updated.username) {
            const duplicateUsername = await this.pgSql<{ id: string }[]>`
              SELECT id FROM pegawai
              WHERE LOWER(username) = ${updated.username.toLowerCase()}
                AND id <> ${updated.id}
              LIMIT 1
            `;
            if (duplicateUsername.length > 0) {
              throw new ConflictException(
                `Username "${updated.username}" sudah digunakan oleh pegawai lain.`,
              );
            }
          }

          const rows = await this.pgSql<PegawaiDbRow[]>`
            UPDATE pegawai
            SET
              nama = ${updated.nama},
              nip = ${updated.nip},
              unit_kerja = ${updated.unitKerja},
              jabatan = ${updated.jabatan},
              pangkat_golongan = ${updated.pangkatGolongan ?? null},
              telepon = ${updated.telepon ?? null},
              email = ${updated.email ?? null},
              foto_avatar = ${updated.fotoAvatar ?? null},
              username = ${updated.username ?? null},
              password = ${updated.password ?? 'password123'},
              role = ${updated.role},
              updated_at = NOW()
            WHERE id = ${updated.id}
            RETURNING
              id, nama, nip, unit_kerja, jabatan, pangkat_golongan,
              telepon, email, foto_avatar, username, password, role
          `;
          return mapRowToPegawai(rows[0]);
        }

        this.loadPegawaiStorage();
        if (
          this.inMemoryPegawai.some(
            (p) => p.nip === updated.nip && p.id !== updated.id,
          )
        ) {
          throw new ConflictException(
            `NIP ${updated.nip} sudah digunakan oleh pegawai lain.`,
          );
        }
        if (
          updated.username &&
          this.inMemoryPegawai.some(
            (p) =>
              p.id !== updated.id &&
              p.username?.toLowerCase() === updated.username?.toLowerCase(),
          )
        ) {
          throw new ConflictException(
            `Username "${updated.username}" sudah digunakan oleh pegawai lain.`,
          );
        }
        const index = this.inMemoryPegawai.findIndex(
          (p) => p.id === updated.id,
        );
        if (index !== -1) {
          this.inMemoryPegawai[index] = updated;
          this.savePegawaiStorage();
        }
        return updated;
      },

      delete: async (args: {
        where: { id: string };
      }): Promise<PegawaiEntity> => {
        await this.ensureInitialized();
        if (args.where.id === 'peg-01') {
          throw new BadRequestException(
            'Akun utama Super Admin tidak dapat dihapus.',
          );
        }

        if (this.pgReady && this.pgSql) {
          const rows = await this.pgSql<PegawaiDbRow[]>`
            DELETE FROM pegawai
            WHERE id = ${args.where.id}
            RETURNING
              id, nama, nip, unit_kerja, jabatan, pangkat_golongan,
              telepon, email, foto_avatar, username, password, role
          `;
          if (!rows[0]) {
            throw new NotFoundException('Data pegawai tidak ditemukan.');
          }
          return mapRowToPegawai(rows[0]);
        }

        this.loadPegawaiStorage();
        const index = this.inMemoryPegawai.findIndex(
          (p) => p.id === args.where.id,
        );
        if (index === -1) {
          throw new NotFoundException('Data pegawai tidak ditemukan.');
        }
        const removed = this.inMemoryPegawai.splice(index, 1)[0];
        this.savePegawaiStorage();
        return removed;
      },
    };
  }

  get suratTugas() {
    return {
      findMany: async (): Promise<SuratTugasEntity[]> => {
        await this.ensureInitialized();
        if (this.pgReady && this.pgSql) {
          const rows = await this.pgSql<{ payload: unknown }[]>`
            SELECT payload FROM surat_tugas ORDER BY created_at DESC
          `;
          return rows.map((row) => this.parsePayloadRow(row.payload));
        }
        this.loadTaskStorage();
        return [...this.inMemoryTasks];
      },

      findUnique: async (args: {
        where: { id: string };
      }): Promise<SuratTugasEntity | null> => {
        await this.ensureInitialized();
        if (this.pgReady && this.pgSql) {
          const rows = await this.pgSql<{ payload: unknown }[]>`
            SELECT payload FROM surat_tugas WHERE id = ${args.where.id} LIMIT 1
          `;
          return rows[0] ? this.parsePayloadRow(rows[0].payload) : null;
        }
        this.loadTaskStorage();
        return this.inMemoryTasks.find((t) => t.id === args.where.id) || null;
      },

      create: async (args: {
        data: Record<string, unknown>;
      }): Promise<SuratTugasEntity> => {
        await this.ensureInitialized();
        const newTask: SuratTugasEntity = {
          ...(args.data as Partial<SuratTugasEntity>),
          id:
            typeof args.data.id === 'string' && args.data.id.trim()
              ? args.data.id.trim()
              : `st-${Date.now()}`,
          nomorSurat: asText(args.data.nomorSurat),
          perihal: asText(args.data.perihal, 'Penugasan Baru'),
          unitKerja: asText(args.data.unitKerja, 'RBI'),
          tanggalMulai: asText(args.data.tanggalMulai),
          tanggalSelesai: asText(args.data.tanggalSelesai),
          lokasiPenugasan: asText(args.data.lokasiPenugasan),
          status: asText(args.data.status, 'DRAFT'),
          createdAt:
            typeof args.data.createdAt === 'string'
              ? args.data.createdAt
              : new Date().toISOString(),
        };

        if (this.pgReady && this.pgSql) {
          const rows = await this.pgSql<{ payload: unknown }[]>`
            INSERT INTO surat_tugas (
              id, nomor_surat, perihal, unit_kerja, tanggal_mulai,
              tanggal_selesai, lokasi_penugasan, status, payload
            ) VALUES (
              ${newTask.id},
              ${newTask.nomorSurat},
              ${newTask.perihal},
              ${newTask.unitKerja},
              ${newTask.tanggalMulai},
              ${newTask.tanggalSelesai},
              ${newTask.lokasiPenugasan},
              ${newTask.status},
              ${this.pgSql.json(newTask as postgres.JSONValue)}
            )
            RETURNING payload
          `;
          return this.parsePayloadRow(rows[0].payload);
        }

        this.loadTaskStorage();
        this.inMemoryTasks.unshift(newTask);
        this.saveTaskStorage();
        return newTask;
      },

      update: async (args: {
        where: { id: string };
        data: Record<string, unknown>;
      }): Promise<SuratTugasEntity | null> => {
        await this.ensureInitialized();
        if (this.pgReady && this.pgSql) {
          const existing = await this.suratTugas.findUnique({
            where: { id: args.where.id },
          });
          if (!existing) return null;

          const updatedTask: SuratTugasEntity = {
            ...existing,
            ...(args.data as Partial<SuratTugasEntity>),
            id: existing.id,
            updatedAt: new Date().toISOString(),
          };

          const rows = await this.pgSql<{ payload: unknown }[]>`
            UPDATE surat_tugas
            SET
              nomor_surat = ${String(updatedTask.nomorSurat || '')},
              perihal = ${String(updatedTask.perihal || '')},
              unit_kerja = ${String(updatedTask.unitKerja || 'RBI')},
              tanggal_mulai = ${String(updatedTask.tanggalMulai || '')},
              tanggal_selesai = ${String(updatedTask.tanggalSelesai || '')},
              lokasi_penugasan = ${String(updatedTask.lokasiPenugasan || '')},
              status = ${String(updatedTask.status || 'DRAFT')},
              payload = ${this.pgSql.json(updatedTask as postgres.JSONValue)},
              updated_at = NOW()
            WHERE id = ${args.where.id}
            RETURNING payload
          `;
          return rows[0] ? this.parsePayloadRow(rows[0].payload) : null;
        }

        this.loadTaskStorage();
        const index = this.inMemoryTasks.findIndex(
          (t) => t.id === args.where.id,
        );
        if (index !== -1) {
          this.inMemoryTasks[index] = {
            ...this.inMemoryTasks[index],
            ...(args.data as Partial<SuratTugasEntity>),
            updatedAt: new Date().toISOString(),
          };
          this.saveTaskStorage();
          return this.inMemoryTasks[index];
        }
        return null;
      },

      delete: async (args: {
        where: { id: string };
      }): Promise<SuratTugasEntity | null> => {
        await this.ensureInitialized();
        if (this.pgReady && this.pgSql) {
          const rows = await this.pgSql<{ payload: unknown }[]>`
            DELETE FROM surat_tugas WHERE id = ${args.where.id} RETURNING payload
          `;
          return rows[0] ? this.parsePayloadRow(rows[0].payload) : null;
        }

        this.loadTaskStorage();
        const index = this.inMemoryTasks.findIndex(
          (t) => t.id === args.where.id,
        );
        if (index !== -1) {
          const removed = this.inMemoryTasks.splice(index, 1)[0];
          this.saveTaskStorage();
          return removed;
        }
        return null;
      },
    };
  }

  private parseTemplatePayloadRow(payload: unknown): TemplateSuratEntity {
    if (typeof payload === 'string') {
      return JSON.parse(payload) as TemplateSuratEntity;
    }
    return payload as TemplateSuratEntity;
  }

  get templateSurat() {
    return {
      findMany: async (): Promise<TemplateSuratEntity[]> => {
        await this.ensureInitialized();
        if (this.pgReady && this.pgSql) {
          const rows = await this.pgSql<{ payload: unknown }[]>`
            SELECT payload FROM template_surat ORDER BY updated_at DESC, created_at DESC
          `;
          return rows.map((row) => this.parseTemplatePayloadRow(row.payload));
        }
        this.loadTemplateStorage();
        return [...this.inMemoryTemplates];
      },

      findUnique: async (args: {
        where: { id: string };
      }): Promise<TemplateSuratEntity | null> => {
        await this.ensureInitialized();
        if (this.pgReady && this.pgSql) {
          const rows = await this.pgSql<{ payload: unknown }[]>`
            SELECT payload FROM template_surat WHERE id = ${args.where.id} LIMIT 1
          `;
          return rows[0] ? this.parseTemplatePayloadRow(rows[0].payload) : null;
        }
        this.loadTemplateStorage();
        return (
          this.inMemoryTemplates.find((tpl) => tpl.id === args.where.id) || null
        );
      },

      create: async (args: {
        data: Record<string, unknown>;
      }): Promise<TemplateSuratEntity> => {
        await this.ensureInitialized();
        const nowIso = new Date().toISOString();
        const newTemplate: TemplateSuratEntity = {
          ...(args.data as Partial<TemplateSuratEntity>),
          id:
            typeof args.data.id === 'string' && args.data.id.trim()
              ? args.data.id.trim()
              : `TPL-${Date.now()}`,
          namaTemplate: asText(args.data.namaTemplate, 'Template Surat'),
          kategoriTemplate: asText(args.data.kategoriTemplate, 'INDIVIDU'),
          kontenHtml: asText(args.data.kontenHtml),
          sertakanKopResmi: Boolean(args.data.sertakanKopResmi),
          dibuatOleh: asText(args.data.dibuatOleh, 'Pejabat Approval'),
          diperbaruiPada: asText(args.data.diperbaruiPada, nowIso),
          aktif: args.data.aktif !== undefined ? Boolean(args.data.aktif) : true,
          createdAt:
            typeof args.data.createdAt === 'string'
              ? args.data.createdAt
              : nowIso,
          updatedAt: nowIso,
        };

        if (this.pgReady && this.pgSql) {
          const rows = await this.pgSql<{ payload: unknown }[]>`
            INSERT INTO template_surat (
              id, nama_template, kategori_template, aktif, payload
            ) VALUES (
              ${newTemplate.id},
              ${newTemplate.namaTemplate},
              ${newTemplate.kategoriTemplate},
              ${newTemplate.aktif},
              ${this.pgSql.json(newTemplate as postgres.JSONValue)}
            )
            ON CONFLICT (id) DO UPDATE SET
              nama_template = EXCLUDED.nama_template,
              kategori_template = EXCLUDED.kategori_template,
              aktif = EXCLUDED.aktif,
              payload = EXCLUDED.payload,
              updated_at = NOW()
            RETURNING payload
          `;
          return this.parseTemplatePayloadRow(rows[0].payload);
        }

        this.loadTemplateStorage();
        const existingIdx = this.inMemoryTemplates.findIndex(
          (tpl) => tpl.id === newTemplate.id,
        );
        if (existingIdx !== -1) {
          this.inMemoryTemplates[existingIdx] = newTemplate;
        } else {
          this.inMemoryTemplates.unshift(newTemplate);
        }
        this.saveTemplateStorage();
        return newTemplate;
      },

      update: async (args: {
        where: { id: string };
        data: Record<string, unknown>;
      }): Promise<TemplateSuratEntity | null> => {
        await this.ensureInitialized();
        if (this.pgReady && this.pgSql) {
          const existing = await this.templateSurat.findUnique({
            where: { id: args.where.id },
          });
          if (!existing) return null;

          const updatedTemplate: TemplateSuratEntity = {
            ...existing,
            ...(args.data as Partial<TemplateSuratEntity>),
            id: existing.id,
            updatedAt: new Date().toISOString(),
          };

          const rows = await this.pgSql<{ payload: unknown }[]>`
            UPDATE template_surat
            SET
              nama_template = ${String(updatedTemplate.namaTemplate || 'Template Surat')},
              kategori_template = ${String(updatedTemplate.kategoriTemplate || 'INDIVIDU')},
              aktif = ${Boolean(updatedTemplate.aktif)},
              payload = ${this.pgSql.json(updatedTemplate as postgres.JSONValue)},
              updated_at = NOW()
            WHERE id = ${args.where.id}
            RETURNING payload
          `;
          return rows[0] ? this.parseTemplatePayloadRow(rows[0].payload) : null;
        }

        this.loadTemplateStorage();
        const index = this.inMemoryTemplates.findIndex(
          (tpl) => tpl.id === args.where.id,
        );
        if (index !== -1) {
          this.inMemoryTemplates[index] = {
            ...this.inMemoryTemplates[index],
            ...(args.data as Partial<TemplateSuratEntity>),
            updatedAt: new Date().toISOString(),
          };
          this.saveTemplateStorage();
          return this.inMemoryTemplates[index];
        }
        return null;
      },

      delete: async (args: {
        where: { id: string };
      }): Promise<TemplateSuratEntity | null> => {
        await this.ensureInitialized();
        if (this.pgReady && this.pgSql) {
          const rows = await this.pgSql<{ payload: unknown }[]>`
            DELETE FROM template_surat WHERE id = ${args.where.id} RETURNING payload
          `;
          return rows[0] ? this.parseTemplatePayloadRow(rows[0].payload) : null;
        }

        this.loadTemplateStorage();
        const index = this.inMemoryTemplates.findIndex(
          (tpl) => tpl.id === args.where.id,
        );
        if (index !== -1) {
          const removed = this.inMemoryTemplates.splice(index, 1)[0];
          this.saveTemplateStorage();
          return removed;
        }
        return null;
      },
    };
  }

  private parseCutiPayloadRow(payload: unknown): PengajuanCutiEntity {
    if (typeof payload === 'string') {
      return JSON.parse(payload) as PengajuanCutiEntity;
    }
    return payload as PengajuanCutiEntity;
  }

  get cuti() {
    return {
      findMany: async (): Promise<PengajuanCutiEntity[]> => {
        await this.ensureInitialized();
        if (this.pgReady && this.pgSql) {
          const rows = await this.pgSql<{ payload: unknown }[]>`
            SELECT payload FROM pengajuan_cuti ORDER BY created_at DESC
          `;
          return rows.map((row) => this.parseCutiPayloadRow(row.payload));
        }
        this.loadCutiStorage();
        return [...this.inMemoryCuti];
      },

      findUnique: async (args: {
        where: { id: string };
      }): Promise<PengajuanCutiEntity | null> => {
        await this.ensureInitialized();
        if (this.pgReady && this.pgSql) {
          const rows = await this.pgSql<{ payload: unknown }[]>`
            SELECT payload FROM pengajuan_cuti WHERE id = ${args.where.id} LIMIT 1
          `;
          return rows[0] ? this.parseCutiPayloadRow(rows[0].payload) : null;
        }
        this.loadCutiStorage();
        return this.inMemoryCuti.find((item) => item.id === args.where.id) || null;
      },

      create: async (args: {
        data: Record<string, unknown>;
      }): Promise<PengajuanCutiEntity> => {
        await this.ensureInitialized();
        const nowIso = new Date().toISOString();
        const jenisRaw = asText(args.data.jenis, 'CUTI').toUpperCase();
        const jenis: PengajuanCutiEntity['jenis'] =
          jenisRaw === 'IZIN' || jenisRaw === 'SAKIT' || jenisRaw === 'DINAS_LUAR'
            ? jenisRaw
            : 'CUTI';
        const statusRaw = asText(args.data.status, 'MENUNGGU').toUpperCase();
        const status: PengajuanCutiEntity['status'] =
          statusRaw === 'DISETUJUI' || statusRaw === 'DITOLAK'
            ? statusRaw
            : 'MENUNGGU';

        const newCuti: PengajuanCutiEntity = {
          ...(args.data as Partial<PengajuanCutiEntity>),
          id:
            typeof args.data.id === 'string' && args.data.id.trim()
              ? args.data.id.trim()
              : `cuti-${Date.now()}`,
          nama: asText(args.data.nama, 'Pegawai'),
          nip: asText(args.data.nip),
          unitKerja: normalizeUnitKerja(args.data.unitKerja),
          jenis,
          mulai: asText(args.data.mulai),
          selesai: asText(args.data.selesai),
          alasan: asText(args.data.alasan),
          status,
          tanggalPengajuan: asText(args.data.tanggalPengajuan, nowIso.slice(0, 10)),
          createdAt: nowIso,
          updatedAt: nowIso,
        };

        if (this.pgReady && this.pgSql) {
          const rows = await this.pgSql<{ payload: unknown }[]>`
            INSERT INTO pengajuan_cuti (
              id, nip, nama, unit_kerja, jenis, mulai, selesai, status, payload
            ) VALUES (
              ${newCuti.id},
              ${newCuti.nip},
              ${newCuti.nama},
              ${newCuti.unitKerja},
              ${newCuti.jenis},
              ${newCuti.mulai},
              ${newCuti.selesai},
              ${newCuti.status},
              ${this.pgSql.json(newCuti as postgres.JSONValue)}
            )
            RETURNING payload
          `;
          return this.parseCutiPayloadRow(rows[0].payload);
        }

        this.loadCutiStorage();
        this.inMemoryCuti.unshift(newCuti);
        this.saveCutiStorage();
        return newCuti;
      },

      update: async (args: {
        where: { id: string };
        data: Record<string, unknown>;
      }): Promise<PengajuanCutiEntity | null> => {
        await this.ensureInitialized();
        if (this.pgReady && this.pgSql) {
          const existing = await this.cuti.findUnique({ where: { id: args.where.id } });
          if (!existing) return null;

          const updatedCuti: PengajuanCutiEntity = {
            ...existing,
            ...(args.data as Partial<PengajuanCutiEntity>),
            id: existing.id,
            updatedAt: new Date().toISOString(),
          };

          const rows = await this.pgSql<{ payload: unknown }[]>`
            UPDATE pengajuan_cuti
            SET
              status = ${String(updatedCuti.status || 'MENUNGGU')},
              payload = ${this.pgSql.json(updatedCuti as postgres.JSONValue)},
              updated_at = NOW()
            WHERE id = ${args.where.id}
            RETURNING payload
          `;
          return rows[0] ? this.parseCutiPayloadRow(rows[0].payload) : null;
        }

        this.loadCutiStorage();
        const index = this.inMemoryCuti.findIndex((item) => item.id === args.where.id);
        if (index !== -1) {
          this.inMemoryCuti[index] = {
            ...this.inMemoryCuti[index],
            ...(args.data as Partial<PengajuanCutiEntity>),
            updatedAt: new Date().toISOString(),
          };
          this.saveCutiStorage();
          return this.inMemoryCuti[index];
        }
        return null;
      },

      delete: async (args: {
        where: { id: string };
      }): Promise<PengajuanCutiEntity | null> => {
        await this.ensureInitialized();
        if (this.pgReady && this.pgSql) {
          const rows = await this.pgSql<{ payload: unknown }[]>`
            DELETE FROM pengajuan_cuti WHERE id = ${args.where.id} RETURNING payload
          `;
          return rows[0] ? this.parseCutiPayloadRow(rows[0].payload) : null;
        }

        this.loadCutiStorage();
        const index = this.inMemoryCuti.findIndex((item) => item.id === args.where.id);
        if (index !== -1) {
          const removed = this.inMemoryCuti.splice(index, 1)[0];
          this.saveCutiStorage();
          return removed;
        }
        return null;
      },
    };
  }

  get pokja() {
    return {
      findMany: async (): Promise<PokjaEntity[]> => {
        await this.ensureInitialized();
        if (this.pgReady && this.pgSql) {
          const rows = await this.pgSql<
            { id: string; kode: string; nama: string; created_at: Date; updated_at: Date }[]
          >`
            SELECT id, kode, nama, created_at, updated_at FROM pokja ORDER BY kode ASC
          `;
          return rows.map((r) => ({
            id: r.id,
            kode: r.kode,
            nama: r.nama,
            createdAt: r.created_at?.toISOString(),
            updatedAt: r.updated_at?.toISOString(),
          }));
        }
        this.loadPokjaStorage();
        return [...this.inMemoryPokja];
      },

      create: async (args: {
        data: { id?: string; kode: string; nama: string };
      }): Promise<PokjaEntity> => {
        await this.ensureInitialized();
        const kode = args.data.kode.trim().toUpperCase();
        const nama = args.data.nama.trim();
        const id = args.data.id?.trim() || `pokja-${Date.now()}`;
        const nowIso = new Date().toISOString();

        if (this.pgReady && this.pgSql) {
          const existing = await this.pgSql<{ id: string }[]>`
            SELECT id FROM pokja WHERE UPPER(kode) = ${kode} LIMIT 1
          `;
          if (existing.length > 0) {
            throw new ConflictException(`Kode POKJA "${kode}" sudah digunakan.`);
          }
          await this.pgSql`
            INSERT INTO pokja (id, kode, nama) VALUES (${id}, ${kode}, ${nama})
          `;
          return { id, kode, nama, createdAt: nowIso, updatedAt: nowIso };
        }

        this.loadPokjaStorage();
        if (this.inMemoryPokja.some((p) => p.kode.toUpperCase() === kode)) {
          throw new ConflictException(`Kode POKJA "${kode}" sudah digunakan.`);
        }
        const created: PokjaEntity = { id, kode, nama, createdAt: nowIso, updatedAt: nowIso };
        this.inMemoryPokja.push(created);
        this.savePokjaStorage();
        return created;
      },

      update: async (args: {
        where: { id: string };
        data: { kode?: string; nama?: string };
      }): Promise<PokjaEntity | null> => {
        await this.ensureInitialized();
        const kode = args.data.kode?.trim().toUpperCase();
        const nama = args.data.nama?.trim();
        const nowIso = new Date().toISOString();

        if (this.pgReady && this.pgSql) {
          const currentRows = await this.pgSql<{ id: string; kode: string; nama: string }[]>`
            SELECT id, kode, nama FROM pokja WHERE id = ${args.where.id} LIMIT 1
          `;
          if (!currentRows[0]) return null;
          const nextKode = kode || currentRows[0].kode;
          const nextNama = nama || currentRows[0].nama;

          const dup = await this.pgSql<{ id: string }[]>`
            SELECT id FROM pokja WHERE UPPER(kode) = ${nextKode} AND id <> ${args.where.id} LIMIT 1
          `;
          if (dup.length > 0) {
            throw new ConflictException(`Kode POKJA "${nextKode}" sudah digunakan.`);
          }

          await this.pgSql`
            UPDATE pokja SET kode = ${nextKode}, nama = ${nextNama}, updated_at = NOW()
            WHERE id = ${args.where.id}
          `;
          return { id: args.where.id, kode: nextKode, nama: nextNama, updatedAt: nowIso };
        }

        this.loadPokjaStorage();
        const idx = this.inMemoryPokja.findIndex((p) => p.id === args.where.id);
        if (idx === -1) return null;
        const nextKode = kode || this.inMemoryPokja[idx].kode;
        const nextNama = nama || this.inMemoryPokja[idx].nama;
        if (this.inMemoryPokja.some((p) => p.kode.toUpperCase() === nextKode && p.id !== args.where.id)) {
          throw new ConflictException(`Kode POKJA "${nextKode}" sudah digunakan.`);
        }
        this.inMemoryPokja[idx] = { ...this.inMemoryPokja[idx], kode: nextKode, nama: nextNama, updatedAt: nowIso };
        this.savePokjaStorage();
        return this.inMemoryPokja[idx];
      },

      delete: async (args: { where: { id: string } }): Promise<PokjaEntity | null> => {
        await this.ensureInitialized();
        if (this.pgReady && this.pgSql) {
          const rows = await this.pgSql<{ id: string; kode: string; nama: string }[]>`
            DELETE FROM pokja WHERE id = ${args.where.id} RETURNING id, kode, nama
          `;
          return rows[0] ? { id: rows[0].id, kode: rows[0].kode, nama: rows[0].nama } : null;
        }
        this.loadPokjaStorage();
        const idx = this.inMemoryPokja.findIndex((p) => p.id === args.where.id);
        if (idx === -1) return null;
        const removed = this.inMemoryPokja.splice(idx, 1)[0];
        this.savePokjaStorage();
        return removed;
      },
    };
  }

  get notifikasi() {
    return {
      findMany: async (targetRole?: string): Promise<NotifikasiEntity[]> => {
        await this.ensureInitialized();
        const roleFilter = targetRole?.trim().toUpperCase();
        if (this.pgReady && this.pgSql) {
          const rows = roleFilter
            ? await this.pgSql<
                {
                  id: string;
                  target_role: string;
                  title: string;
                  description: string;
                  time_label: string;
                  unread: boolean;
                  category: string;
                }[]
              >`
                SELECT id, target_role, title, description, time_label, unread, category
                FROM notifikasi
                WHERE UPPER(target_role) = ${roleFilter}
                ORDER BY created_at DESC
              `
            : await this.pgSql<
                {
                  id: string;
                  target_role: string;
                  title: string;
                  description: string;
                  time_label: string;
                  unread: boolean;
                  category: string;
                }[]
              >`
                SELECT id, target_role, title, description, time_label, unread, category
                FROM notifikasi
                ORDER BY created_at DESC
              `;
          return rows.map((r) => ({
            id: r.id,
            targetRole: r.target_role,
            title: r.title,
            desc: r.description,
            time: r.time_label,
            unread: r.unread,
            category: r.category,
          }));
        }
        this.loadNotifikasiStorage();
        return roleFilter
          ? this.inMemoryNotifikasi.filter((n) => n.targetRole.toUpperCase() === roleFilter)
          : [...this.inMemoryNotifikasi];
      },

      create: async (args: {
        data: Partial<NotifikasiEntity>;
      }): Promise<NotifikasiEntity> => {
        await this.ensureInitialized();
        const created: NotifikasiEntity = {
          id: args.data.id?.trim() || `notif-${Date.now()}`,
          targetRole: (args.data.targetRole || 'USER').toUpperCase(),
          title: asText(args.data.title, 'Notifikasi'),
          desc: asText(args.data.desc),
          time: asText(args.data.time, 'Baru saja'),
          unread: args.data.unread !== undefined ? Boolean(args.data.unread) : true,
          category: asText(args.data.category, 'SISTEM'),
        };

        if (this.pgReady && this.pgSql) {
          await this.pgSql`
            INSERT INTO notifikasi (
              id, target_role, title, description, time_label, unread, category
            ) VALUES (
              ${created.id},
              ${created.targetRole},
              ${created.title},
              ${created.desc},
              ${created.time},
              ${created.unread},
              ${created.category}
            )
          `;
          return created;
        }

        this.loadNotifikasiStorage();
        this.inMemoryNotifikasi.unshift(created);
        this.saveNotifikasiStorage();
        return created;
      },

      update: async (args: {
        where: { id: string };
        data: { unread?: boolean };
      }): Promise<NotifikasiEntity | null> => {
        await this.ensureInitialized();
        if (this.pgReady && this.pgSql) {
          const rows = await this.pgSql<
            {
              id: string;
              target_role: string;
              title: string;
              description: string;
              time_label: string;
              unread: boolean;
              category: string;
            }[]
          >`
            UPDATE notifikasi
            SET unread = ${Boolean(args.data.unread)}, updated_at = NOW()
            WHERE id = ${args.where.id}
            RETURNING id, target_role, title, description, time_label, unread, category
          `;
          const r = rows[0];
          return r
            ? {
                id: r.id,
                targetRole: r.target_role,
                title: r.title,
                desc: r.description,
                time: r.time_label,
                unread: r.unread,
                category: r.category,
              }
            : null;
        }

        this.loadNotifikasiStorage();
        const idx = this.inMemoryNotifikasi.findIndex((n) => n.id === args.where.id);
        if (idx === -1) return null;
        this.inMemoryNotifikasi[idx] = {
          ...this.inMemoryNotifikasi[idx],
          unread: Boolean(args.data.unread),
        };
        this.saveNotifikasiStorage();
        return this.inMemoryNotifikasi[idx];
      },

      markAllRead: async (targetRole?: string): Promise<void> => {
        await this.ensureInitialized();
        const roleFilter = targetRole?.trim().toUpperCase();
        if (this.pgReady && this.pgSql) {
          if (roleFilter) {
            await this.pgSql`
              UPDATE notifikasi SET unread = FALSE, updated_at = NOW()
              WHERE UPPER(target_role) = ${roleFilter}
            `;
          } else {
            await this.pgSql`UPDATE notifikasi SET unread = FALSE, updated_at = NOW()`;
          }
          return;
        }
        this.loadNotifikasiStorage();
        this.inMemoryNotifikasi = this.inMemoryNotifikasi.map((n) =>
          !roleFilter || n.targetRole.toUpperCase() === roleFilter
            ? { ...n, unread: false }
            : n,
        );
        this.saveNotifikasiStorage();
      },

      delete: async (args: { where: { id: string } }): Promise<boolean> => {
        await this.ensureInitialized();
        if (this.pgReady && this.pgSql) {
          const rows = await this.pgSql<{ id: string }[]>`
            DELETE FROM notifikasi WHERE id = ${args.where.id} RETURNING id
          `;
          return rows.length > 0;
        }
        this.loadNotifikasiStorage();
        const before = this.inMemoryNotifikasi.length;
        this.inMemoryNotifikasi = this.inMemoryNotifikasi.filter((n) => n.id !== args.where.id);
        this.saveNotifikasiStorage();
        return this.inMemoryNotifikasi.length < before;
      },

      clearAll: async (targetRole?: string): Promise<void> => {
        await this.ensureInitialized();
        const roleFilter = targetRole?.trim().toUpperCase();
        if (this.pgReady && this.pgSql) {
          if (roleFilter) {
            await this.pgSql`
              DELETE FROM notifikasi WHERE UPPER(target_role) = ${roleFilter}
            `;
          } else {
            await this.pgSql`DELETE FROM notifikasi`;
          }
          return;
        }
        this.loadNotifikasiStorage();
        this.inMemoryNotifikasi = roleFilter
          ? this.inMemoryNotifikasi.filter((n) => n.targetRole.toUpperCase() !== roleFilter)
          : [];
        this.saveNotifikasiStorage();
      },
    };
  }
}
