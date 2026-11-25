import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, StyleSheet, useWindowDimensions, View } from 'react-native';

const FLAKES = 26;

function Flake({ x, size, delay, duration, height }: { x: number; size: number; delay: number; duration: number; height: number }) {
  const y = useRef(new Animated.Value(-20)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(y, {
        toValue: height + 20,
        duration,
        delay,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [y, height, duration, delay]);

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: x,
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: 'white',
        opacity: 0.35 + (size / 10) * 0.4,
        transform: [{ translateY: y }],
      }}
    />
  );
}

export default function Snow() {
  const { width, height } = useWindowDimensions();
  const flakes = useMemo(
    () =>
      Array.from({ length: FLAKES }, (_, i) => ({
        key: i,
        x: Math.random() * width,
        size: 2 + Math.random() * 5,
        delay: Math.random() * 6000,
        duration: 9000 + Math.random() * 9000,
      })),
    [width],
  );

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {flakes.map((f) => (
        <Flake key={f.key} x={f.x} size={f.size} delay={f.delay} duration={f.duration} height={height} />
      ))}
    </View>
  );
}
