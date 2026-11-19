import { Navigate, Route, Routes } from 'react-router-dom';
import { DashboardPage } from '@/pages/user/DashboardPage';
import { TugasPage } from '@/pages/user/TugasPage';
import { ProgresTugasPage } from '@/pages/user/ProgresTugasPage';
import { LaporanTugasPage } from '@/pages/user/LaporanTugasPage';
import { UploadSuratPage } from '@/pages/user/UploadSuratPage';
import { StatusApprovalPage } from '@/pages/user/StatusApprovalPage';
import { AbsensiPage } from '@/pages/user/AbsensiPage';
import { CutiPage } from '@/pages/user/CutiPage';
import { NotifikasiPage } from '@/pages/user/NotifikasiPage';
import { SimpananPage } from '@/pages/user/SimpananPage';
import { ProfilePage } from '@/pages/user/ProfilePage';
import { PemetaanPage } from '@/pages/super-admin/PemetaanPage';
import { ArsipSuratLaporanPage } from '@/pages/shared/ArsipSuratLaporanPage';

export const UserRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="dashboard" replace />} />
      <Route path="dashboard" element={<DashboardPage />} />
      
      {/* Sub-menu Tugas */}
      <Route path="tugas" element={<Navigate to="pengajuan" replace />} />
      <Route path="tugas/pengajuan" element={<TugasPage />} />
      <Route path="tugas/progres" element={<ProgresTugasPage />} />
      <Route path="tugas/laporan" element={<LaporanTugasPage />} />

      {/* Sub-menu Absensi */}
      <Route path="absensi" element={<Navigate to="kehadiran" replace />} />
      <Route path="absensi/kehadiran" element={<AbsensiPage />} />
      <Route path="absensi/cuti" element={<CutiPage />} />

      {/* Fitur Lainnya */}
      <Route path="upload-surat" element={<UploadSuratPage />} />
      <Route path="status-approval" element={<StatusApprovalPage />} />
      <Route path="pemetaan" element={<PemetaanPage />} />
      <Route path="arsip" element={<ArsipSuratLaporanPage />} />
      <Route path="notifikasi" element={<NotifikasiPage />} />
      <Route path="simpanan" element={<SimpananPage />} />
      <Route path="profile" element={<ProfilePage />} />
      <Route path="*" element={<Navigate to="dashboard" replace />} />
    </Routes>
  );
};
