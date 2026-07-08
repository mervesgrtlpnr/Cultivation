import { useCallback, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
  Alert,
  InteractionManager,
  Text,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { ScreenWrapper } from '@/components/ScreenWrapper';

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

function parseTagsInput(raw: string): string[] {
  return raw
    .split(/[,#]/g)
    .map((s) => s.trim())
    .filter(Boolean);
}

export default function JournalScreen() {
  const surface = useThemeColor({}, 'surface');
  const border = useThemeColor({}, 'border');
  const tint = useThemeColor({}, 'tint');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const textColor = useThemeColor({}, 'text');

  const journalEntries = useHabitStore((s) => s.journalEntries);
  const addJournalEntry = useHabitStore((s) => s.addJournalEntry);

  const [moodScore, setMoodScore] = useState<number>(3);
  const [content, setContent] = useState('');
  const [tagsRaw, setTagsRaw] = useState('');
  const todayKey = todayLocalDateKey();
  
  const [isReady, setIsReady] = useState(false);

  useFocusEffect(
    useCallback(() => {
      const task = InteractionManager.runAfterInteractions(() => {
        setIsReady(true);
      });
      return () => {
        task.cancel();
      };
    }, [])
  );

  // justSaved: save sonrası useFocusEffect'in alanları yeniden doldurmasını önler
  const justSaved = useRef(false);

  // Bugüne ait tüm kayıtlar (yükleme için değil, sayı göstermek için)
  const todayEntries = journalEntries.filter(
    (e) => toLocalDateKey(new Date(e.date)) === todayKey,
  );

  useFocusEffect(
    useCallback(() => {
      // Birden fazla kayıt desteklendiğinden, ekrana gelince alanları doldurma —
      // sadece justSaved bayrağını sıfırla
      if (justSaved.current) {
        justSaved.current = false;
      }
    }, []),
  );


  const onSave = () => {
    if (!content.trim()) return;
    const tags = parseTagsInput(tagsRaw);
    const entryData = { content, moodScore, tags, reminders: [] };

    console.log('[Journal] Yeni kayıt ekleniyor:', JSON.stringify(entryData));
    // Her zaman YENİ bir kayıt ekle (aynı güne birden fazla kayıt desteği)
    addJournalEntry(entryData);
    console.log('[Journal] Kayıt başarılı.');

    // Tüm alanları hemen temizle
    setContent('');
    setTagsRaw('');
    setMoodScore(3);
    // Flag: bir sonraki focus olayında yeniden yükleme yapma
    justSaved.current = true;

    const msg = 'Kayıt başarıyla kaydedildi';
    if (Platform.OS === 'web') {
      window.alert(msg);
    } else {
      Alert.alert('Başarılı', msg);
    }
  };

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
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
            <View style={styles.header}>
              <ThemedText type="title">Günlük</ThemedText>
              <ThemedText style={[styles.lead, { color: textSecondary }]}>
                Duygu durumunuzu seçin, günü yazın ve etiketleyin.
                {todayEntries.length > 0
                  ? ` Bugün ${todayEntries.length} kayıt var. Yeni bir kayıt ekleyebilirsiniz.`
                  : ' Bugün henüz kayıt yok.'}
              </ThemedText>
            </View>

            <View style={[styles.card, { backgroundColor: surface, borderColor: border }]}>
              <ThemedText type="subtitle">Bugün nasılsınız?</ThemedText>
              <ThemedText style={[styles.moodHint, { color: textSecondary }]}>
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
              <ThemedText type="subtitle">Günün notu</ThemedText>
              <TextInput
                placeholder="Bugün neler oldu? Neler hissettiniz?"
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


            <View style={[styles.card, { backgroundColor: surface, borderColor: border }]}>
              <ThemedText type="subtitle">Etiketler</ThemedText>
              <ThemedText style={[styles.tagHint, { color: textSecondary }]}>
                Virgül veya boşlukla ayırın (ör. bahçe, odak, dinlenme)
              </ThemedText>
              <TextInput
                placeholder="bahçe, ilerleme, şükür"
                placeholderTextColor={textSecondary}
                value={tagsRaw}
                onChangeText={setTagsRaw}
                style={[styles.input, { color: textColor, borderColor: border }]}
              />
            </View>

            <PrimaryButton
              title="Günlüğü kaydet"
              onPress={onSave}
              disabled={!content.trim()}
            />

        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },
  flex: { flex: 1 },
  scroll: { paddingHorizontal: 20, paddingBottom: 100 },
  header: { marginBottom: 16, marginTop: 8 },
  lead: { fontSize: 15, lineHeight: 21, marginTop: 8 },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 14,
  },
  moodHint: { fontSize: 13, marginTop: 6, marginBottom: 12 },
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
  bodyInput: {
    marginTop: 12,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    minHeight: 160,
    fontSize: 16,
    lineHeight: 22,
  },
  tagHint: { fontSize: 13, marginTop: 6, marginBottom: 10 },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  empty: { marginTop: 8, fontSize: 15 },
});
