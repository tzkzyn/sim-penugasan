import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import type {
  AjuanSuratTugas,
  Pegawai,
  StatusSuratTugas,
  TemplateSuratResmi,
  UnitKerjaType,
} from '@/types';
import { apiService } from '@/api/apiService';
import { dummyAjuanSuratTugas, dummyPegawaiList, syncDummyPegawaiList } from '@/data/dummyData';
import { useAuth } from '@/hooks/useAuth';
import { DEFAULT_STARTER_TEMPLATE_HTML } from '@/utils/docxImport';
import { downloadFileUrl } from '@/utils/penugasanHelpers';

const TEMPLATE_STORAGE_KEY = 'sim_penugasan_approval_templates';

interface PenugasanActionResult<T = void> {
  success: boolean;
  data?: T;
  message?: string;
}

interface PenugasanContextType {
  tasks: AjuanSuratTugas[];
  myTasks: AjuanSuratTugas[];
  pegawaiList: Pegawai[];
  templates: TemplateSuratResmi[];
  isLoading: boolean;
  createTask: (newTaskData: Partial<AjuanSuratTugas>) => Promise<AjuanSuratTugas>;
  updateTaskStatus: (id: string, status: string) => Promise<void>;
  updateTask: (id: string, updatedData: Partial<AjuanSuratTugas>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  refreshTasks: () => Promise<void>;
  addPegawai: (newPegawaiData: Partial<Pegawai>) => Promise<PenugasanActionResult<Pegawai>>;
  updatePegawai: (id: string, updatedData: Partial<Pegawai>) => Promise<PenugasanActionResult<Pegawai>>;
  deletePegawai: (id: string) => Promise<PenugasanActionResult>;
  refreshPegawai: () => Promise<void>;
  saveTemplate: (
    tpl: Omit<TemplateSuratResmi, 'id' | 'diperbaruiPada'> & { id?: string },
  ) => Promise<{ data: TemplateSuratResmi; persistedToDb: boolean }>;
  deleteTemplate: (id: string) => Promise<void>;
  toggleTemplateActive: (id: string) => Promise<void>;
  refreshTemplates: () => Promise<void>;
  downloadTemplateDocx: (tpl: TemplateSuratResmi) => Promise<boolean>;
}

const isPegawaiMatch = (target: Pegawai | undefined, currentUser: Pegawai | null): boolean => {
  if (!target || !currentUser) return false;

  const targetNama = (target.nama || '').trim().toLowerCase();
  const currentNama = (currentUser.nama || '').trim().toLowerCase();
  const targetUsername = (target.username || '').trim().toLowerCase();
  const currentUsername = (currentUser.username || '').trim().toLowerCase();

  // Cegah data tugas lama yang sempat memakai id 'peg-01' untuk non-Taryadi bocor ke user lain / Taryadi
  const isLegacyCorruptedPeg01 = target.id === 'peg-01' && targetNama !== 'taryadi';
  if (isLegacyCorruptedPeg01) {
    const matchByUsername = Boolean(targetUsername && currentUsername && targetUsername === currentUsername);
    const matchByNama = Boolean(targetNama && currentNama && targetNama === currentNama);
    return matchByUsername || matchByNama;
  }

  if (target.id && currentUser.id && target.id === currentUser.id) return true;

  const targetNip = (target.nip || '').trim();
  const currentNip = (currentUser.nip || '').trim();
  if (targetNip && currentNip && targetNip !== '-' && targetNip === currentNip) return true;

  if (targetUsername && currentUsername && targetUsername === currentUsername) return true;
  if (targetNama && currentNama && targetNama === currentNama) return true;

  return false;
};

const PenugasanContext = createContext<PenugasanContextType | undefined>(undefined);

const normalizeTaskRecord = (raw: unknown): AjuanSuratTugas | null => {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const rec = raw as Partial<AjuanSuratTugas> & Record<string, unknown>;
  const id = typeof rec.id === 'string' ? rec.id : typeof rec.id === 'number' ? String(rec.id) : '';
  const perihal = typeof rec.perihal === 'string' ? rec.perihal : 'Penugasan';
  if (!id || id.startsWith('TUGAS-TEST') || id.startsWith('TUGAS-REJECT')) return null;
  if (perihal.includes('Uji Coba') || perihal.includes('Test')) return null;

  const fallbackPengaju = dummyPegawaiList[0];
  const rawPengaju = rec.pengaju && typeof rec.pengaju === 'object' ? (rec.pengaju as Pegawai) : fallbackPengaju;
  const pegawaiDitugaskan = Array.isArray(rec.pegawaiDitugaskan)
    ? rec.pegawaiDitugaskan.filter((p): p is Pegawai => Boolean(p && typeof p === 'object'))
    : [];
  const workflow = Array.isArray(rec.workflow)
    ? rec.workflow.filter((w) => Boolean(w && typeof w === 'object'))
    : [];
  const koordinat: [number, number] =
    Array.isArray(rec.koordinat) &&
    rec.koordinat.length === 2 &&
    typeof rec.koordinat[0] === 'number' &&
    typeof rec.koordinat[1] === 'number'
      ? [rec.koordinat[0], rec.koordinat[1]]
      : [-6.9147, 107.6098];

  return {
    ...rec,
    id,
    nomorSurat: typeof rec.nomorSurat === 'string' ? rec.nomorSurat : '-',
    perihal,
    pengaju: rawPengaju,
    pegawaiDitugaskan,
    unitKerja: (typeof rec.unitKerja === 'string' && rec.unitKerja ? rec.unitKerja : 'RBI') as UnitKerjaType,
    tanggalMulai: typeof rec.tanggalMulai === 'string' ? rec.tanggalMulai : '',
    tanggalSelesai: typeof rec.tanggalSelesai === 'string' ? rec.tanggalSelesai : '',
    lokasiPenugasan: typeof rec.lokasiPenugasan === 'string' ? rec.lokasiPenugasan : '',
    deskripsi: typeof rec.deskripsi === 'string' ? rec.deskripsi : '',
    koordinat,
    status: (typeof rec.status === 'string' && rec.status ? rec.status : 'DRAFT') as StatusSuratTugas,
    workflow,
  };
};

const normalizeTaskList = (rawList: unknown): AjuanSuratTugas[] => {
  if (!Array.isArray(rawList)) return dummyAjuanSuratTugas;
  return rawList.map(normalizeTaskRecord).filter((t): t is AjuanSuratTugas => t !== null);
};

const normalizeTemplateList = (rawList: unknown): TemplateSuratResmi[] => {
  if (!Array.isArray(rawList)) return [];
  return rawList
    .filter((item): item is TemplateSuratResmi => {
      if (!item || typeof item !== 'object' || Array.isArray(item)) return false;
      const rec = item as Partial<TemplateSuratResmi>;
      return typeof rec.id === 'string' && typeof rec.namaTemplate === 'string' && typeof rec.kontenHtml === 'string';
    })
    .map((item) => {
      const needsCleanHtml =
        !item.kontenHtml.trim() ||
        item.kontenHtml.includes('data:image/') ||
        !item.kontenHtml.includes('{{');
      return {
        ...item,
        hasFileDocx: Boolean(item.hasFileDocx || item.fileDocxDataUrl || item.fileNamaAsli),
        kontenHtml: needsCleanHtml ? DEFAULT_STARTER_TEMPLATE_HTML : item.kontenHtml,
        sertakanKopResmi: needsCleanHtml ? true : item.sertakanKopResmi,
      };
    });
};

export const PenugasanProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<AjuanSuratTugas[]>(() => {
    try {
      const saved = localStorage.getItem('sim_penugasan_live_tasks');
      if (saved) {
        const parsed: unknown = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return normalizeTaskList(parsed);
        }
      }
      return dummyAjuanSuratTugas;
    } catch {
      return dummyAjuanSuratTugas;
    }
  });
  const [pegawaiList, setPegawaiList] = useState<Pegawai[]>(() => [...dummyPegawaiList]);
  const [templates, setTemplates] = useState<TemplateSuratResmi[]>(() => {
    try {
      const saved = localStorage.getItem(TEMPLATE_STORAGE_KEY);
      if (saved) {
        const parsed: unknown = JSON.parse(saved);
        return normalizeTemplateList(parsed);
      }
    } catch {
      // ignore storage errors
    }
    return [];
  });
  const [isLoading, setIsLoading] = useState(false);

  const syncTemplates = useCallback((nextTemplates: TemplateSuratResmi[]) => {
    setTemplates(nextTemplates);
    try {
      const lightweight = nextTemplates.map((item) => {
        const copy = {
          ...item,
          hasFileDocx: Boolean(item.hasFileDocx || item.fileDocxDataUrl || item.fileNamaAsli),
        };
        delete copy.fileDocxDataUrl;
        return copy;
      });
      localStorage.setItem(TEMPLATE_STORAGE_KEY, JSON.stringify(lightweight));
    } catch {
      // ignore storage errors
    }
  }, []);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === TEMPLATE_STORAGE_KEY && e.newValue) {
        try {
          const parsed: unknown = JSON.parse(e.newValue);
          setTemplates(normalizeTemplateList(parsed));
        } catch {
          // ignore
        }
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const syncTasks = useCallback((taskList: AjuanSuratTugas[]) => {
    setTasks(taskList);
    try {
      localStorage.setItem('sim_penugasan_live_tasks', JSON.stringify(taskList));
    } catch {
      // ignore storage errors
    }
  }, []);

  const syncPegawai = useCallback((nextList: Pegawai[]) => {
    setPegawaiList(nextList);
    syncDummyPegawaiList(nextList);
  }, []);

  const refreshTasks = useCallback(async () => {
    try {
      const res = await apiService.getTugas();
      if (res.success && Array.isArray(res.data)) {
        syncTasks(normalizeTaskList(res.data));
      }
    } catch {
      // fallback to current tasks
    }
  }, [syncTasks]);

  const refreshPegawai = useCallback(async () => {
    try {
      const res = await apiService.getPegawai();
      if (res.success && Array.isArray(res.data)) {
        syncPegawai(res.data);
      }
    } catch {
      // fallback to local pegawai list
    }
  }, [syncPegawai]);

  const refreshTemplates = useCallback(async () => {
    try {
      const res = await apiService.getTemplates();
      if (res.success && Array.isArray(res.data)) {
        const normalized = normalizeTemplateList(res.data);
        setTemplates((prev) => {
          const merged = normalized.map((item) => {
            const existing = prev.find((p) => p.id === item.id);
            return {
              ...item,
              fileDocxDataUrl: item.fileDocxDataUrl || existing?.fileDocxDataUrl,
              hasFileDocx: Boolean(
                item.hasFileDocx || item.fileDocxDataUrl || existing?.fileDocxDataUrl || item.fileNamaAsli,
              ),
            };
          });
          try {
            const lightweight = merged.map((tpl) => {
              const copy = { ...tpl };
              delete copy.fileDocxDataUrl;
              return copy;
            });
            localStorage.setItem(TEMPLATE_STORAGE_KEY, JSON.stringify(lightweight));
          } catch {
            // ignore storage errors
          }
          return merged;
        });
      }
    } catch {
      // fallback to current templates
    }
  }, []);

  useEffect(() => {
    const syncAll = () => {
      void refreshTasks();
      void refreshPegawai();
      void refreshTemplates();
    };
    const initialTimer = window.setTimeout(syncAll, 0);
    // Polling interval 3 detik untuk sinkronisasi realtime lintas tab/role
    const interval = window.setInterval(syncAll, 3000);
    return () => {
      window.clearTimeout(initialTimer);
      window.clearInterval(interval);
    };
  }, [refreshTasks, refreshPegawai, refreshTemplates]);

  const createTask = async (newTaskData: Partial<AjuanSuratTugas>): Promise<AjuanSuratTugas> => {
    setIsLoading(true);
    const newTask: AjuanSuratTugas = {
      id: newTaskData.id || `st-${Date.now()}`,
      nomorSurat: newTaskData.nomorSurat || `ST/00${tasks.length + 1}/2026`,
      perihal: newTaskData.perihal || 'Penugasan Baru',
      pengaju: (newTaskData.pengaju || dummyPegawaiList[0]) as Pegawai,
      pegawaiDitugaskan: newTaskData.pegawaiDitugaskan || [],
      unitKerja: (newTaskData.unitKerja || 'RBI') as UnitKerjaType,
      tanggalMulai: newTaskData.tanggalMulai || new Date().toISOString().substring(0, 10),
      tanggalSelesai: newTaskData.tanggalSelesai || new Date().toISOString().substring(0, 10),
      lokasiPenugasan: newTaskData.lokasiPenugasan || 'Kantor Pusat',
      lokasiSpesifik: newTaskData.lokasiSpesifik,
      koordinat: newTaskData.koordinat || [-6.9147, 107.6098],
      deskripsi: newTaskData.deskripsi || '',
      fileDraftUrl: newTaskData.fileDraftUrl,
      dokumenDraftText: newTaskData.dokumenDraftText,
      ttdDigitalPng: newTaskData.ttdDigitalPng,
      ttdSignerName: newTaskData.ttdSignerName,
      ttdSignedAt: newTaskData.ttdSignedAt,
      ttdUserPng: newTaskData.ttdUserPng,
      ttdUserSignerName: newTaskData.ttdUserSignerName,
      ttdUserSignedAt: newTaskData.ttdUserSignedAt,
      ttdApprovalPng: newTaskData.ttdApprovalPng,
      ttdApprovalSignerName: newTaskData.ttdApprovalSignerName,
      ttdApprovalSignedAt: newTaskData.ttdApprovalSignedAt,
      status: newTaskData.status || 'DRAFT',
      workflow: newTaskData.workflow || [
        {
          stage: 'DRAFT',
          label: 'Pengajuan Draft ST',
          actor: 'Pengaju',
          tanggal: new Date().toISOString().replace('T', ' ').substring(0, 16),
          status: 'COMPLETED',
          catatan: 'Draft tugas telah masuk ke sistem antrean.',
        },
        {
          stage: 'VERIFIKASI_SUBBAGIAN',
          label: 'Verifikasi Subbagian',
          actor: 'Kasubag',
          status: 'IN_PROGRESS',
          catatan: 'Menunggu telaah kelengkapan tugas.',
        },
        {
          stage: 'PERSETUJUAN_PIMPINAN',
          label: 'Persetujuan Pimpinan',
          actor: 'Pimpinan',
          status: 'PENDING',
        },
        {
          stage: 'SURAT_TERBIT',
          label: 'Penerbitan Surat Resmi',
          actor: 'Tata Usaha',
          status: 'PENDING',
        },
      ],
    };

    const nextTasks = [newTask, ...tasks];
    syncTasks(nextTasks);

    // Sync to backend asynchronously
    try {
      await apiService.createTugas(newTask);
    } catch {
      // offline fallback
    }

    setIsLoading(false);
    return newTask;
  };

  const updateTaskStatus = async (id: string, status: string): Promise<void> => {
    const nextTasks: AjuanSuratTugas[] = tasks.map((t) => {
      if (t.id === id) {
        return {
          ...t,
          status: status as StatusSuratTugas,
          workflow: (t.workflow || []).map((w) => {
            if (status === 'SURAT_TERBIT') return { ...w, status: 'COMPLETED' };
            if (status === 'DITOLAK' && w.stage === 'PERSETUJUAN_PIMPINAN')
              return { ...w, status: 'REJECTED' };
            return w;
          }),
        };
      }
      return t;
    });

    syncTasks(nextTasks);

    // Sync to backend
    try {
      await apiService.updateStatusTugas(id, status);
    } catch {
      // offline fallback
    }
  };

  const updateTask = async (id: string, updatedData: Partial<AjuanSuratTugas>): Promise<void> => {
    const nextTasks: AjuanSuratTugas[] = tasks.map((t) => {
      if (t.id === id) {
        return {
          ...t,
          ...updatedData,
        };
      }
      return t;
    });

    syncTasks(nextTasks);

    try {
      await apiService.updateTugas(id, updatedData);
    } catch {
      // offline fallback
    }
  };

  const deleteTask = async (id: string): Promise<void> => {
    const nextTasks = tasks.filter((t) => t.id !== id);
    syncTasks(nextTasks);

    try {
      await apiService.deleteTugas(id);
    } catch {
      // offline fallback
    }
  };

  const addPegawai = async (
    newPegawaiData: Partial<Pegawai>,
  ): Promise<PenugasanActionResult<Pegawai>> => {
    const nama = (newPegawaiData.nama || '').trim();
    const nip = (newPegawaiData.nip || '').trim();
    const jabatan = (newPegawaiData.jabatan || '').trim();
    const email = newPegawaiData.email?.trim() || undefined;
    const rawUsername = newPegawaiData.username?.trim().toLowerCase();
    const derivedFromEmail = email?.includes('@')
      ? email.split('@')[0].trim().toLowerCase().replace(/[^a-z0-9._-]/g, '')
      : '';
    const derivedFromNama = nama
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '.')
      .replace(/^\.+|\.+$/g, '');
    const username = rawUsername || derivedFromEmail || derivedFromNama || nip.toLowerCase();
    const rawPassword = newPegawaiData.password?.trim() || '';

    if (!nama || !nip) {
      return { success: false, message: 'Nama dan NIP pegawai wajib diisi.' };
    }
    if (!jabatan) {
      return { success: false, message: 'Jabatan pegawai wajib diisi.' };
    }
    if (rawPassword && rawPassword.length < 6) {
      return { success: false, message: 'Password akun minimal 6 karakter.' };
    }
    if (pegawaiList.some((p) => p.nip.trim() === nip)) {
      return { success: false, message: `NIP ${nip} sudah terdaftar.` };
    }
    if (
      username &&
      pegawaiList.some((p) => p.username?.trim().toLowerCase() === username)
    ) {
      return {
        success: false,
        message: `Username "${username}" sudah digunakan oleh pegawai lain.`,
      };
    }

    const candidate: Pegawai = {
      id: newPegawaiData.id?.trim() || `peg-${Date.now()}`,
      nama,
      nip,
      unitKerja: (newPegawaiData.unitKerja || 'RBI') as UnitKerjaType,
      jabatan,
      pangkatGolongan: newPegawaiData.pangkatGolongan?.trim() || undefined,
      telepon: newPegawaiData.telepon?.trim() || undefined,
      email,
      fotoAvatar:
        newPegawaiData.fotoAvatar?.trim() ||
        `${import.meta.env.BASE_URL}pp-navbar-2.jpg`,
      username,
      password: rawPassword || 'password123',
      role: newPegawaiData.role || 'USER',
    };

    const res = await apiService.createPegawai(candidate);
    if (res.success && res.data) {
      syncPegawai([...pegawaiList, res.data]);
      return { success: true, data: res.data };
    }
    if (!res.fallback) {
      return {
        success: false,
        message: res.message || 'Gagal menyimpan pegawai baru ke database.',
      };
    }

    syncPegawai([...pegawaiList, candidate]);
    return {
      success: true,
      data: candidate,
      message: 'Backend offline: data pegawai disimpan sementara di browser.',
    };
  };

  const updatePegawai = async (
    id: string,
    updatedData: Partial<Pegawai>,
  ): Promise<PenugasanActionResult<Pegawai>> => {
    const existing = pegawaiList.find((p) => p.id === id);
    if (!existing) {
      return { success: false, message: 'Data pegawai tidak ditemukan.' };
    }

    const nextNip =
      updatedData.nip !== undefined ? updatedData.nip.trim() : existing.nip;
    const nextUsername =
      updatedData.username !== undefined
        ? updatedData.username.trim().toLowerCase() || existing.username
        : existing.username;
    const trimmedPassword =
      updatedData.password !== undefined ? updatedData.password.trim() : '';

    if (trimmedPassword && trimmedPassword.length < 6) {
      return { success: false, message: 'Password akun minimal 6 karakter.' };
    }
    if (
      nextNip &&
      pegawaiList.some((p) => p.id !== id && p.nip.trim() === nextNip)
    ) {
      return {
        success: false,
        message: `NIP ${nextNip} sudah digunakan oleh pegawai lain.`,
      };
    }
    if (
      nextUsername &&
      pegawaiList.some(
        (p) => p.id !== id && p.username?.trim().toLowerCase() === nextUsername,
      )
    ) {
      return {
        success: false,
        message: `Username "${nextUsername}" sudah digunakan oleh pegawai lain.`,
      };
    }

    const merged: Pegawai = {
      ...existing,
      ...updatedData,
      id: existing.id,
      nama: updatedData.nama !== undefined ? updatedData.nama.trim() || existing.nama : existing.nama,
      nip: nextNip || existing.nip,
      jabatan:
        updatedData.jabatan !== undefined
          ? updatedData.jabatan.trim() || existing.jabatan
          : existing.jabatan,
      username: nextUsername,
      password: trimmedPassword || existing.password || 'password123',
    };

    const res = await apiService.updatePegawai(id, merged);
    if (res.success && res.data) {
      const nextList = pegawaiList.map((p) => (p.id === id ? res.data! : p));
      syncPegawai(nextList);
      return { success: true, data: res.data };
    }
    if (!res.fallback) {
      return {
        success: false,
        message: res.message || 'Gagal memperbarui data pegawai.',
      };
    }

    const nextList = pegawaiList.map((p) => (p.id === id ? merged : p));
    syncPegawai(nextList);
    return { success: true, data: merged };
  };

  const deletePegawai = async (id: string): Promise<PenugasanActionResult> => {
    if (id === 'peg-01') {
      return {
        success: false,
        message: 'Akun utama Super Admin tidak dapat dihapus.',
      };
    }

    const res = await apiService.deletePegawai(id);
    if (res.success) {
      syncPegawai(pegawaiList.filter((p) => p.id !== id));
      return { success: true };
    }
    if (!res.fallback) {
      return {
        success: false,
        message: res.message || 'Gagal menghapus pegawai dari database.',
      };
    }

    syncPegawai(pegawaiList.filter((p) => p.id !== id));
    return { success: true };
  };

  const saveTemplate = useCallback(
    async (
      tpl: Omit<TemplateSuratResmi, 'id' | 'diperbaruiPada'> & { id?: string },
    ): Promise<{ data: TemplateSuratResmi; persistedToDb: boolean }> => {
      const nowStr = new Date().toLocaleString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
      if (tpl.id) {
        const existing = templates.find((item) => item.id === tpl.id);
        if (existing) {
          const updated: TemplateSuratResmi = {
            ...existing,
            ...tpl,
            id: existing.id,
            diperbaruiPada: nowStr,
          };
          syncTemplates(templates.map((item) => (item.id === existing.id ? updated : item)));
          const res = await apiService.updateTemplate(existing.id, updated);
          if (res.success && res.data) {
            return { data: res.data, persistedToDb: true };
          }
          // Jika belum ada di DB (misalnya baru dibuat offline sebelumnya), coba create
          const createRes = await apiService.createTemplate(updated);
          return {
            data: createRes.success && createRes.data ? createRes.data : updated,
            persistedToDb: createRes.success,
          };
        }
      }
      const created: TemplateSuratResmi = {
        ...tpl,
        id: tpl.id || `TPL-${Date.now()}`,
        diperbaruiPada: nowStr,
      };
      syncTemplates([created, ...templates]);
      const res = await apiService.createTemplate(created);
      return {
        data: res.success && res.data ? res.data : created,
        persistedToDb: res.success,
      };
    },
    [templates, syncTemplates],
  );

  const deleteTemplate = useCallback(
    async (id: string) => {
      syncTemplates(templates.filter((item) => item.id !== id));
      await apiService.deleteTemplate(id);
    },
    [templates, syncTemplates],
  );

  const toggleTemplateActive = useCallback(
    async (id: string) => {
      const target = templates.find((item) => item.id === id);
      if (!target) return;
      const nextAktif = !target.aktif;
      syncTemplates(
        templates.map((item) => (item.id === id ? { ...item, aktif: nextAktif } : item)),
      );
      await apiService.updateTemplate(id, { aktif: nextAktif });
    },
    [templates, syncTemplates],
  );

  const downloadTemplateDocx = useCallback(
    async (tpl: TemplateSuratResmi): Promise<boolean> => {
      const fileName = tpl.fileNamaAsli || `${tpl.namaTemplate}.docx`;
      if (tpl.fileDocxDataUrl) {
        return downloadFileUrl(tpl.fileDocxDataUrl, fileName);
      }
      const res = await apiService.getTemplateById(tpl.id);
      if (res.success && res.data?.fileDocxDataUrl) {
        const fetchedUrl = res.data.fileDocxDataUrl;
        setTemplates((prev) =>
          prev.map((item) => (item.id === tpl.id ? { ...item, fileDocxDataUrl: fetchedUrl, hasFileDocx: true } : item)),
        );
        return downloadFileUrl(fetchedUrl, fileName);
      }
      return false;
    },
    [],
  );

  const myTasks = useMemo(() => {
    if (!user) return [];
    return tasks.filter((task) => {
      if (isPegawaiMatch(task.pengaju, user)) return true;
      return (task.pegawaiDitugaskan || []).some((peg) => isPegawaiMatch(peg, user));
    });
  }, [tasks, user]);

  return (
    <PenugasanContext.Provider
      value={{
        tasks,
        myTasks,
        pegawaiList,
        templates,
        isLoading,
        createTask,
        updateTaskStatus,
        updateTask,
        deleteTask,
        refreshTasks,
        addPegawai,
        updatePegawai,
        deletePegawai,
        refreshPegawai,
        saveTemplate,
        deleteTemplate,
        toggleTemplateActive,
        refreshTemplates,
        downloadTemplateDocx,
      }}
    >
      {children}
    </PenugasanContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const usePenugasan = () => {
  const context = useContext(PenugasanContext);
  if (!context) {
    throw new Error('usePenugasan must be used within a PenugasanProvider');
  }
  return context;
};
