import { useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  CalendarCheck,
  FileText,
  MapPin,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  ClipboardList,
  ChartNoAxesCombined,
  KeyRound,
  Network,
  Users,
  CheckSquare,
  History,
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
}

/**
 * Daftar menu deklaratif per role.
 * Untuk menambah fitur/menu baru pada salah satu role, cukup tambahkan item di sini.
 */
const getSidebarMenuByRole = (role: string, prefix: string): SidebarMenuItemConfig[] => {
  const normalized = role.toUpperCase();

  if (normalized === 'SUPER_ADMIN') {
    return [
      { to: `${prefix}/dashboard`, label: 'Dashboard', icon: LayoutDashboard },
      { to: `${prefix}/anggota`, label: 'Pegawai', icon: Users },
      {
        to: '#',
        label: 'Absensi',
        icon: CalendarCheck,
        items: [
          { to: `${prefix}/absensi`, label: 'Presensi Kehadiran' },
          { to: `${prefix}/absensi/verifikasi`, label: 'Verifikasi Izin & Cuti' },
        ],
      },
      { to: `${prefix}/tugas`, label: 'Penugasan', icon: FileText },
      { to: `${prefix}/pemetaan`, label: 'Pemetaan', icon: MapPin },
      {
        to: '#',
        label: 'Superadmin',
        icon: ShieldCheck,
        variant: 'section',
        defaultOpenPaths: ['/akun', '/pokja'],
        items: [
          { to: `${prefix}/akun`, label: 'Akun', icon: KeyRound },
          { to: `${prefix}/pokja`, label: 'POKJA', icon: Network },
        ],
      },
      {
        to: '#',
        label: 'Administrator',
        icon: ShieldCheck,
        variant: 'section',
        defaultOpenPaths: ['/ajuan-pegawai', '/rekap-penugasan'],
        items: [
          { to: `${prefix}/ajuan-pegawai`, label: 'Ajuan Pegawai', icon: FileText },
          { to: `${prefix}/rekap-penugasan`, label: 'Rekap Penugasan', icon: ChartNoAxesCombined },
        ],
      },
    ];
  }

  if (normalized === 'APPROVAL') {
    return [
      { to: `${prefix}/dashboard`, label: 'Dashboard', icon: LayoutDashboard },
      { to: `${prefix}/approval-tugas`, label: 'Approval Tugas', icon: CheckSquare },
      { to: `${prefix}/approval-cuti`, label: 'Approval Izin & Cuti', icon: CalendarCheck },
      { to: `${prefix}/surat-tugas`, label: 'Surat Tugas', icon: FileText },
      { to: `${prefix}/template-surat`, label: 'Template Surat', icon: ClipboardList },
      { to: `${prefix}/riwayat-approval`, label: 'Riwayat Approval', icon: History },
    ];
  }

  return [
    { to: `${prefix}/dashboard`, label: 'Dashboard', icon: LayoutDashboard },
    { to: `${prefix}/anggota`, label: 'Pegawai', icon: Users },
    {
      to: '#',
      label: 'Absensi',
      icon: CalendarCheck,
      items: [
        { to: `${prefix}/absensi`, label: 'Presensi Kehadiran' },
        { to: `${prefix}/absensi/verifikasi`, label: 'Verifikasi Izin & Cuti' },
      ],
    },
    {
      to: '#',
      label: 'Penugasan',
      icon: ClipboardList,
      items: [
        { to: `${prefix}/tugas?tab=rekap`, label: 'Rekap Penugasan' },
        { to: `${prefix}/tugas?tab=pegawai`, label: 'Pegawai Penugasan' },
        { to: `${prefix}/tugas?tab=laporan`, label: 'Laporan Penugasan' },
        { to: `${prefix}/tugas?tab=periode`, label: 'Periode Penugasan' },
        { to: `${prefix}/tugas?tab=pivot`, label: 'Pivot Penugasan' },
        { to: `${prefix}/tugas?tab=berlangsung`, label: 'Penugasan Berlangsung' },
        { to: `${prefix}/tugas?tab=draft`, label: 'Draft Penugasan' },
        { to: `${prefix}/tugas?tab=blokir`, label: 'Blokir Penugasan' },
      ],
    },
    { to: `${prefix}/pemetaan`, label: 'Pemetaan', icon: MapPin },
    {
      to: '#',
      label: 'Administrator',
      icon: ShieldCheck,
      items: [
        { to: `${prefix}/ajuan-pegawai`, label: 'Ajuan Pegawai', icon: FileText },
        { to: `${prefix}/rekap-penugasan`, label: 'Rekap Penugasan', icon: ChartNoAxesCombined },
      ],
    },
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
          className={`flex w-full items-center justify-between py-2.5 text-sm transition-all cursor-pointer ${
            isSidebarCollapsed ? 'justify-center rounded-xl px-0' : 'rounded-l-full pl-4 pr-5'
          } ${
            isSectionVariant
              ? isActiveStyle
                ? 'bg-white/20 text-white font-semibold'
                : 'text-blue-100 hover:bg-white/15 hover:text-white'
              : isActiveStyle
                ? 'bg-[#F3F6FB] text-[#1E40AF] font-bold'
                : isOpen
                  ? 'bg-white/20 text-white font-semibold'
                  : 'text-blue-100 hover:bg-white/15 hover:text-white'
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
          <div className="mt-1 ml-4 flex flex-col space-y-1 border-l border-blue-300/35 pl-3">
            {link.items.map((subItem) => {
              const childActive = isSubItemActive(subItem.to, location.pathname, location.search);
              const SubIcon = subItem.icon;
              return (
                <Link
                  key={subItem.to}
                  to={subItem.to}
                  onClick={onNavigate}
                  className={`flex items-center gap-3 rounded-l-full py-2 pl-3 pr-4 text-sm transition-all ${
                    childActive
                      ? 'bg-[#F3F6FB] text-[#1E40AF] font-bold'
                      : 'text-blue-100/90 hover:text-white hover:bg-white/15'
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
      end={link.to.endsWith('/dashboard')}
      onClick={onNavigate}
      title={isSidebarCollapsed ? link.label : undefined}
      className={({ isActive }) =>
        `flex items-center gap-3 py-2.5 text-sm transition-all ${
          isSidebarCollapsed ? 'justify-center rounded-xl px-0' : 'rounded-l-full pl-4 pr-5'
        } ${
          isActive
            ? 'bg-[#F3F6FB] text-[#1E40AF] font-bold'
            : 'text-blue-100 hover:bg-white/15 hover:text-white'
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
      {menuItems.map((link) => (
        <SidebarMenuItem
          key={link.label}
          link={link}
          isSidebarCollapsed={isSidebarCollapsed}
          onNavigate={onNavigate}
        />
      ))}
    </>
  );
};

