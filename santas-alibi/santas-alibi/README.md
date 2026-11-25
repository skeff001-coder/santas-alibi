# Santa's Alibi

Expo (SDK 58) app. Bundle id: com.onjjem.santasalibi

## Before first build
1. src/purchases.ts: paste your RevenueCat iOS key (until then Pro unlocks in "dev mode" so test builds work).
2. App Store Connect: create a non-consumable IAP, link it in RevenueCat to entitlement "pro".
3. Sounds in assets/sounds are synthesised placeholders. Replace with real recordings using the SAME filenames
   (classic.wav, pie.wav, rudolph.wav, chaos.wav). Keep each under 30 seconds.

## Build
eas build --platform ios --profile production
