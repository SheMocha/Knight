import { AD_FREE_POLICY } from './adConfig';

export type AdEntitlementSource =
  | 'none'
  | 'google_play_billing'
  | 'restored_purchase';

export interface AdEntitlement {
  /** Kullanıcının doğrulanmış "Reklamları Kaldır" hakkı var mı? */
  removeAdsOwned: boolean;
  /** İlişkili Google Play ürün kimliği */
  productId: string;
  /** Hakkın nereden geldiği */
  source: AdEntitlementSource;
  /** Google Play Billing satın alma jetonu (yeniden yükleme ve doğrulama için) */
  purchaseToken: string | null;
  /** Google Play sipariş kimliği */
  orderId: string | null;
  /** Hakkın sunucu/Play Billing ile doğrulandığı zaman damgası */
  verifiedAt: number | null;
  /** Son Google Play sorgu zamanı */
  lastSyncedAt: number | null;
  /** Bekleyen satın alma doğrulaması var mı */
  pendingVerification: boolean;
}

export interface VerifiedPurchaseRecord {
  productId: string;
  purchaseToken: string;
  orderId?: string | null;
  source: 'google_play_billing' | 'restored_purchase';
  verifiedAt?: number;
}

type EntitlementListener = (entitlement: AdEntitlement) => void;

const ENTITLEMENT_STORAGE_KEY = 'black_knight_ad_entitlement_v1';

function createDefaultEntitlement(): AdEntitlement {
  return {
    removeAdsOwned: false,
    productId: AD_FREE_POLICY.removeAdsProductId,
    source: 'none',
    purchaseToken: null,
    orderId: null,
    verifiedAt: null,
    lastSyncedAt: null,
    pendingVerification: false,
  };
}

/**
 * AdEntitlementStore
 * ==================
 * Oyuncunun "Reklamları Kaldır" hakkının durumunu yönetir.
 *
 * KRİTİK GÜVENLİK KURALI:
 * - Satın alma doğrulaması olmadan `removeAdsOwned` ASLA `true` yapılmaz.
 * - Yerel depolamadan okuma yapılırken yalnızca geçerli bir `purchaseToken` ve
 *   Google Play kaynağı taşıyan kayıtlar kabul edilir; ileride Play Billing
 *   bağlandığında uygulama her açılışta Google Play ile hakkı yeniden doğrular.
 */
export class AdEntitlementStore {
  private entitlement: AdEntitlement;
  private listeners = new Set<EntitlementListener>();
  private readonly storageKey: string;

  constructor(storageKey = ENTITLEMENT_STORAGE_KEY) {
    this.storageKey = storageKey;
    this.entitlement = this.loadPersisted();
  }

  private loadPersisted(): AdEntitlement {
    const fallback = createDefaultEntitlement();
    if (typeof window === 'undefined' || !window.localStorage) {
      return fallback;
    }
    try {
      const raw = window.localStorage.getItem(this.storageKey);
      if (!raw) return fallback;
      const parsed = JSON.parse(raw) as Partial<AdEntitlement>;
      const validSource =
        parsed.source === 'google_play_billing' || parsed.source === 'restored_purchase';
      const hasValidToken =
        typeof parsed.purchaseToken === 'string' && parsed.purchaseToken.trim().length > 0;
      const matchesProduct = parsed.productId === AD_FREE_POLICY.removeAdsProductId;
      const verified = Boolean(parsed.removeAdsOwned && validSource && hasValidToken && matchesProduct);

      if (!verified) {
        return fallback;
      }

      return {
        removeAdsOwned: true,
        productId: AD_FREE_POLICY.removeAdsProductId,
        source: parsed.source as AdEntitlementSource,
        purchaseToken: parsed.purchaseToken!.trim(),
        orderId: typeof parsed.orderId === 'string' ? parsed.orderId : null,
        verifiedAt: typeof parsed.verifiedAt === 'number' ? parsed.verifiedAt : null,
        lastSyncedAt: typeof parsed.lastSyncedAt === 'number' ? parsed.lastSyncedAt : null,
        pendingVerification: Boolean(parsed.pendingVerification),
      };
    } catch {
      return fallback;
    }
  }

  private persist(): void {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      window.localStorage.setItem(this.storageKey, JSON.stringify(this.entitlement));
    } catch {
      // Depolama kotası hatalarını yok say
    }
  }

  private emit(): void {
    const copy = this.getEntitlement();
    this.listeners.forEach((cb) => cb(copy));
  }

  public getEntitlement(): AdEntitlement {
    return { ...this.entitlement };
  }

  public subscribe(listener: EntitlementListener): () => void {
    this.listeners.add(listener);
    listener(this.getEntitlement());
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Yalnızca gerçek Google Play Billing satın alma / geri yükleme doğrulaması
   * tamamlandığında çağrılır.
   */
  public applyVerifiedPurchase(record: VerifiedPurchaseRecord): boolean {
    const token = record.purchaseToken.trim();
    if (record.productId !== AD_FREE_POLICY.removeAdsProductId || token.length === 0) {
      return false;
    }
    const now = Date.now();
    this.entitlement = {
      removeAdsOwned: true,
      productId: record.productId,
      source: record.source,
      purchaseToken: token,
      orderId: record.orderId ?? null,
      verifiedAt: record.verifiedAt ?? now,
      lastSyncedAt: now,
      pendingVerification: false,
    };
    this.persist();
    this.emit();
    return true;
  }

  /**
   * Google Play iade (refund) veya iptal durumunda hakkı geri alır.
   */
  public revokeEntitlement(): void {
    this.entitlement = {
      ...createDefaultEntitlement(),
      lastSyncedAt: Date.now(),
    };
    this.persist();
    this.emit();
  }

  public markSynced(): void {
    this.entitlement = {
      ...this.entitlement,
      lastSyncedAt: Date.now(),
    };
    this.persist();
  }
}

export const adEntitlementStore = new AdEntitlementStore();
