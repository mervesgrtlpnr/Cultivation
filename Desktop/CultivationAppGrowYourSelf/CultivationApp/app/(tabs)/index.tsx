import { useMemo, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  Apple,
  BookOpen,
  Dumbbell,
  Moon,
  Wallet,
  Droplets,
  User,
  Sparkles,
  Bell,
} from 'lucide-react-native';

import { ModuleColors } from '@/constants/colors';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { todayLocalDateKey } from '@/lib/date';
import { ScreenWrapper } from '@/components/ScreenWrapper';
import { AIInsightsModal } from '@/components/AIInsightsModal';
import { NotificationModal } from '@/components/NotificationModal';
import { useNotificationStore } from '@/store/useNotificationStore';

type ModuleDef = {
  id: string;
  label: string;
  pastel: string;
  iconColor: string;
  Icon: typeof BookOpen;
  route: string;
};

const TRACKING_MODULES: ModuleDef[] = [
  { id: 'Regl',     label: 'Regl',     pastel: ModuleColors.period.solid,    iconColor: ModuleColors.period.text,    Icon: Droplets, route: '/modules/period'    },
  { id: 'Ders',     label: 'Ders',     pastel: ModuleColors.study.solid,     iconColor: ModuleColors.study.text,     Icon: BookOpen, route: '/modules/study'     },
  { id: 'Beslenme', label: 'Beslenme', pastel: ModuleColors.nutrition.solid, iconColor: ModuleColors.nutrition.text, Icon: Apple,    route: '/modules/nutrition' },
  { id: 'Bütçe',   label: 'Bütçe',   pastel: ModuleColors.budget.solid,    iconColor: ModuleColors.budget.text,    Icon: Wallet,   route: '/modules/budget'    },
  { id: 'Spor',     label: 'Spor',     pastel: ModuleColors.sport.solid,     iconColor: ModuleColors.sport.text,     Icon: Dumbbell, route: '/modules/sport'     },
  { id: 'Uyku',     label: 'Uyku',     pastel: ModuleColors.sleep.solid,     iconColor: ModuleColors.sleep.text,     Icon: Moon,     route: '/modules/sleep'     },
];

const CARD_TEXT = '#1e293b';

export default function DashboardScreen() {
  const { width } = useWindowDimensions();
  const isLargeScreen = width > 768;

  const textSecondary = useThemeColor({}, 'textSecondary');
  const tint = useThemeColor({}, 'tint');
  const surface = useThemeColor({}, 'surface');
  const primaryText = useThemeColor({}, 'text');

  const [showAIModal, setShowAIModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const hasUnread = useNotificationStore((s) => s.hasUnread);
  const markAsRead = useNotificationStore((s) => s.markAsRead);

  const dateLabel = useMemo(() => {
    const d = new Date();
    return d.toLocaleDateString('tr-TR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }, []);

  return (
    <ScreenWrapper edges={['top']}>
      <ScrollView
        style={styles.scrollView}
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          <View style={[styles.hero, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }]}>
            <View style={{ flex: 1, paddingRight: 16 }}>
              <ThemedText type="title">Cultivation</ThemedText>
              <ThemedText style={[styles.dateLine, { color: textSecondary }]}>{dateLabel}</ThemedText>
              <ThemedText style={[styles.lead, { color: textSecondary }]}>
                Bir modüle dokunarak veri girişi yapın veya hedef planlayın.
              </ThemedText>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 4 }}>
              <Pressable
                onPress={() => {
                  markAsRead();
                  setShowNotifications(true);
                }}
                hitSlop={12}
                style={{ padding: 4, position: 'relative' }}
              >
                <Bell size={26} color={textSecondary} />
                {hasUnread && (
                  <View
                    style={{
                      position: 'absolute',
                      right: 4,
                      top: 4,
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: '#ef4444',
                    }}
                  />
                )}
              </Pressable>
              <Pressable onPress={() => router.push('/settings')} hitSlop={12} style={{ padding: 4 }}>
                <User size={26} color={textSecondary} />
              </Pressable>
            </View>
          </View>

          <View style={styles.gridCenter}>
            <View style={[styles.grid, isLargeScreen && styles.gridLarge]}>
              {TRACKING_MODULES.map((m) => (
                <Pressable
                  key={m.id}
                  accessibilityRole="button"
                  accessibilityLabel={m.label}
                  onPress={() => router.push(m.route as `/${string}`)}
                  style={({ pressed }) => [
                    styles.card,
                    isLargeScreen && styles.cardLarge,
                    {
                      backgroundColor: m.pastel,
                      opacity: pressed ? 0.88 : 1,
                      transform: [{ scale: pressed ? 0.98 : 1 }],
                    },
                  ]}>
                  <m.Icon color={m.iconColor} size={isLargeScreen ? 40 : 32} strokeWidth={1.75} />
                  <ThemedText type="defaultSemiBold" style={[styles.cardTitle, isLargeScreen && { fontSize: 20, marginTop: 12 }, { color: CARD_TEXT }]}>
                    {m.label}
                  </ThemedText>
                </Pressable>
              ))}
            </View>

            <Pressable
              onPress={() => setShowAIModal(true)}
              style={({ pressed }) => [
                styles.aiButton,
                { backgroundColor: `${tint}15`, borderColor: tint },
                pressed && { opacity: 0.8 },
                isLargeScreen && { maxWidth: 600, width: '100%' },
              ]}
            >
              <Sparkles size={24} color={tint} style={{ marginRight: 12 }} />
              <View>
                <ThemedText style={{ color: tint, fontSize: 16, fontWeight: '700' }}>
                  Yapay Zeka ile Verilerimi Yorumla
                </ThemedText>
                <ThemedText style={{ color: textSecondary, fontSize: 13, marginTop: 2 }}>
                  Tüm alışkanlık ve günlük kayıtlarını analiz et
                </ThemedText>
              </View>
            </Pressable>
          </View>
        </ScrollView>
        <AIInsightsModal visible={showAIModal} onClose={() => setShowAIModal(false)} />
        <NotificationModal visible={showNotifications} onClose={() => setShowNotifications(false)} />
      </ScreenWrapper>
  );
}

const cardShadow =
  Platform.select({
    ios: {
      shadowColor: '#0f172a',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.12,
      shadowRadius: 12,
    },
    android: {
      elevation: 5,
    },
    default: {},
  }) ?? {};

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },
  scrollView: { flex: 1 },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  hero: {
    marginBottom: 24,
    marginTop: 8,
  },
  dateLine: { fontSize: 15, marginTop: 4 },
  lead: { fontSize: 15, lineHeight: 21, marginTop: 10 },
  gridCenter: {
    flexGrow: 1,
    minHeight: 360,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 14,
    maxWidth: 420,
    width: '100%',
  },
  gridLarge: {
    maxWidth: 1000,
    justifyContent: 'flex-start',
    gap: 24,
  },
  card: {
    width: '47%',
    aspectRatio: 1.05,
    maxWidth: 200,
    borderRadius: 20,
    padding: 16,
    justifyContent: 'space-between',
    ...cardShadow,
  },
  cardLarge: {
    width: '31%',
    maxWidth: 320,
    aspectRatio: 1.3,
    padding: 24,
  },
  cardTitle: {
    fontSize: 17,
    marginTop: 8,
  },
  aiButton: {
    marginTop: 32,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    width: '100%',
    maxWidth: 420,
  },
});
