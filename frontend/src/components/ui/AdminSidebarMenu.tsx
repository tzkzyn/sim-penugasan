import { useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  CalendarCheck,
  FileText,
  MapPin,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  ChartNoAxesCombined,
  KeyRound,
  Network,
  Users,
  CheckSquare,
  History,
  Archive,
  LayoutTemplate,
  Clock,
  type LucideIcon,
} from 'lucide-react';

export interface SidebarSubItem {
  to: string;
  label: string;
  icon?: LucideIcon;
}

export interface SidebarMenuItemConfig {
  to: string;
  label: string;
  icon: LucideIcon;
  items?: SidebarSubItem[];
  defaultOpenPaths?: string[];
  /** Tampilkan garis pemisah vertikal bertitik/garis seperti section Superadmin/Administrator */
  variant?: 'default' | 'section';
  /** Judul grup pemisah di atas item menu */
  sectionTitle?: string;
}

/**
 * Daftar menu deklaratif per role.
 * Untuk menambah fitur/menu baru pada salah satu role, cukup tambahkan item di sini.
 */
const getSidebarMenuByRole = (role: string, prefix: string): SidebarMenuItemConfig[] => {
  const normalized = role.toUpperCase();

  if (normalized === 'SUPER_ADMIN') {
    return [
      { to: `${prefix}/dashboard`, label: 'Dashboard', icon: LayoutDashboard, sectionTitle: 'Utama' },
      { to: `${prefix}/arsip`, label: 'Arsip Surat & Laporan', icon: Archive, sectionTitle: 'Penugasan' },
      { to: `${prefix}/rekap-penugasan`, label: 'Rekap Penugasan', icon: ChartNoAxesCombined },
      { to: `${prefix}/pemetaan`, label: 'Pemetaan', icon: MapPin },
      { to: `${prefix}/anggota`, label: 'Data Pegawai', icon: Users, sectionTitle: 'Kepegawaian & Akun' },
      { to: `${prefix}/absensi`, label: 'Presensi Kehadiran', icon: CalendarCheck },
      { to: `${prefix}/absensi/verifikasi`, label: 'Verifikasi Izin & Cuti', icon: CheckSquare },
      { to: `${prefix}/akun`, label: 'Kelola Akun', icon: KeyRound },
      { to: `${prefix}/pokja`, label: 'Data POKJA', icon: Network },
    ];
  }

  if (normalized === 'APPROVAL') {
    return [
      { to: `${prefix}/dashboard`, label: 'Dashboard', icon: LayoutDashboard },
      { to: `${prefix}/approval-tugas`, label: 'Approval Tugas', icon: CheckSquare, sectionTitle: 'Persetujuan' },
      { to: `${prefix}/approval-cuti`, label: 'Approval Izin & Cuti', icon: CalendarCheck },
      { to: `${prefix}/surat-tugas`, label: 'Surat Tugas', icon: FileText, sectionTitle: 'Dokumen & Riwayat' },
      { to: `${prefix}/arsip`, label: 'Arsip Surat & Laporan', icon: Archive },
      { to: `${prefix}/riwayat-approval`, label: 'Riwayat Approval', icon: History },
    ];
  }

  return [
    { to: `${prefix}/dashboard`, label: 'Dashboard', icon: LayoutDashboard },
    { to: `${prefix}/tugas/buat`, label: 'Buat Surat Tugas', icon: FileText, sectionTitle: 'Penugasan' },
    { to: `${prefix}/tugas?tab=draft`, label: 'Draft Surat', icon: Clock },
    { to: `${prefix}/template-surat`, label: 'Template Surat', icon: LayoutTemplate },
    { to: `${prefix}/arsip`, label: 'Arsip Surat & Laporan', icon: Archive },
    { to: `${prefix}/anggota`, label: 'Data Pegawai', icon: Users, sectionTitle: 'Pegawai & Kehadiran' },
    { to: `${prefix}/absensi`, label: 'Presensi Kehadiran', icon: CalendarCheck },
    { to: `${prefix}/absensi/verifikasi`, label: 'Verifikasi Izin & Cuti', icon: CheckSquare },
    { to: `${prefix}/pemetaan`, label: 'Pemetaan', icon: MapPin },
  ];
};

const isSubItemActive = (itemTo: string, currentPath: string, currentSearch: string): boolean => {
  const [basePath, queryString] = itemTo.split('?');
  const targetTab = new URLSearchParams(queryString || '').get('tab');
  const currentTab = new URLSearchParams(currentSearch).get('tab');
  const isQueryActive = targetTab ? currentTab === targetTab : true;
  const isPathActive = currentPath === basePath || currentPath === `${basePath}/`;
  return isPathActive && isQueryActive;
};

interface SidebarMenuItemProps {
  link: SidebarMenuItemConfig;
  isSidebarCollapsed: boolean;
  onNavigate?: () => void;
}

const SidebarMenuItem = ({ link, isSidebarCollapsed, onNavigate }: SidebarMenuItemProps) => {
  const location = useLocation();
  const Icon = link.icon;

  const [isOpen, setIsOpen] = useState(() =>
    Boolean(link.defaultOpenPaths?.some((p) => location.pathname.includes(p))),
  );

  if (link.items && link.items.length > 0) {
    const isChildActive = link.items.some((item) =>
      isSubItemActive(item.to, location.pathname, location.search),
    );
    const isSectionVariant = link.variant === 'section';
    const isActiveStyle = isSectionVariant ? isOpen || isChildActive : isChildActive;

    return (
      <div className={isSectionVariant ? 'pt-2' : 'flex flex-col'}>
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          title={isSidebarCollapsed ? link.label : undefined}
          aria-expanded={isOpen}
          className={`flex w-full items-center justify-between py-2.5 text-sm transition-all cursor-pointer rounded-xl ${
            isSidebarCollapsed ? 'justify-center px-0' : 'px-4'
          } ${
            isSectionVariant
              ? isActiveStyle
                ? 'bg-[#ECF2FF] text-[#5D87FF] font-semibold'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              : isActiveStyle
                ? 'bg-[#5D87FF] text-white font-semibold shadow-sm shadow-[#5D87FF]/25'
                : isOpen
                  ? 'bg-[#ECF2FF] text-[#5D87FF] font-semibold'
                  : 'text-slate-600 hover:bg-[#ECF2FF] hover:text-[#5D87FF]'
          }`}
        >
          <div className="flex items-center gap-3">
            <Icon className="h-5 w-5 shrink-0" />
            {!isSidebarCollapsed && (
              <span className="overflow-hidden whitespace-nowrap">{link.label}</span>
            )}
          </div>
          {!isSidebarCollapsed &&
            (isSectionVariant ? (
              isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
            ) : isOpen ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            ))}
        </button>

        {!isSidebarCollapsed && isOpen && (
          <div className="mt-1 ml-4 flex flex-col space-y-1 border-l border-slate-200 pl-3">
            {link.items.map((subItem) => {
              const childActive = isSubItemActive(subItem.to, location.pathname, location.search);
              const SubIcon = subItem.icon;
              return (
                <Link
                  key={subItem.to}
                  to={subItem.to}
                  onClick={onNavigate}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-all ${
                    childActive
                      ? 'bg-[#5D87FF] text-white font-semibold shadow-sm shadow-[#5D87FF]/25'
                      : 'text-slate-600 hover:bg-[#ECF2FF] hover:text-[#5D87FF]'
                  }`}
                >
                  {SubIcon && <SubIcon className="h-4 w-4 shrink-0" />}
                  <span>{subItem.label}</span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  return (
    <NavLink
      to={link.to}
      end={link.to.endsWith('/dashboard') || link.to.endsWith('/tugas') || link.to.endsWith('/absensi')}
      onClick={onNavigate}
      title={isSidebarCollapsed ? link.label : undefined}
      className={({ isActive }) =>
        `flex items-center gap-3 py-2.5 text-sm transition-all rounded-xl ${
          isSidebarCollapsed ? 'justify-center px-0' : 'px-4'
        } ${
          isActive
            ? 'bg-[#5D87FF] text-white font-semibold shadow-sm shadow-[#5D87FF]/25'
            : 'text-slate-600 hover:bg-[#ECF2FF] hover:text-[#5D87FF]'
        }`
      }
    >
      <Icon className="h-5 w-5 shrink-0" />
      {!isSidebarCollapsed && <span className="overflow-hidden whitespace-nowrap">{link.label}</span>}
    </NavLink>
  );
};

interface AdminSidebarMenuProps {
  role: string;
  prefix: string;
  isSidebarCollapsed: boolean;
  onNavigate?: () => void;
}

export const AdminSidebarMenu = ({
  role,
  prefix,
  isSidebarCollapsed,
  onNavigate,
}: AdminSidebarMenuProps) => {
  const menuItems = getSidebarMenuByRole(role, prefix);

  return (
    <>
      {!isSidebarCollapsed && (
        <p className="px-4 pb-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Utama
        </p>
      )}
      {menuItems.map((link) => (
        <div key={link.label}>
          {!isSidebarCollapsed && link.sectionTitle && (
            <p className="px-4 pt-4 pb-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              {link.sectionTitle}
            </p>
          )}
          <SidebarMenuItem
            link={link}
            isSidebarCollapsed={isSidebarCollapsed}
            onNavigate={onNavigate}
          />
        </div>
      ))}
    </>
  );
};

