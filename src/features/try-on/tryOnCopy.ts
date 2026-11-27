import { env } from '@/config/env';
import { GARMENT_SLOT_LABELS } from '@/features/outfit';
import type { TryOnError, TryOnProgress } from '@/services/tryOn';

/** İşleniyor ekranının kullanıcıya görünen metinleri ve ilerleme hesabı (tek yerde). */

export function phaseTitle(progress: TryOnProgress): string {
  switch (progress.phase) {
    case 'preparing':
      return 'Fotoğraflar hazırlanıyor';
    case 'uploading':
      return 'Yükleniyor';
    case 'queued':
      return 'Sıraya alındı';
    case 'removing-background':
      return 'Arka planlar temizleniyor';
    case 'dressing':
      return progress.currentSlot
        ? `Giydiriliyor: ${GARMENT_SLOT_LABELS[progress.currentSlot]}`
        : 'Giydiriliyor';
  }
}

export function phaseStep(progress: TryOnProgress): string | null {
  if (progress.step === undefined || progress.totalSteps === undefined) return null;
  return `${progress.step} / ${progress.totalSteps}`;
}

/** 0–1 arası genel ilerleme (yaklaşık; aşamalara ağırlık verilir). */
export function progressFraction(progress: TryOnProgress): number {
  const ratio =
    progress.step !== undefined && progress.totalSteps
      ? (progress.step - 1) / progress.totalSteps
      : 0;
  switch (progress.phase) {
    case 'preparing':
      return 0.03;
    case 'uploading':
      return 0.06;
    case 'queued':
      return 0.1;
    case 'removing-background':
      return 0.1 + 0.2 * ratio;
    case 'dressing':
      return 0.3 + 0.65 * ratio;
  }
}

/** Parça sayısına göre beklenen süre metni (1 parça: 20–60 sn). */
export function estimateText(garmentCount: number): string {
  return `Yaklaşık ${10 + 10 * garmentCount}–${30 + 30 * garmentCount} sn`;
}

export type TryOnErrorAction = 'retry' | 'change-body' | 'change-outfit' | 'back';

export const ERROR_ACTION_LABELS: Record<TryOnErrorAction, string> = {
  retry: 'Tekrar dene',
  'change-body': 'Fotoğrafını değiştir',
  'change-outfit': 'Kombini değiştir',
  back: 'Kombine dön',
};

export type TryOnErrorCopy = { title: string; message: string; action: TryOnErrorAction };

/** Hata kodu → kullanıcı dostu Türkçe mesaj + sonraki aksiyon (bkz. SPEC.md §5). */
export function describeTryOnError(error: TryOnError): TryOnErrorCopy {
  switch (error.code) {
    case 'NETWORK':
      if (env.tryOnBackend === 'dev-server') {
        // Geliştirme sırasında en olası sebep: Mac'teki geçici sunucu kapalı.
        return {
          title: 'AI sunucusuna ulaşılamadı',
          message: "Mac'te `npm run dev-server` çalışıyor mu? Telefon ve Mac aynı Wi-Fi'da olmalı.",
          action: 'retry',
        };
      }
      return { title: 'Bağlantı yok', message: 'İnternet bağlantını kontrol et.', action: 'retry' };
    case 'TIMEOUT':
      return { title: 'Çok uzun sürdü', message: 'İşlem zamanında bitmedi.', action: 'retry' };
    case 'SERVER':
      return { title: 'Şu an bağlanamıyoruz', message: 'Biraz sonra tekrar dene.', action: 'retry' };
    case 'RATE_LIMITED':
      return { title: 'Biraz bekle', message: 'Çok fazla deneme yaptın, biraz sonra tekrar dene.', action: 'back' };
    case 'INVALID_BODY_IMAGE':
      return {
        title: 'Kişi bulunamadı',
        message: 'Fotoğrafta denenecek bölgeyi net göremedik.',
        action: 'change-body',
      };
    case 'INVALID_GARMENT_IMAGE':
      return { title: 'Ürün tanınamadı', message: 'Ürünü ayırt edemedik.', action: 'change-outfit' };
    case 'UNSUPPORTED_SLOT':
      return {
        title: 'Desteklenmiyor',
        message: 'Bu ürün türü henüz desteklenmiyor.',
        action: 'change-outfit',
      };
    case 'NO_CREDITS':
      return { title: 'Deneme hakkın bitti', message: 'Yeni deneme için hak alman gerekiyor.', action: 'back' };
    case 'UNAUTHENTICATED':
      return { title: 'Oturum kapandı', message: 'Lütfen tekrar giriş yap.', action: 'back' };
    case 'CANCELLED':
    case 'UNKNOWN':
      return { title: 'Bir şeyler ters gitti', message: 'Lütfen tekrar dene.', action: 'retry' };
  }
}
