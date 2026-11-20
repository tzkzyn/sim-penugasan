import { useEffect, useRef, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Bell, ChevronDown, LogOut, Menu, UserCircle2 } from 'lucide-react';
import type { Pegawai } from '@/types';

interface UserTopNavbarProps {
  user: Pegawai | null;
  onOpenMobileMenu: () => void;
  onLogout: () => void;
}

export const UserTopNavbar = ({ user, onOpenMobileMenu, onLogout }: UserTopNavbarProps) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const firstName = user?.nama?.split(' ')[0] || 'Pegawai';

  return (
    <header className="border-b border-slate-200/70 bg-white/95 backdrop-blur-sm px-4 py-3 sm:px-6 sticky top-0 z-30">
      <div className="flex items-center justify-between">
        {/* Kiri: Tombol Menu Mobile + Judul Area */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onOpenMobileMenu}
            className="rounded-xl p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition lg:hidden cursor-pointer"
            aria-label="Buka menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div>
            <p className="text-sm font-bold text-slate-800">Area Pegawai</p>
            <p className="text-xs text-slate-500 hidden sm:block">
              Pantau surat tugas, laporan, dan kehadiran Anda
            </p>
          </div>
        </div>

        {/* Kanan: Notifikasi + Profil */}
        <div className="flex items-center gap-2 sm:gap-3">
          <NavLink
            to="/user/notifikasi"
            aria-label="Notifikasi"
            title="Notifikasi"
            className={({ isActive }) =>
              `relative flex h-9 w-9 items-center justify-center rounded-full transition ${
                isActive ? 'bg-[#ECF2FF] text-[#5D87FF]' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`
            }
          >
            <Bell className="h-[18px] w-[18px]" />
            <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-[#5D87FF] ring-2 ring-white" />
          </NavLink>

          <span className="hidden sm:block h-6 w-px bg-slate-200" aria-hidden="true" />

          <div ref={profileRef} className="relative">
            <button
              type="button"
              onClick={() => setIsProfileOpen((prev) => !prev)}
              className="flex items-center gap-2.5 rounded-full py-1 pl-1 pr-2 hover:bg-slate-100/80 transition cursor-pointer"
            >
              <div className="w-8 h-8 rounded-full bg-[#ECF2FF] border border-[#5D87FF]/25 flex items-center justify-center text-[#5D87FF] overflow-hidden shrink-0">
                {user?.fotoAvatar ? (
                  <img src={user.fotoAvatar} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <UserCircle2 className="w-5 h-5" />
                )}
              </div>
              <span className="text-sm font-medium text-slate-700 hidden sm:block">
                Halo, <strong className="font-semibold text-slate-900">{firstName}</strong>
              </span>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400 hidden sm:block" />
            </button>

            {isProfileOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-200 z-50 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
                  <p className="text-sm font-bold text-slate-800 truncate">{user?.nama || 'Pegawai'}</p>
                  <p className="text-xs text-slate-500 truncate">{user?.unitKerja || 'Unit'} • {user?.role || 'PEGAWAI'}</p>
                </div>
                <div className="py-1">
                  <Link
                    to="/user/profile"
                    onClick={() => setIsProfileOpen(false)}
                    className="flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-[#ECF2FF] hover:text-[#5D87FF] transition-colors"
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
    </header>
  );
};
