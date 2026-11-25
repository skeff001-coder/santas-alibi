import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { DELAYS, SCENARIOS } from '../scenarios';
import { cancelVisit, ensureNotificationPermission, scheduleVisit } from '../notifications';
import { colors, radius } from '../theme';

type Phase = 'idle' | 'armed' | 'playing' | 'done';

const RING = 240;
const STROKE = 12;
const R = (RING - STROKE) / 2;
const CIRC = 2 * Math.PI * R;
const KEEP_AWAKE_TAG = 'alibi-countdown';

function fmt(totalSeconds: number): string {
  const s = Math.max(0, Math.ceil(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(sec)}` : `${pad(m)}:${pad(sec)}`;
}

type Props = {
  isPro: boolean;
  onNeedPro: () => void;
};

export default function AlibiScreen({ isPro, onNeedPro }: Props) {
  const [scenarioId, setScenarioId] = useState(SCENARIOS[0].id);
  const [delayIdx, setDelayIdx] = useState(1);
  const [phase, setPhase] = useState<Phase>('idle');
  const [endAt, setEndAt] = useState(0);
  const [now, setNow] = useState(Date.now());

  const scenario = SCENARIOS.find((s) => s.id === scenarioId) ?? SCENARIOS[0];
  const delay = DELAYS[delayIdx];

  const player = useAudioPlayer(scenario.asset);
  const status = useAudioPlayerStatus(player);

  const phaseRef = useRef<Phase>('idle');
  const endAtRef = useRef(0);
  phaseRef.current = phase;
  endAtRef.current = endAt;

  useEffect(() => {
    setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: false,
      interruptionMode: 'duckOthers',
    }).catch(() => {});
  }, []);

  const playNow = useCallback(async () => {
    try {
      await player.seekTo(0);
    } catch {
      // ignore: first play on a fresh player
    }
    player.play();
  }, [player]);

  // Playback finished -> done
  useEffect(() => {
    if (status.didJustFinish && phaseRef.current === 'playing') {
      setPhase('done');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }
  }, [status.didJustFinish]);

  const fire = useCallback(
    async (lateMs: number) => {
      deactivateKeepAwake(KEEP_AWAKE_TAG);
      await cancelVisit().catch(() => {});
      // If the app was suspended and we woke up late, the notification already played the sound.
      if (lateMs > 3000) {
        setPhase('done');
        return;
      }
      setPhase('playing');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
      await playNow();
    },
    [playNow],
  );

  // Countdown tick based on wall-clock time (safe if the app was backgrounded)
  useEffect(() => {
    if (phase !== 'armed') return;
    const id = setInterval(() => {
      const n = Date.now();
      setNow(n);
      if (n >= endAtRef.current) {
        clearInterval(id);
        fire(n - endAtRef.current);
      }
    }, 250);
    return () => clearInterval(id);
  }, [phase, fire]);

  const arm = async () => {
    if (scenario.pro && !isPro) {
      onNeedPro();
      return;
    }
    const granted = await ensureNotificationPermission().catch(() => false);
    if (!granted) {
      Alert.alert(
        'Notifications are off',
        'Santa’s Alibi will still work, but only if you leave this screen open. Turn notifications on in Settings so the sound can play with the phone locked.',
      );
    }
    const end = Date.now() + delay.seconds * 1000;
    setEndAt(end);
    setNow(Date.now());
    setPhase('armed');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    activateKeepAwakeAsync(KEEP_AWAKE_TAG).catch(() => {});
    if (granted) {
      try {
        await scheduleVisit(scenario, delay.seconds);
      } catch {
        // in-app timer still works
      }
    }
  };

  const cancel = async () => {
    deactivateKeepAwake(KEEP_AWAKE_TAG);
    player.pause();
    await cancelVisit().catch(() => {});
    setPhase('idle');
  };

  const reset = () => setPhase('idle');

  useEffect(() => {
    return () => {
      deactivateKeepAwake(KEEP_AWAKE_TAG);
    };
  }, []);

  const remaining = phase === 'armed' ? Math.max(0, (endAt - now) / 1000) : 0;
  const progress = phase === 'armed' ? Math.min(1, remaining / delay.seconds) : phase === 'idle' ? 1 : 0;
  const locked = (s: (typeof SCENARIOS)[number]) => s.pro && !isPro;

  const centerTop =
    phase === 'armed' ? fmt(remaining) : phase === 'playing' ? '🔔' : phase === 'done' ? '✨' : scenario.emoji;
  const centerBottom =
    phase === 'armed'
      ? 'until Santa arrives'
      : phase === 'playing'
        ? 'Listen...'
        : phase === 'done'
          ? 'The visit is over'
          : `in ${delay.label}`;

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.heading}>Santa{'’'}s Alibi</Text>
      <Text style={styles.sub}>Hide your phone near the tree. Let the magic happen.</Text>

      <View style={styles.ringWrap}>
        <Svg width={RING} height={RING}>
          <Circle cx={RING / 2} cy={RING / 2} r={R} stroke={colors.cardBorder} strokeWidth={STROKE} fill="none" />
          <Circle
            cx={RING / 2}
            cy={RING / 2}
            r={R}
            stroke={phase === 'playing' ? colors.gold : colors.red}
            strokeWidth={STROKE}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={`${CIRC} ${CIRC}`}
            strokeDashoffset={CIRC * (1 - progress)}
            rotation={-90}
            origin={`${RING / 2}, ${RING / 2}`}
          />
        </Svg>
        <View style={styles.ringCenter}>
          <Text style={styles.ringTop}>{centerTop}</Text>
          <Text style={styles.ringBottom}>{centerBottom}</Text>
        </View>
      </View>

      {phase === 'idle' && (
        <>
          <Text style={styles.label}>Scenario</Text>
          {SCENARIOS.map((s) => {
            const active = s.id === scenarioId;
            return (
              <Pressable
                key={s.id}
                onPress={() => (locked(s) ? onNeedPro() : setScenarioId(s.id))}
                style={[styles.card, active && styles.cardActive]}
              >
                <Text style={styles.cardEmoji}>{s.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>{s.title}</Text>
                  <Text style={styles.cardBlurb}>{s.blurb}</Text>
                </View>
                {locked(s) ? <Text style={styles.lock}>🔒</Text> : active ? <Text style={styles.tick}>✓</Text> : null}
              </Pressable>
            );
          })}

          <Text style={styles.label}>Start in</Text>
          <View style={styles.chips}>
            {DELAYS.map((d, i) => (
              <Pressable key={d.label} onPress={() => setDelayIdx(i)} style={[styles.chip, i === delayIdx && styles.chipActive]}>
                <Text style={[styles.chipText, i === delayIdx && { color: 'white' }]}>{d.label}</Text>
              </Pressable>
            ))}
          </View>

          <Pressable style={styles.primary} onPress={arm}>
            <Text style={styles.primaryText}>Start the countdown</Text>
          </Pressable>
          <Pressable style={styles.secondary} onPress={() => (scenario.pro && !isPro ? onNeedPro() : playNow())}>
            <Text style={styles.secondaryText}>▶︎ Hear it now</Text>
          </Pressable>
        </>
      )}

      {phase === 'armed' && (
        <>
          <View style={styles.tips}>
            <Text style={styles.tipTitle}>Tips for the best effect</Text>
            <Text style={styles.tip}>• Turn the ringer ON and the volume up (the silent switch mutes lock-screen playback).</Text>
            <Text style={styles.tip}>• Keep this screen open and the phone charging, then turn the brightness right down.</Text>
            <Text style={styles.tip}>• If the screen locks, the sound still plays through a notification.</Text>
          </View>
          <Pressable style={styles.secondary} onPress={cancel}>
            <Text style={styles.secondaryText}>Cancel</Text>
          </Pressable>
        </>
      )}

      {phase === 'playing' && (
        <Pressable style={styles.secondary} onPress={cancel}>
          <Text style={styles.secondaryText}>Stop</Text>
        </Pressable>
      )}

      {phase === 'done' && (
        <>
          <Text style={styles.doneText}>Now go and find the evidence. Try the Boot Print tab! 👣</Text>
          <Pressable style={styles.primary} onPress={reset}>
            <Text style={styles.primaryText}>Set up another visit</Text>
          </Pressable>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 40, alignItems: 'stretch' },
  heading: { color: colors.snow, fontSize: 30, fontWeight: '900', textAlign: 'center' },
  sub: { color: colors.muted, textAlign: 'center', marginTop: 6 },
  ringWrap: { alignSelf: 'center', marginVertical: 22, width: RING, height: RING, alignItems: 'center', justifyContent: 'center' },
  ringCenter: { position: 'absolute', alignItems: 'center' },
  ringTop: { color: colors.snow, fontSize: 46, fontWeight: '800', fontVariant: ['tabular-nums'] },
  ringBottom: { color: colors.muted, marginTop: 4 },
  label: { color: colors.gold, fontWeight: '700', marginTop: 8, marginBottom: 10, textTransform: 'uppercase', fontSize: 12, letterSpacing: 1 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 14,
    marginBottom: 10,
  },
  cardActive: { borderColor: colors.gold, backgroundColor: '#1B2450' },
  cardEmoji: { fontSize: 30 },
  cardTitle: { color: colors.snow, fontWeight: '700', fontSize: 16 },
  cardBlurb: { color: colors.muted, marginTop: 2, fontSize: 13 },
  lock: { fontSize: 18 },
  tick: { color: colors.gold, fontSize: 20, fontWeight: '800' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  chip: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 999,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  chipActive: { backgroundColor: colors.red, borderColor: colors.red },
  chipText: { color: colors.snow, fontWeight: '600' },
  primary: { backgroundColor: colors.red, borderRadius: radius.md, paddingVertical: 17, alignItems: 'center' },
  primaryText: { color: 'white', fontWeight: '800', fontSize: 17 },
  secondary: { marginTop: 12, paddingVertical: 14, alignItems: 'center', borderRadius: radius.md, borderWidth: 1, borderColor: colors.cardBorder },
  secondaryText: { color: colors.snow, fontWeight: '700' },
  tips: { backgroundColor: colors.card, borderRadius: radius.md, borderWidth: 1, borderColor: colors.cardBorder, padding: 16, gap: 6 },
  tipTitle: { color: colors.gold, fontWeight: '700', marginBottom: 4 },
  tip: { color: colors.snow, lineHeight: 20 },
  doneText: { color: colors.snow, textAlign: 'center', fontSize: 16, marginBottom: 18, lineHeight: 22 },
});
