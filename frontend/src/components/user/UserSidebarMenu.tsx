import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  UploadCloud,
  Archive,
  CalendarDays,
  CalendarPlus,
  type LucideIcon,
} from 'lucide-react';

interface UserMenuLink {
  to: string;
  label: string;
  icon: LucideIcon;
}

const MAIN_LINKS: UserMenuLink[] = [
  { to: '/user/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/user/tugas/pengajuan', label: 'Surat Tugas Saya', icon: FileText },
  { to: '/user/upload-surat', label: 'Upload Laporan', icon: UploadCloud },
  { to: '/user/arsip', label: 'Arsip Surat & Laporan', icon: Archive },
];

const KEHADIRAN_LINKS: UserMenuLink[] = [
  { to: '/user/absensi/kehadiran', label: 'Absensi Kehadiran', icon: CalendarDays },
  { to: '/user/absensi/cuti', label: 'Izin & Cuti', icon: CalendarPlus },
];

interface UserSidebarMenuProps {
  onNavigate?: () => void;
}

export const UserSidebarMenu = ({ onNavigate }: UserSidebarMenuProps) => {
  const renderLink = ({ to, label, icon: Icon }: UserMenuLink) => (
    <NavLink
      key={to}
      to={to}
      onClick={onNavigate}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-xl px-4 py-3 text-sm transition-all ${
          isActive
            ? 'bg-[#5D87FF] text-white font-semibold shadow-sm shadow-[#5D87FF]/25'
            : 'text-slate-700 hover:bg-[#ECF2FF] hover:text-[#5D87FF]'
        }`
      }
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span>{label}</span>
    </NavLink>
  );

  return (
    <>
      <p className="px-4 pb-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
        Menu Utama
      </p>
      <div className="space-y-1">{MAIN_LINKS.map(renderLink)}</div>

      <p className="px-4 pt-5 pb-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
        Kehadiran
      </p>
      <div className="space-y-1">{KEHADIRAN_LINKS.map(renderLink)}</div>
    </>
  );
};
