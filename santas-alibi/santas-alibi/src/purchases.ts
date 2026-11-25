import Purchases, { type PurchasesPackage } from 'react-native-purchases';

/**
 * RevenueCat setup (one time):
 *  1. Create the app in RevenueCat with bundle id com.onjjem.santasalibi
 *  2. Create a NON-CONSUMABLE in-app purchase in App Store Connect (e.g. com.onjjem.santasalibi.pro)
 *  3. In RevenueCat: add that product, create an entitlement called "pro", attach the product,
 *     and put it in the Current offering.
 *  4. Paste the public iOS SDK key below (starts with "appl_").
 */
export const REVENUECAT_IOS_KEY = 'YOUR_REVENUECAT_IOS_KEY';
export const ENTITLEMENT_ID = 'pro';

/** True until you paste a real key. In dev mode the "purchase" button just unlocks Pro for the session. */
export const DEV_MODE = REVENUECAT_IOS_KEY.startsWith('YOUR_');

let configured = false;

export async function initPurchases(): Promise<boolean> {
  if (DEV_MODE) return false;
  if (!configured) {
    Purchases.configure({ apiKey: REVENUECAT_IOS_KEY });
    configured = true;
  }
  const info = await Purchases.getCustomerInfo();
  return !!info.entitlements.active[ENTITLEMENT_ID];
}

export async function getProPackage(): Promise<PurchasesPackage | null> {
  if (DEV_MODE) return null;
  const offerings = await Purchases.getOfferings();
  return offerings.current?.availablePackages[0] ?? null;
}

/** Returns true when Pro is active after the purchase. Returns false if the user cancelled. */
export async function buyPro(pkg: PurchasesPackage | null): Promise<boolean> {
  if (DEV_MODE || !pkg) return DEV_MODE;
  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    return !!customerInfo.entitlements.active[ENTITLEMENT_ID];
  } catch (e: unknown) {
    const err = e as { userCancelled?: boolean };
    if (err?.userCancelled) return false;
    throw e;
  }
}

export async function restorePro(): Promise<boolean> {
  if (DEV_MODE) return false;
  const info = await Purchases.restorePurchases();
  return !!info.entitlements.active[ENTITLEMENT_ID];
}
