import { useState, useEffect } from 'react';
import { usePenugasan } from '@/context/PenugasanContext';
import { Eye, Edit3, CheckCircle2, XCircle, FileText, Clock, CheckCheck, Search, MoreVertical } from 'lucide-react';
import type { AjuanSuratTugas } from '@/types';
import {
  AdminAjuanDetailModal,
  AdminAjuanEditModal,
} from '@/components/admin/AdminAjuanPegawaiModals';

const hasLaporan = (task: AjuanSuratTugas): boolean =>
  Boolean(task.fileLaporanUrl || task.fileDraftUrl);

const downloadLaporanTugas = (task: AjuanSuratTugas) => {
  const fileUrl = task.fileLaporanUrl || task.fileDraftUrl;
  if (!fileUrl) return;
  const isSafeUrl =
    fileUrl.startsWith('data:') ||
    fileUrl.startsWith('blob:') ||
    fileUrl.startsWith('https://') ||
    fileUrl.startsWith('http://') ||
    fileUrl.startsWith('/');
  if (!isSafeUrl) return;
  const safeNomor = (task.nomorSurat || task.id).replace(/[^a-zA-Z0-9._-]/g, '_');
  const fileName = task.fileLaporanNama || `Laporan_${safeNomor}.pdf`;
  const link = document.createElement('a');
  link.href = fileUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

type TabKey = 'baru' | 'proses' | 'selesai';

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  DRAFT: { label: 'Diajukan', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  VERIFIKASI_SUBBAGIAN: { label: 'Verifikasi Subbagian', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  PERSETUJUAN_PIMPINAN: { label: 'Persetujuan Pimpinan', color: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
  SURAT_TERBIT: { label: 'Surat Terbit', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  DITOLAK: { label: 'Ditolak', color: 'bg-red-100 text-red-700 border-red-200' },
};

const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: 'baru', label: 'Ajuan Baru', icon: <FileText className="w-4 h-4" /> },
  { key: 'proses', label: 'Sedang Diproses', icon: <Clock className="w-4 h-4" /> },
  { key: 'selesai', label: 'Selesai Diproses', icon: <CheckCheck className="w-4 h-4" /> },
];

export const AjuanPegawaiPage = () => {
  const { tasks: ajuanList, updateTaskStatus } = usePenugasan();
  const [activeTab, setActiveTab] = useState<TabKey>('baru');
  const [searchQuery, setSearchQuery] = useState('');
  const [openActionId, setOpenActionId] = useState<string | null>(null);

  // Close action dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!(e.target as Element).closest('.action-dropdown-wrapper')) {
        setOpenActionId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Modal States
  const [detailModal, setDetailModal] = useState<AjuanSuratTugas | null>(null);
  const [editModal, setEditModal] = useState<AjuanSuratTugas | null>(null);
  const [editForm, setEditForm] = useState({ perihal: '', deskripsi: '' });

  // Filter ajuan by tab
  const filterByTab = (tab: TabKey): AjuanSuratTugas[] => {
    let filtered: AjuanSuratTugas[];
    switch (tab) {
      case 'baru':
        filtered = ajuanList.filter(a => a.status === 'DRAFT');
        break;
      case 'proses':
        filtered = ajuanList.filter(a => a.status === 'VERIFIKASI_SUBBAGIAN' || a.status === 'PERSETUJUAN_PIMPINAN');
        break;
      case 'selesai':
        filtered = ajuanList.filter(a => a.status === 'SURAT_TERBIT' || a.status === 'DITOLAK');
        break;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(a =>
        a.pengaju?.nama?.toLowerCase().includes(q) ||
        a.pengaju?.nip?.toLowerCase().includes(q) ||
        a.perihal?.toLowerCase().includes(q)
      );
    }
    return filtered;
  };

  // Handlers
  const handleApprove = (id: string) => {
    const task = ajuanList.find(a => a.id === id);
    if (!task) return;
    const nextStatusMap: Record<string, AjuanSuratTugas['status']> = {
      DRAFT: 'VERIFIKASI_SUBBAGIAN',
      VERIFIKASI_SUBBAGIAN: 'PERSETUJUAN_PIMPINAN',
      PERSETUJUAN_PIMPINAN: 'SURAT_TERBIT',
    };
    const nextStatus = nextStatusMap[task.status];
    if (nextStatus) {
      updateTaskStatus(id, nextStatus);
    }
  };

  const handleReject = (id: string) => {
    updateTaskStatus(id, 'DITOLAK');
  };

  const openEdit = (ajuan: AjuanSuratTugas) => {
    setEditForm({ perihal: ajuan.perihal, deskripsi: ajuan.deskripsi });
    setEditModal(ajuan);
  };

  const handleEditSave = () => {
    if (!editModal) return;
    setEditModal(null);
  };

  const currentData = filterByTab(activeTab);

  const tabCounts = {
    baru: ajuanList.filter(a => a.status === 'DRAFT').length,
    proses: ajuanList.filter(a => a.status === 'VERIFIKASI_SUBBAGIAN' || a.status === 'PERSETUJUAN_PIMPINAN').length,
    selesai: ajuanList.filter(a => a.status === 'SURAT_TERBIT' || a.status === 'DITOLAK').length,
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Ajuan Pegawai</h1>
        <p className="text-sm text-slate-500 mt-1">Kelola seluruh ajuan surat tugas pegawai berdasarkan status pengajuan.</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-all -mb-px ${
              activeTab === tab.key
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            {tab.icon}
            {tab.label}
            <span className={`ml-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${
              activeTab === tab.key ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'
            }`}>
              {tabCounts[tab.key]}
            </span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Cari NIP, nama pegawai, atau perihal ajuan..."
          className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white transition-all shadow-sm"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600">
              <tr>
                <th className="px-5 py-3.5 font-semibold">NIP</th>
                <th className="px-5 py-3.5 font-semibold">Nama Pegawai</th>
                <th className="px-5 py-3.5 font-semibold">Nama Ajuan</th>
                <th className="px-5 py-3.5 font-semibold">Tanggal Ajuan</th>
                <th className="px-5 py-3.5 font-semibold">Status Ajuan</th>
                <th className="px-5 py-3.5 font-semibold text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {currentData.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-400">
                    Tidak ada data ajuan pada kategori ini.
                  </td>
                </tr>
              ) : (
                currentData.map(ajuan => {
                  const statusInfo = STATUS_LABEL[ajuan.status] || { label: ajuan.status, color: 'bg-slate-100 text-slate-600' };
                  return (
                    <tr key={ajuan.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-3.5 font-mono text-[13px] text-slate-600">{ajuan.pengaju.nip}</td>
                      <td className="px-5 py-3.5 font-medium text-slate-800">{ajuan.pengaju.nama}</td>
                      <td className="px-5 py-3.5 text-slate-600 max-w-xs truncate">{ajuan.perihal}</td>
                      <td className="px-5 py-3.5 text-slate-600 whitespace-nowrap">{ajuan.tanggalMulai}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex flex-col gap-1 items-start">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider border ${statusInfo.color}`}>
                            {statusInfo.label}
                          </span>
                          {hasLaporan(ajuan) && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                              <CheckCircle2 className="w-3 h-3" /> Laporan: Lengkap
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 action-dropdown-wrapper relative">
                        <div className="flex items-center justify-center">
                          <button
                            onClick={() => setOpenActionId(openActionId === ajuan.id ? null : ajuan.id)}
                            className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            aria-expanded={openActionId === ajuan.id}
                          >
                            <MoreVertical className="w-5 h-5" />
                          </button>
                          
                          {openActionId === ajuan.id && (
                            <div className="absolute right-12 top-1/2 -translate-y-1/2 mt-1 w-48 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 z-[50] overflow-hidden">
                              <button
                                onClick={() => { setDetailModal(ajuan); setOpenActionId(null); }}
                                className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3 transition-colors"
                              >
                                <Eye className="w-4 h-4 text-blue-600" />
                                <span className="font-medium">Lihat Detail</span>
                              </button>
                              
                              {ajuan.status !== 'SURAT_TERBIT' && ajuan.status !== 'DITOLAK' && (
                                <>
                                  <button
                                    onClick={() => { openEdit(ajuan); setOpenActionId(null); }}
                                    className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3 transition-colors"
                                  >
                                    <Edit3 className="w-4 h-4 text-amber-600" />
                                    <span className="font-medium">Edit Ajuan</span>
                                  </button>
                                  <button
                                    onClick={() => { handleApprove(ajuan.id); setOpenActionId(null); }}
                                    className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3 transition-colors"
                                  >
                                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                    <span className="font-medium">Setujui</span>
                                  </button>
                                  <div className="h-px bg-slate-100 my-1 mx-2"></div>
                                  <button
                                    onClick={() => { handleReject(ajuan.id); setOpenActionId(null); }}
                                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors"
                                  >
                                    <XCircle className="w-4 h-4 text-red-600" />
                                    <span className="font-medium">Tolak / Batal</span>
                                  </button>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: Detail Ajuan */}
      <AdminAjuanDetailModal
        ajuan={detailModal}
        statusMap={STATUS_LABEL}
        hasLaporan={hasLaporan}
        onDownloadLaporan={downloadLaporanTugas}
        onClose={() => setDetailModal(null)}
      />

      {/* MODAL: Edit Ajuan */}
      <AdminAjuanEditModal
        ajuan={editModal}
        form={editForm}
        onChangeForm={setEditForm}
        onSave={handleEditSave}
        onClose={() => setEditModal(null)}
      />
    </div>
  );
};
