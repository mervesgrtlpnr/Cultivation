import { useCallback, useMemo, useRef, useState, type ComponentProps } from 'react';
import { Pressable, ScrollView, StyleSheet, View, InteractionManager, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenWrapper } from '@/components/ScreenWrapper';
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
} from '@gorhom/bottom-sheet';
import { router, useFocusEffect } from 'expo-router';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { CheckCircle } from 'lucide-react-native';

import { PrimaryButton } from '@/components/primary-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ModuleColors } from '@/constants/colors';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useThemeColor } from '@/hooks/use-theme-color';
import {
  buildMarkedDates,
  DOT_JOURNAL,
  DOT_SPORT,
  DOT_NUTRITION,
  DOT_STUDY,
  DOT_BUDGET,
  DOT_SLEEP,
  DOT_PERIOD,
} from '@/lib/calendar-marked';
import { toLocalDateKey, todayLocalDateKey } from '@/lib/date';
import { useHabitStore } from '@/store/useHabitStore';

// ─── Türkçe takvim ─────────────────────────────────────────────────────────
LocaleConfig.locales.tr = {
  monthNames: ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'],
  monthNamesShort: ['Oca','Şub','Mar','Nis','May','Haz','Tem','Ağu','Eyl','Eki','Kas','Ara'],
  dayNames: ['Pazar','Pazartesi','Salı','Çarşamba','Perşembe','Cuma','Cumartesi'],
  dayNamesShort: ['Pa','Pt','Sa','Ça','Pe','Cu','Ct'],
  today: 'Bugün',
};
LocaleConfig.defaultLocale = 'tr';

const MOODS = ['😫', '😕', '😐', '🙂', '🌟'];

// ─── Dot legend verileri ───────────────────────────────────────────────────
const DOT_LEGEND = [
  { key: 'journal',   color: DOT_JOURNAL,   label: 'Günlük' },
  { key: 'period',    color: DOT_PERIOD,    label: 'Regl' },
  { key: 'sport',     color: DOT_SPORT,     label: 'Spor' },
  { key: 'study',     color: DOT_STUDY,     label: 'Ders' },
  { key: 'nutrition', color: DOT_NUTRITION, label: 'Beslenme' },
  { key: 'budget',    color: DOT_BUDGET,    label: 'Bütçe' },
  { key: 'sleep',     color: DOT_SLEEP,     label: 'Uyku' },
] as const;

// ─── Yardımcı fonksiyonlar ─────────────────────────────────────────────────
function daysAgoKey(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return toLocalDateKey(d);
}

function filterByLocalDay<T extends { date: string }>(items: T[], dateKey: string): T[] {
  return items.filter((e) => toLocalDateKey(new Date(e.date)) === dateKey);
}

function dayHasData(
  dateKey: string,
  s: {
    journalEntries: { date: string }[];
    sportsEntries: { date: string }[];
    nutritionEntries: { date: string }[];
    studyEntries: { date: string }[];
    budgetEntries: { date: string }[];
    sleepEntries: { date: string }[];
    periodEntries: { startDate: string, endDate?: string }[];
  },
): boolean {
  const hasPeriod = s.periodEntries.some((p) => {
    if (!p.startDate) return false;
    const end = p.endDate || p.startDate;
    return dateKey >= p.startDate && dateKey <= end;
  });

  return (
    hasPeriod ||
    filterByLocalDay(s.journalEntries, dateKey).length > 0 ||
    filterByLocalDay(s.sportsEntries, dateKey).length > 0 ||
    filterByLocalDay(s.nutritionEntries, dateKey).length > 0 ||
    filterByLocalDay(s.studyEntries, dateKey).length > 0 ||
    filterByLocalDay(s.budgetEntries, dateKey).length > 0 ||
    filterByLocalDay(s.sleepEntries, dateKey).length > 0
  );
}

// ─── Modül kartı bileşeni ──────────────────────────────────────────────────
type ModuleCardProps = {
  title: string;
  subtitle: string;
  accentColor: string;
  isPlanned?: boolean;
  textSecondary: string;
  onComplete?: () => void;
};

function ModuleCard({ title, subtitle, accentColor, isPlanned, textSecondary, onComplete }: ModuleCardProps) {
  return (
    <View
      style={[
        styles.detailCard,
        {
          borderColor: accentColor,
          backgroundColor: isPlanned ? `${accentColor}18` : `${accentColor}28`,
          borderStyle: isPlanned ? 'dashed' : 'solid',
          opacity: isPlanned ? 0.85 : 1,
        },
      ]}>
      {/* Sol renk şeridi */}
      <View style={[styles.cardAccent, { backgroundColor: accentColor }]} />
      <View style={styles.cardBody}>
        <View style={styles.cardTitleRow}>
          <ThemedText type="defaultSemiBold" style={{ fontSize: 15 }}>
            {title}
          </ThemedText>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            {isPlanned && (
              <View style={[styles.plannedBadge, { borderColor: accentColor }]}>
                <ThemedText style={[styles.plannedBadgeText, { color: accentColor }]}>
                  Planlanan
                </ThemedText>
              </View>
            )}
            {isPlanned && onComplete && (
              <Pressable onPress={onComplete} hitSlop={8} style={{ marginLeft: 4 }}>
                <CheckCircle size={20} color={accentColor} />
              </Pressable>
            )}
          </View>
        </View>
        <ThemedText style={[styles.cardSubtitle, { color: textSecondary }]}>
          {subtitle}
        </ThemedText>
      </View>
    </View>
  );
}

// ─── Ana Ekran ─────────────────────────────────────────────────────────────
export default function StatsScreen() {
  const colorScheme = useColorScheme();
  const scheme = colorScheme === 'dark' ? 'dark' : 'light';

  const surface      = useThemeColor({}, 'surface');
  const border       = useThemeColor({}, 'border');
  const tint         = useThemeColor({}, 'tint');
  const tintMuted    = '#40916c';
  const textSecondary = useThemeColor({}, 'textSecondary');
  const textColor    = useThemeColor({}, 'text');
  const background   = useThemeColor({}, 'background');

  // Tema key — takvimi zorla yeniden render etmek için
  const appTheme = useHabitStore((s) => s.appTheme);

  // Store verileri
  const journalEntries   = useHabitStore((s) => s.journalEntries);
  const sportsEntries    = useHabitStore((s) => s.sportsEntries);
  const nutritionEntries = useHabitStore((s) => s.nutritionEntries);
  const studyEntries     = useHabitStore((s) => s.studyEntries);
  const budgetEntries    = useHabitStore((s) => s.budgetEntries);
  const sleepEntries     = useHabitStore((s) => s.sleepEntries);
  const periodEntries    = useHabitStore((s) => s.periodEntries);

  const sheetRef = useRef<BottomSheetModal>(null);
  const [sheetDay, setSheetDay] = useState(todayLocalDateKey());

  const [isReady, setIsReady] = useState(false);

  useFocusEffect(
    useCallback(() => {
      const task = InteractionManager.runAfterInteractions(() => {
        setIsReady(true);
      });
      return () => {
        sheetRef.current?.dismiss();
        task.cancel();
      };
    }, []),
  );

  const snapPoints = useMemo(() => ['55%', '92%'], []);

  const renderBackdrop = useCallback(
    (props: ComponentProps<typeof BottomSheetBackdrop>) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.42}
      />
    ),
    [],
  );

  // Takvim markedDates — tüm 7 modül
  const baseMarked = useMemo(
    () =>
      buildMarkedDates(
        journalEntries,
        sportsEntries,
        nutritionEntries,
        studyEntries,
        budgetEntries,
        sleepEntries,
        periodEntries,
      ),
    [journalEntries, sportsEntries, nutritionEntries, studyEntries, budgetEntries, sleepEntries, periodEntries],
  );

  const markedDates = useMemo(() => {
    const merged = { ...baseMarked };
    merged[sheetDay] = {
      ...(merged[sheetDay] ?? {}),
      selected: true,
      selectedColor: scheme === 'dark' ? `${tint}44` : `${tint}33`,
      selectedTextColor: textColor,
    };
    return merged;
  }, [baseMarked, sheetDay, tint, textColor, scheme]);

  const calendarTheme = useMemo(
    () => ({
      backgroundColor: surface,
      calendarBackground: surface,
      textSectionTitleColor: textSecondary,
      selectedDayBackgroundColor: `${tint}55`,
      selectedDayTextColor: textColor,
      todayTextColor: tint,
      dayTextColor: textColor,
      textDisabledColor: `${textSecondary}88`,
      dotColor: tint,
      selectedDotColor: textColor,
      arrowColor: tint,
      monthTextColor: textColor,
      textDayFontWeight: '500' as const,
      textDayHeaderFontWeight: '600' as const,
      textDayFontSize: 15,
      textMonthFontSize: 17,
      textMonthFontWeight: '600' as const,
    }),
    [surface, textSecondary, tint, textColor],
  );

  const onDayPress = useCallback((day: { dateString: string }) => {
    // State güncellemesinin React tarafından işlenmesini garantilemek için
    // requestAnimationFrame ile sheet açmayı bir tick geciktiriyoruz.
    // Bu, aynı güne art arda tıklandığında sheet'in açılmaması sorununu çözer.
    setSheetDay(day.dateString);
    requestAnimationFrame(() => {
      sheetRef.current?.dismiss();
      requestAnimationFrame(() => {
        sheetRef.current?.present();
      });
    });
  }, []);

  // Bottom sheet snapshot
  const sheetSnapshot = useMemo(() => {
    const activePeriod = periodEntries.filter((p) => {
      if (!p.startDate) return false;
      const s = p.startDate;
      const e = p.endDate || p.startDate;
      return sheetDay >= s && sheetDay <= e;
    }).slice(0, 1);

    return {
      journals:  filterByLocalDay(journalEntries, sheetDay),
      sports:    filterByLocalDay(sportsEntries, sheetDay),
      nutrition: filterByLocalDay(nutritionEntries, sheetDay),
      study:     filterByLocalDay(studyEntries, sheetDay),
      budget:    filterByLocalDay(budgetEntries, sheetDay),
      sleep:     filterByLocalDay(sleepEntries, sheetDay),
      period:    activePeriod,
    };
  }, [sheetDay, journalEntries, sportsEntries, nutritionEntries, studyEntries, budgetEntries, sleepEntries, periodEntries]);

  const hasData = useMemo(
    () => dayHasData(sheetDay, { journalEntries, sportsEntries, nutritionEntries, studyEntries, budgetEntries, sleepEntries, periodEntries }),
    [sheetDay, journalEntries, sportsEntries, nutritionEntries, studyEntries, budgetEntries, sleepEntries, periodEntries],
  );

  // Ruh hali bar grafik
  const bars = useMemo(() => {
    return [6, 5, 4, 3, 2, 1, 0].map((offset) => {
      const key = daysAgoKey(offset);
      const journals = journalEntries.filter((e) => toLocalDateKey(new Date(e.date)) === key);
      const avg = journals.length > 0 ? journals.reduce((s, e) => s + e.moodScore, 0) / journals.length : 0;
      const pct = avg / 5;
      return { key, label: key.slice(5), pct: Number.isFinite(pct) ? pct : 0 };
    });
  }, [journalEntries]);

  const openDailyEntry = () => {
    sheetRef.current?.dismiss();
    router.push({ pathname: '/daily-entry', params: { date: sheetDay } });
  };

  const sheetTitle = useMemo(() => {
    const [y, m, d] = sheetDay.split('-').map(Number);
    if (!y || !m || !d) return sheetDay;
    return new Date(y, m - 1, d).toLocaleDateString('tr-TR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
  }, [sheetDay]);

  if (!isReady) {
    return (
      <ScreenWrapper edges={['top']}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: textSecondary }}>Yükleniyor...</Text>
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* ── Takvim ──────────────────────────────────────────── */}
          <View style={[styles.calWrap, { backgroundColor: surface, borderColor: border }]}>
            <Calendar
              key={`cal-${appTheme}-${scheme}`}
              current={sheetDay}
              markingType="multi-dot"
              markedDates={markedDates}
              onDayPress={onDayPress}
              theme={calendarTheme}
              enableSwipeMonths
            />
            {/* Dot legend — sadece nokta renkleri */}
            <View style={styles.dotLegend}>
              {DOT_LEGEND.map((item) => (
                <View key={item.key} style={styles.legendItem}>
                  <View style={[styles.dot, { backgroundColor: item.color }]} />
                  <ThemedText style={[styles.legendTxt, { color: textSecondary }]}>
                    {item.label}
                  </ThemedText>
                </View>
              ))}
            </View>
          </View>

          {/* ── Ruh hali grafiği ─────────────────────────────────── */}
          <View style={[styles.panel, { backgroundColor: surface, borderColor: border }]}>
            <ThemedText type="subtitle">Son 7 gün — ruh hali</ThemedText>
            <ThemedText style={[styles.chartCaption, { color: textSecondary }]}>
              Günlük ortalaması (0 = giriş yok)
            </ThemedText>
            <View style={styles.bars}>
              {bars.map((item) => (
                <View key={item.key} style={styles.barColumn}>
                  <View style={[styles.barTrack, { backgroundColor: border }]}>
                    <View
                      style={[
                        styles.barFill,
                        {
                          height: Math.max(4, Math.round(120 * item.pct)),
                          backgroundColor: item.pct > 0 ? tint : tintMuted,
                          opacity: item.pct > 0 ? 1 : 0.35,
                        },
                      ]}
                    />
                  </View>
                  <ThemedText style={[styles.barLabel, { color: textSecondary }]}>
                    {item.label}
                  </ThemedText>
                </View>
              ))}
            </View>
          </View>
        </ScrollView>

        {/* ── Bottom Sheet ─────────────────────────────────────── */}
        <BottomSheetModal
          ref={sheetRef}
          snapPoints={snapPoints}
          enablePanDownToClose
          backdropComponent={renderBackdrop}
          handleIndicatorStyle={{ backgroundColor: border, width: 44 }}
          backgroundStyle={{
            backgroundColor: surface,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
          }}>
          <BottomSheetScrollView
            contentContainerStyle={[styles.sheetScroll, { paddingBottom: 40 }]}
            showsVerticalScrollIndicator={false}>
            <ThemedText type="subtitle">{sheetTitle}</ThemedText>
            {(() => {
              const isFutureDate = sheetDay > todayLocalDateKey();
              return !hasData ? (
                <View style={[styles.emptyCard, { borderColor: border, backgroundColor: background }]}>
                  <ThemedText type="defaultSemiBold" style={styles.emptyTitle}>
                    Bu gün için henüz bir kayıt girilmemiş
                  </ThemedText>
                  <ThemedText style={[styles.emptyBody, { color: textSecondary }]}>
                    Günlük girdi veya diğer takip modüllerinden veri ekleyerek takvimde noktaları
                    görebilirsiniz.
                  </ThemedText>
                  {!isFutureDate && <PrimaryButton title="Veri Ekle" onPress={openDailyEntry} style={styles.emptyBtn} />}
                </View>
              ) : null;
            })() || (
              <>
                {/* Günlük — tüm kayıtları listele */}
                {sheetSnapshot.journals.map((j) => (
                  <ModuleCard
                    key={j.id}
                    title="Günlük"
                    subtitle={`${MOODS[j.moodScore - 1] ?? '•'}  Duygu: ${j.moodScore}/5${
                      j.content.trim() ? `\n${j.content}` : ''
                    }${
                      j.tags.length > 0 ? `\n🏷️ ${j.tags.join(' · ')}` : ''
                    }`}
                    accentColor={ModuleColors.journal.solid}
                    isPlanned={false}
                    textSecondary={textSecondary}
                  />
                ))}

                {/* Regl */}
                {sheetSnapshot.period.map((p) => {
                  const sDate = new Date(p.startDate);
                  const cDate = new Date(sheetDay);
                  const diffTime = cDate.getTime() - sDate.getTime();
                  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
                  const dayText = `${diffDays}. Gün`;
                  const subtitleText = p.notes ? `${dayText}\n${p.notes}` : dayText;

                  return (
                    <ModuleCard
                      key={p.id}
                      title="Regl"
                      subtitle={subtitleText}
                      accentColor={ModuleColors.period.solid}
                      isPlanned={p.isPlanned}
                      textSecondary={textSecondary}
                    />
                  );
                })}

                {/* Spor */}
                {sheetSnapshot.sports.map((sp) => (
                  <ModuleCard
                    key={sp.id}
                    title={`Spor — ${sp.workoutType}`}
                    subtitle={`${sp.durationMinutes} dk · ${sp.caloriesBurned} kcal yakılan${sp.notes ? '\n' + sp.notes : ''}`}
                    accentColor={ModuleColors.sport.solid}
                    isPlanned={sp.isPlanned}
                    textSecondary={textSecondary}
                    onComplete={() => {
                      sheetRef.current?.dismiss();
                      setTimeout(() => router.push({ pathname: '/modules/sport', params: { editId: sp.id } }), 150);
                    }}
                  />
                ))}

                {/* Ders */}
                {sheetSnapshot.study.map((st) => (
                  <ModuleCard
                    key={st.id}
                    title={`Ders — ${st.subject}`}
                    subtitle={`${st.topic} · ${st.durationMinutes} dk · %${st.accuracyRate} doğruluk · ${st.questionCount} soru`}
                    accentColor={ModuleColors.study.solid}
                    isPlanned={st.isPlanned}
                    textSecondary={textSecondary}
                    onComplete={() => {
                      sheetRef.current?.dismiss();
                      setTimeout(() => router.push({ pathname: '/modules/study', params: { editId: st.id } }), 150);
                    }}
                  />
                ))}

                {/* Beslenme */}
                {sheetSnapshot.nutrition.map((n) => (
                  <ModuleCard
                    key={n.id}
                    title={`Beslenme — ${n.mealType}`}
                    subtitle={`${n.foods ? n.foods + '\n' : ''}${n.calories} kcal · P ${n.macros.protein} / K ${n.macros.carbs} / Y ${n.macros.fat}`}
                    accentColor={ModuleColors.nutrition.solid}
                    isPlanned={n.isPlanned}
                    textSecondary={textSecondary}
                    onComplete={() => {
                      sheetRef.current?.dismiss();
                      setTimeout(() => router.push({ pathname: '/modules/nutrition', params: { editId: n.id } }), 150);
                    }}
                  />
                ))}

                {/* Bütçe */}
                {sheetSnapshot.budget.map((b) => (
                  <ModuleCard
                    key={b.id}
                    title={`Bütçe — ${b.type === 'income' ? 'Gelir' : 'Gider'}`}
                    subtitle={`${b.category} · ${b.amount} ₺`}
                    accentColor={ModuleColors.budget.solid}
                    isPlanned={b.isPlanned}
                    textSecondary={textSecondary}
                    onComplete={() => {
                      sheetRef.current?.dismiss();
                      setTimeout(() => router.push({ pathname: '/modules/budget', params: { editId: b.id } }), 150);
                    }}
                  />
                ))}

                {/* Uyku */}
                {sheetSnapshot.sleep.map((sl) => (
                  <ModuleCard
                    key={sl.id}
                    title="Uyku"
                    subtitle={`${sl.durationHours} saat · Kalite ${sl.qualityScore}/10`}
                    accentColor={ModuleColors.sleep.solid}
                    isPlanned={sl.isPlanned}
                    textSecondary={textSecondary}
                    onComplete={() => {
                      sheetRef.current?.dismiss();
                      setTimeout(() => router.push({ pathname: '/modules/sleep', params: { editId: sl.id } }), 150);
                    }}
                  />
                ))}

                {!(sheetDay > todayLocalDateKey()) && (
                  <Pressable
                    onPress={openDailyEntry}
                    style={({ pressed }) => [
                      styles.linkBtn,
                      { borderColor: tint, opacity: pressed ? 0.85 : 1 },
                    ]}>
                    <ThemedText style={{ color: tint, fontWeight: '700' }}>
                      Günlük girdiyi düzenle
                    </ThemedText>
                  </Pressable>
                )}
              </>
            )}
          </BottomSheetScrollView>
        </BottomSheetModal>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },
  scroll: { paddingHorizontal: 20, paddingBottom: 120 },
  header: { marginBottom: 16, marginTop: 8 },
  lead: { fontSize: 15, lineHeight: 21, marginTop: 8 },

  // Takvim
  calWrap: {
    borderRadius: 18,
    borderWidth: 1,
    paddingBottom: 10,
    marginBottom: 16,
    overflow: 'hidden',
  },
  dotLegend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingTop: 6,
    paddingBottom: 10,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  legendTxt: { fontSize: 11, fontWeight: '600' },

  // Ruh hali grafiği
  panel: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
    marginBottom: 16,
  },
  chartCaption: { fontSize: 14, marginTop: 4, marginBottom: 12 },
  bars: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: 6,
    minHeight: 140,
    paddingTop: 8,
  },
  barColumn: { flex: 1, alignItems: 'center' },
  barTrack: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },
  barLabel: { fontSize: 10, marginTop: 6, textAlign: 'center' },

  // Bottom sheet
  sheetScroll: { paddingHorizontal: 20, paddingTop: 8 },
  sheetSub: { fontSize: 13, marginTop: 4, marginBottom: 16 },
  emptyCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    alignItems: 'center',
  },
  emptyTitle: { textAlign: 'center' },
  emptyBody: { textAlign: 'center', marginTop: 10, lineHeight: 21 },
  emptyBtn: { marginTop: 18, alignSelf: 'stretch' },

  // Modül kartı
  detailCard: {
    flexDirection: 'row',
    borderRadius: 14,
    borderWidth: 1.5,
    marginBottom: 10,
    overflow: 'hidden',
  },
  cardAccent: {
    width: 4,
    borderRadius: 0,
  },
  cardBody: {
    flex: 1,
    padding: 14,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  cardSubtitle: {
    fontSize: 13,
    marginTop: 5,
    lineHeight: 19,
  },
  plannedBadge: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  plannedBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  linkBtn: {
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  block: { marginTop: 12 },
  blockLabel: { fontSize: 12, fontWeight: '700', marginBottom: 4, textTransform: 'uppercase' },
  bulletLine: { fontSize: 15, lineHeight: 22 },
  tags: { fontSize: 13, marginTop: 10 },
  moodRowSheet: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 },
  moodEmojiBig: { fontSize: 32 },
});
