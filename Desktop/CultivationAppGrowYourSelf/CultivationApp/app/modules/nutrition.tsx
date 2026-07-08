/**
 * Beslenme Takibi Formu
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

const C = ModuleColors.nutrition;
const MEAL_TYPES = ['Sabah', 'Öğle', 'Akşam', 'Ara Öğün'];

export default function NutritionFormScreen() {
  const surface = useThemeColor({}, 'surface');
  const border = useThemeColor({}, 'border');
  const textColor = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const background = useThemeColor({}, 'background');

  const { editId } = useLocalSearchParams<{ editId?: string }>();
  const existingEntry = useHabitStore((s) => s.nutritionEntries.find((e) => e.id === editId));
  const addNutritionEntry = useHabitStore((s) => s.addNutritionEntry);
  const updateNutritionEntry = useHabitStore((s) => s.updateNutritionEntry);

  const [mode, setMode] = useState<EntryMode>('record');
  const [dateKey, setDateKey] = useState(todayLocalDateKey());
  const [showCalendar, setShowCalendar] = useState(false);
  const [mealType, setMealType] = useState('Sabah');
  const [foods, setFoods] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');

  useEffect(() => {
    if (existingEntry) {
      setMode('record');
      setDateKey(existingEntry.date.split('T')[0] || todayLocalDateKey());
      setMealType(existingEntry.mealType);
      setFoods(existingEntry.foods || '');
      setCalories(String(existingEntry.calories || ''));
      setProtein(String(existingEntry.macros?.protein || ''));
      setCarbs(String(existingEntry.macros?.carbs || ''));
      setFat(String(existingEntry.macros?.fat || ''));
    }
  }, [existingEntry]);

  const tmpl = useTemplateState('nutrition');

  const applyTemplate = (t: { data: Record<string, unknown> }) => {
    setMealType((t.data.mealType as string) ?? 'Sabah');
    setFoods((t.data.foods as string) ?? '');
    setCalories(String(t.data.calories ?? ''));
    setProtein(String((t.data.macros as { protein: number })?.protein ?? ''));
    setCarbs(String((t.data.macros as { carbs: number })?.carbs ?? ''));
    setFat(String((t.data.macros as { fat: number })?.fat ?? ''));
  };

  const onSave = () => {
    const data = {
      mealType, foods: foods.trim(),
      calories: parseInt(calories) || 0,
      macros: { protein: parseFloat(protein) || 0, carbs: parseFloat(carbs) || 0, fat: parseFloat(fat) || 0 },
    };
    if (editId) {
      updateNutritionEntry(editId, { ...data, isPlanned: false, date: new Date(dateKey).toISOString() });
    } else {
      addNutritionEntry({ date: dateKey, isPlanned: mode === 'plan', ...data });
    }
    tmpl.saveTemplateIfNeeded({ ...data });

    const msg = 'Kayıt başarıyla kaydedildi';
    if (Platform.OS === 'web') {
      window.alert(msg);
    } else {
      Alert.alert('Başarılı', msg);
    }

    // Reset Form fields
    setFoods('');
    setCalories('');
    setProtein('');
    setCarbs('');
    setFat('');
    setMealType('Sabah');
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
                <ThemedText style={[styles.cardTitle, { color: textColor }]}>Öğün Tipi</ThemedText>
                <OptionRow options={MEAL_TYPES} selected={mealType} onSelect={setMealType} tint={C.accent} border={border} textColor={textColor} textSecondary={textSecondary} />

                <ThemedText style={[styles.label, { color: textSecondary }]}>Yenen Yemekler</ThemedText>
                <TextInput value={foods} onChangeText={setFoods} placeholder="Yulaf, muz, yoğurt..." placeholderTextColor={textSecondary} multiline style={[styles.multiInput, { color: textColor, borderColor: border }]} />
              </View>

              <View style={[styles.card, { backgroundColor: surface, borderColor: C.solid }]}>
                <ThemedText style={[styles.cardTitle, { color: textColor }]}>Besin Değerleri</ThemedText>
                <View style={styles.numRow}>
                  <View style={{ flex: 1 }}>
                    <ThemedText style={[styles.label, { color: textSecondary }]}>Kalori</ThemedText>
                    <NumInput value={calories} onChange={setCalories} placeholder="500" textColor={textColor} border={border} />
                  </View>
                </View>
                <ThemedText style={[styles.label, { color: textSecondary, marginTop: 12 }]}>Makrolar (gram)</ThemedText>
                <View style={styles.numRow}>
                  <View style={{ flex: 1 }}>
                    <ThemedText style={[styles.miniLabel, { color: textSecondary }]}>Protein</ThemedText>
                    <NumInput value={protein} onChange={setProtein} placeholder="30" textColor={textColor} border={border} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <ThemedText style={[styles.miniLabel, { color: textSecondary }]}>Karb.</ThemedText>
                    <NumInput value={carbs} onChange={setCarbs} placeholder="60" textColor={textColor} border={border} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <ThemedText style={[styles.miniLabel, { color: textSecondary }]}>Yağ</ThemedText>
                    <NumInput value={fat} onChange={setFat} placeholder="15" textColor={textColor} border={border} />
                  </View>
                </View>
              </View>

              <TemplateSaveRow saveAsTemplate={tmpl.saveAsTemplate} templateName={tmpl.templateName} onToggle={tmpl.setSaveAsTemplate} onNameChange={tmpl.setTemplateName} surface={surface} border={border} tint={C.accent} textColor={textColor} textSecondary={textSecondary} />
              <PrimaryButton title={editId ? 'Kaydet & Tamamla' : (mode === 'plan' ? 'Plan Kaydet' : 'Öğün Kaydet')} onPress={onSave} style={{ marginTop: 12 }} />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      <CalendarModal visible={showCalendar} onClose={() => setShowCalendar(false)} onSelect={(d) => setDateKey(d)} selectedDate={dateKey} mode={mode} surface={surface} tint={C.accent} textColor={textColor} textSecondary={textSecondary} border={border} />
      <TemplatePickerModal visible={tmpl.showTemplatePicker} onClose={() => tmpl.setShowTemplatePicker(false)} moduleKey="nutrition" onSelect={(t) => applyTemplate(t)} surface={surface} border={border} tint={C.accent} textColor={textColor} textSecondary={textSecondary} background={background} />
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
  miniLabel: { fontSize: 11, fontWeight: '600', marginBottom: 4 },
  multiInput: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15, minHeight: 80, textAlignVertical: 'top' },
  numRow: { flexDirection: 'row', gap: 10 },
});
