/**
 * Spor Kaydı Formu
 */
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';

import { PrimaryButton } from '@/components/primary-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import {
  CalendarModal, DateRow, EntryMode, ModeSegmentedControl,
  NumInput, OptionRow, TemplateSaveRow, TemplatePickerModal, useTemplateState,
} from '@/components/form-components';
import { ModuleColors } from '@/constants/colors';
import { useThemeColor } from '@/hooks/use-theme-color';
import { todayLocalDateKey } from '@/lib/date';
import { useHabitStore } from '@/store/useHabitStore';

const C = ModuleColors.sport;
const WORKOUT_TYPES = ['Koşu', 'Yürüyüş', 'Yüzme', 'Bisiklet', 'Fitness', 'Yoga', 'HIIT', 'Pilates', 'Diğer'];

export default function SportFormScreen() {
  const surface = useThemeColor({}, 'surface');
  const border = useThemeColor({}, 'border');
  const textColor = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const background = useThemeColor({}, 'background');

  const { editId } = useLocalSearchParams<{ editId?: string }>();
  const existingEntry = useHabitStore((s) => s.sportsEntries.find((e) => e.id === editId));
  const addSportsEntry = useHabitStore((s) => s.addSportsEntry);
  const updateSportsEntry = useHabitStore((s) => s.updateSportsEntry);

  const [mode, setMode] = useState<EntryMode>('record');
  const [dateKey, setDateKey] = useState(todayLocalDateKey());
  const [showCalendar, setShowCalendar] = useState(false);
  const [workoutType, setWorkoutType] = useState('Koşu');
  const [customType, setCustomType] = useState('');
  const [duration, setDuration] = useState('');
  const [calories, setCalories] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (existingEntry) {
      setMode('record');
      setDateKey(existingEntry.date.split('T')[0] || todayLocalDateKey());
      setWorkoutType(existingEntry.workoutType);
      setDuration(String(existingEntry.durationMinutes || ''));
      setCalories(String(existingEntry.caloriesBurned || ''));
      setNotes(existingEntry.notes || '');
    }
  }, [existingEntry]);

  const tmpl = useTemplateState('sport');

  const applyTemplate = (t: { data: Record<string, unknown> }) => {
    setWorkoutType((t.data.workoutType as string) ?? 'Koşu');
    setDuration(String(t.data.durationMinutes ?? ''));
    setCalories(String(t.data.caloriesBurned ?? ''));
    setNotes((t.data.notes as string) ?? '');
  };

  const resolvedType = workoutType === 'Diğer' ? customType.trim() || 'Diğer' : workoutType;

  const onSave = () => {
    if (!resolvedType) { Alert.alert('Eksik Alan', 'Antrenman tipi seçin.'); return; }
    const data = {
      workoutType: resolvedType,
      durationMinutes: parseInt(duration) || 0,
      caloriesBurned: parseInt(calories) || 0,
      notes: notes.trim(),
      performanceMetrics: {},
    };
    if (editId) {
      updateSportsEntry(editId, { ...data, isPlanned: false, date: new Date(dateKey).toISOString() });
    } else {
      addSportsEntry({ date: dateKey, isPlanned: mode === 'plan', ...data });
    }
    tmpl.saveTemplateIfNeeded({ ...data });
    const msg = 'Kayıt başarıyla kaydedildi';
    if (Platform.OS === 'web') {
      window.alert(msg);
    } else {
      Alert.alert('Başarılı', msg);
    }

    // Reset Form fields
    setWorkoutType('Koşu');
    setCustomType('');
    setDuration('');
    setCalories('');
    setNotes('');
    setDateKey(todayLocalDateKey());
    tmpl.setSaveAsTemplate(false);
    tmpl.setTemplateName('');
  };

  return (
    <ThemedView style={styles.root}>
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <View style={styles.body}>
              <ModeSegmentedControl mode={mode} onChange={setMode} accentColor={C.accent} border={border} surface={surface} textColor={textColor} textSecondary={textSecondary} />
              <PrimaryButton title="Şablonlardan Seç" onPress={() => tmpl.setShowTemplatePicker(true)} style={[styles.templateBtn, { backgroundColor: `${C.solid}44`, borderColor: C.accent }]} textColor="#000000" />
              <DateRow label="Tarih" dateKey={dateKey} onPress={() => setShowCalendar(true)} surface={surface} border={border} tint={C.accent} textSecondary={textSecondary} textColor={textColor} />

              <View style={[styles.card, { backgroundColor: surface, borderColor: C.solid }]}>
                <ThemedText style={[styles.cardTitle, { color: textColor }]}>Antrenman Tipi</ThemedText>
                <OptionRow options={WORKOUT_TYPES} selected={workoutType} onSelect={setWorkoutType} tint={C.accent} border={border} textColor={textColor} textSecondary={textSecondary} />
                {workoutType === 'Diğer' && (
                  <TextInput value={customType} onChangeText={setCustomType} placeholder="Antrenman adı girin..." placeholderTextColor={textSecondary} style={[styles.input, { color: textColor, borderColor: border, marginTop: 10 }]} />
                )}
              </View>

              <View style={[styles.card, { backgroundColor: surface, borderColor: C.solid }]}>
                <View style={styles.numRow}>
                  <View style={{ flex: 1 }}>
                    <ThemedText style={[styles.label, { color: textSecondary }]}>Süre (dk)</ThemedText>
                    <NumInput value={duration} onChange={setDuration} placeholder="45" textColor={textColor} border={border} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <ThemedText style={[styles.label, { color: textSecondary }]}>Yakılan Kalori</ThemedText>
                    <NumInput value={calories} onChange={setCalories} placeholder="300" textColor={textColor} border={border} />
                  </View>
                </View>

                <ThemedText style={[styles.label, { color: textSecondary }]}>Ekstra Notlar / Metrikler</ThemedText>
                <TextInput value={notes} onChangeText={setNotes} placeholder="Nabız: 145, Mesafe: 5km..." placeholderTextColor={textSecondary} multiline style={[styles.multiInput, { color: textColor, borderColor: border }]} />
              </View>

              <TemplateSaveRow saveAsTemplate={tmpl.saveAsTemplate} templateName={tmpl.templateName} onToggle={tmpl.setSaveAsTemplate} onNameChange={tmpl.setTemplateName} surface={surface} border={border} tint={C.accent} textColor={textColor} textSecondary={textSecondary} />
              <PrimaryButton title={editId ? 'Kaydet & Tamamla' : (mode === 'plan' ? 'Plan Kaydet' : 'Antrenman Kaydet')} onPress={onSave} style={{ marginTop: 12 }} />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      <CalendarModal visible={showCalendar} onClose={() => setShowCalendar(false)} onSelect={(d) => setDateKey(d)} selectedDate={dateKey} mode={mode} surface={surface} tint={C.accent} textColor={textColor} textSecondary={textSecondary} border={border} />
      <TemplatePickerModal visible={tmpl.showTemplatePicker} onClose={() => tmpl.setShowTemplatePicker(false)} moduleKey="sport" onSelect={(t) => applyTemplate(t)} surface={surface} border={border} tint={C.accent} textColor={textColor} textSecondary={textSecondary} background={background} />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 }, safe: { flex: 1 }, scroll: { paddingBottom: 40 },
  body: { paddingHorizontal: 20, paddingTop: 20 },
  templateBtn: { marginBottom: 12, borderWidth: 1.5 },
  card: { borderRadius: 16, borderWidth: 1.5, padding: 16, marginBottom: 14 },
  cardTitle: { fontSize: 15, fontWeight: '700', marginBottom: 10 },
  label: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', marginBottom: 6, marginTop: 4 },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15 },
  multiInput: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15, minHeight: 100, textAlignVertical: 'top' },
  numRow: { flexDirection: 'row', gap: 10 },
});
