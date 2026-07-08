import React, { ReactNode } from 'react';
import { StyleSheet, View, useColorScheme as useDeviceColorScheme } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Path } from 'react-native-svg';
import { useHabitStore } from '@/store/useHabitStore';

export function GlobalBackground({ children }: { children: ReactNode }) {
  const systemScheme = useDeviceColorScheme() ?? 'light';
  const themePref = useHabitStore((s) => s.appTheme);
  const isDark = (themePref === 'system' ? systemScheme : themePref) === 'dark';

  // Light Mode Colors (Ferah, açık yeşil/krem/beyaz geçişi)
  const lightColors = ['#F8FCF9', '#eef9f2', '#e2f4e8'];
  const lightShapeOpacity = 0.05;

  // Dark Mode Colors (Derin, koyu lacivert/koyu yeşil/siyah geçişi)
  const darkColors = ['#0c1b12', '#12261a', '#060d09'];
  const darkShapeOpacity = 0.07;

  const gradientColors = isDark ? darkColors : lightColors;
  const shapeOpacity = isDark ? darkShapeOpacity : lightShapeOpacity;
  const shapeColor = isDark ? '#a7f3d0' : '#1e6845'; // Mint on dark, dark green on light

  return (
    <View style={styles.container}>
      {/* 1. Base Gradient */}
      <LinearGradient
        colors={gradientColors}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      
      {/* 2. Abstract Shapes (SVG) - pointEvents none to allow clicks */}
      <View style={styles.svgContainer} pointerEvents="none">
        <Svg width="100%" height="100%">
          {/* Top right abstract blob */}
          <Circle cx="90%" cy="5%" r="250" fill={shapeColor} opacity={shapeOpacity} />
          
          {/* Bottom left abstract blob */}
          <Circle cx="10%" cy="95%" r="300" fill={shapeColor} opacity={shapeOpacity * 0.8} />
          
          {/* Center right soft blob */}
          <Circle cx="80%" cy="60%" r="150" fill={shapeColor} opacity={shapeOpacity * 0.6} />

          {/* Abstract background wave */}
          <Path
            d="M -100 200 C 150 400 400 0 600 300 S 800 600 1200 400"
            fill="none"
            stroke={shapeColor}
            strokeWidth="4"
            opacity={shapeOpacity * 1.2}
          />
        </Svg>
      </View>

      {/* 3. Content */}
      <View style={styles.content}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  svgContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  content: {
    flex: 1,
    zIndex: 1,
  },
});
