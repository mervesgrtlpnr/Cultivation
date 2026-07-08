/**
 * Bütçe Takibi Formu — Gelir/Gider, liste görünümü
 */
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
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
import { toLocalDateKey, todayLocalDateKey } from '@/lib/date';
import { useHabitStore } from '@/store/useHabitStore';

const C = ModuleColors.budget;

const INCOME_CATS = ['Maaş', 'Freelance', 'Yatırım', 'Burs', 'Diğer'];
const EXPENSE_CATS = ['Market', 'Ulaşım', 'Fatura', 'Giyim', 'Eğlence', 'Sağlık', 'Eğitim', 'Diğer'];

export default function BudgetFormScreen() {
  const surface = useThemeColor({}, 'surface');
  const border = useThemeColor({}, 'border');
  const textColor = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const background = useThemeColor({}, 'background');

  const budgetEntries = useHabitStore((s) => s.budgetEntries);
  const { editId } = useLocalSearchParams<{ editId?: string }>();
  const existingEntry = useHabitStore((s) => s.budgetEntries.find((e) => e.id === editId));
  const addBudgetEntry = useHabitStore((s) => s.addBudgetEntry);
  const updateBudgetEntry = useHabitStore((s) => s.updateBudgetEntry);
  const deleteBudgetEntry = useHabitStore((s) => s.deleteBudgetEntry);

  const [mode, setMode] = useState<EntryMode>('record');
  const [dateKey, setDateKey] = useState(todayLocalDateKey());
  const [showCalendar, setShowCalendar] = useState(false);
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');

  useEffect(() => {
    if (existingEntry) {
      setMode('record');
      setDateKey(existingEntry.date.split('T')[0] || todayLocalDateKey());
      setType(existingEntry.type);
      setAmount(String(existingEntry.amount || ''));
      setCategory(existingEntry.category || '');
    }
  }, [existingEntry]);

  const tmpl = useTemplateState('budget');

  const applyTemplate = (t: { data: Record<string, unknown> }) => {
    setType((t.data.type as 'income' | 'expense') ?? 'expense');
    setCategory((t.data.category as string) ?? 'Market');
    setAmount(String(t.data.amount ?? ''));
  };

  const onSave = () => {
    if (!amount || !category.trim()) {
      Alert.alert('Hata', 'Lütfen tutar ve kategori girin.');
      return;
    }
    const data = {
      type, amount: parseFloat(amount) || 0,
      category: category.trim()
    };
    if (editId) {
      updateBudgetEntry(editId, { ...data, isPlanned: false, date: new Date(dateKey).toISOString() });
    } else {
      addBudgetEntry({ date: dateKey, isPlanned: mode === 'plan', ...data });
    }
    tmpl.saveTemplateIfNeeded(data);
    const msg = 'Kayıt başarıyla kaydedildi';
    if (Platform.OS === 'web') {
      window.alert(msg);
    } else {
      Alert.alert('Başarılı', msg);
    }

    // Reset Form fields
    setAmount('');
    setCategory(type === 'income' ? 'Maaş' : 'Market');
    setDateKey(todayLocalDateKey());
    tmpl.setSaveAsTemplate(false);
    tmpl.setTemplateName('');
  };

  // Bugünün kayıtları
  const todayEntries = budgetEntries
    .filter((e) => toLocalDateKey(new Date(e.date)) === dateKey)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const totalIncome = todayEntries.filter((e) => e.type === 'income').reduce((s, e) => s + e.amount, 0);
  const totalExpense = todayEntries.filter((e) => e.type === 'expense').reduce((s, e) => s + e.amount, 0);

  const cats = type === 'income' ? INCOME_CATS : EXPENSE_CATS;

  return (
    <ThemedView style={styles.root}>
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <View style={styles.body}>
              <ModeSegmentedControl mode={mode} onChange={setMode} accentColor={C.accent} border={border} surface={surface} textColor={textColor} textSecondary={textSecondary} />
              <PrimaryButton title="Şablonlardan Seç" onPress={() => tmpl.setShowTemplatePicker(true)} style={[styles.templateBtn, { backgroundColor: `${C.solid}44`, borderColor: C.accent }]} textColor="#000000" />
              <DateRow label="Tarih" dateKey={dateKey} onPress={() => setShowCalendar(true)} surface={surface} border={border} tint={C.accent} textSecondary={textSecondary} textColor={textColor} />

              {/* Gelir/Gider toggle */}
              <View style={[styles.typeToggle, { backgroundColor: surface, borderColor: border }]}>
                {(['income', 'expense'] as const).map((t) => (
                  <Pressable key={t} onPress={() => { setType(t); setCategory(t === 'income' ? 'Maaş' : 'Market'); }}
                    style={[styles.typeBtn, type === t && { backgroundColor: t === 'income' ? '#4ade80' : '#f87171' }]}>
                    <ThemedText style={[styles.typeText, { color: type === t ? '#fff' : textSecondary }]}>
                      {t === 'income' ? 'Gelir' : 'Gider'}
                    </ThemedText>
                  </Pressable>
                ))}
              </View>

              <View style={[styles.card, { backgroundColor: surface, borderColor: C.solid }]}>
                <ThemedText style={[styles.cardTitle, { color: textColor }]}>Kategori</ThemedText>
                <OptionRow options={cats} selected={category} onSelect={setCategory} tint={C.accent} border={border} textColor={textColor} textSecondary={textSecondary} />

                <ThemedText style={[styles.label, { color: textSecondary }]}>Tutar (₺)</ThemedText>
                <NumInput value={amount} onChange={setAmount} placeholder="0.00" textColor={textColor} border={border} />
              </View>

              <TemplateSaveRow saveAsTemplate={tmpl.saveAsTemplate} templateName={tmpl.templateName} onToggle={tmpl.setSaveAsTemplate} onNameChange={tmpl.setTemplateName} surface={surface} border={border} tint={C.accent} textColor={textColor} textSecondary={textSecondary} />
              <PrimaryButton title={editId ? 'Kaydet & Tamamla' : 'Ekle'} onPress={onSave} style={{ marginTop: 12 }} />

              {/* Günün özeti */}
              {todayEntries.length > 0 && (
                <View style={[styles.summaryCard, { backgroundColor: surface, borderColor: border }]}>
                  <View style={styles.summaryHeader}>
                    <ThemedText style={{ fontWeight: '700', fontSize: 15, color: textColor }}>{dateKey} Özeti</ThemedText>
                    <ThemedText style={{ color: '#4ade80', fontWeight: '700' }}>+{totalIncome.toFixed(2)} ₺</ThemedText>
                    <ThemedText style={{ color: '#f87171', fontWeight: '700' }}>-{totalExpense.toFixed(2)} ₺</ThemedText>
                  </View>
                  {todayEntries.map((e) => (
                    <View key={e.id} style={[styles.entryRow, { borderBottomColor: border }]}>
                      <ThemedText style={{ fontSize: 14, color: e.type === 'income' ? '#4ade80' : '#f87171' }}>
                        {e.type === 'income' ? '+' : '-'}{e.amount} ₺
                      </ThemedText>
                      <ThemedText style={{ flex: 1, color: textSecondary, marginLeft: 8, fontSize: 13 }}>
                        {e.category}{e.isPlanned ? ' (Planlanan)' : ''}
                      </ThemedText>
                      <Pressable onPress={() => deleteBudgetEntry(e.id)} hitSlop={8}>
                        <ThemedText style={{ color: textSecondary }}>✕</ThemedText>
                      </Pressable>
                    </View>
                  ))}
                  <ThemedText style={[styles.netText, { color: totalIncome - totalExpense >= 0 ? '#4ade80' : '#f87171' }]}>
                    Net: {(totalIncome - totalExpense).toFixed(2)} ₺
                  </ThemedText>
                </View>
              )}

              <Pressable onPress={() => router.back()} style={[styles.doneBtn, { borderColor: C.accent }]}>
                <ThemedText style={{ color: C.accent, fontWeight: '700' }}>Tamamlandı</ThemedText>
              </Pressable>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      <CalendarModal visible={showCalendar} onClose={() => setShowCalendar(false)} onSelect={(d) => setDateKey(d)} selectedDate={dateKey} mode={mode} surface={surface} tint={C.accent} textColor={textColor} textSecondary={textSecondary} border={border} />
      <TemplatePickerModal visible={tmpl.showTemplatePicker} onClose={() => tmpl.setShowTemplatePicker(false)} moduleKey="budget" onSelect={(t) => applyTemplate(t)} surface={surface} border={border} tint={C.accent} textColor={textColor} textSecondary={textSecondary} background={background} />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 }, safe: { flex: 1 }, scroll: { paddingBottom: 40 },
  body: { paddingHorizontal: 20, paddingTop: 20 },
  templateBtn: { marginBottom: 12, borderWidth: 1.5 },
  typeToggle: { flexDirection: 'row', borderRadius: 14, borderWidth: 1, overflow: 'hidden', marginBottom: 14 },
  typeBtn: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  typeText: { fontWeight: '700', fontSize: 14 },
  card: { borderRadius: 16, borderWidth: 1.5, padding: 16, marginBottom: 14 },
  cardTitle: { fontSize: 15, fontWeight: '700', marginBottom: 10 },
  label: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', marginBottom: 6, marginTop: 10 },
  summaryCard: { borderRadius: 16, borderWidth: 1, padding: 16, marginTop: 8 },
  summaryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  entryRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth },
  netText: { fontWeight: '800', fontSize: 15, marginTop: 10, textAlign: 'right' },
  doneBtn: { marginTop: 16, borderWidth: 1.5, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
});
