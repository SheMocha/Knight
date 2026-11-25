import { AD_FREE_POLICY } from './adConfig';
import { AdEntitlement, AdEntitlementStore, adEntitlementStore } from './adEntitlement';

export interface AdFreePolicyOverride {
  disableInterstitialWhenAdFree?: boolean;
  disableBannerWhenAdFree?: boolean;
  allowOptionalRewardedWhenAdFree?: boolean;
}

/**
 * AdFreeManager
 * =============
 * Bütün reklam türlerinden ÖNCE sorgulanan merkezi yetki kontrol sınıfı.
 * - Oyuncunun doğrulanmış "Reklamları Kaldır" hakkı varsa:
 *   - Interstitial reklamlar kapatılır.
 *   - Banner reklamlar kapatılır.
 *   - Ödüllü reklamlar `AD_FREE_POLICY.allowOptionalRewardedWhenAdFree` politikasına göre yönetilir.
 * - Satın alma doğrulaması yoksa ASLA reklam kaldırılmış gibi davranmaz.
 */
export class AdFreeManager {
  private readonly entitlementStore: AdEntitlementStore;
  private policy: {
    disableInterstitialWhenAdFree: boolean;
    disableBannerWhenAdFree: boolean;
    allowOptionalRewardedWhenAdFree: boolean;
  };

  constructor(
    entitlementStore: AdEntitlementStore = adEntitlementStore,
    policyOverride?: AdFreePolicyOverride,
  ) {
    this.entitlementStore = entitlementStore;
    this.policy = {
      disableInterstitialWhenAdFree:
        policyOverride?.disableInterstitialWhenAdFree ??
        AD_FREE_POLICY.disableInterstitialWhenAdFree,
      disableBannerWhenAdFree:
        policyOverride?.disableBannerWhenAdFree ?? AD_FREE_POLICY.disableBannerWhenAdFree,
      allowOptionalRewardedWhenAdFree:
        policyOverride?.allowOptionalRewardedWhenAdFree ??
        AD_FREE_POLICY.allowOptionalRewardedWhenAdFree,
    };
  }

  public getEntitlement(): AdEntitlement {
    return this.entitlementStore.getEntitlement();
  }

  public isAdFree(): boolean {
    return this.entitlementStore.getEntitlement().removeAdsOwned;
  }

  public shouldShowInterstitial(): boolean {
    if (this.isAdFree() && this.policy.disableInterstitialWhenAdFree) {
      return false;
    }
    return true;
  }

  public shouldShowBanner(): boolean {
    if (this.isAdFree() && this.policy.disableBannerWhenAdFree) {
      return false;
    }
    return true;
  }

  public shouldAllowRewarded(): boolean {
    if (this.isAdFree()) {
      return this.policy.allowOptionalRewardedWhenAdFree;
    }
    return true;
  }

  public setRewardedPolicyForAdFree(allowOptionalRewarded: boolean): void {
    this.policy.allowOptionalRewardedWhenAdFree = allowOptionalRewarded;
  }

  public subscribe(listener: (entitlement: AdEntitlement) => void): () => void {
    return this.entitlementStore.subscribe(listener);
  }
}

export const adFreeManager = new AdFreeManager(adEntitlementStore);
