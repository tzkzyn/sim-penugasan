import { useState } from 'react';
import { Bell, CheckCheck, Clock, FileText, Trash2 } from 'lucide-react';

interface NotificationItem {
  id: number;
  title: string;
  desc: string;
  time: string;
  unread: boolean;
  category: string;
}

export const NotifikasiPage = () => {
  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    try {
      const saved = localStorage.getItem('sim_approval_notifications');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  };

  const deleteNotification = (id: number) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
            <Bell className="h-6 w-6 text-blue-600" />
            Notifikasi & Pemberitahuan
          </h1>
          <p className="text-sm text-slate-500">Pemberitahuan aktivitas surat tugas dan persetujuan.</p>
        </div>
        {notifications.some((n) => n.unread) && (
          <button
            onClick={markAllRead}
            className="flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3.5 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition-colors"
          >
            <CheckCheck className="h-4 w-4" /> Tandai Semua Dibaca
          </button>
        )}
      </div>

      <div className="space-y-3">
        {notifications.length > 0 ? (
          notifications.map((n) => (
            <div
              key={n.id}
              className={`flex items-start justify-between gap-4 rounded-2xl border p-4 transition-all shadow-xs ${
                n.unread
                  ? 'border-blue-200 bg-blue-50/40 hover:bg-blue-50/70'
                  : 'border-slate-200 bg-white hover:bg-slate-50/80'
              }`}
            >
              <div className="flex items-start gap-3.5">
                <div
                  className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                    n.unread ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  <FileText className="h-4 w-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className={`text-sm ${n.unread ? 'font-bold text-slate-900' : 'font-semibold text-slate-700'}`}>
                      {n.title}
                    </p>
                    {n.unread && (
                      <span className="h-2 w-2 rounded-full bg-blue-600"></span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 mt-1">{n.desc}</p>
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-2">
                    <Clock className="h-3 w-3" />
                    <span>{n.time}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => deleteNotification(n.id)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-rose-600 transition-colors"
                title="Hapus"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center text-slate-400">
            <Bell className="mx-auto h-8 w-8 text-slate-300 mb-2" />
            <p className="text-sm">Tidak ada notifikasi baru.</p>
          </div>
        )}
      </div>
    </div>
  );
};
