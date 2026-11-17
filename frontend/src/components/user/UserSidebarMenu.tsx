import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  Send,
  ChartNoAxesCombined,
  CalendarCheck,
  CalendarDays,
  CalendarPlus,
  ChevronDown,
  CheckSquare,
  UploadCloud,
  MapPin,
  Wallet,
  type LucideIcon,
} from 'lucide-react';

interface UserMenuLink {
  to: string;
  label: string;
  icon: LucideIcon;
}

interface UserDropdownGroup {
  key: string;
  label: string;
  icon: LucideIcon;
  activePrefix: string;
  items: UserMenuLink[];
}

const MAIN_LINKS: UserMenuLink[] = [
  { to: '/user/dashboard', label: 'Dashboard', icon: LayoutDashboard },
];

const DROPDOWN_GROUPS: UserDropdownGroup[] = [
  {
    key: 'tugas',
    label: 'Tugas',
    icon: FileText,
    activePrefix: '/user/tugas',
    items: [
      { to: '/user/tugas/pengajuan', label: 'Proses Ajuan Surat Tugas', icon: Send },
      { to: '/user/tugas/progres', label: 'Progres Surat Tugas', icon: FileText },
      { to: '/user/tugas/laporan', label: 'Laporan', icon: ChartNoAxesCombined },
    ],
  },
  {
    key: 'absensi',
    label: 'Absensi',
    icon: CalendarCheck,
    activePrefix: '/user/absensi',
    items: [
      { to: '/user/absensi/kehadiran', label: 'Absensi Kehadiran', icon: CalendarDays },
      { to: '/user/absensi/cuti', label: 'Izin & Cuti', icon: CalendarPlus },
    ],
  },
];

const SECONDARY_LINKS: UserMenuLink[] = [
  { to: '/user/status-approval', label: 'Status Approval', icon: CheckSquare },
  { to: '/user/upload-surat', label: 'Upload Surat Tugas', icon: UploadCloud },
  { to: '/user/pemetaan', label: 'Pemetaan Penugasan', icon: MapPin },
  { to: '/user/simpanan', label: 'Simpanan & Biaya', icon: Wallet },
];

interface UserSidebarMenuProps {
  onNavigate?: () => void;
}

export const UserSidebarMenu = ({ onNavigate }: UserSidebarMenuProps) => {
  const location = useLocation();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => ({
    tugas: location.pathname.startsWith('/user/tugas'),
    absensi: location.pathname.startsWith('/user/absensi'),
  }));

  const toggleGroup = (key: string) => {
    setOpenGroups((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <>
      {MAIN_LINKS.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          onClick={onNavigate}
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-l-full py-2.5 pl-4 pr-5 text-sm transition-all ${
              isActive
                ? 'bg-[#F3F6FB] text-[#1E40AF] font-bold'
                : 'text-blue-100 hover:bg-white/15 hover:text-white'
            }`
          }
        >
          <Icon className="h-4 w-4 shrink-0" />
          {label}
        </NavLink>
      ))}

      {DROPDOWN_GROUPS.map((group) => {
        const GroupIcon = group.icon;
        const isGroupActive = location.pathname.startsWith(group.activePrefix);
        const isOpen = Boolean(openGroups[group.key]);

        return (
          <div key={group.key}>
            <button
              type="button"
              onClick={() => toggleGroup(group.key)}
              className={`flex w-full items-center gap-3 rounded-l-full py-2.5 pl-4 pr-5 text-sm transition-all cursor-pointer ${
                isGroupActive
                  ? 'bg-[#F3F6FB] text-[#1E40AF] font-bold'
                  : 'text-blue-100 hover:bg-white/15 hover:text-white'
              }`}
              aria-expanded={isOpen}
            >
              <GroupIcon className="h-4 w-4 shrink-0" />
              <span className="flex-1 text-left">{group.label}</span>
              <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
              <div className="mt-1 space-y-1 border-l border-blue-300/35 py-1 pl-3 ml-5">
                {group.items.map(({ to, label, icon: SubIcon }) => (
                  <NavLink
                    key={to}
                    to={to}
                    onClick={onNavigate}
                    className={({ isActive }) =>
                      `flex items-center gap-2 rounded-l-full py-2 pl-3 pr-4 text-xs transition-all ${
                        isActive
                          ? 'bg-[#F3F6FB] text-[#1E40AF] font-bold'
                          : 'text-blue-100/90 hover:text-white hover:bg-white/15'
                      }`
                    }
                  >
                    <SubIcon className="h-3.5 w-3.5 shrink-0" /> {label}
                  </NavLink>
                ))}
              </div>
            )}
          </div>
        );
      })}

      <div className="pt-3 mt-2 border-t border-white/15">
        <p className="px-4 pb-2 text-[11px] font-bold uppercase tracking-wider text-blue-200/80">
          Layanan Pegawai
        </p>
        {SECONDARY_LINKS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-l-full py-2.5 pl-4 pr-5 text-sm transition-all ${
                isActive
                  ? 'bg-white text-[#1E40AF] font-bold shadow-[0_6px_18px_-4px_rgba(15,23,42,0.22)]'
                  : 'text-blue-100 hover:bg-white/15 hover:text-white'
              }`
            }
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </NavLink>
        ))}
      </div>
    </>
  );
};

