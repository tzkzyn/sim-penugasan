import type {
  AjuanSuratTugas,
  KategoriTemplateSurat,
  Pegawai,
  TemplateSuratResmi,
  UnitKerjaType,
} from '@/types';
import {
  DEFAULT_JAM_MULAI,
  DEFAULT_JAM_SELESAI,
  resolveKategoriTemplate,
} from '@/utils/penugasanHelpers';

export type Wilayah = { id: string; name: string };

export const buildInitialFormState = (
  editingTask: AjuanSuratTugas | null,
  currentPegawai: Pegawai,
  pegawaiOptions: Pegawai[],
  newestTemplate: TemplateSuratResmi | undefined,
) => {
  if (editingTask) {
    const matchedIds = editingTask.pegawaiDitugaskan.map((p) => {
      const found = pegawaiOptions.find(
        (opt) => opt.id === p.id || (p.nip && opt.nip === p.nip) || opt.nama === p.nama,
      );
      return found ? found.id : p.id;
    });
    return {
      nomorSurat: editingTask.nomorSurat,
      perihal: editingTask.perihal,
      unitKerja: editingTask.unitKerja,
      kategoriTemplate:
        editingTask.kategoriTemplate ?? resolveKategoriTemplate(editingTask.pegawaiDitugaskan.length),
      pegawaiIds: matchedIds.length > 0 ? matchedIds : currentPegawai ? [currentPegawai.id] : [],
      tanggalMulai: editingTask.tanggalMulai,
      tanggalSelesai: editingTask.tanggalSelesai,
      jamMulai: editingTask.jamMulai || DEFAULT_JAM_MULAI,
      jamSelesai: editingTask.jamSelesai || DEFAULT_JAM_SELESAI,
      lokasiPenugasan: editingTask.lokasiPenugasan,
      lokasiSpesifik: editingTask.lokasiSpesifik || '',
      provinsiId: '',
      kotaId: '',
      koordinatLat: editingTask.koordinat?.[0] ?? -6.9147,
      koordinatLng: editingTask.koordinat?.[1] ?? 107.6098,
      deskripsi: editingTask.deskripsi || '',
      dasarSuratDari: editingTask.dasarSuratDari || '',
      dasarSuratNomor: editingTask.dasarSuratNomor || '',
      dasarSuratTanggal: editingTask.dasarSuratTanggal || '',
      sumberBiaya: editingTask.sumberBiaya || ('PENYELENGGARA' as const),
      file: null as File | null,
      existingFilePerbaikanUrl: editingTask.filePerbaikanUrl || '',
      existingFilePerbaikanNama: editingTask.filePerbaikanNama || '',
      docMode: 'editor' as 'editor' | 'upload',
      dokumenDraftText: editingTask.dokumenDraftText || '',
      ttdUserPng: editingTask.ttdUserPng || '',
      ttdUserSignerName: editingTask.ttdUserSignerName || '',
      ttdUserSignedAt: editingTask.ttdUserSignedAt || '',
    };
  }

  const pf = newestTemplate?.prefillData;
  const selfPegawaiIds = currentPegawai?.id ? [currentPegawai.id] : [];
  return {
    nomorSurat: pf?.nomorSurat || '',
    perihal: pf?.perihal || '',
    unitKerja: (currentPegawai?.unitKerja || 'RBI') as UnitKerjaType,
    kategoriTemplate: newestTemplate?.kategoriTemplate || ('INDIVIDU' as KategoriTemplateSurat),
    pegawaiIds: selfPegawaiIds,
    tanggalMulai: '',
    tanggalSelesai: '',
    jamMulai: DEFAULT_JAM_MULAI,
    jamSelesai: DEFAULT_JAM_SELESAI,
    lokasiPenugasan: pf?.lokasiPenugasan || '',
    lokasiSpesifik: pf?.lokasiSpesifik || '',
    provinsiId: '',
    kotaId: '',
    koordinatLat: -6.9147,
    koordinatLng: 107.6098,
    deskripsi: '',
    dasarSuratDari: pf?.dasarSuratDari || '',
    dasarSuratNomor: pf?.dasarSuratNomor || '',
    dasarSuratTanggal: pf?.dasarSuratTanggal || '',
    sumberBiaya: pf?.sumberBiaya || ('PENYELENGGARA' as const),
    file: null as File | null,
    existingFilePerbaikanUrl: '',
    existingFilePerbaikanNama: '',
    googleDocsSuratUrl: '',
    docMode: 'editor' as 'editor' | 'upload',
    dokumenDraftText: '',
    ttdUserPng: '',
    ttdUserSignerName: '',
    ttdUserSignedAt: '',
  };
};

