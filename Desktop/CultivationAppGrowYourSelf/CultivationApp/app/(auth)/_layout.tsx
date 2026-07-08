import { Redirect, Slot } from 'expo-router';
import { useAuthStore } from '@/store/useAuthStore';

export default function AuthLayout() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  if (isAuthenticated) {
    return <Redirect href="/(tabs)" />;
  }

  return <Slot />;
}
