import { useState, useEffect, type ReactNode } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [absensiTerbuka, setAbsensiTerbuka] = useState(location.pathname.startsWith('/user/absensi'));
  const [tugasTerbuka, setTugasTerbuka] = useState(location.pathname.startsWith('/user/tugas'));
  const absensiAktif = location.pathname.startsWith('/user/absensi');
  const tugasAktif = location.pathname.startsWith('/user/tugas');

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

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
            `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
              isActive ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`
          }
        >
          <Icon className="h-4 w-4" />
          {label}
        </NavLink>
      ))}

      <div>
        <button
          type="button"
          onClick={() => setTugasTerbuka((terbuka) => !terbuka)}
          className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
            tugasAktif ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
          aria-expanded={tugasTerbuka}
        >
          <FileText className="h-4 w-4" />
          <span className="flex-1 text-left">Tugas</span>
          <ChevronDown className={`h-4 w-4 transition-transform ${tugasTerbuka ? 'rotate-180' : ''}`} />
        </button>
        {tugasTerbuka && (
          <div className="mt-1 space-y-1 border-l border-slate-200 py-1 pl-4 ml-5">
            <NavLink
              to="/user/tugas/pengajuan"
              onClick={() => setIsMobileMenuOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-2 rounded-lg px-3 py-2 text-xs transition ${
                  isActive ? 'bg-blue-50 font-semibold text-blue-700' : 'text-slate-600 hover:bg-slate-100'
                }`
              }
            >
              <Send className="h-3.5 w-3.5" /> Proses Ajuan Surat Tugas
            </NavLink>
            <NavLink
              to="/user/tugas/progres"
              onClick={() => setIsMobileMenuOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-2 rounded-lg px-3 py-2 text-xs transition ${
                  isActive ? 'bg-blue-50 font-semibold text-blue-700' : 'text-slate-600 hover:bg-slate-100'
                }`
              }
            >
              <FileText className="h-3.5 w-3.5" /> Progres Surat Tugas
            </NavLink>
            <NavLink
              to="/user/tugas/laporan"
              onClick={() => setIsMobileMenuOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-2 rounded-lg px-3 py-2 text-xs transition ${
                  isActive ? 'bg-blue-50 font-semibold text-blue-700' : 'text-slate-600 hover:bg-slate-100'
                }`
              }
            >
              <ChartNoAxesCombined className="h-3.5 w-3.5" /> Laporan
            </NavLink>
          </div>
        )}
      </div>

      <div>
        <button
          type="button"
          onClick={() => setAbsensiTerbuka((terbuka) => !terbuka)}
          className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
            absensiAktif ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
          aria-expanded={absensiTerbuka}
        >
          <CalendarCheck className="h-4 w-4" />
          <span className="flex-1 text-left">Absensi</span>
          <ChevronDown className={`h-4 w-4 transition-transform ${absensiTerbuka ? 'rotate-180' : ''}`} />
        </button>
        {absensiTerbuka && (
          <div className="mt-1 space-y-1 border-l border-slate-200 py-1 pl-4 ml-5">
            <NavLink
              to="/user/absensi/kehadiran"
              onClick={() => setIsMobileMenuOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-2 rounded-lg px-3 py-2 text-xs transition ${
                  isActive ? 'bg-blue-50 font-semibold text-blue-700' : 'text-slate-600 hover:bg-slate-100'
                }`
              }
            >
              <CalendarDays className="h-3.5 w-3.5" /> Absensi Kehadiran
            </NavLink>
            <NavLink
              to="/user/absensi/cuti"
              onClick={() => setIsMobileMenuOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-2 rounded-lg px-3 py-2 text-xs transition ${
                  isActive ? 'bg-blue-50 font-semibold text-blue-700' : 'text-slate-600 hover:bg-slate-100'
                }`
              }
            >
              <CalendarPlus className="h-3.5 w-3.5" /> Izin & Cuti
            </NavLink>
          </div>
        )}
      </div>

      <div className="pt-2 border-t border-slate-100">
        <p className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">Layanan Pegawai</p>
        {secondaryLinks.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={() => setIsMobileMenuOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
                isActive ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`
            }
          >
            <Icon className="h-4 w-4" />
            {label}
          </NavLink>
        ))}
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="flex min-h-screen">
        {/* Desktop Sidebar */}
        <aside className="hidden w-72 flex-col border-r border-slate-200 bg-white px-5 py-6 text-slate-700 lg:flex">
          <Link to="/user/dashboard" className="flex items-center gap-3 px-2 py-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold">SIM Penugasan</p>
              <p className="text-xs text-slate-500">Pegawai</p>
            </div>
          </Link>

          <nav className="mt-8 space-y-1 overflow-y-auto">
            {navContent}
          </nav>

          <div className="mt-auto rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-semibold">{user?.nama || 'User'}</p>
            <p className="text-xs text-slate-500">{user?.unitKerja || 'Unit'} • {user?.role || 'PEGAWAI'}</p>
            <button
              type="button"
              onClick={handleLogout}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 transition cursor-pointer"
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
            <div className="relative flex w-72 max-w-[85vw] flex-col bg-white p-5 text-slate-700 shadow-2xl">
              <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                <Link to="/user/dashboard" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">SIM Penugasan</p>
                    <p className="text-xs text-slate-500">Pegawai</p>
                  </div>
                </Link>
                <button
                  type="button"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <nav className="mt-6 flex-1 space-y-1 overflow-y-auto">
                {navContent}
              </nav>

              <div className="pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-medium text-rose-600 hover:bg-rose-50 transition"
                >
                  <LogOut className="h-4 w-4" /> Keluar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 min-w-0">
          <header className="border-b border-slate-200 bg-white px-4 py-3 sm:px-6 shadow-xs sticky top-0 z-30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsMobileMenuOpen(true)}
                  className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 transition lg:hidden"
                  aria-label="Buka menu"
                >
                  <Menu className="h-6 w-6" />
                </button>
                <div>
                  <p className="text-sm font-bold text-slate-800">Area Pegawai</p>
                  <p className="text-xs text-slate-500 hidden sm:block">Pantau tugas, absensi, dan pengajuan surat tugas</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <NavLink
                  to="/user/notifikasi"
                  aria-label="Notifikasi"
                  title="Notifikasi"
                  className={({ isActive }) =>
                    `relative flex h-9 w-9 items-center justify-center rounded-full transition ${
                      isActive ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-blue-700'
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
                      isActive ? 'bg-blue-100 text-blue-700' : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
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
