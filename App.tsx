import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import AlibiScreen from './src/screens/AlibiScreen';
import BootPrintScreen from './src/screens/BootPrintScreen';
import ProModal from './src/components/ProModal';
import Snow from './src/components/Snow';
import { initPurchases } from './src/purchases';
import { colors } from './src/theme';

type Tab = 'alibi' | 'evidence';

export default function App() {
  const [tab, setTab] = useState<Tab>('alibi');
  const [isPro, setIsPro] = useState(false);
  const [showPro, setShowPro] = useState(false);

  useEffect(() => {
    initPurchases()
      .then(setIsPro)
      .catch(() => {});
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <LinearGradient colors={[colors.bgDeep, colors.bg, '#14204A']} style={StyleSheet.absoluteFill} />
      <Snow />
      <SafeAreaView style={styles.safe}>
        <View style={styles.body}>
          {tab === 'alibi' ? (
            <AlibiScreen isPro={isPro} onNeedPro={() => setShowPro(true)} />
          ) : (
            <BootPrintScreen isPro={isPro} onNeedPro={() => setShowPro(true)} />
          )}
        </View>

        <View style={styles.tabs}>
          <TabButton label="Alibi" emoji="🔔" active={tab === 'alibi'} onPress={() => setTab('alibi')} />
          <TabButton label="Boot Print" emoji="👣" active={tab === 'evidence'} onPress={() => setTab('evidence')} />
          {!isPro && <TabButton label="Pro" emoji="⭐️" active={false} onPress={() => setShowPro(true)} />}
        </View>
      </SafeAreaView>

      <ProModal
        visible={showPro}
        onClose={() => setShowPro(false)}
        onUnlocked={() => {
          setIsPro(true);
          setShowPro(false);
        }}
      />
    </SafeAreaProvider>
  );
}

function TabButton({ label, emoji, active, onPress }: { label: string; emoji: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.tab}>
      <Text style={{ fontSize: 22, opacity: active ? 1 : 0.55 }}>{emoji}</Text>
      <Text style={[styles.tabLabel, active && { color: colors.gold }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  body: { flex: 1 },
  tabs: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.cardBorder,
    backgroundColor: 'rgba(11,16,38,0.92)',
    paddingTop: 8,
    paddingBottom: 4,
  },
  tab: { flex: 1, alignItems: 'center' },
  tabLabel: { color: colors.muted, fontSize: 12, marginTop: 2, fontWeight: '600' },
});
