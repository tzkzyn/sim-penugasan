import { useState } from 'react';
import { Bell, CheckCheck, Clock, FileText, CalendarCheck, ShieldCheck, Trash2, Filter } from 'lucide-react';

interface NotificationItem {
  id: string;
  title: string;
  desc: string;
  time: string;
  unread: boolean;
  category: 'TUGAS' | 'ABSENSI' | 'SISTEM' | 'APPROVAL';
}

export const NotifikasiPage = () => {
  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    try {
      const saved = localStorage.getItem('sim_admin_notifications');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [activeFilter, setActiveFilter] = useState<'ALL' | 'TUGAS' | 'ABSENSI' | 'APPROVAL' | 'SISTEM'>('ALL');

  const saveNotifications = (newList: NotificationItem[]) => {
    setNotifications(newList);
    try {
      localStorage.setItem('sim_admin_notifications', JSON.stringify(newList));
    } catch {
      // storage fallback
    }
  };

  const markAllRead = () => {
    const updated = notifications.map((n) => ({ ...n, unread: false }));
    saveNotifications(updated);
  };

  const toggleRead = (id: string) => {
    const updated = notifications.map((n) => (n.id === id ? { ...n, unread: !n.unread } : n));
    saveNotifications(updated);
  };

  const deleteNotification = (id: string) => {
    const updated = notifications.filter((n) => n.id !== id);
    saveNotifications(updated);
  };

  const clearAll = () => {
    if (confirm('Apakah Anda yakin ingin menghapus semua notifikasi?')) {
      saveNotifications([]);
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    if (activeFilter === 'ALL') return true;
    return n.category === activeFilter;
  });

  const unreadCount = notifications.filter((n) => n.unread).length;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Bell className="h-6 w-6 text-blue-600" />
            Notifikasi & Pemberitahuan Admin
          </h1>
          <p className="text-sm text-slate-500">
            Pusat pemantauan aktivitas tugas, verifikasi absensi, dan status pengajuan sistem.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3.5 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition-colors cursor-pointer"
            >
              <CheckCheck className="h-4 w-4" /> Tandai Semua Dibaca ({unreadCount})
            </button>
          )}
          {notifications.length > 0 && (
            <button
              onClick={clearAll}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-rose-50 hover:text-rose-600 transition-colors cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5" /> Hapus Semua
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 items-center bg-white p-2 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-1 text-xs font-semibold text-slate-500 px-2 py-1">
          <Filter className="h-3.5 w-3.5" /> Kategori:
        </div>
        {([
          { key: 'ALL', label: 'Semua' },
          { key: 'TUGAS', label: 'Penugasan' },
          { key: 'ABSENSI', label: 'Absensi' },
          { key: 'APPROVAL', label: 'Approval' },
          { key: 'SISTEM', label: 'Sistem' },
        ] as const).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveFilter(tab.key)}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
              activeFilter === tab.key
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {filteredNotifications.length > 0 ? (
          filteredNotifications.map((n) => (
            <div
              key={n.id}
              className={`flex items-start justify-between gap-4 rounded-2xl border p-4 transition-all shadow-xs ${
                n.unread
                  ? 'border-blue-200 bg-blue-50/40 hover:bg-blue-50/70'
                  : 'border-slate-200 bg-white hover:bg-slate-50/80'
              }`}
            >
              <div className="flex items-start gap-3.5 min-w-0">
                <div
                  className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                    n.category === 'TUGAS'
                      ? 'bg-blue-600 text-white'
                      : n.category === 'ABSENSI'
                      ? 'bg-emerald-600 text-white'
                      : n.category === 'APPROVAL'
                      ? 'bg-purple-600 text-white'
                      : 'bg-slate-700 text-white'
                  }`}
                >
                  {n.category === 'TUGAS' && <FileText className="h-5 w-5" />}
                  {n.category === 'ABSENSI' && <CalendarCheck className="h-5 w-5" />}
                  {n.category === 'APPROVAL' && <ShieldCheck className="h-5 w-5" />}
                  {n.category === 'SISTEM' && <Bell className="h-5 w-5" />}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p
                      className={`text-sm ${
                        n.unread ? 'font-bold text-slate-900' : 'font-semibold text-slate-700'
                      }`}
                    >
                      {n.title}
                    </p>
                    {n.unread && <span className="h-2 w-2 rounded-full bg-blue-600 shrink-0"></span>}
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                      {n.category}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">{n.desc}</p>
                  <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-2">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {n.time}
                    </span>
                    <button
                      onClick={() => toggleRead(n.id)}
                      className="text-blue-600 hover:underline cursor-pointer font-medium"
                    >
                      {n.unread ? 'Tandai sudah dibaca' : 'Tandai belum dibaca'}
                    </button>
                  </div>
                </div>
              </div>

              <button
                onClick={() => deleteNotification(n.id)}
                className="shrink-0 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-rose-600 transition-colors cursor-pointer"
                title="Hapus Notifikasi"
                aria-label="Hapus notifikasi"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center text-slate-400">
            <Bell className="mx-auto h-10 w-10 text-slate-300 mb-3" />
            <p className="text-base font-semibold text-slate-600">Tidak ada notifikasi pada kategori ini</p>
            <p className="text-xs text-slate-400 mt-1">
              Semua aktivitas baru terkait tugas dan absensi akan otomatis muncul di sini.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
