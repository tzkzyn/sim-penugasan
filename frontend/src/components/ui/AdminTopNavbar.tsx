import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, ChevronDown, LogOut, Menu, UserCircle2 } from 'lucide-react';
import type { Pegawai } from '@/types';

interface AdminTopNavbarProps {
  user: Pegawai | null;
  prefix: string;
  isSidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  onOpenMobileMenu: () => void;
  onLogout: () => void;
}

export const AdminTopNavbar = ({
  user,
  prefix,
  isSidebarCollapsed,
  onToggleSidebar,
  onOpenMobileMenu,
  onLogout,
}: AdminTopNavbarProps) => {
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

  return (
    <header className="sticky top-0 z-40 border-b border-slate-100 bg-white/95 backdrop-blur-sm shadow-[0_4px_20px_-6px_rgba(30,64,175,0.08)]">
      <div className="flex items-center justify-between px-4 py-3 sm:px-6">
        {/* Kiri: Tombol Menu Mobile & Desktop + Logo Mobile */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenMobileMenu}
            className="rounded-xl p-2 text-[#1E40AF] bg-[#EEF3FB] hover:bg-blue-100 transition lg:hidden cursor-pointer"
            aria-label="Buka menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={onToggleSidebar}
            className="rounded-xl p-2 text-[#1E40AF] bg-[#EEF3FB] hover:bg-blue-100 transition hidden lg:block cursor-pointer"
            aria-label={isSidebarCollapsed ? 'Perluas sidebar' : 'Kecilkan sidebar'}
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

        {/* Kanan: Notifikasi + Dropdown Profil */}
        <div className="flex items-center gap-2.5 ml-auto">
          <div ref={notifRef} className="relative">
            <button
              type="button"
              onClick={() => {
                setIsNotifOpen((prev) => !prev);
                setIsProfileOpen(false);
              }}
              className="relative p-2.5 bg-[#EEF3FB] text-[#1E40AF] hover:bg-blue-100 rounded-full transition-colors cursor-pointer"
              aria-label="Notifikasi"
            >
              <Bell className="w-4 h-4" />
              {hasUnreadNotif && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white" />
              )}
            </button>

            {isNotifOpen && (
              <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white rounded-xl shadow-lg border border-slate-200 z-50 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                  <h3 className="font-bold text-slate-800 text-sm">Notifikasi</h3>
                  <button
                    type="button"
                    onClick={() => setHasUnreadNotif(false)}
                    className="text-xs text-blue-600 hover:underline cursor-pointer font-medium"
                  >
                    Tandai semua dibaca
                  </button>
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

          <div ref={profileRef} className="relative">
            <button
              type="button"
              onClick={() => {
                setIsProfileOpen((prev) => !prev);
                setIsNotifOpen(false);
              }}
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
                <div className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-green-500" />
              </div>
              <span className="text-sm font-semibold text-slate-700 hidden sm:block">
                {user?.nama || 'Administrator'}
              </span>
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
                    type="button"
                    onClick={onLogout}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 transition-colors font-medium cursor-pointer"
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
      {/* Garis aksen biru di bawah navbar */}
      <div className="h-0.5 bg-gradient-to-r from-[#1E3A8A] via-[#2563EB] to-[#38BDF8]" />
    </header>
  );
};

