/**
 * Ders Takibi Formu
 * Kayıt/Plan modu, tarih kısıtlaması, şablon sistemi.
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
  CalendarModal,
  DateRow,
  EntryMode,
  ModeSegmentedControl,
  NumInput,
  TemplateSaveRow,
  TemplatePickerModal,
  useTemplateState,
} from '@/components/form-components';
import { ModuleColors } from '@/constants/colors';
import { useThemeColor } from '@/hooks/use-theme-color';
import { todayLocalDateKey } from '@/lib/date';
import { useHabitStore } from '@/store/useHabitStore';

const C = ModuleColors.study;

export default function StudyFormScreen() {
  const surface      = useThemeColor({}, 'surface');
  const border       = useThemeColor({}, 'border');
  const tint         = useThemeColor({}, 'tint');
  const textColor    = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const background   = useThemeColor({}, 'background');

  const { editId } = useLocalSearchParams<{ editId?: string }>();
  const existingEntry = useHabitStore((s) => s.studyEntries.find((e) => e.id === editId));
  const addStudyEntry = useHabitStore((s) => s.addStudyEntry);
  const updateStudyEntry = useHabitStore((s) => s.updateStudyEntry);

  const [mode, setMode] = useState<EntryMode>('record');
  const [dateKey, setDateKey] = useState(todayLocalDateKey());
  const [showCalendar, setShowCalendar] = useState(false);

  const [subject, setSubject] = useState('');
  const [topic, setTopic] = useState('');
  const [duration, setDuration] = useState('');
  const [qCount, setQCount] = useState('');
  const [correct, setCorrect] = useState('');
  const [wrong, setWrong] = useState('');

  useEffect(() => {
    if (existingEntry) {
      setMode('record');
      setDateKey(existingEntry.date.split('T')[0] || todayLocalDateKey());
      setSubject(existingEntry.subject);
      setTopic(existingEntry.topic);
      setDuration(String(existingEntry.durationMinutes || ''));
      setQCount(String(existingEntry.questionCount || ''));
      setCorrect(String(existingEntry.correctCount || ''));
      setWrong(String(existingEntry.wrongCount || ''));
    }
  }, [existingEntry]);

  const tmpl = useTemplateState('study');

  const applyTemplate = (t: { data: Record<string, unknown> }) => {
    setSubject((t.data.subject as string) ?? '');
    setTopic((t.data.topic as string) ?? '');
    setDuration(String(t.data.durationMinutes ?? ''));
    // Dinamik metrikler Şablona dahil değil — boş bırak
    setQCount('');
    setCorrect('');
    setWrong('');
  };

  const onSave = () => {
    if (!subject.trim() || !topic.trim()) {
      Alert.alert('Eksik Alan', 'Ders adı ve konu zorunludur.');
      return;
    }
    const qN = parseInt(qCount) || 0;
    const cN = parseInt(correct) || 0;
    const wN = parseInt(wrong) || 0;
    const data = {
      subject: subject.trim(), topic: topic.trim(),
      durationMinutes: parseInt(duration) || 0,
      questionCount: qN, correctCount: cN, wrongCount: wN,
    };
    if (editId) {
      updateStudyEntry(editId, { ...data, accuracyRate: qN > 0 ? Math.round((cN / qN) * 100) : 0, isPlanned: false, date: new Date(dateKey).toISOString() });
    } else {
      addStudyEntry({
        date: dateKey,
        accuracyRate: qN > 0 ? Math.round((cN / qN) * 100) : 0,
        isPlanned: mode === 'plan',
        ...data,
      });
    }
    // Sadece ders adı, konu ve süre Şablona kaydedilir; soru metrikleri dahil değil
    tmpl.saveTemplateIfNeeded({
      subject: data.subject,
      topic: data.topic,
      durationMinutes: data.durationMinutes,
    });

    const msg = 'Kayıt başarıyla kaydedildi';
    if (Platform.OS === 'web') {
      window.alert(msg);
    } else {
      Alert.alert('Başarılı', msg);
    }

    // Reset Form fields
    setSubject('');
    setTopic('');
    setDuration('');
    setQCount('');
    setCorrect('');
    setWrong('');
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
              {/* Mod seçici */}
              <ModeSegmentedControl mode={mode} onChange={setMode} accentColor={C.accent} border={border} surface={surface} textColor={textColor} textSecondary={textSecondary} />

              {/* Şablon seç */}
              <PrimaryButton
                title="Şablonlardan Seç"
                onPress={() => tmpl.setShowTemplatePicker(true)}
                style={[styles.templateBtn, { backgroundColor: `${C.solid}44`, borderColor: C.accent }]}
                textColor="#000000"
              />

              {/* Tarih */}
              <DateRow label="Tarih" dateKey={dateKey} onPress={() => setShowCalendar(true)} surface={surface} border={border} tint={C.accent} textSecondary={textSecondary} textColor={textColor} />

              {/* Formlar */}
              <View style={[styles.card, { backgroundColor: surface, borderColor: C.solid }]}>
                <ThemedText style={[styles.label, { color: textSecondary }]}>Ders Adı *</ThemedText>
                <TextInput value={subject} onChangeText={setSubject} placeholder="Matematik, Fizik..." placeholderTextColor={textSecondary} style={[styles.input, { color: textColor, borderColor: border }]} />

                <ThemedText style={[styles.label, { color: textSecondary }]}>Konu *</ThemedText>
                <TextInput value={topic} onChangeText={setTopic} placeholder="Türev, Dinamik..." placeholderTextColor={textSecondary} style={[styles.input, { color: textColor, borderColor: border }]} />

                <ThemedText style={[styles.label, { color: textSecondary }]}>Çalışma Süresi (dk)</ThemedText>
                <NumInput value={duration} onChange={setDuration} placeholder="45" textColor={textColor} border={border} />
              </View>

              <View style={[styles.card, { backgroundColor: surface, borderColor: C.solid }]}>
                <ThemedText style={styles.cardTitle}>Soru Bilgileri</ThemedText>
                <View style={styles.numRow}>
                  <View style={{ flex: 1 }}>
                    <ThemedText style={[styles.label, { color: textSecondary }]}>Toplam Soru</ThemedText>
                    <NumInput value={qCount} onChange={setQCount} placeholder="40" textColor={textColor} border={border} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <ThemedText style={[styles.label, { color: textSecondary }]}>Doğru</ThemedText>
                    <NumInput value={correct} onChange={setCorrect} placeholder="30" textColor={textColor} border={border} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <ThemedText style={[styles.label, { color: textSecondary }]}>Yanlış</ThemedText>
                    <NumInput value={wrong} onChange={setWrong} placeholder="10" textColor={textColor} border={border} />
                  </View>
                </View>
                {(parseInt(qCount) > 0) && (
                  <ThemedText style={[styles.accuracyBadge, { color: C.accent }]}>
                    Doğruluk: %{Math.round((parseInt(correct) || 0) / parseInt(qCount) * 100)}
                  </ThemedText>
                )}
              </View>

              {/* Şablon kaydet */}
              <TemplateSaveRow saveAsTemplate={tmpl.saveAsTemplate} templateName={tmpl.templateName} onToggle={tmpl.setSaveAsTemplate} onNameChange={tmpl.setTemplateName} surface={surface} border={border} tint={C.accent} textColor={textColor} textSecondary={textSecondary} />

              <PrimaryButton title={editId ? 'Kaydet & Tamamla' : (mode === 'plan' ? 'Hedef Kaydet' : 'Kaydet')} onPress={onSave} style={{ marginTop: 12 }} />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      <CalendarModal visible={showCalendar} onClose={() => setShowCalendar(false)} onSelect={(d) => setDateKey(d)} selectedDate={dateKey} mode={mode} surface={surface} tint={C.accent} textColor={textColor} textSecondary={textSecondary} border={border} />
      <TemplatePickerModal visible={tmpl.showTemplatePicker} onClose={() => tmpl.setShowTemplatePicker(false)} moduleKey="study" onSelect={(t) => applyTemplate(t)} surface={surface} border={border} tint={C.accent} textColor={textColor} textSecondary={textSecondary} background={background} />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },
  scroll: { paddingBottom: 40 },
  body: { paddingHorizontal: 20, paddingTop: 20, gap: 0 },
  templateBtn: { marginBottom: 12, borderWidth: 1.5 },
  card: { borderRadius: 16, borderWidth: 1.5, padding: 16, marginBottom: 14 },
  cardTitle: { fontSize: 15, fontWeight: '700', marginBottom: 10 },
  label: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', marginBottom: 6, marginTop: 10 },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15 },
  numRow: { flexDirection: 'row', gap: 10 },
  accuracyBadge: { marginTop: 10, fontWeight: '700', fontSize: 15 },
});
