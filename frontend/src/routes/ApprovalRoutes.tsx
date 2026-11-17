import { Navigate, Route, Routes } from 'react-router-dom';
import { DashboardPage } from '@/pages/approval/DashboardPage';
import { ApprovalTugasPage } from '@/pages/approval/ApprovalTugasPage';
import { ApprovalCutiPage } from '@/pages/approval/ApprovalCutiPage';
import { SuratTugasPage } from '@/pages/approval/SuratTugasPage';
import { RiwayatApprovalPage } from '@/pages/approval/RiwayatApprovalPage';
import { TemplateSuratPage } from '@/pages/approval/TemplateSuratPage';
import { NotifikasiPage } from '@/pages/approval/NotifikasiPage';
import { ProfilePage } from '@/pages/approval/ProfilePage';

export const ApprovalRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="dashboard" replace />} />
      <Route path="dashboard" element={<DashboardPage />} />
      <Route path="tugas" element={<Navigate to="/approval/approval-tugas" replace />} />
      <Route path="approval-tugas" element={<ApprovalTugasPage />} />
      <Route path="approval-cuti" element={<ApprovalCutiPage />} />
      <Route path="surat-tugas" element={<SuratTugasPage />} />
      <Route path="template-surat" element={<TemplateSuratPage />} />
      <Route path="riwayat-approval" element={<RiwayatApprovalPage />} />
      <Route path="notifikasi" element={<NotifikasiPage />} />
      <Route path="profile" element={<ProfilePage />} />
      <Route path="*" element={<Navigate to="dashboard" replace />} />
    </Routes>
  );
};
