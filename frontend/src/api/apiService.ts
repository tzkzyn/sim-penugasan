import axios from 'axios';
import { axiosInstance } from './axiosInstance';
import { dummyAjuanSuratTugas, dummyPegawaiList } from '@/data/dummyData';
import type { AjuanSuratTugas, Pegawai } from '@/types';

const extractErrorInfo = (error: unknown): { isNetworkError: boolean; message?: string } => {
  if (axios.isAxiosError(error) && error.response) {
    const data = error.response.data as { message?: string | string[] } | undefined;
    const rawMsg = data?.message;
    const message = Array.isArray(rawMsg) ? rawMsg.join(', ') : rawMsg;
    return {
      isNetworkError: false,
      message: typeof message === 'string' && message.trim() ? message : `Permintaan ditolak (${error.response.status}).`,
    };
  }
  return { isNetworkError: true };
};

export const apiService = {
  // 1. Dashboard
  async getDashboard() {
    try {
      const response = await axiosInstance.get('/dashboard');
      return { success: true, data: response.data };
    } catch {
      return { success: false, fallback: true };
    }
  },

  // 2. Absensi
  async getAbsensi() {
    try {
      const response = await axiosInstance.get('/absensi');
      return { success: true, data: response.data };
    } catch {
      return { success: false, fallback: true };
    }
  },

  // 3. Tugas
  async getTugas() {
    try {
      const response = await axiosInstance.get<AjuanSuratTugas[]>('/tugas');
      return { success: true, data: response.data };
    } catch {
      return { success: false, fallback: true, data: dummyAjuanSuratTugas };
    }
  },

  // Create Tugas
  async createTugas(taskData: Partial<AjuanSuratTugas>) {
    try {
      const response = await axiosInstance.post<AjuanSuratTugas>('/tugas', taskData);
      return { success: true, data: response.data };
    } catch {
      return { success: false, fallback: true };
    }
  },

  // 4. Update Status Tugas
  async updateStatusTugas(id: string, status: string) {
    try {
      const response = await axiosInstance.patch<AjuanSuratTugas>(`/tugas/${id}/status`, { status });
      return { success: true, data: response.data };
    } catch {
      return { success: false, fallback: true };
    }
  },

  // Update Full Tugas
  async updateTugas(id: string, taskData: Partial<AjuanSuratTugas>) {
    try {
      const response = await axiosInstance.patch<AjuanSuratTugas>(`/tugas/${id}`, taskData);
      return { success: true, data: response.data };
    } catch {
      return { success: false, fallback: true };
    }
  },

  // Delete Tugas
  async deleteTugas(id: string) {
    try {
      const response = await axiosInstance.delete(`/tugas/${id}`);
      return { success: true, data: response.data };
    } catch {
      return { success: false, fallback: true };
    }
  },

  // 5. Pegawai (PostgreSQL CRUD)
  async getPegawai() {
    try {
      const response = await axiosInstance.get<Pegawai[]>('/pegawai');
      return { success: true as const, data: response.data };
    } catch {
      return { success: false as const, fallback: true, data: dummyPegawaiList };
    }
  },

  async createPegawai(pegawaiData: Partial<Pegawai>) {
    try {
      const response = await axiosInstance.post<Pegawai>('/pegawai', pegawaiData);
      return { success: true as const, data: response.data };
    } catch (error) {
      const info = extractErrorInfo(error);
      return { success: false as const, fallback: info.isNetworkError, message: info.message };
    }
  },

  async updatePegawai(id: string, pegawaiData: Partial<Pegawai>) {
    try {
      const response = await axiosInstance.patch<Pegawai>(`/pegawai/${id}`, pegawaiData);
      return { success: true as const, data: response.data };
    } catch (error) {
      const info = extractErrorInfo(error);
      return { success: false as const, fallback: info.isNetworkError, message: info.message };
    }
  },

  async deletePegawai(id: string) {
    try {
      const response = await axiosInstance.delete<Pegawai>(`/pegawai/${id}`);
      return { success: true as const, data: response.data };
    } catch (error) {
      const info = extractErrorInfo(error);
      return { success: false as const, fallback: info.isNetworkError, message: info.message };
    }
  },

  // 6. Auth Login
  async login(email: string, password: string) {
    try {
      const response = await axiosInstance.post('/auth/login', { email, password });
      return { success: true, data: response.data };
    } catch {
      return { success: false, fallback: true };
    }
  },
};

