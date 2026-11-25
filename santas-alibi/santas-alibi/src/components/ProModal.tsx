import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import type { PurchasesPackage } from 'react-native-purchases';
import * as Haptics from 'expo-haptics';
import { buyPro, DEV_MODE, getProPackage, restorePro } from '../purchases';
import { colors, radius } from '../theme';

type Props = {
  visible: boolean;
  onClose: () => void;
  onUnlocked: () => void;
};

const PERKS = [
  '🥧 Mince Pie Midnight',
  "🦌 Rudolph's Cold",
  '🧯 Chimney Chaos',
  '👣 Extra boot prints & soot smudges',
  '♾️ One payment, no subscription',
];

export default function ProModal({ visible, onClose, onUnlocked }: Props) {
  const [pkg, setPkg] = useState<PurchasesPackage | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!visible) return;
    getProPackage()
      .then(setPkg)
      .catch(() => setPkg(null));
  }, [visible]);

  const price = pkg?.product.priceString ?? '£2.99';

  const onBuy = async () => {
    setBusy(true);
    try {
      const ok = await buyPro(pkg);
      if (ok) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onUnlocked();
      }
    } catch (e) {
      Alert.alert('Purchase failed', 'Please try again in a moment.');
    } finally {
      setBusy(false);
    }
  };

  const onRestore = async () => {
    setBusy(true);
    try {
      const ok = await restorePro();
      if (ok) onUnlocked();
      else Alert.alert('Nothing to restore', 'We could not find an earlier purchase on this Apple ID.');
    } catch (e) {
      Alert.alert('Restore failed', 'Please try again in a moment.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Text style={styles.emoji}>🎄</Text>
          <Text style={styles.title}>Christmas Eve Pro Pass</Text>
          <Text style={styles.sub}>Unlock every scenario and extra stamps. Pay once, keep forever.</Text>

          <View style={styles.perks}>
            {PERKS.map((p) => (
              <Text key={p} style={styles.perk}>
                {p}
              </Text>
            ))}
          </View>

          <Pressable style={[styles.buy, busy && { opacity: 0.6 }]} onPress={onBuy} disabled={busy}>
            {busy ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.buyText}>{DEV_MODE ? 'Unlock (dev mode)' : `Unlock for ${price}`}</Text>
            )}
          </Pressable>

          <Pressable onPress={onRestore} disabled={busy} style={styles.link}>
            <Text style={styles.linkText}>Restore purchase</Text>
          </Pressable>
          <Pressable onPress={onClose} style={styles.link}>
            <Text style={[styles.linkText, { color: colors.muted }]}>Maybe later</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: 24,
    paddingBottom: 40,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    alignItems: 'center',
  },
  emoji: { fontSize: 44 },
  title: { color: colors.snow, fontSize: 22, fontWeight: '800', marginTop: 6 },
  sub: { color: colors.muted, textAlign: 'center', marginTop: 8, lineHeight: 20 },
  perks: { alignSelf: 'stretch', marginTop: 18, gap: 8 },
  perk: { color: colors.snow, fontSize: 16 },
  buy: {
    marginTop: 22,
    backgroundColor: colors.red,
    borderRadius: radius.md,
    paddingVertical: 16,
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  buyText: { color: 'white', fontWeight: '800', fontSize: 17 },
  link: { paddingVertical: 12 },
  linkText: { color: colors.gold, fontWeight: '600' },
});
