import { useState, type ReactNode } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { SidebarBotanicalDecor } from '@/components/ui/SidebarBotanicalDecor';
import {
  LayoutDashboard,
  FileText,
  Send,
  ChartNoAxesCombined,
  CalendarCheck,
  CalendarDays,
  CalendarPlus,
  ChevronDown,
  Bell,
  UserCircle2,
  LogOut,
  ShieldCheck,
  CheckSquare,
  UploadCloud,
  MapPin,
  Wallet,
  Menu,
  X
} from 'lucide-react';

interface UserLayoutProps {
  children: ReactNode;
}

const mainLinks = [
  { to: '/user/dashboard', label: 'Dashboard', icon: LayoutDashboard },
];

const secondaryLinks = [
  { to: '/user/status-approval', label: 'Status Approval', icon: CheckSquare },
  { to: '/user/upload-surat', label: 'Upload Surat Tugas', icon: UploadCloud },
  { to: '/user/pemetaan', label: 'Pemetaan Penugasan', icon: MapPin },
  { to: '/user/simpanan', label: 'Simpanan & Biaya', icon: Wallet },
];

export const UserLayout = ({ children }: UserLayoutProps) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuPath, setMobileMenuPath] = useState<string | null>(null);
  const isMobileMenuOpen = mobileMenuPath === location.pathname;
  const setIsMobileMenuOpen = (open: boolean) => setMobileMenuPath(open ? location.pathname : null);
  const [absensiTerbuka, setAbsensiTerbuka] = useState(location.pathname.startsWith('/user/absensi'));
  const [tugasTerbuka, setTugasTerbuka] = useState(location.pathname.startsWith('/user/tugas'));
  const absensiAktif = location.pathname.startsWith('/user/absensi');
  const tugasAktif = location.pathname.startsWith('/user/tugas');

  const handleLogout = () => {
    logout();
    navigate('/auth/login');
  };

  const navContent = (
    <>
      {mainLinks.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          onClick={() => setIsMobileMenuOpen(false)}
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

      <div>
        <button
          type="button"
          onClick={() => setTugasTerbuka((terbuka) => !terbuka)}
          className={`flex w-full items-center gap-3 rounded-l-full py-2.5 pl-4 pr-5 text-sm transition-all cursor-pointer ${
            tugasAktif
              ? 'bg-white text-[#1E40AF] font-bold shadow-[0_6px_18px_-4px_rgba(15,23,42,0.22)]'
              : 'text-blue-100 hover:bg-white/15 hover:text-white'
          }`}
          aria-expanded={tugasTerbuka}
        >
          <FileText className="h-4 w-4 shrink-0" />
          <span className="flex-1 text-left">Tugas</span>
          <ChevronDown className={`h-4 w-4 transition-transform ${tugasTerbuka ? 'rotate-180' : ''}`} />
        </button>
        {tugasTerbuka && (
          <div className="mt-1 space-y-1 border-l border-blue-300/35 py-1 pl-3 ml-5">
            <NavLink
              to="/user/tugas/pengajuan"
              onClick={() => setIsMobileMenuOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-2 rounded-l-full py-2 pl-3 pr-4 text-xs transition-all ${
                  isActive
                    ? 'bg-white text-[#1E40AF] font-bold shadow-xs'
                    : 'text-blue-100/90 hover:bg-white/15 hover:text-white'
                }`
              }
            >
              <Send className="h-3.5 w-3.5 shrink-0" /> Proses Ajuan Surat Tugas
            </NavLink>
            <NavLink
              to="/user/tugas/progres"
              onClick={() => setIsMobileMenuOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-2 rounded-l-full py-2 pl-3 pr-4 text-xs transition-all ${
                  isActive
                    ? 'bg-white text-[#1E40AF] font-bold shadow-xs'
                    : 'text-blue-100/90 hover:bg-white/15 hover:text-white'
                }`
              }
            >
              <FileText className="h-3.5 w-3.5 shrink-0" /> Progres Surat Tugas
            </NavLink>
            <NavLink
              to="/user/tugas/laporan"
              onClick={() => setIsMobileMenuOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-2 rounded-l-full py-2 pl-3 pr-4 text-xs transition-all ${
                  isActive
                    ? 'bg-white text-[#1E40AF] font-bold shadow-xs'
                    : 'text-blue-100/90 hover:bg-white/15 hover:text-white'
                }`
              }
            >
              <ChartNoAxesCombined className="h-3.5 w-3.5 shrink-0" /> Laporan
            </NavLink>
          </div>
        )}
      </div>

      <div>
        <button
          type="button"
          onClick={() => setAbsensiTerbuka((terbuka) => !terbuka)}
          className={`flex w-full items-center gap-3 rounded-l-full py-2.5 pl-4 pr-5 text-sm transition-all cursor-pointer ${
            absensiAktif
              ? 'bg-white text-[#1E40AF] font-bold shadow-[0_6px_18px_-4px_rgba(15,23,42,0.22)]'
              : 'text-blue-100 hover:bg-white/15 hover:text-white'
          }`}
          aria-expanded={absensiTerbuka}
        >
          <CalendarCheck className="h-4 w-4 shrink-0" />
          <span className="flex-1 text-left">Absensi</span>
          <ChevronDown className={`h-4 w-4 transition-transform ${absensiTerbuka ? 'rotate-180' : ''}`} />
        </button>
        {absensiTerbuka && (
          <div className="mt-1 space-y-1 border-l border-blue-300/35 py-1 pl-3 ml-5">
            <NavLink
              to="/user/absensi/kehadiran"
              onClick={() => setIsMobileMenuOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-2 rounded-l-full py-2 pl-3 pr-4 text-xs transition-all ${
                  isActive
                    ? 'bg-white text-[#1E40AF] font-bold shadow-xs'
                    : 'text-blue-100/90 hover:bg-white/15 hover:text-white'
                }`
              }
            >
              <CalendarDays className="h-3.5 w-3.5 shrink-0" /> Absensi Kehadiran
            </NavLink>
            <NavLink
              to="/user/absensi/cuti"
              onClick={() => setIsMobileMenuOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-2 rounded-l-full py-2 pl-3 pr-4 text-xs transition-all ${
                  isActive
                    ? 'bg-white text-[#1E40AF] font-bold shadow-xs'
                    : 'text-blue-100/90 hover:bg-white/15 hover:text-white'
                }`
              }
            >
              <CalendarPlus className="h-3.5 w-3.5 shrink-0" /> Izin & Cuti
            </NavLink>
          </div>
        )}
      </div>

      <div className="pt-3 mt-2 border-t border-white/15">
        <p className="px-4 pb-2 text-[11px] font-bold uppercase tracking-wider text-blue-200/80">Layanan Pegawai</p>
        {secondaryLinks.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={() => setIsMobileMenuOpen(false)}
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

  return (
    <div className="h-screen overflow-hidden bg-[#F3F6FB]">
      <div className="flex h-full">
        {/* Desktop Sidebar */}
        <aside className="relative hidden h-full w-72 shrink-0 flex-col overflow-hidden bg-gradient-to-b from-[#1E3A8A] via-[#1D4ED8] to-[#1E40AF] py-6 pl-5 pr-0 text-white shadow-xl lg:flex">
          <SidebarBotanicalDecor />

          <Link to="/user/dashboard" className="relative z-10 flex shrink-0 items-center gap-3 px-2 py-2 pr-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#1E40AF] shadow-md">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-bold tracking-tight text-white">SIM Penugasan</p>
              <p className="text-xs text-blue-200">Pegawai</p>
            </div>
          </Link>

          <nav className="relative z-10 mt-8 flex-1 min-h-0 space-y-1.5 overflow-y-auto">
            {navContent}
          </nav>

          <div className="relative z-10 mt-4 mr-5 shrink-0 rounded-2xl border border-white/20 bg-white/10 p-4 text-white backdrop-blur-sm">
            <p className="text-sm font-bold truncate">{user?.nama || 'User'}</p>
            <p className="text-xs text-blue-100/90 truncate">{user?.unitKerja || 'Unit'} • {user?.role || 'PEGAWAI'}</p>
            <button
              type="button"
              onClick={handleLogout}
              className="mt-3.5 flex w-full items-center justify-center gap-2 rounded-xl border border-white/25 bg-white/15 px-3 py-2 text-sm font-semibold text-white hover:bg-white/25 transition cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
              Keluar
            </button>
          </div>
        </aside>

        {/* Mobile Drawer */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 flex lg:hidden">
            <div
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <div className="relative flex w-72 max-w-[85vw] flex-col overflow-hidden bg-gradient-to-b from-[#1E3A8A] via-[#1D4ED8] to-[#1E40AF] py-5 pl-5 pr-0 text-white shadow-2xl">
              <SidebarBotanicalDecor />

              <div className="relative z-10 flex items-center justify-between pb-4 pr-5 border-b border-white/15">
                <Link to="/user/dashboard" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-[#1E40AF] shadow-sm">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">SIM Penugasan</p>
                    <p className="text-xs text-blue-200">Pegawai</p>
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
                {navContent}
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

        {/* Main Content Area */}
        <div className="flex-1 min-w-0 h-full overflow-y-auto bg-[#F3F6FB]">
          <header className="border-b border-slate-100 bg-white/95 backdrop-blur-sm px-4 py-3.5 sm:px-6 shadow-[0_4px_20px_-6px_rgba(30,64,175,0.08)] sticky top-0 z-30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsMobileMenuOpen(true)}
                  className="rounded-xl p-2 text-[#1E40AF] bg-[#EEF3FB] hover:bg-blue-100 transition lg:hidden"
                  aria-label="Buka menu"
                >
                  <Menu className="h-5 w-5" />
                </button>
                <div>
                  <p className="text-sm font-bold text-slate-800">Area Pegawai</p>
                  <p className="text-xs text-slate-500 hidden sm:block">Pantau tugas, absensi, dan pengajuan surat tugas</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <NavLink
                  to="/user/notifikasi"
                  aria-label="Notifikasi"
                  title="Notifikasi"
                  className={({ isActive }) =>
                    `relative flex h-9 w-9 items-center justify-center rounded-full transition ${
                      isActive ? 'bg-[#1D4ED8] text-white shadow-sm' : 'bg-[#EEF3FB] text-[#1E40AF] hover:bg-blue-100'
                    }`
                  }
                >
                  <Bell className="h-4 w-4" />
                  <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-rose-500 ring-2 ring-white" />
                </NavLink>
                <NavLink
                  to="/user/profile"
                  aria-label="Profil"
                  title="Profil"
                  className={({ isActive }) =>
                    `flex h-9 w-9 items-center justify-center rounded-full transition ${
                      isActive ? 'bg-[#1D4ED8] text-white shadow-sm' : 'bg-[#EEF3FB] text-[#1E40AF] hover:bg-blue-100'
                    }`
                  }
                >
                  <UserCircle2 className="h-5 w-5" />
                </NavLink>
              </div>
            </div>
          </header>
          <main className="p-4 sm:p-6">{children}</main>
        </div>
      </div>
    </div>
  );
};
