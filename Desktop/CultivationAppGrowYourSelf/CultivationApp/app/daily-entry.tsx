import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';

import { PrimaryButton } from '@/components/primary-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { toLocalDateKey, todayLocalDateKey } from '@/lib/date';
import { useHabitStore } from '@/store/useHabitStore';
import { useThemeColor } from '@/hooks/use-theme-color';

const MOODS = [
  { score: 1 as const, label: 'Çok düşük', emoji: '😫' },
  { score: 2 as const, label: 'Düşük', emoji: '😕' },
  { score: 3 as const, label: 'Orta', emoji: '😐' },
  { score: 4 as const, label: 'İyi', emoji: '🙂' },
  { score: 5 as const, label: 'Harika', emoji: '🌟' },
];

function parseDateParam(raw: unknown): string {
  if (typeof raw !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return todayLocalDateKey();
  }
  return raw;
}

export default function DailyEntryScreen() {
  const { date: dateParam } = useLocalSearchParams<{ date?: string }>();
  const dateKey = useMemo(() => parseDateParam(dateParam), [dateParam]);

  const surface = useThemeColor({}, 'surface');
  const border = useThemeColor({}, 'border');
  const tint = useThemeColor({}, 'tint');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const textColor = useThemeColor({}, 'text');

  const journalEntries = useHabitStore((s) => s.journalEntries);
  const upsertJournalForLocalDate = useHabitStore((s) => s.upsertJournalForLocalDate);

  const [moodScore, setMoodScore] = useState<number>(3);
  const [content, setContent] = useState('');

  const loadFromStore = useCallback(() => {
    const existing = journalEntries.find((e) => toLocalDateKey(new Date(e.date)) === dateKey);
    if (existing) {
      setMoodScore(existing.moodScore);
      setContent(existing.content);
    } else {
      setMoodScore(3);
      setContent('');
    }
  }, [journalEntries, dateKey]);

  useEffect(() => {
    loadFromStore();
  }, [loadFromStore]);

  const formattedTitle = useMemo(() => {
    const [y, m, d] = dateKey.split('-').map(Number);
    if (!y || !m || !d) return dateKey;
    const dt = new Date(y, m - 1, d);
    return dt.toLocaleDateString('tr-TR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }, [dateKey]);



  const onSave = () => {
    console.log('[DailyEntry] Kaydediliyor:', dateKey);
    upsertJournalForLocalDate(dateKey, {
      content,
      moodScore,
      reminders: [],
    });
    console.log('[DailyEntry] Kayıt başarılı.');
    setContent('');
    setMoodScore(3);
    Alert.alert('Başarılı', 'Günlüğünüz kaydedildi!', [
      { text: 'Tamam', onPress: () => router.back() }
    ]);
  };

  return (
    <ThemedView style={styles.root}>
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}>
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            <ThemedText style={[styles.dateBanner, { color: textSecondary }]}>{formattedTitle}</ThemedText>

            <View style={[styles.card, { backgroundColor: surface, borderColor: border }]}>
              <ThemedText type="subtitle">Duygu durumu</ThemedText>
              <ThemedText style={[styles.hint, { color: textSecondary }]}>
                1 (en zor) — 5 (en iyi)
              </ThemedText>
              <View style={styles.moodRow}>
                {MOODS.map((m) => {
                  const selected = moodScore === m.score;
                  return (
                    <Pressable
                      key={m.score}
                      onPress={() => setMoodScore(m.score)}
                      style={[
                        styles.moodChip,
                        {
                          borderColor: selected ? tint : border,
                          backgroundColor: selected ? `${tint}22` : 'transparent',
                        },
                      ]}>
                      <ThemedText style={styles.moodEmoji}>{m.emoji}</ThemedText>
                      <ThemedText
                        style={[
                          styles.moodLabel,
                          { color: selected ? textColor : textSecondary },
                        ]}>
                        {m.score}
                      </ThemedText>
                    </Pressable>
                  );
                })}
              </View>
            </View>


            <View style={[styles.card, { backgroundColor: surface, borderColor: border }]}>
              <ThemedText type="subtitle">Günlük notu</ThemedText>
              <ThemedText style={[styles.hint, { color: textSecondary }]}>
                Günü serbest metinle değerlendirin.
              </ThemedText>
              <TextInput
                placeholder="Bugün nasıl geçti? Neler öğrendiniz?"
                placeholderTextColor={textSecondary}
                value={content}
                onChangeText={setContent}
                multiline
                textAlignVertical="top"
                style={[
                  styles.bodyInput,
                  { color: textColor, borderColor: border },
                ]}
              />
            </View>

            <PrimaryButton title="Kaydet" onPress={onSave} />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },
  flex: { flex: 1 },
  scroll: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 32 },
  dateBanner: { fontSize: 15, marginBottom: 16 },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    marginBottom: 14,
  },
  hint: { fontSize: 13, marginTop: 6, marginBottom: 12 },
  moodRow: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    gap: 8,
  },
  moodChip: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: 14,
    paddingVertical: 10,
    alignItems: 'center',
    minWidth: 0,
  },
  moodEmoji: { fontSize: 26 },
  moodLabel: { fontSize: 12, fontWeight: '700', marginTop: 4 },
  reminderComposer: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    marginBottom: 12,
  },
  reminderInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  addChip: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 11,
  },
  addChipText: { fontSize: 15, fontWeight: '700' },
  emptyRem: { fontSize: 14, fontStyle: 'italic' },
  reminderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  bullet: { fontSize: 18, width: 16 },
  reminderText: { flex: 1, fontSize: 15 },
  bodyInput: {
    marginTop: 4,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    minHeight: 180,
    fontSize: 16,
    lineHeight: 22,
  },
});
