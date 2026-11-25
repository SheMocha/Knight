import { AD_FREE_POLICY } from './adConfig';
import { AdEntitlementStore, adEntitlementStore } from './adEntitlement';

export interface BillingProductDetails {
  productId: string;
  title: string;
  description: string;
  formattedPrice: string;
  priceAmountMicros: number;
  priceCurrencyCode: string;
}

export interface BillingPurchaseRecord {
  productId: string;
  purchaseToken: string;
  orderId?: string;
  purchaseState: 'PURCHASED' | 'PENDING' | 'UNSPECIFIED';
  acknowledged: boolean;
  purchaseTime: number;
}

export interface PurchaseFlowResult {
  success: boolean;
  statusCode:
    | 'PURCHASED'
    | 'PENDING'
    | 'USER_CANCELED'
    | 'ALREADY_OWNED'
    | 'BILLING_NOT_CONNECTED'
    | 'OFFLINE'
    | 'ERROR';
  message: string;
  purchase?: BillingPurchaseRecord;
}

export interface RestorePurchasesResult {
  success: boolean;
  restoredRemoveAds: boolean;
  statusCode: 'RESTORED' | 'NO_PURCHASES_FOUND' | 'BILLING_NOT_CONNECTED' | 'OFFLINE' | 'ERROR';
  message: string;
}

/**
 * İleride Google Play Billing Library v7 Capacitor eklentisinin uygulayacağı sözleşme.
 * Bu arayüz sayesinde billing eklentisi bağlandığında oyun kodu, AdManager veya
 * AdFreeManager değişmeden doğrudan çalışır.
 */
export interface BillingProvider {
  readonly providerName: string;
  isAvailable(): boolean;
  connect(): Promise<boolean>;
  queryProductDetails(productIds: string[]): Promise<BillingProductDetails[]>;
  queryActivePurchases(): Promise<BillingPurchaseRecord[]>;
  launchPurchaseFlow(productId: string): Promise<PurchaseFlowResult>;
  acknowledgePurchase(purchaseToken: string): Promise<boolean>;
}

/**
 * Henüz Google Play Billing bağlanmadığında kullanılan dürüst varsayılan sağlayıcı.
 * ASLA sahte satın alma gerçekleştirmez ve oyuncuya reklam kaldırılmış gibi davranmaz.
 */
class UnconfiguredBillingProvider implements BillingProvider {
  public readonly providerName = 'unconfigured';

  public isAvailable(): boolean {
    return false;
  }

  public async connect(): Promise<boolean> {
    return false;
  }

  public async queryProductDetails(): Promise<BillingProductDetails[]> {
    return [];
  }

  public async queryActivePurchases(): Promise<BillingPurchaseRecord[]> {
    return [];
  }

  public async launchPurchaseFlow(): Promise<PurchaseFlowResult> {
    return {
      success: false,
      statusCode: 'BILLING_NOT_CONNECTED',
      message:
        'Google Play Billing satın alma servisi henüz etkinleştirilmedi. Reklamları Kaldır satın alımı yakında aktif olacaktır.',
    };
  }

  public async acknowledgePurchase(): Promise<boolean> {
    return false;
  }
}

/**
 * PurchaseManager
 * ===============
 * İleride Google Play Billing entegrasyonunun bağlanacağı merkezi satın alma yöneticisi.
 * - `registerProvider(googlePlayBillingProvider)` çağrıldığında gerçek Google Play
 *   satın alma, doğrulama, acknowledge ve uygulama yeniden yükleme sonrası hak geri
 *   yükleme (restorePurchases) akışlarını otomatik olarak AdEntitlementStore'a bağlar.
 */
export class PurchaseManager {
  private provider: BillingProvider;
  private readonly entitlementStore: AdEntitlementStore;
  private initialized = false;

  constructor(
    entitlementStore: AdEntitlementStore = adEntitlementStore,
    provider: BillingProvider = new UnconfiguredBillingProvider(),
  ) {
    this.entitlementStore = entitlementStore;
    this.provider = provider;
  }

  public registerProvider(provider: BillingProvider): void {
    this.provider = provider;
    this.initialized = false;
  }

  public isBillingConnected(): boolean {
    return this.provider.isAvailable();
  }

  public getRemoveAdsProductId(): string {
    return AD_FREE_POLICY.removeAdsProductId;
  }

  /**
   * Uygulama açılışında Google Play Billing bağlıysa aktif satın alımları sorgular
   * ve uygulama silinip yeniden yüklenmiş olsa bile "Reklamları Kaldır" hakkını geri yükler.
   */
  public async initializeAndSyncEntitlements(): Promise<RestorePurchasesResult> {
    if (!this.provider.isAvailable()) {
      return {
        success: false,
        restoredRemoveAds: false,
        statusCode: 'BILLING_NOT_CONNECTED',
        message: 'Google Play Billing sağlayıcısı henüz bağlı değil.',
      };
    }

    const connected = await this.provider.connect();
    if (!connected) {
      return {
        success: false,
        restoredRemoveAds: false,
        statusCode: 'ERROR',
        message: 'Google Play Billing servisine bağlanılamadı.',
      };
    }

    this.initialized = true;
    return this.restorePurchases();
  }

  public async getRemoveAdsProductDetails(): Promise<BillingProductDetails | null> {
    if (!this.provider.isAvailable()) return null;
    if (!this.initialized) {
      const ok = await this.provider.connect();
      if (!ok) return null;
      this.initialized = true;
    }
    const products = await this.provider.queryProductDetails([AD_FREE_POLICY.removeAdsProductId]);
    return products.find((p) => p.productId === AD_FREE_POLICY.removeAdsProductId) ?? null;
  }

  /**
   * "REKLAMLARI KALDIR" tek seferlik satın alma akışını başlatır.
   * Yalnızca gerçek Play Billing `PURCHASED` + `acknowledgePurchase` doğrulamasından
   * sonra AdEntitlementStore güncellenir.
   */
  public async purchaseRemoveAds(): Promise<PurchaseFlowResult> {
    if (!this.provider.isAvailable()) {
      return {
        success: false,
        statusCode: 'BILLING_NOT_CONNECTED',
        message:
          'Google Play Billing henüz bağlı değil. Satın alma işlemi yalnızca gerçek Play Billing entegrasyonu ile yapılır.',
      };
    }

    if (!this.initialized) {
      const ok = await this.provider.connect();
      if (!ok) {
        return {
          success: false,
          statusCode: 'ERROR',
          message: 'Google Play faturalandırma servisine ulaşılamadı.',
        };
      }
      this.initialized = true;
    }

    const res = await this.provider.launchPurchaseFlow(AD_FREE_POLICY.removeAdsProductId);
    if (res.success && res.purchase && res.purchase.purchaseState === 'PURCHASED') {
      if (!res.purchase.acknowledged) {
        const ackOk = await this.provider.acknowledgePurchase(res.purchase.purchaseToken);
        if (!ackOk) {
          return {
            success: false,
            statusCode: 'ERROR',
            message: 'Satın alma onayı (acknowledge) tamamlanamadı; lütfen tekrar kontrol edin.',
          };
        }
      }
      this.entitlementStore.applyVerifiedPurchase({
        productId: res.purchase.productId,
        purchaseToken: res.purchase.purchaseToken,
        orderId: res.purchase.orderId ?? null,
        source: 'google_play_billing',
        verifiedAt: res.purchase.purchaseTime || Date.now(),
      });
    }
    return res;
  }

  /**
   * Uygulama yeniden yüklendiğinde veya cihaz değiştirildiğinde Google Play satın alma
   * geçmişinden "Reklamları Kaldır" hakkını geri yükler.
   */
  public async restorePurchases(): Promise<RestorePurchasesResult> {
    if (!this.provider.isAvailable()) {
      return {
        success: false,
        restoredRemoveAds: false,
        statusCode: 'BILLING_NOT_CONNECTED',
        message: 'Satın alımları geri yüklemek için Google Play Billing bağlantısı gerekir.',
      };
    }

    try {
      const purchases = await this.provider.queryActivePurchases();
      const removeAdsPurchase = purchases.find(
        (p) =>
          p.productId === AD_FREE_POLICY.removeAdsProductId &&
          p.purchaseState === 'PURCHASED' &&
          p.purchaseToken.trim().length > 0,
      );

      if (removeAdsPurchase) {
        if (!removeAdsPurchase.acknowledged) {
          await this.provider.acknowledgePurchase(removeAdsPurchase.purchaseToken);
        }
        this.entitlementStore.applyVerifiedPurchase({
          productId: removeAdsPurchase.productId,
          purchaseToken: removeAdsPurchase.purchaseToken,
          orderId: removeAdsPurchase.orderId ?? null,
          source: 'restored_purchase',
          verifiedAt: removeAdsPurchase.purchaseTime || Date.now(),
        });
        return {
          success: true,
          restoredRemoveAds: true,
          statusCode: 'RESTORED',
          message: 'Reklamları Kaldır hakkınız Google Play hesabınızdan geri yüklendi.',
        };
      }

      // Google Play aktif satın alma bildirmiyorsa mevcut hak varsa (iade/iptal) geri al
      if (this.entitlementStore.getEntitlement().removeAdsOwned) {
        this.entitlementStore.revokeEntitlement();
      } else {
        this.entitlementStore.markSynced();
      }

      return {
        success: true,
        restoredRemoveAds: false,
        statusCode: 'NO_PURCHASES_FOUND',
        message: 'Bu hesap için aktif bir Reklamları Kaldır satın alımı bulunamadı.',
      };
    } catch (err) {
      return {
        success: false,
        restoredRemoveAds: false,
        statusCode: 'ERROR',
        message: err instanceof Error ? err.message : 'Satın alımlar geri yüklenemedi.',
      };
    }
  }
}

export const purchaseManager = new PurchaseManager(adEntitlementStore);
