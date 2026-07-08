/**
 * Uyku Takibi Formu — Saat/Dakika seçici + 1-10 kalite puanı
 */
import { useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';

import { PrimaryButton } from '@/components/primary-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import {
  CalendarModal, DateRow, EntryMode, ModeSegmentedControl,
  TemplateSaveRow, TemplatePickerModal, useTemplateState,
} from '@/components/form-components';
import { ModuleColors } from '@/constants/colors';
import { useThemeColor } from '@/hooks/use-theme-color';
import { todayLocalDateKey } from '@/lib/date';
import { useHabitStore } from '@/store/useHabitStore';

const C = ModuleColors.sleep;
const HOURS = Array.from({ length: 13 }, (_, i) => i);        // 0–12
const MINUTES = [0, 15, 30, 45];
const QUALITY_LABELS: Record<number, string> = {
  1: 'Çok Kötü', 2: 'Kötü', 3: 'Zayıf', 4: 'İdare Eder', 5: 'Orta',
  6: 'İyi', 7: 'Oldukça İyi', 8: 'Harika', 9: 'Mükemmel', 10: 'Mükemmel+',
};

export default function SleepFormScreen() {
  const surface = useThemeColor({}, 'surface');
  const border = useThemeColor({}, 'border');
  const textColor = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const background = useThemeColor({}, 'background');

  const { editId } = useLocalSearchParams<{ editId?: string }>();
  const existingEntry = useHabitStore((s) => s.sleepEntries.find((e) => e.id === editId));
  const addSleepEntry = useHabitStore((s) => s.addSleepEntry);
  const updateSleepEntry = useHabitStore((s) => s.updateSleepEntry);

  const [mode, setMode] = useState<EntryMode>('record');
  const [dateKey, setDateKey] = useState(todayLocalDateKey());
  const [showCalendar, setShowCalendar] = useState(false);
  const [hours, setHours] = useState(7);
  const [minutes, setMinutes] = useState(0);
  const [quality, setQuality] = useState(7);

  useEffect(() => {
    if (existingEntry) {
      setMode('record');
      setDateKey(existingEntry.date.split('T')[0] || todayLocalDateKey());
      setHours(Math.floor(existingEntry.durationHours));
      setMinutes(Math.round((existingEntry.durationHours % 1) * 60));
      setQuality(existingEntry.qualityScore);
    }
  }, [existingEntry]);

  const tmpl = useTemplateState('sleep');

  const applyTemplate = (t: { data: Record<string, unknown> }) => {
    const dh = (t.data.durationHours as number) ?? 7;
    setHours(Math.floor(dh));
    setMinutes(Math.round((dh % 1) * 60));
    setQuality((t.data.qualityScore as number) ?? 7);
  };

  const durationHours = hours + minutes / 60;

  const onSave = () => {
    const data = { durationHours, qualityScore: quality };
    if (editId) {
      updateSleepEntry(editId, { ...data, isPlanned: false, date: new Date(dateKey).toISOString() });
    } else {
      addSleepEntry({ date: dateKey, isPlanned: mode === 'plan', ...data });
    }
    tmpl.saveTemplateIfNeeded({ durationHours, qualityScore: quality });
    const msg = 'Kayıt başarıyla kaydedildi';
    if (Platform.OS === 'web') {
      window.alert(msg);
    } else {
      Alert.alert('Başarılı', msg);
    }

    // Reset Form fields
    setHours(7);
    setMinutes(0);
    setQuality(7);
    setDateKey(todayLocalDateKey());
    tmpl.setSaveAsTemplate(false);
    tmpl.setTemplateName('');
  };

  return (
    <ThemedView style={styles.root}>
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.body}>
            <ModeSegmentedControl mode={mode} onChange={setMode} accentColor={C.accent} border={border} surface={surface} textColor={textColor} textSecondary={textSecondary} />
            <PrimaryButton title="Şablonlardan Seç" onPress={() => tmpl.setShowTemplatePicker(true)} style={[styles.templateBtn, { backgroundColor: `${C.solid}44`, borderColor: C.accent }]} textColor="#000000" />
            <DateRow label="Tarih" dateKey={dateKey} onPress={() => setShowCalendar(true)} surface={surface} border={border} tint={C.accent} textSecondary={textSecondary} textColor={textColor} />

            {/* Saat seçici */}
            <View style={[styles.card, { backgroundColor: surface, borderColor: C.solid }]}>
              <ThemedText style={[styles.cardTitle, { color: textColor }]}>Saat</ThemedText>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.pickerRow}>
                  {HOURS.map((h) => (
                    <Pressable key={h} onPress={() => setHours(h)}
                      style={[styles.pickerChip, { borderColor: hours === h ? C.accent : border, backgroundColor: hours === h ? C.solid : 'transparent' }]}>
                      <ThemedText style={[styles.pickerText, { color: hours === h ? C.text : textSecondary }]}>
                        {h}s
                      </ThemedText>
                    </Pressable>
                  ))}
                </View>
              </ScrollView>

              <ThemedText style={[styles.cardTitle, { color: textColor, marginTop: 12 }]}>Dakika</ThemedText>
              <View style={styles.pickerRow}>
                {MINUTES.map((m) => (
                  <Pressable key={m} onPress={() => setMinutes(m)}
                    style={[styles.pickerChip, { borderColor: minutes === m ? C.accent : border, backgroundColor: minutes === m ? C.solid : 'transparent' }]}>
                    <ThemedText style={[styles.pickerText, { color: minutes === m ? C.text : textSecondary }]}>
                      {m}dk
                    </ThemedText>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Kalite puanı */}
            <View style={[styles.card, { backgroundColor: surface, borderColor: C.solid }]}>
              <ThemedText style={[styles.cardTitle, { color: textColor }]}>
                Uyku Kalitesi: <ThemedText style={{ color: C.accent }}>{quality}/10 — {QUALITY_LABELS[quality]}</ThemedText>
              </ThemedText>
              <View style={styles.qualityRow}>
                {Array.from({ length: 10 }, (_, i) => i + 1).map((q) => (
                  <Pressable key={q} onPress={() => setQuality(q)}
                    style={[styles.qualityBtn, { borderColor: quality === q ? C.accent : border, backgroundColor: quality === q ? C.solid : 'transparent' }]}>
                    <ThemedText style={[styles.qualityText, { color: quality === q ? C.text : textSecondary }]}>
                      {q}
                    </ThemedText>
                  </Pressable>
                ))}
              </View>
            </View>

            <TemplateSaveRow saveAsTemplate={tmpl.saveAsTemplate} templateName={tmpl.templateName} onToggle={tmpl.setSaveAsTemplate} onNameChange={tmpl.setTemplateName} surface={surface} border={border} tint={C.accent} textColor={textColor} textSecondary={textSecondary} />
            <PrimaryButton title={editId ? 'Kaydet & Tamamla' : (mode === 'plan' ? 'Uyku Hedefi Kaydet' : 'Uyku Kaydet')} onPress={onSave} style={{ marginTop: 12 }} />
          </View>
        </ScrollView>
      </SafeAreaView>

      <CalendarModal visible={showCalendar} onClose={() => setShowCalendar(false)} onSelect={(d) => setDateKey(d)} selectedDate={dateKey} mode={mode} surface={surface} tint={C.accent} textColor={textColor} textSecondary={textSecondary} border={border} />
      <TemplatePickerModal visible={tmpl.showTemplatePicker} onClose={() => tmpl.setShowTemplatePicker(false)} moduleKey="sleep" onSelect={(t) => applyTemplate(t)} surface={surface} border={border} tint={C.accent} textColor={textColor} textSecondary={textSecondary} background={background} />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 }, safe: { flex: 1 }, scroll: { paddingBottom: 40 },
  body: { paddingHorizontal: 20, paddingTop: 20 },
  templateBtn: { marginBottom: 12, borderWidth: 1.5 },
  card: { borderRadius: 16, borderWidth: 1.5, padding: 16, marginBottom: 14 },
  cardTitle: { fontSize: 14, fontWeight: '700', marginBottom: 10 },
  pickerRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  pickerChip: { borderWidth: 1.5, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 },
  pickerText: { fontSize: 14, fontWeight: '600' },
  qualityRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  qualityBtn: { width: 40, height: 40, borderRadius: 10, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  qualityText: { fontSize: 14, fontWeight: '700' },
});
