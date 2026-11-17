import React, { createContext, useState, useEffect } from 'react';
import type { Pegawai, UnitKerjaType } from '@/types';
import { dummyPegawaiList } from '@/data/dummyData';

export interface AuthContextType {
  user: Pegawai | null;
  isAuthenticated: boolean;
  login: (usernameOrNip: string, password: string) => { success: boolean; message?: string };
  updateCredentials: (data: { username: string; currentPassword: string; newPassword: string }) => { success: boolean; message?: string };
  getDemoCredentials: () => { username: string; password: string };
  logout: () => void;
}

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'sim_penugasan_user';
const CREDENTIALS_STORAGE_KEY = 'sim_penugasan_credentials';
const ROLE_CREDENTIALS_STORAGE_KEY = 'sim_penugasan_role_credentials';
const AKUNS_STORAGE_KEY = 'sim_penugasan_akuns';
const DEFAULT_CREDENTIALS = { username: 'yadiyudi', password: 'password123' };

type ValidRole = NonNullable<Pegawai['role']>;

interface StoredCredentialEntry {
  username: string;
  password: string;
  role: ValidRole;
  userId: string;
}

interface StoredAkun {
  id: number | string;
  nama: string;
  nip: string;
  username: string;
  level: string;
  password?: string;
}

const VALID_ROLES: ReadonlySet<ValidRole> = new Set<ValidRole>([
  'SUPER_ADMIN',
  'ADMIN',
  'PEGAWAI',
  'APPROVAL',
  'USER',
]);

const VALID_UNITS: ReadonlySet<UnitKerjaType> = new Set<UnitKerjaType>([
  'RBI',
  'Fastingkom',
  'Kepeg',
  'PM',
]);

const RESERVED_ROLE_USERNAMES: ReadonlySet<string> = new Set([
  'superadmin',
  'admin',
  'approval',
  'user',
  'pegawai',
]);

const isValidRole = (role: unknown): role is ValidRole =>
  typeof role === 'string' && VALID_ROLES.has(role as ValidRole);

const isValidUnitKerja = (unit: unknown): unit is UnitKerjaType =>
  typeof unit === 'string' && VALID_UNITS.has(unit as UnitKerjaType);

const mapLevelToRole = (level?: string): ValidRole => {
  const normalized = (level || '').trim().toUpperCase().replace(/\s+/g, '_');
  if (normalized === 'SUPER_ADMIN' || normalized === 'SUPERADMIN') return 'SUPER_ADMIN';
  if (normalized === 'ADMIN' || normalized === 'ADMIN_UNIT_KERJA') return 'ADMIN';
  if (normalized === 'APPROVAL') return 'APPROVAL';
  if (normalized === 'PEGAWAI') return 'PEGAWAI';
  return 'USER';
};

const getPegawaiByIdOrFallback = (id: string, fallbackIndex: number): Pegawai =>
  dummyPegawaiList.find((p) => p.id === id) || dummyPegawaiList[fallbackIndex] || dummyPegawaiList[0];

const resolveAvatar = (fotoAvatar: unknown, fallbackAvatar?: string): string => {
  if (typeof fotoAvatar === 'string' && fotoAvatar.trim() && !fotoAvatar.includes('unsplash')) {
    return fotoAvatar;
  }
  if (fallbackAvatar && !fallbackAvatar.includes('unsplash')) {
    return fallbackAvatar;
  }
  return `${import.meta.env.BASE_URL}pp-navbar-2.jpg`;
};

const getCredentials = (): { username: string; password: string } => {
  try {
    const saved = localStorage.getItem(CREDENTIALS_STORAGE_KEY);
    if (!saved) return DEFAULT_CREDENTIALS;
    const parsed: unknown = JSON.parse(saved);
    if (parsed && typeof parsed === 'object') {
      const rec = parsed as Record<string, unknown>;
      return {
        username:
          typeof rec.username === 'string' && rec.username.trim()
            ? rec.username.trim()
            : DEFAULT_CREDENTIALS.username,
        password:
          typeof rec.password === 'string' && rec.password
            ? rec.password
            : DEFAULT_CREDENTIALS.password,
      };
    }
    return DEFAULT_CREDENTIALS;
  } catch {
    return DEFAULT_CREDENTIALS;
  }
};

const getRoleCredentialsMap = (): Record<string, StoredCredentialEntry> => {
  try {
    const saved = localStorage.getItem(ROLE_CREDENTIALS_STORAGE_KEY);
    if (!saved) return {};
    const parsed: unknown = JSON.parse(saved);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    const result: Record<string, StoredCredentialEntry> = {};
    for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
      if (!value || typeof value !== 'object') continue;
      const entry = value as Record<string, unknown>;
      if (
        typeof entry.username === 'string' &&
        typeof entry.password === 'string' &&
        isValidRole(entry.role) &&
        typeof entry.userId === 'string'
      ) {
        result[key] = {
          username: entry.username,
          password: entry.password,
          role: entry.role,
          userId: entry.userId,
        };
      }
    }
    return result;
  } catch {
    return {};
  }
};

const getStoredAkuns = (): StoredAkun[] => {
  try {
    const saved = localStorage.getItem(AKUNS_STORAGE_KEY);
    if (!saved) return [];
    const parsed: unknown = JSON.parse(saved);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is StoredAkun => {
      if (!item || typeof item !== 'object') return false;
      const rec = item as Record<string, unknown>;
      return typeof rec.username === 'string' && typeof rec.level === 'string';
    });
  } catch {
    return [];
  }
};

/** Memulihkan profil pegawai yang benar untuk sesi lama yang terkorupsi dengan id 'peg-01'. */
const healLegacyPegawaiSession = (
  rec: Partial<Pegawai> & Record<string, unknown>,
  targetId: string,
  fallbackIndex: number,
  targetRole: ValidRole,
  defaultUsername: string,
): Pegawai => {
  const base = getPegawaiByIdOrFallback(targetId, fallbackIndex);
  const rawId = typeof rec.id === 'string' ? rec.id.trim() : '';
  const rawNama = typeof rec.nama === 'string' ? rec.nama.trim() : '';
  const rawUsername = typeof rec.username === 'string' ? rec.username.trim() : '';
  const lowerNama = rawNama.toLowerCase();
  const keepStoredIdentity =
    rawId !== 'peg-01' && !!rawNama && lowerNama !== 'taryadi' && !lowerNama.includes('(approval)');

  return {
    ...base,
    id: base.id,
    nama: keepStoredIdentity ? rawNama : base.nama,
    nip: rawId !== 'peg-01' && typeof rec.nip === 'string' && rec.nip.trim() ? rec.nip : base.nip,
    unitKerja: rawId !== 'peg-01' && isValidUnitKerja(rec.unitKerja) ? rec.unitKerja : base.unitKerja,
    jabatan:
      rawId !== 'peg-01' && typeof rec.jabatan === 'string' && rec.jabatan.trim()
        ? rec.jabatan
        : base.jabatan,
    fotoAvatar: resolveAvatar(rec.fotoAvatar, base.fotoAvatar),
    username: rawUsername || defaultUsername,
    role: targetRole,
  };
};

/**
 * Menormalkan data sesi user yang tersimpan di localStorage agar role dan identitas
 * tidak tertimpa menjadi SUPER_ADMIN saat halaman di-refresh, sekaligus memulihkan
 * sesi lama yang terkorupsi akibat penggunaan ID 'peg-01' untuk semua role quick-login.
 */
const normalizeStoredUser = (raw: unknown): Pegawai | null => {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;

  const rec = raw as Partial<Pegawai> & Record<string, unknown>;
  const rawId = typeof rec.id === 'string' ? rec.id.trim() : '';
  const rawNama = typeof rec.nama === 'string' ? rec.nama.trim() : '';
  const rawUsername = typeof rec.username === 'string' ? rec.username.trim() : '';
  const lowerNama = rawNama.toLowerCase();
  const lowerUsername = rawUsername.toLowerCase();
  const rawRoleUpper = typeof rec.role === 'string' ? rec.role.trim().toUpperCase() : '';

  if (!rawNama && !rawUsername && !rawId) return null;

  // 1. Auto-heal hanya jika sesi lama masih memakai id 'peg-01' (atau tanpa id) untuk role non-SuperAdmin
  const isLegacyPeg01 = !rawId || rawId === 'peg-01';
  if (isLegacyPeg01) {
    const isApprovalHint =
      lowerUsername === 'approval' ||
      lowerNama.includes('(approval)') ||
      lowerNama.includes('kepala subbagian') ||
      rawRoleUpper === 'APPROVAL';
    if (isApprovalHint) {
      return healLegacyPegawaiSession(rec, 'peg-03', 2, 'APPROVAL', 'approval');
    }

    const isUserHint =
      lowerUsername === 'user' ||
      lowerUsername === 'pegawai' ||
      lowerNama === 'pegawai pelaksana' ||
      rawRoleUpper === 'USER' ||
      rawRoleUpper === 'PEGAWAI';
    if (isUserHint) {
      return healLegacyPegawaiSession(rec, 'peg-08', 7, 'USER', 'user');
    }

    const isAdminHint =
      lowerUsername === 'admin' ||
      lowerNama === 'admin operasional' ||
      rawRoleUpper === 'ADMIN';
    if (isAdminHint) {
      return healLegacyPegawaiSession(rec, 'peg-02', 1, 'ADMIN', 'admin');
    }

    // Super Admin eksplisit (memang akun Taryadi / superadmin)
    const base = getPegawaiByIdOrFallback('peg-01', 0);
    return {
      ...base,
      id: base.id,
      nama: rawNama || base.nama,
      nip: typeof rec.nip === 'string' && rec.nip.trim() ? rec.nip : base.nip,
      unitKerja: isValidUnitKerja(rec.unitKerja) ? rec.unitKerja : base.unitKerja,
      jabatan: typeof rec.jabatan === 'string' && rec.jabatan.trim() ? rec.jabatan : base.jabatan,
      fotoAvatar: resolveAvatar(rec.fotoAvatar, base.fotoAvatar),
      username: rawUsername || 'superadmin',
      role: 'SUPER_ADMIN',
    };
  }

  // 2. Pegawai lain dari database dummyPegawaiList atau akun baru dari Manajemen Akun
  const matchedPegawai = dummyPegawaiList.find((p) => p.id === rawId);
  const resolvedRole: ValidRole = isValidRole(rawRoleUpper)
    ? rawRoleUpper
    : matchedPegawai?.role && isValidRole(matchedPegawai.role)
      ? matchedPegawai.role
      : 'USER';

  const finalNama =
    rawId === 'peg-07'
      ? 'Arnest, S.Kom.'
      : rawNama || matchedPegawai?.nama || rawUsername;

  return {
    ...(matchedPegawai || {}),
    id: rawId,
    nama: finalNama,
    nip: typeof rec.nip === 'string' && rec.nip.trim() ? rec.nip : matchedPegawai?.nip || '-',
    unitKerja: isValidUnitKerja(rec.unitKerja)
      ? rec.unitKerja
      : matchedPegawai?.unitKerja || 'RBI',
    jabatan:
      typeof rec.jabatan === 'string' && rec.jabatan.trim()
        ? rec.jabatan
        : matchedPegawai?.jabatan || 'Pegawai',
    pangkatGolongan:
      typeof rec.pangkatGolongan === 'string' ? rec.pangkatGolongan : matchedPegawai?.pangkatGolongan,
    telepon: typeof rec.telepon === 'string' ? rec.telepon : matchedPegawai?.telepon,
    email: typeof rec.email === 'string' ? rec.email : matchedPegawai?.email,
    fotoAvatar: resolveAvatar(rec.fotoAvatar, matchedPegawai?.fotoAvatar),
    username: rawUsername || matchedPegawai?.username,
    role: resolvedRole,
  };
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Pegawai | null>(() => {
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        const parsed: unknown = JSON.parse(stored);
        return normalizeStoredUser(parsed);
      }
    } catch {
      // fallback
    }
    // Pengunjung baru harus melewati halaman login terlebih dahulu.
    return null;
  });

  const isAuthenticated = !!user;

  const login = (usernameOrNip: string, password: string) => {
    const cleanInput = usernameOrNip.trim().toLowerCase();
    if (!cleanInput) {
      return { success: false, message: 'Username / NIP wajib diisi.' };
    }
    if (!password.trim()) {
      return { success: false, message: 'Password wajib diisi.' };
    }

    const credentials = getCredentials();
    const roleCredentialsMap = getRoleCredentialsMap();
    const akuns = getStoredAkuns();

    const matchedCustomCred = Object.values(roleCredentialsMap).find(
      (entry) => entry.username.trim().toLowerCase() === cleanInput,
    );
    const isCustomSuperAdminUsername = cleanInput === credentials.username.toLowerCase();

    if (matchedCustomCred && password !== matchedCustomCred.password) {
      return { success: false, message: 'Password tidak sesuai.' };
    }
    if (!matchedCustomCred && isCustomSuperAdminUsername && password !== credentials.password) {
      return { success: false, message: 'Password tidak sesuai.' };
    }

    const matchedAkun = akuns.find(
      (a) =>
        a.username.trim().toLowerCase() === cleanInput ||
        (a.nip && a.nip.trim().toLowerCase() === cleanInput),
    );
    if (matchedAkun?.password && matchedAkun.password !== '***' && password !== matchedAkun.password) {
      return { success: false, message: 'Password tidak sesuai.' };
    }

    const commitLogin = (pegawai: Pegawai) => {
      const safePegawai: Pegawai = {
        ...pegawai,
        fotoAvatar: resolveAvatar(pegawai.fotoAvatar),
      };
      delete safePegawai.password;
      setUser(safePegawai);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(safePegawai));
      return { success: true };
    };

    // 1. Jika login dengan kredensial ubahan per-user dari halaman Profil
    if (matchedCustomCred) {
      const targetBase =
        dummyPegawaiList.find((p) => p.id === matchedCustomCred.userId) ||
        getPegawaiByIdOrFallback('peg-01', 0);
      return commitLogin({
        ...targetBase,
        id: matchedCustomCred.userId,
        role: matchedCustomCred.role,
        username: matchedCustomCred.username,
      });
    }

    // 2. Pencarian exact pegawai di tabel database (username, NIP, prefix email, nama lengkap)
    const exactPegawai = dummyPegawaiList.find((p) => {
      const nipMatch = p.nip.toLowerCase() === cleanInput;
      const emailPrefixMatch = p.email?.toLowerCase().split('@')[0] === cleanInput;
      const usernameMatch = p.username?.toLowerCase() === cleanInput;
      const exactNameMatch = p.nama.toLowerCase() === cleanInput;
      return nipMatch || emailPrefixMatch || usernameMatch || exactNameMatch;
    });

    if (exactPegawai) {
      const expectedPwd = exactPegawai.password?.trim();
      if (expectedPwd && expectedPwd !== '***' && password !== expectedPwd) {
        return { success: false, message: 'Password tidak sesuai.' };
      }
      return commitLogin({
        ...exactPegawai,
        username: exactPegawai.username || exactPegawai.email?.split('@')[0] || cleanInput,
      });
    }

    // 3. Login eksplisit berdasarkan role quick-login & akun utama Super Admin
    if (cleanInput === 'superadmin' || isCustomSuperAdminUsername) {
      const base = getPegawaiByIdOrFallback('peg-01', 0);
      return commitLogin({
        ...base,
        role: 'SUPER_ADMIN',
        username: cleanInput === 'superadmin' ? 'superadmin' : credentials.username,
      });
    }

    if (cleanInput === 'admin') {
      const base = getPegawaiByIdOrFallback('peg-02', 1);
      const resolvedRole = matchedAkun ? mapLevelToRole(matchedAkun.level) : base.role || 'ADMIN';
      return commitLogin({
        ...base,
        role: resolvedRole,
        username: 'admin',
      });
    }

    if (cleanInput === 'approval') {
      const base = getPegawaiByIdOrFallback('peg-03', 2);
      const resolvedRole = matchedAkun ? mapLevelToRole(matchedAkun.level) : base.role || 'APPROVAL';
      return commitLogin({
        ...base,
        role: resolvedRole,
        username: 'approval',
      });
    }

    if (cleanInput === 'user' || cleanInput === 'pegawai') {
      const base = getPegawaiByIdOrFallback('peg-08', 7);
      const resolvedRole = matchedAkun ? mapLevelToRole(matchedAkun.level) : base.role || 'USER';
      return commitLogin({
        ...base,
        role: resolvedRole,
        username: cleanInput,
      });
    }

    // 4. Akun tambahan warisan dari sim_penugasan_akuns (jika masih ada)
    if (matchedAkun) {
      const mappedRole = mapLevelToRole(matchedAkun.level);
      const linkedPegawai = dummyPegawaiList.find(
        (p) =>
          (matchedAkun.nip && p.nip.toLowerCase() === matchedAkun.nip.trim().toLowerCase()) ||
          p.nama.toLowerCase() === matchedAkun.nama.trim().toLowerCase(),
      );
      if (linkedPegawai) {
        return commitLogin({
          ...linkedPegawai,
          role: mappedRole,
          username: matchedAkun.username,
        });
      }
      return commitLogin({
        id: `akun-${matchedAkun.id}`,
        nama: matchedAkun.nama || matchedAkun.username,
        nip: matchedAkun.nip || '-',
        unitKerja: 'RBI',
        jabatan: matchedAkun.level || 'Pegawai',
        fotoAvatar: `${import.meta.env.BASE_URL}pp-navbar-2.jpg`,
        username: matchedAkun.username,
        role: mappedRole,
      });
    }

    // 5. Pencarian parsial nama pegawai (minimal 3 karakter agar 1 huruf tidak cocok ke Super Admin)
    if (cleanInput.length >= 3) {
      const partialPegawai = dummyPegawaiList.find((p) =>
        p.nama.toLowerCase().includes(cleanInput),
      );
      if (partialPegawai) {
        const expectedPwd = partialPegawai.password?.trim();
        if (expectedPwd && expectedPwd !== '***' && password !== expectedPwd) {
          return { success: false, message: 'Password tidak sesuai.' };
        }
        return commitLogin({
          ...partialPegawai,
          username: partialPegawai.username || partialPegawai.email?.split('@')[0] || cleanInput,
        });
      }
    }

    return { success: false, message: 'Username / NIP tidak ditemukan dalam database.' };
  };

  const updateCredentials: AuthContextType['updateCredentials'] = ({ username, currentPassword, newPassword }) => {
    const trimmedUsername = username.trim();
    const lowerNewUsername = trimmedUsername.toLowerCase();
    const activeUserId = user?.id || 'peg-01';
    const activeRole: ValidRole = isValidRole(user?.role) ? user.role : 'SUPER_ADMIN';
    const currentUsernameLower = (user?.username || '').trim().toLowerCase();
    const roleCredentialsMap = getRoleCredentialsMap();
    const superCredentials = getCredentials();
    const expectedPassword =
      roleCredentialsMap[activeUserId]?.password ||
      (activeRole === 'SUPER_ADMIN' ? superCredentials.password : DEFAULT_CREDENTIALS.password);

    if (!trimmedUsername) return { success: false, message: 'Username wajib diisi.' };
    if (RESERVED_ROLE_USERNAMES.has(lowerNewUsername) && lowerNewUsername !== currentUsernameLower) {
      return { success: false, message: 'Username tersebut dicadangkan untuk login role bawaan sistem.' };
    }
    const usedByOtherUser = Object.values(roleCredentialsMap).some(
      (entry) => entry.userId !== activeUserId && entry.username.trim().toLowerCase() === lowerNewUsername,
    );
    const usedBySuperAdmin =
      activeRole !== 'SUPER_ADMIN' && superCredentials.username.trim().toLowerCase() === lowerNewUsername;
    if (usedByOtherUser || usedBySuperAdmin) {
      return { success: false, message: 'Username tersebut sudah digunakan oleh akun lain.' };
    }
    if (currentPassword !== expectedPassword) return { success: false, message: 'Password lama tidak sesuai.' };
    if (!newPassword || newPassword.length < 6) return { success: false, message: 'Password baru minimal 6 karakter.' };

    const nextRoleCreds: Record<string, StoredCredentialEntry> = {
      ...roleCredentialsMap,
      [activeUserId]: {
        username: trimmedUsername,
        password: newPassword,
        role: activeRole,
        userId: activeUserId,
      },
    };
    localStorage.setItem(ROLE_CREDENTIALS_STORAGE_KEY, JSON.stringify(nextRoleCreds));

    if (activeRole === 'SUPER_ADMIN') {
      localStorage.setItem(
        CREDENTIALS_STORAGE_KEY,
        JSON.stringify({ username: trimmedUsername, password: newPassword }),
      );
    }

    setUser((currentUser) => (currentUser ? { ...currentUser, username: trimmedUsername } : currentUser));
    return { success: true, message: 'Username dan password berhasil diperbarui.' };
  };

  const getDemoCredentials = () => {
    if (user?.id) {
      const roleEntry = getRoleCredentialsMap()[user.id];
      if (roleEntry) {
        return { username: roleEntry.username, password: roleEntry.password };
      }
      if (user.role && user.role !== 'SUPER_ADMIN') {
        return {
          username: user.username || user.email?.split('@')[0] || user.nip,
          password: DEFAULT_CREDENTIALS.password,
        };
      }
    }
    return getCredentials();
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
  };

  useEffect(() => {
    if (user) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, updateCredentials, getDemoCredentials, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
