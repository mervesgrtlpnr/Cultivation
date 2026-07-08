import React, { ReactNode } from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView, type SafeAreaViewProps } from 'react-native-safe-area-context';
import { GlobalBackground } from './GlobalBackground';

type ScreenWrapperProps = {
  children: ReactNode;
  edges?: SafeAreaViewProps['edges'];
  style?: any;
};

export function ScreenWrapper({ children, edges, style }: ScreenWrapperProps) {
  return (
    <GlobalBackground>
      <SafeAreaView style={[styles.safe, style]} edges={edges}>
        {children}
      </SafeAreaView>
    </GlobalBackground>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
});
