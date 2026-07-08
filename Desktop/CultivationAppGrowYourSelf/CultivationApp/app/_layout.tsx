import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';
import { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';

import { navigationTheme } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAutoNotifications } from '@/hooks/useAutoNotifications';
import { useHabitStore } from '@/store/useHabitStore';
import { useAuthStore } from '@/store/useAuthStore';
import { auth, db } from '@/firebaseConfig';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const appTheme = useHabitStore((s) => s.appTheme);
  const scheme = appTheme === 'system' ? (colorScheme === 'dark' ? 'dark' : 'light') : appTheme;

  // Run automatically triggered notifications hook
  useAutoNotifications();

  const login = useAuthStore((s) => s.login);
  const logout = useAuthStore((s) => s.logout);
  const setAuthLoading = useAuthStore((s) => s.setAuthLoading);

  useEffect(() => {
    let unsubscribeDoc: (() => void) | null = null;
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (unsubscribeDoc) {
        unsubscribeDoc();
        unsubscribeDoc = null;
      }

      if (user) {
        // Set loading name initially or keep previous name to avoid flashing
        const currentFullName = useAuthStore.getState().user?.fullName;
        login({
          fullName: currentFullName || user.displayName || 'Yükleniyor...',
          email: user.email || '',
          birthDate: '',
          profilePictureUrl: user.photoURL || undefined
        });

        // Set up real-time listener to Firestore user doc
        unsubscribeDoc = onSnapshot(doc(db, 'users', user.uid), (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            login({
              fullName: data.fullName || 'Kullanıcı',
              email: data.email || user.email || '',
              birthDate: data.birthDate || '',
              profilePictureUrl: data.profilePictureUrl || undefined
            });
          }
        }, (err) => {
          console.error("Firestore user sync error:", err);
        });

        // Fetch data from Firestore to Zustand store
        useHabitStore.getState().fetchUserData(user.uid);
      } else {
        logout();
        useHabitStore.getState().clearAllData();
      }
      setAuthLoading(false);
    });
    return () => {
      unsubscribeAuth();
      if (unsubscribeDoc) unsubscribeDoc();
    };
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <BottomSheetModalProvider>
        <ThemeProvider value={navigationTheme(scheme)}>
          <Stack screenOptions={{ animation: 'slide_from_right' }}>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            <Stack.Screen
              name="daily-entry"
              options={{ presentation: 'modal', title: 'Günlük Girdi', headerBackTitle: 'Kapat' }}
            />
            {/* Modül form ekranları */}
            <Stack.Screen name="modules/period"    options={{ presentation: 'modal', title: 'Regl',       headerBackTitle: 'Geri' }} />
            <Stack.Screen name="modules/study"     options={{ presentation: 'modal', title: 'Ders',       headerBackTitle: 'Geri' }} />
            <Stack.Screen name="modules/nutrition" options={{ presentation: 'modal', title: 'Beslenme',   headerBackTitle: 'Geri' }} />
            <Stack.Screen name="modules/budget"    options={{ presentation: 'modal', title: 'Bütçe',      headerBackTitle: 'Geri' }} />
            <Stack.Screen name="modules/sport"     options={{ presentation: 'modal', title: 'Spor',       headerBackTitle: 'Geri' }} />
            <Stack.Screen name="modules/sleep"     options={{ presentation: 'modal', title: 'Uyku',       headerBackTitle: 'Geri' }} />
            <Stack.Screen name="settings"   options={{ title: 'Ayarlar',         headerBackTitle: 'Geri' }} />
            <Stack.Screen name="templates"  options={{ title: 'Kayıtlı Şemalar', headerBackTitle: 'Geri' }} />
          </Stack>
          <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
        </ThemeProvider>
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
}

export { ErrorBoundary } from 'expo-router';
