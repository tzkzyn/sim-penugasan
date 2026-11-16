import { axiosInstance } from './axiosInstance';
import { dummyAjuanSuratTugas } from '@/data/dummyData';

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
      const response = await axiosInstance.get('/tugas');
      return { success: true, data: response.data };
    } catch {
      return { success: false, fallback: true, data: dummyAjuanSuratTugas };
    }
  },

  // Create Tugas
  async createTugas(taskData: any) {
    try {
      const response = await axiosInstance.post('/tugas', taskData);
      return { success: true, data: response.data };
    } catch {
      return { success: false, fallback: true };
    }
  },

  // 4. Update Status Tugas
  async updateStatusTugas(id: string, status: string) {
    try {
      const response = await axiosInstance.patch(`/tugas/${id}/status`, { status });
      return { success: true, data: response.data };
    } catch {
      return { success: false, fallback: true };
    }
  },

  // Update Full Tugas
  async updateTugas(id: string, taskData: any) {
    try {
      const response = await axiosInstance.patch(`/tugas/${id}`, taskData);
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

  // 5. Auth Login
  async login(email: string, password: string) {
    try {
      const response = await axiosInstance.post('/auth/login', { email, password });
      return { success: true, data: response.data };
    } catch {
      return { success: false, fallback: true };
    }
  },
};

