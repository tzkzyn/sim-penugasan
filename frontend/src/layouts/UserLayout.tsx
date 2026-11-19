import { useState, type ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { UserSidebarMenu } from '@/components/user/UserSidebarMenu';
import { UserTopNavbar } from '@/components/user/UserTopNavbar';
import { LogOut, X } from 'lucide-react';

interface UserLayoutProps {
  children: ReactNode;
}

export const UserLayout = ({ children }: UserLayoutProps) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuPath, setMobileMenuPath] = useState<string | null>(null);
  const isMobileMenuOpen = mobileMenuPath === location.pathname;
  const setIsMobileMenuOpen = (open: boolean) => setMobileMenuPath(open ? location.pathname : null);

  const handleLogout = () => {
    logout();
    navigate('/auth/login');
  };

  return (
    <div className="h-screen overflow-hidden bg-[#F3F6FB]">
      <div className="flex h-full">
        {/* Sidebar Desktop */}
        <aside className="relative hidden h-full w-72 shrink-0 flex-col overflow-hidden bg-white border-r border-slate-200/80 px-4 py-6 text-slate-700 lg:flex">
          <Link to="/user/dashboard" className="relative z-10 flex shrink-0 items-center gap-3 px-2 py-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white border border-slate-200/80 shadow-xs">
              <img
                src={`${import.meta.env.BASE_URL}logo-bmti.png`}
                alt="Logo BMTI"
                className="h-8 w-8 object-contain"
              />
            </div>
            <div>
              <p className="text-sm font-bold tracking-tight text-slate-800">SIM Penugasan</p>
              <p className="text-xs text-slate-500">Pegawai</p>
            </div>
          </Link>

          <nav className="relative z-10 mt-8 flex-1 min-h-0 space-y-1.5 overflow-y-auto">
            <UserSidebarMenu />
          </nav>
        </aside>

        {/* Drawer Mobile */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 flex lg:hidden">
            <div
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <div className="relative flex w-72 max-w-[85vw] flex-col overflow-hidden bg-white border-r border-slate-200/80 p-5 text-slate-700 shadow-2xl">
              <div className="relative z-10 flex items-center justify-between pb-4 border-b border-slate-200/80">
                <Link
                  to="/user/dashboard"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-3"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white border border-slate-200/80 shadow-xs">
                    <img
                      src={`${import.meta.env.BASE_URL}logo-bmti.png`}
                      alt="Logo BMTI"
                      className="h-7 w-7 object-contain"
                    />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">SIM Penugasan</p>
                    <p className="text-xs text-slate-500">Pegawai</p>
                  </div>
                </Link>
                <button
                  type="button"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                  aria-label="Tutup menu"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <nav className="relative z-10 mt-6 flex-1 space-y-1.5 overflow-y-auto">
                <UserSidebarMenu onNavigate={() => setIsMobileMenuOpen(false)} />
              </nav>

              <div className="relative z-10 pt-4 border-t border-slate-200/80">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition cursor-pointer"
                >
                  <LogOut className="h-4 w-4" /> Keluar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Area Konten Utama */}
        <div className="flex-1 min-w-0 h-full overflow-y-auto bg-[#F3F6FB]">
          <UserTopNavbar
            user={user}
            onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
            onLogout={handleLogout}
          />
          <main className="p-4 sm:p-6">{children}</main>
        </div>
      </div>
    </div>
  );
};
