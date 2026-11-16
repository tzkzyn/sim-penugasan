import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { AjuanSuratTugas } from '@/types';
import { apiService } from '@/api/apiService';
import { dummyAjuanSuratTugas } from '@/data/dummyData';

interface PenugasanContextType {
  tasks: AjuanSuratTugas[];
  isLoading: boolean;
  createTask: (newTaskData: Partial<AjuanSuratTugas>) => Promise<AjuanSuratTugas>;
  updateTaskStatus: (id: string, status: string) => Promise<void>;
  updateTask: (id: string, updatedData: Partial<AjuanSuratTugas>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  refreshTasks: () => Promise<void>;
}

const PenugasanContext = createContext<PenugasanContextType | undefined>(undefined);

export const PenugasanProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tasks, setTasks] = useState<AjuanSuratTugas[]>(() => {
    try {
      const saved = localStorage.getItem('sim_penugasan_live_tasks');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter(
            (t: any) =>
              !t.id?.startsWith('TUGAS-TEST') &&
              !t.id?.startsWith('TUGAS-REJECT') &&
              !t.perihal?.includes('Uji Coba') &&
              !t.perihal?.includes('Test')
          );
        }
      }
      return dummyAjuanSuratTugas;
    } catch {
      return dummyAjuanSuratTugas;
    }
  });
  const [isLoading, setIsLoading] = useState(false);

  const syncTasks = useCallback((taskList: AjuanSuratTugas[]) => {
    setTasks(taskList);
    try {
      localStorage.setItem('sim_penugasan_live_tasks', JSON.stringify(taskList));
    } catch {
      // ignore storage errors
    }
  }, []);

  const refreshTasks = useCallback(async () => {
    try {
      const res = await apiService.getTugas();
      if (res.success && Array.isArray(res.data)) {
        syncTasks(res.data);
      }
    } catch {
      // fallback to current tasks
    }
  }, [syncTasks]);

  useEffect(() => {
    refreshTasks();
    // Polling interval 3 detik untuk sinkronisasi realtime lintas tab/role
    const interval = setInterval(refreshTasks, 3000);
    return () => clearInterval(interval);
  }, [refreshTasks]);

  const createTask = async (newTaskData: Partial<AjuanSuratTugas>): Promise<AjuanSuratTugas> => {
    setIsLoading(true);
    const newTask: AjuanSuratTugas = {
      id: newTaskData.id || `st-${Date.now()}`,
      nomorSurat: newTaskData.nomorSurat || `ST/00${tasks.length + 1}/2026`,
      perihal: newTaskData.perihal || 'Penugasan Baru',
      pengaju: newTaskData.pengaju as any,
      pegawaiDitugaskan: newTaskData.pegawaiDitugaskan || [],
      unitKerja: newTaskData.unitKerja || ('RBI' as any),
      tanggalMulai: newTaskData.tanggalMulai || new Date().toISOString().substring(0, 10),
      tanggalSelesai: newTaskData.tanggalSelesai || new Date().toISOString().substring(0, 10),
      lokasiPenugasan: newTaskData.lokasiPenugasan || 'Kantor Pusat',
      lokasiSpesifik: newTaskData.lokasiSpesifik,
      koordinat: newTaskData.koordinat || [-6.9147, 107.6098],
      deskripsi: newTaskData.deskripsi || '',
      fileDraftUrl: newTaskData.fileDraftUrl,
      dokumenDraftText: newTaskData.dokumenDraftText,
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
          status: status as any,
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

  return (
    <PenugasanContext.Provider
      value={{
        tasks,
        isLoading,
        createTask,
        updateTaskStatus,
        updateTask,
        deleteTask,
        refreshTasks,
      }}
    >
      {children}
    </PenugasanContext.Provider>
  );
};

export const usePenugasan = () => {
  const context = useContext(PenugasanContext);
  if (!context) {
    throw new Error('usePenugasan must be used within a PenugasanProvider');
  }
  return context;
};
