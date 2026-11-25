import React, { useMemo, useRef, useState } from 'react';
import { Alert, Animated, Image, PanResponder, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';
import { captureRef } from 'react-native-view-shot';
import * as ImagePicker from 'expo-image-picker';
import * as Sharing from 'expo-sharing';
import * as Haptics from 'expo-haptics';
import { colors, radius } from '../theme';

type StampId = 'boot' | 'crumbs' | 'soot';

const STAMPS: { id: StampId; label: string; emoji: string; pro: boolean }[] = [
  { id: 'boot', label: 'Boot print', emoji: '👣', pro: false },
  { id: 'crumbs', label: 'Pie crumbs', emoji: '🥧', pro: true },
  { id: 'soot', label: 'Soot smudge', emoji: '🧤', pro: true },
];

function StampArt({ id, size }: { id: StampId; size: number }) {
  if (id === 'boot') {
    return (
      <Svg width={size} height={size * 1.6} viewBox="0 0 100 160">
        <G fill="#FFFFFF" opacity={0.88}>
          <Path d="M22 8 C10 8 6 30 8 52 C10 72 20 84 38 84 C56 84 64 70 64 50 C64 28 58 8 44 8 Z" />
          <Path d="M28 100 C18 100 16 118 22 138 C26 152 40 156 52 150 C64 144 66 126 60 110 C56 100 40 96 28 100 Z" />
        </G>
        <G stroke="#0B1026" strokeWidth={3} opacity={0.35}>
          <Path d="M16 24 H52" />
          <Path d="M14 38 H56" />
          <Path d="M14 52 H56" />
          <Path d="M16 66 H54" />
          <Path d="M26 114 H54" />
          <Path d="M24 128 H56" />
        </G>
      </Svg>
    );
  }
  if (id === 'crumbs') {
    const dots = [
      [20, 20, 6], [42, 14, 4], [66, 26, 7], [30, 44, 5], [58, 50, 4], [78, 62, 6],
      [18, 70, 4], [44, 76, 7], [66, 90, 5], [28, 96, 6], [52, 108, 4], [80, 22, 3],
    ];
    return (
      <Svg width={size} height={size} viewBox="0 0 100 120">
        {dots.map(([x, y, r], i) => (
          <Circle key={i} cx={x} cy={y} r={r} fill={i % 3 === 0 ? '#C98B4A' : '#E5B97A'} />
        ))}
      </Svg>
    );
  }
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <G fill="#1a1a1a">
        <Ellipse cx={50} cy={58} rx={26} ry={22} opacity={0.55} />
        <Ellipse cx={22} cy={30} rx={7} ry={11} opacity={0.5} />
        <Ellipse cx={40} cy={18} rx={7} ry={12} opacity={0.5} />
        <Ellipse cx={60} cy={18} rx={7} ry={12} opacity={0.5} />
        <Ellipse cx={78} cy={30} rx={7} ry={11} opacity={0.5} />
        <Rect x={30} y={72} width={40} height={18} rx={9} opacity={0.4} />
      </G>
    </Svg>
  );
}

type Props = {
  isPro: boolean;
  onNeedPro: () => void;
};

export default function BootPrintScreen({ isPro, onNeedPro }: Props) {
  const { width, height } = useWindowDimensions();
  const frameW = width - 40;
  const frameH = Math.min(frameW * 1.25, Math.max(220, height - 540));

  const [uri, setUri] = useState<string | null>(null);
  const [stamp, setStamp] = useState<StampId>('boot');
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(-15);
  const [busy, setBusy] = useState(false);
  const shotRef = useRef<React.ComponentRef<typeof View>>(null);

  const pan = useRef(new Animated.ValueXY({ x: frameW * 0.3, y: frameH * 0.45 })).current;
  const last = useRef({ x: frameW * 0.3, y: frameH * 0.45 });

  const responder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: () => {
          pan.setOffset({ x: last.current.x, y: last.current.y });
          pan.setValue({ x: 0, y: 0 });
        },
        onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], { useNativeDriver: false }),
        onPanResponderRelease: (_, g) => {
          last.current = { x: last.current.x + g.dx, y: last.current.y + g.dy };
          pan.flattenOffset();
        },
      }),
    [pan],
  );

  const pick = async (fromCamera: boolean) => {
    const result = fromCamera
      ? await ImagePicker.launchCameraAsync({ quality: 0.9 })
      : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.9 });
    if (!result.canceled && result.assets[0]) setUri(result.assets[0].uri);
  };

  const choosePhoto = () => {
    Alert.alert('Add a photo', 'Take a photo of the fireplace, carpet or tree.', [
      { text: 'Take photo', onPress: () => pick(true).catch(() => pick(false).catch(() => Alert.alert('Could not open photos', 'Please check photo access in Settings.'))) },
      { text: 'Choose from library', onPress: () => pick(false) },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const selectStamp = (id: StampId, needsPro: boolean) => {
    if (needsPro && !isPro) {
      onNeedPro();
      return;
    }
    setStamp(id);
  };

  const share = async () => {
    if (!uri || !shotRef.current) return;
    setBusy(true);
    try {
      const out = await captureRef(shotRef, { format: 'jpg', quality: 0.95 });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(out, { mimeType: 'image/jpeg', dialogTitle: 'Share the evidence' });
      }
    } catch {
      Alert.alert('Could not export', 'Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const stampSize = 90 * scale;

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>The Evidence</Text>
      <Text style={styles.sub}>Add a footprint to your own photo. Drag it into place.</Text>

      <View ref={shotRef} collapsable={false} style={[styles.frame, { width: frameW, height: frameH }]}>
        {uri ? (
          <Image source={{ uri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        ) : (
          <Pressable style={styles.empty} onPress={choosePhoto}>
            <Text style={{ fontSize: 44 }}>📸</Text>
            <Text style={styles.emptyText}>Tap to add a photo</Text>
          </Pressable>
        )}
        {uri && (
          <Animated.View
            {...responder.panHandlers}
            style={{
              position: 'absolute',
              transform: [...pan.getTranslateTransform(), { rotate: `${rotation}deg` }],
            }}
          >
            <StampArt id={stamp} size={stampSize} />
          </Animated.View>
        )}
      </View>

      <View style={styles.row}>
        {STAMPS.map((s) => (
          <Pressable key={s.id} onPress={() => selectStamp(s.id, s.pro)} style={[styles.stampBtn, stamp === s.id && styles.stampBtnActive]}>
            <Text style={{ fontSize: 22 }}>{s.pro && !isPro ? '🔒' : s.emoji}</Text>
            <Text style={styles.stampLabel}>{s.label}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.row}>
        <Pressable style={styles.tool} onPress={() => setScale((v) => Math.max(0.5, v - 0.15))}>
          <Text style={styles.toolText}>－ Size</Text>
        </Pressable>
        <Pressable style={styles.tool} onPress={() => setScale((v) => Math.min(3, v + 0.15))}>
          <Text style={styles.toolText}>＋ Size</Text>
        </Pressable>
        <Pressable style={styles.tool} onPress={() => setRotation((v) => v + 20)}>
          <Text style={styles.toolText}>⟳ Rotate</Text>
        </Pressable>
      </View>

      <View style={styles.row}>
        <Pressable style={[styles.tool, { flex: 1 }]} onPress={choosePhoto}>
          <Text style={styles.toolText}>{uri ? 'Change photo' : 'Add photo'}</Text>
        </Pressable>
        <Pressable style={[styles.share, { flex: 1.4 }, (!uri || busy) && { opacity: 0.5 }]} onPress={share} disabled={!uri || busy}>
          <Text style={styles.shareText}>Share / Save</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  heading: { color: colors.snow, fontSize: 30, fontWeight: '900', textAlign: 'center' },
  sub: { color: colors.muted, textAlign: 'center', marginTop: 6, marginBottom: 14 },
  frame: { alignSelf: 'center', backgroundColor: colors.card, borderRadius: radius.md, overflow: 'hidden', borderWidth: 1, borderColor: colors.cardBorder },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  emptyText: { color: colors.muted },
  row: { flexDirection: 'row', gap: 10, marginTop: 12 },
  stampBtn: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: radius.md, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder },
  stampBtnActive: { borderColor: colors.gold },
  stampLabel: { color: colors.snow, fontSize: 12, marginTop: 2 },
  tool: { flex: 1, alignItems: 'center', paddingVertical: 13, borderRadius: radius.md, borderWidth: 1, borderColor: colors.cardBorder },
  toolText: { color: colors.snow, fontWeight: '600' },
  share: { alignItems: 'center', paddingVertical: 13, borderRadius: radius.md, backgroundColor: colors.red },
  shareText: { color: 'white', fontWeight: '800' },
});
