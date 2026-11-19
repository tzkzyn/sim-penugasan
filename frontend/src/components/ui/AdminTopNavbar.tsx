import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, ChevronDown, FileText, LogOut, Menu, UserCircle2 } from 'lucide-react';
import { usePenugasan } from '@/context/PenugasanContext';
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
  const { tasks } = usePenugasan();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [hasUnreadNotif, setHasUnreadNotif] = useState(false);

  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  const normalizedRole = user?.role?.toUpperCase() || 'ADMIN';
  const isApproval = normalizedRole === 'APPROVAL';

  const pendingCount = useMemo(
    () =>
      tasks.filter((item) =>
        isApproval
          ? item.status === 'PERSETUJUAN_PIMPINAN'
          : item.status === 'DRAFT' ||
            item.status === 'VERIFIKASI_SUBBAGIAN' ||
            item.status === 'PERSETUJUAN_PIMPINAN',
      ).length,
    [tasks, isApproval],
  );

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

  const firstName = user?.nama?.split(' ')[0] || 'Admin';

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/95 backdrop-blur-sm">
      <div className="flex items-center justify-between px-4 py-3 sm:px-6">
        {/* Kiri: Tombol Menu Mobile & Desktop + Logo Mobile */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenMobileMenu}
            className="rounded-xl p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition lg:hidden cursor-pointer"
            aria-label="Buka menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={onToggleSidebar}
            className="rounded-xl p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition hidden lg:block cursor-pointer"
            aria-label={isSidebarCollapsed ? 'Perluas sidebar' : 'Kecilkan sidebar'}
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="lg:hidden flex items-center gap-2 pl-1">
            <div className="h-7 w-7 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center">
              <img
                src={`${import.meta.env.BASE_URL}logo-bmti.png`}
                alt="Logo"
                className="h-6 w-6"
              />
            </div>
            <span className="text-xs font-bold text-slate-800 tracking-tight sm:text-sm">SIM Penugasan</span>
          </div>
        </div>

        {/* Kanan: Ajuan Pending + Notifikasi + Profil */}
        <div className="flex items-center gap-2 sm:gap-3 ml-auto">
          <Link
            to={isApproval ? `${prefix}/approval-tugas` : `${prefix}/ajuan-pegawai`}
            title="Ajuan Menunggu"
            aria-label="Ajuan Menunggu"
            className="relative p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 rounded-full transition-colors"
          >
            <FileText className="w-[18px] h-[18px]" />
            {pendingCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white">
                {pendingCount}
              </span>
            )}
          </Link>

          <div ref={notifRef} className="relative">
            <button
              type="button"
              onClick={() => {
                setIsNotifOpen((prev) => !prev);
                setIsProfileOpen(false);
              }}
              className="relative p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 rounded-full transition-colors cursor-pointer"
              aria-label="Notifikasi"
            >
              <Bell className="w-[18px] h-[18px]" />
              {hasUnreadNotif && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#5D87FF] rounded-full ring-2 ring-white" />
              )}
            </button>

            {isNotifOpen && (
              <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white rounded-xl shadow-lg border border-slate-200 z-50 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                  <h3 className="font-bold text-slate-800 text-sm">Notifikasi</h3>
                  <button
                    type="button"
                    onClick={() => setHasUnreadNotif(false)}
                    className="text-xs text-[#5D87FF] hover:underline cursor-pointer font-medium"
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
                    className="inline-block text-xs font-semibold text-slate-600 hover:text-[#5D87FF] py-1"
                  >
                    Lihat Semua Notifikasi
                  </Link>
                </div>
              </div>
            )}
          </div>

          <span className="hidden sm:block h-6 w-px bg-slate-200" aria-hidden="true" />

          <div ref={profileRef} className="relative">
            <button
              type="button"
              onClick={() => {
                setIsProfileOpen((prev) => !prev);
                setIsNotifOpen(false);
              }}
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
                  <p className="text-sm font-bold text-slate-800 truncate">{user?.nama || 'Administrator'}</p>
                  <p className="text-xs text-slate-500 truncate">{user?.role?.replace('_', ' ') || 'Admin'}</p>
                </div>
                <div className="py-1">
                  <Link
                    to={`${prefix}/profile`}
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
