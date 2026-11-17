import { useState, useRef, useEffect, type ReactNode } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { SidebarBotanicalDecor } from '@/components/ui/SidebarBotanicalDecor';
import {
  LayoutDashboard,
  CalendarCheck,
  FileText,
  MapPin,
  Bell,
  UserCircle2,
  LogOut,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  ClipboardList,
  Menu,
  ChartNoAxesCombined,
  KeyRound,
  Network,
  Users,
  CheckSquare,
  History,
  X
} from 'lucide-react';

// ─────────────────────────────────────────────
// Sidebar Menu untuk SUPER ADMIN
// ─────────────────────────────────────────────
function SuperAdminSidebar({ isSidebarCollapsed }: { isSidebarCollapsed: boolean }) {
  const location = useLocation();
  const prefix = '/super-admin';

  const [isSuperAdminMenuOpen, setIsSuperAdminMenuOpen] = useState(
    () => location.pathname.includes('/akun') || location.pathname.includes('/pokja'),
  );
  const [isAdministratorMenuOpen, setIsAdministratorMenuOpen] = useState(
    () => location.pathname.includes('/ajuan-pegawai') || location.pathname.includes('/rekap-penugasan'),
  );

  const links = [
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
  ];

  return (
    <>
      {links.map((link) => (
        <SidebarMenuItem 
          key={link.label} 
          link={link} 
          currentPath={location.pathname} 
          isSidebarCollapsed={isSidebarCollapsed} 
        />
      ))}

      {/* Superadmin Section */}
      <div className="pt-2">
        <button
          type="button"
          onClick={() => setIsSuperAdminMenuOpen((v) => !v)}
          title={isSidebarCollapsed ? 'Superadmin' : undefined}
          aria-expanded={isSuperAdminMenuOpen}
          className={`flex w-full items-center gap-3 py-2.5 text-sm transition-all cursor-pointer ${
            isSidebarCollapsed ? 'justify-center rounded-xl px-0' : 'rounded-l-full pl-4 pr-5'
          } ${
            isSuperAdminMenuOpen || location.pathname.includes('/akun') || location.pathname.includes('/pokja')
              ? 'bg-white/20 text-white font-semibold'
              : 'text-blue-100 hover:bg-white/15 hover:text-white'
          }`}
        >
          <ShieldCheck className="h-5 w-5 shrink-0" />
          {!isSidebarCollapsed && (
            <>
              <span className="flex-1 text-left">Superadmin</span>
              {isSuperAdminMenuOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </>
          )}
        </button>
        {!isSidebarCollapsed && isSuperAdminMenuOpen && (
          <div className="mt-1 space-y-1 border-l border-blue-300/35 pl-3 ml-4">
            <NavLink to={`${prefix}/akun`} className={({ isActive }) => `flex items-center gap-3 rounded-l-full py-2 pl-3 pr-4 text-sm transition-all ${isActive ? 'bg-white text-[#1E40AF] font-bold shadow-xs' : 'text-blue-100/90 hover:bg-white/15 hover:text-white'}`}>
              <KeyRound className="h-4 w-4 shrink-0" /> Akun
            </NavLink>
            <NavLink to={`${prefix}/pokja`} className={({ isActive }) => `flex items-center gap-3 rounded-l-full py-2 pl-3 pr-4 text-sm transition-all ${isActive ? 'bg-white text-[#1E40AF] font-bold shadow-xs' : 'text-blue-100/90 hover:bg-white/15 hover:text-white'}`}>
              <Network className="h-4 w-4 shrink-0" /> POKJA
            </NavLink>
          </div>
        )}
      </div>

      {/* Administrator Section */}
      <div className="pt-2">
        <button
          type="button"
          onClick={() => setIsAdministratorMenuOpen((v) => !v)}
          title={isSidebarCollapsed ? 'Administrator' : undefined}
          aria-expanded={isAdministratorMenuOpen}
          className={`flex w-full items-center gap-3 py-2.5 text-sm transition-all cursor-pointer ${
            isSidebarCollapsed ? 'justify-center rounded-xl px-0' : 'rounded-l-full pl-4 pr-5'
          } ${
            isAdministratorMenuOpen || location.pathname.includes('/ajuan-pegawai') || location.pathname.includes('/rekap-penugasan')
              ? 'bg-white/20 text-white font-semibold'
              : 'text-blue-100 hover:bg-white/15 hover:text-white'
          }`}
        >
          <ShieldCheck className="h-5 w-5 shrink-0" />
          {!isSidebarCollapsed && (
            <>
              <span className="flex-1 text-left">Administrator</span>
              {isAdministratorMenuOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </>
          )}
        </button>
        {!isSidebarCollapsed && isAdministratorMenuOpen && (
          <div className="mt-1 space-y-1 border-l border-blue-300/35 pl-3 ml-4">
            <NavLink to={`${prefix}/ajuan-pegawai`} className={({ isActive }) => `flex items-center gap-3 rounded-l-full py-2 pl-3 pr-4 text-sm transition-all ${isActive ? 'bg-white text-[#1E40AF] font-bold shadow-xs' : 'text-blue-100/90 hover:bg-white/15 hover:text-white'}`}>
              <FileText className="h-4 w-4 shrink-0" /> Ajuan Pegawai
            </NavLink>
            <NavLink to={`${prefix}/rekap-penugasan`} className={({ isActive }) => `flex items-center gap-3 rounded-l-full py-2 pl-3 pr-4 text-sm transition-all ${isActive ? 'bg-white text-[#1E40AF] font-bold shadow-xs' : 'text-blue-100/90 hover:bg-white/15 hover:text-white'}`}>
              <ChartNoAxesCombined className="h-4 w-4 shrink-0" /> Rekap Penugasan
            </NavLink>
          </div>
        )}
      </div>
    </>
  );
}

// ─────────────────────────────────────────────
// Sidebar Menu untuk APPROVAL
// ─────────────────────────────────────────────
function ApprovalSidebar({ isSidebarCollapsed, prefix }: { isSidebarCollapsed: boolean, prefix: string }) {
  const links = [
    { to: `${prefix}/dashboard`, label: 'Dashboard', icon: LayoutDashboard },
    { to: `${prefix}/approval-tugas`, label: 'Approval Tugas', icon: CheckSquare },
    { to: `${prefix}/approval-cuti`, label: 'Approval Izin & Cuti', icon: CalendarCheck },
    { to: `${prefix}/surat-tugas`, label: 'Surat Tugas', icon: FileText },
    { to: `${prefix}/template-surat`, label: 'Template Surat', icon: ClipboardList },
    { to: `${prefix}/riwayat-approval`, label: 'Riwayat Approval', icon: History },
  ];

  return (
    <>
      {links.map((link) => (
        <NavLink
          key={link.to}
          to={link.to}
          end={link.to.endsWith('/dashboard')}
          title={isSidebarCollapsed ? link.label : undefined}
          className={({ isActive }) =>
            `flex items-center gap-3 py-2.5 text-sm transition-all ${
              isSidebarCollapsed ? 'justify-center rounded-xl px-0' : 'rounded-l-full pl-4 pr-5'
            } ${
              isActive
                ? 'bg-white text-[#1E40AF] font-bold shadow-[0_6px_18px_-4px_rgba(15,23,42,0.22)]'
                : 'text-blue-100 hover:bg-white/15 hover:text-white'
            }`
          }
        >
          <link.icon className="h-5 w-5 shrink-0" />
          {!isSidebarCollapsed && <span className="overflow-hidden whitespace-nowrap">{link.label}</span>}
        </NavLink>
      ))}
    </>
  );
}

// ─────────────────────────────────────────────
// SidebarMenuItem untuk mendukung Dropdown di ADMIN
// ─────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function SidebarMenuItem({ link, currentPath, isSidebarCollapsed }: { link: any; currentPath: string, isSidebarCollapsed: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const Icon = link.icon;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const isChildActive = link.items?.some((item: any) => {
    const [basePath, search] = item.to.split('?');
    const searchParams = new URLSearchParams(search || '');
    const targetTab = searchParams.get('tab');
    const currentSearchParams = new URLSearchParams(location.search);
    const currentTab = currentSearchParams.get('tab');
    const isQueryActive = targetTab ? currentTab === targetTab : true;
    const isPathActive = currentPath === basePath || currentPath === basePath + '/';
    return isPathActive && isQueryActive;
  });
  const isActive = currentPath === link.to || isChildActive;

  if (link.items) {
    return (
      <div className="flex flex-col">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          title={isSidebarCollapsed ? link.label : undefined}
          className={`flex w-full items-center justify-between py-2.5 text-sm transition-all cursor-pointer ${
            isSidebarCollapsed ? 'justify-center rounded-xl px-0' : 'rounded-l-full pl-4 pr-5'
          } ${
            isActive
              ? 'bg-white text-[#1E40AF] font-bold shadow-[0_6px_18px_-4px_rgba(15,23,42,0.22)]'
              : isOpen
                ? 'bg-white/20 text-white font-semibold'
                : 'text-blue-100 hover:bg-white/15 hover:text-white'
          }`}
        >
          <div className="flex items-center gap-3">
            <Icon className="h-5 w-5 shrink-0" />
            {!isSidebarCollapsed && <span className="overflow-hidden whitespace-nowrap">{link.label}</span>}
          </div>
          {!isSidebarCollapsed && (
            isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />
          )}
        </button>
        {!isSidebarCollapsed && isOpen && (
          <div className="mt-1 ml-4 flex flex-col space-y-1 border-l border-blue-300/35 pl-3">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {link.items.map((subItem: any) => {
              const [basePath, search] = subItem.to.split('?');
              const searchParams = new URLSearchParams(search || '');
              const targetTab = searchParams.get('tab');
              const currentSearchParams = new URLSearchParams(location.search);
              const currentTab = currentSearchParams.get('tab');

              const isQueryActive = targetTab ? currentTab === targetTab : true;
              const isPathActive = currentPath === basePath || currentPath === basePath + '/';
              const childActive = isPathActive && isQueryActive;

              const SubIcon = subItem.icon;
              return (
                <Link
                  key={subItem.to}
                  to={subItem.to}
                  className={`flex items-center gap-3 rounded-l-full py-2 pl-3 pr-4 text-sm transition-all ${
                    childActive
                      ? 'bg-white text-[#1E40AF] font-bold shadow-xs'
                      : 'text-blue-100/90 hover:text-white hover:bg-white/15'
                  }`}
                >
                  {SubIcon && <SubIcon className="h-4 w-4 shrink-0" />}
                  {subItem.label}
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
      title={isSidebarCollapsed ? link.label : undefined}
      className={({ isActive: navActive }) =>
        `flex items-center gap-3 py-2.5 text-sm transition-all ${
          isSidebarCollapsed ? 'justify-center rounded-xl px-0' : 'rounded-l-full pl-4 pr-5'
        } ${
          navActive
            ? 'bg-white text-[#1E40AF] font-bold shadow-[0_6px_18px_-4px_rgba(15,23,42,0.22)]'
            : 'text-blue-100 hover:bg-white/15 hover:text-white'
        }`
      }
    >
      <Icon className="h-5 w-5 shrink-0" />
      {!isSidebarCollapsed && <span className="overflow-hidden whitespace-nowrap">{link.label}</span>}
    </NavLink>
  );
}

// ─────────────────────────────────────────────
// AdminLayout (shared shell for Super Admin, Admin, Approval)
// ─────────────────────────────────────────────
interface AdminLayoutProps {
  children: ReactNode;
}

export const AdminLayout = ({ children }: AdminLayoutProps) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [mobileMenuPath, setMobileMenuPath] = useState<string | null>(null);
  const isMobileMenuOpen = mobileMenuPath === location.pathname;
  const setIsMobileMenuOpen = (open: boolean) => setMobileMenuPath(open ? location.pathname : null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [hasUnreadNotif, setHasUnreadNotif] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/auth/login');
  };

  const normalizedRole = user?.role?.toUpperCase() || 'PEGAWAI';

  const prefix = normalizedRole === 'SUPER_ADMIN' ? '/super-admin' : normalizedRole === 'APPROVAL' ? '/approval' : '/admin';
  const panelLabel = normalizedRole === 'SUPER_ADMIN' ? 'Panel Super Admin' : normalizedRole === 'APPROVAL' ? 'Panel Approval' : 'Panel Admin';

  // Admin Links for Admin Role ONLY
  const adminLinks = [
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
      ]
    },
    { to: `${prefix}/pemetaan`, label: 'Pemetaan', icon: MapPin },
    {
      to: '#',
      label: 'Administrator',
      icon: ShieldCheck,
      items: [
        { to: `${prefix}/ajuan-pegawai`, label: 'Ajuan Pegawai', icon: FileText },
        { to: `${prefix}/rekap-penugasan`, label: 'Rekap Penugasan', icon: ChartNoAxesCombined }
      ]
    },
  ];

  return (
    <div className="h-screen overflow-hidden bg-[#F3F6FB]">
      <div className="flex h-full">
        {/* ====== SIDEBAR ====== */}
        <aside className={`relative hidden h-full shrink-0 flex-col overflow-hidden bg-gradient-to-b from-[#1E3A8A] via-[#1D4ED8] to-[#1E40AF] py-6 text-white shadow-xl lg:flex transition-all duration-300 ${isSidebarCollapsed ? 'w-20 px-2.5' : 'w-72 pl-5 pr-0'}`}>
          <SidebarBotanicalDecor />

          {/* Logo & Title */}
          <Link to={`${prefix}/dashboard`} className={`relative z-10 flex shrink-0 items-center gap-3 py-2 ${isSidebarCollapsed ? 'justify-center' : 'px-2 pr-5'}`}>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white shadow-md">
              <img
                src={`${import.meta.env.BASE_URL}logo-kemendikdasmen.ico`}
                alt="Logo"
                className="h-9 w-9"
              />
            </div>
            {!isSidebarCollapsed && (
              <div className="overflow-hidden whitespace-nowrap">
                <p className="text-sm font-bold tracking-tight text-white">SIM Penugasan</p>
                <p className="text-xs text-blue-200">{panelLabel}</p>
              </div>
            )}
          </Link>

          {/* Navigation */}
          <nav className="relative z-10 mt-8 flex-1 min-h-0 space-y-1.5 overflow-y-auto">
            {normalizedRole === 'SUPER_ADMIN' ? (
              <SuperAdminSidebar isSidebarCollapsed={isSidebarCollapsed} />
            ) : normalizedRole === 'APPROVAL' ? (
              <ApprovalSidebar isSidebarCollapsed={isSidebarCollapsed} prefix={prefix} />
            ) : (
              adminLinks.map((link) => (
                <SidebarMenuItem key={link.label} link={link} currentPath={location.pathname} isSidebarCollapsed={isSidebarCollapsed} />
              ))
            )}
          </nav>
        </aside>

        {/* ====== MOBILE DRAWER ====== */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 flex lg:hidden">
            <div
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <div className="relative flex w-72 max-w-[85vw] flex-col overflow-hidden bg-gradient-to-b from-[#1E3A8A] via-[#1D4ED8] to-[#1E40AF] py-5 pl-5 pr-0 text-white shadow-2xl">
              <SidebarBotanicalDecor />

              <div className="relative z-10 flex items-center justify-between pb-4 pr-5 border-b border-white/15">
                <Link
                  to={`${prefix}/dashboard`}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-3"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm">
                    <img
                      src={`${import.meta.env.BASE_URL}logo-kemendikdasmen.ico`}
                      alt="Logo"
                      className="h-8 w-8"
                    />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">SIM Penugasan</p>
                    <p className="text-xs text-blue-200">{panelLabel}</p>
                  </div>
                </Link>
                <button
                  type="button"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="rounded-lg p-1.5 text-blue-100 hover:bg-white/15 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <nav className="relative z-10 mt-6 flex-1 space-y-1.5 overflow-y-auto">
                {normalizedRole === 'SUPER_ADMIN' ? (
                  <SuperAdminSidebar isSidebarCollapsed={false} />
                ) : normalizedRole === 'APPROVAL' ? (
                  <ApprovalSidebar isSidebarCollapsed={false} prefix={prefix} />
                ) : (
                  adminLinks.map((link) => (
                    <SidebarMenuItem
                      key={link.label}
                      link={link}
                      currentPath={location.pathname}
                      isSidebarCollapsed={false}
                    />
                  ))
                )}
              </nav>

              <div className="relative z-10 pt-4 pr-5 border-t border-white/15">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 rounded-xl border border-white/25 bg-white/15 px-3 py-2.5 text-sm font-semibold text-white hover:bg-white/25 transition"
                >
                  <LogOut className="h-4 w-4" /> Keluar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ====== MAIN CONTENT ====== */}
        <div className="flex-1 min-w-0 h-full overflow-y-auto bg-[#F3F6FB]">
          {/* Navbar */}
          <header className="sticky top-0 z-40 border-b border-slate-100 bg-white/95 backdrop-blur-sm shadow-[0_4px_20px_-6px_rgba(30,64,175,0.08)]">
            <div className="flex items-center justify-between px-4 py-3 sm:px-6">
              {/* Left: Mobile & Desktop Hamburger */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsMobileMenuOpen(true)}
                  className="rounded-xl p-2 text-[#1E40AF] bg-[#EEF3FB] hover:bg-blue-100 transition lg:hidden"
                  aria-label="Buka menu"
                >
                  <Menu className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                  className="rounded-xl p-2 text-[#1E40AF] bg-[#EEF3FB] hover:bg-blue-100 transition hidden lg:block cursor-pointer"
                  aria-label="Kecilkan sidebar"
                >
                  <Menu className="h-5 w-5" />
                </button>
                <div className="lg:hidden flex items-center gap-2 pl-1">
                  <div className="h-7 w-7 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center">
                    <img
                      src={`${import.meta.env.BASE_URL}logo-kemendikdasmen.ico`}
                      alt="Logo"
                      className="h-6 w-6"
                    />
                  </div>
                  <span className="text-xs font-bold text-slate-800 tracking-tight sm:text-sm">SIM Penugasan</span>
                </div>
              </div>

              {/* Right: Notification + Profile */}
              <div className="flex items-center gap-2.5 ml-auto">
                {/* Notification Bell */}
                <div ref={notifRef} className="relative">
                  <button
                    onClick={() => { setIsNotifOpen(!isNotifOpen); setIsProfileOpen(false); }}
                    className="relative p-2.5 bg-[#EEF3FB] text-[#1E40AF] hover:bg-blue-100 rounded-full transition-colors cursor-pointer"
                    aria-label="Notifikasi"
                  >
                    <Bell className="w-4 h-4" />
                    {hasUnreadNotif && (
                      <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
                    )}
                  </button>

                  {isNotifOpen && (
                    <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white rounded-xl shadow-lg border border-slate-200 z-50 overflow-hidden">
                      <div className="px-4 py-3 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                        <h3 className="font-bold text-slate-800 text-sm">Notifikasi</h3>
                        <span 
                          onClick={() => setHasUnreadNotif(false)} 
                          className="text-xs text-blue-600 hover:underline cursor-pointer font-medium"
                        >
                          Tandai semua dibaca
                        </span>
                      </div>
                      <div className="max-h-[300px] overflow-y-auto">
                        <div className="p-8 text-center text-xs text-slate-400">
                          <Bell className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                          <p>Tidak ada notifikasi baru saat ini.</p>
                        </div>
                      </div>
                      <div className="p-2 text-center bg-slate-50 border-t border-slate-100">
                        <Link
                          to={`${prefix}/notifikasi`}
                          onClick={() => setIsNotifOpen(false)}
                          className="inline-block text-xs font-semibold text-slate-600 hover:text-blue-600 py-1"
                        >
                          Lihat Semua Notifikasi
                        </Link>
                      </div>
                    </div>
                  )}
                </div>

                {/* Profile Dropdown */}
                <div ref={profileRef} className="relative">
                  <button
                    onClick={() => { setIsProfileOpen(!isProfileOpen); setIsNotifOpen(false); }}
                    className="flex items-center gap-3 rounded-full border border-slate-200 bg-white p-1 pr-3 hover:bg-slate-50 transition cursor-pointer"
                  >
                    <div className="relative">
                      <div className="w-9 h-9 rounded-full bg-blue-100 border-2 border-blue-300 flex items-center justify-center text-blue-700 overflow-hidden">
                        {user?.fotoAvatar ? (
                          <img src={user.fotoAvatar} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                          <UserCircle2 className="w-5 h-5" />
                        )}
                      </div>
                      <div className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-green-500"></div>
                    </div>
                    <span className="text-sm font-semibold text-slate-700 hidden sm:block">{user?.nama || 'Administrator'}</span>
                    <ChevronDown className="h-4 w-4 text-slate-400" />
                  </button>

                  {isProfileOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-200 z-50 overflow-hidden">
                      <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
                        <p className="text-sm font-bold text-slate-800 truncate">{user?.nama || 'Administrator'}</p>
                        <p className="text-xs text-slate-500 truncate">{user?.role?.replace('_', ' ') || 'Admin'}</p>
                      </div>
                      <div className="py-1">
                        <Link
                          to={`${prefix}/profile`}
                          onClick={() => setIsProfileOpen(false)}
                          className="flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors"
                        >
                          <UserCircle2 className="w-4 h-4" />
                          Profil Saya
                        </Link>
                      </div>
                      <div className="py-1 border-t border-slate-100">
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 transition-colors font-medium"
                        >
                          <LogOut className="w-4 h-4" />
                          Keluar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            {/* Blue accent line at bottom of navbar */}
            <div className="h-0.5 bg-gradient-to-r from-[#1E3A8A] via-[#2563EB] to-[#38BDF8]" />
          </header>

          <main className="p-4 sm:p-6">{children}</main>
        </div>
      </div>
    </div>
  );
};
