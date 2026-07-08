/**
 * Regl Takibi Formu
 * Başlangıç ve bitiş tarihi — takvim arayüzü, isPlanned YOK.
 */
import { useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Calendar } from 'react-native-calendars';

import { PrimaryButton } from '@/components/primary-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ModuleColors } from '@/constants/colors';
import { useThemeColor } from '@/hooks/use-theme-color';
import { todayLocalDateKey } from '@/lib/date';
import { useHabitStore } from '@/store/useHabitStore';

const C = ModuleColors.period;

export default function PeriodFormScreen() {
  const surface = useThemeColor({}, 'surface');
  const border = useThemeColor({}, 'border');
  const textColor = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');

  const addPeriodEntry = useHabitStore((s) => s.addPeriodEntry);

  const today = todayLocalDateKey();
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState<string | undefined>(undefined);
  const [selectionStep, setSelectionStep] = useState<'start' | 'end'>('start');

  const handleDayPress = (day: { dateString: string }) => {
    if (selectionStep === 'start') {
      setStartDate(day.dateString);
      setEndDate(undefined);
      setSelectionStep('end');
    } else {
      if (day.dateString < startDate) {
        setStartDate(day.dateString);
        setEndDate(undefined);
        setSelectionStep('end');
      } else {
        setEndDate(day.dateString);
        setSelectionStep('start');
      }
    }
  };

  // Takvimde seçili günleri vurgula
  const buildMarked = () => {
    const m: Record<string, object> = {
      [startDate]: { selected: true, selectedColor: C.solid, selectedTextColor: C.text },
    };
    if (endDate && endDate !== startDate) {
      m[endDate] = { selected: true, selectedColor: `${C.solid}99`, selectedTextColor: C.text };
    }
    return m;
  };

  const onSave = () => {
    if (startDate > today || (endDate && endDate > today)) {
      Alert.alert('Geçersiz Tarih', 'Regl kaydı için bugünden daha ileri bir tarih seçemezsiniz.');
      return;
    }

    addPeriodEntry({
      date: startDate,
      startDate,
      endDate,
      notes: '',
      isPlanned: false,
    });

    const msg = 'Kayıt başarıyla kaydedildi';
    if (Platform.OS === 'web') {
      window.alert(msg);
    } else {
      Alert.alert('Başarılı', msg);
    }

    // Reset Form fields
    setStartDate(today);
    setEndDate(undefined);
    setSelectionStep('start');
  };

  return (
    <ThemedView style={styles.root}>
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {/* Bilgilendirme şeridi — sadece yönlendirici metin */}
          <View style={[styles.infoBanner, { backgroundColor: `${C.solid}22`, borderColor: C.accent }]}>
            <ThemedText style={[styles.infoText, { color: C.text }]}>
              ℹ️ Takvimde önce başlangıç tarihini, ardından bitiş tarihini seçiniz.
            </ThemedText>
          </View>

          {/* Seçim adımı göstergesi */}
          <View style={[styles.stepRow, { backgroundColor: surface, borderColor: border }]}>
            <View style={[styles.stepDot, { backgroundColor: C.solid }]} />
            <ThemedText style={{ color: textSecondary, fontSize: 14 }}>
              {selectionStep === 'start'
                ? 'Başlangıç tarihini seçin'
                : 'Bitiş tarihini seçin (opsiyonel)'}
            </ThemedText>
          </View>

          {/* Özet */}
          {(startDate || endDate) && (
            <View style={[styles.summaryCard, { backgroundColor: `${C.solid}22`, borderColor: C.accent }]}>
              <ThemedText style={[styles.summaryText, { color: C.text }]}>
                Başlangıç: <ThemedText style={{ fontWeight: '700' }}>{startDate}</ThemedText>
              </ThemedText>
              {endDate && (
                <ThemedText style={[styles.summaryText, { color: C.text }]}>
                  Bitiş: <ThemedText style={{ fontWeight: '700' }}>{endDate}</ThemedText>
                </ThemedText>
              )}
            </View>
          )}

          {/* Takvim */}
          <View style={[styles.calWrap, { backgroundColor: surface, borderColor: border }]}>
            <Calendar
              current={startDate}
              maxDate={today}
              markedDates={buildMarked()}
              onDayPress={handleDayPress}
              enableSwipeMonths
              theme={{
                backgroundColor: surface,
                calendarBackground: surface,
                textSectionTitleColor: textSecondary,
                selectedDayBackgroundColor: C.solid,
                selectedDayTextColor: C.text,
                todayTextColor: C.accent,
                dayTextColor: textColor,
                textDisabledColor: `${textSecondary}55`,
                arrowColor: C.accent,
                monthTextColor: textColor,
                textDayFontWeight: '500',
                textMonthFontWeight: '700',
              }}
            />
          </View>

          {/* Sıfırla */}
          <Pressable
            onPress={() => { setStartDate(today); setEndDate(undefined); setSelectionStep('start'); }}
            style={[styles.resetBtn, { borderColor: C.accent }]}>
            <ThemedText style={{ color: C.accent, fontWeight: '600' }}>Seçimi Sıfırla</ThemedText>
          </Pressable>

          <PrimaryButton title="Kaydet" onPress={onSave} />
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },
  scroll: { paddingBottom: 40 },
  infoBanner: {
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  infoText: { fontSize: 14, lineHeight: 20, fontWeight: '500' },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  stepDot: { width: 10, height: 10, borderRadius: 5 },
  summaryCard: {
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    gap: 4,
  },
  summaryText: { fontSize: 14 },
  calWrap: {
    marginHorizontal: 20,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 16,
  },
  resetBtn: {
    marginHorizontal: 20,
    marginBottom: 12,
    borderWidth: 1.5,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
});
