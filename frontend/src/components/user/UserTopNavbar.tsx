import { NavLink } from 'react-router-dom';
import { Bell, Menu, UserCircle2 } from 'lucide-react';

interface UserTopNavbarProps {
  onOpenMobileMenu: () => void;
}

export const UserTopNavbar = ({ onOpenMobileMenu }: UserTopNavbarProps) => (
  <header className="border-b border-slate-100 bg-white/95 backdrop-blur-sm px-4 py-3.5 sm:px-6 shadow-[0_4px_20px_-6px_rgba(30,64,175,0.08)] sticky top-0 z-30">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="rounded-xl p-2 text-[#1E40AF] bg-[#EEF3FB] hover:bg-blue-100 transition lg:hidden cursor-pointer"
          aria-label="Buka menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div>
          <p className="text-sm font-bold text-slate-800">Area Pegawai</p>
          <p className="text-xs text-slate-500 hidden sm:block">
            Pantau tugas, absensi, dan pengajuan surat tugas
          </p>
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
);

