import { useState, type ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { SidebarBotanicalDecor } from '@/components/ui/SidebarBotanicalDecor';
import { UserSidebarMenu } from '@/components/user/UserSidebarMenu';
import { UserTopNavbar } from '@/components/user/UserTopNavbar';
import { LogOut, ShieldCheck, X } from 'lucide-react';

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
        <aside className="relative hidden h-full w-72 shrink-0 flex-col overflow-hidden bg-gradient-to-b from-[#1E3A8A] via-[#1D4ED8] to-[#1E40AF] py-6 pl-5 pr-0 text-white lg:flex">
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
            <UserSidebarMenu />
          </nav>

          <div className="relative z-10 mt-4 mr-5 shrink-0 rounded-2xl border border-white/20 bg-white/10 p-4 text-white backdrop-blur-sm">
            <p className="text-sm font-bold truncate">{user?.nama || 'User'}</p>
            <p className="text-xs text-blue-100/90 truncate">
              {user?.unitKerja || 'Unit'} • {user?.role || 'PEGAWAI'}
            </p>
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

        {/* Drawer Mobile */}
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
                  to="/user/dashboard"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-3"
                >
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
                  aria-label="Tutup menu"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <nav className="relative z-10 mt-6 flex-1 space-y-1.5 overflow-y-auto">
                <UserSidebarMenu onNavigate={() => setIsMobileMenuOpen(false)} />
              </nav>

              <div className="relative z-10 pt-4 pr-5 border-t border-white/15">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 rounded-xl border border-white/25 bg-white/15 px-3 py-2.5 text-sm font-semibold text-white hover:bg-white/25 transition cursor-pointer"
                >
                  <LogOut className="h-4 w-4" /> Keluar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Area Konten Utama */}
        <div className="flex-1 min-w-0 h-full overflow-y-auto bg-[#F3F6FB]">
          <UserTopNavbar onOpenMobileMenu={() => setIsMobileMenuOpen(true)} />
          <main className="p-4 sm:p-6">{children}</main>
        </div>
      </div>
    </div>
  );
};
