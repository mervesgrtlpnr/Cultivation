import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';

type Props = {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  /** Override label color. If not provided, defaults to white on dark bg. */
  textColor?: string;
};

export function PrimaryButton({ title, onPress, disabled, style, textColor }: Props) {
  const tint = useThemeColor({}, 'tint');

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: tint, opacity: disabled ? 0.45 : pressed ? 0.88 : 1 },
        { zIndex: 1, pointerEvents: 'auto' as any },
        style,
      ]}>
      <ThemedText
        lightColor={textColor ?? '#ffffff'}
        darkColor={textColor ?? '#0c1914'}
        style={styles.label}>
        {title}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
  },
});
