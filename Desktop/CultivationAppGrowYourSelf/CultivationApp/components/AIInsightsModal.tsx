import React, { useState } from 'react';
import {
  Modal,
  View,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  ScrollView,
  Platform,
  Alert,
} from 'react-native';
import { X, Sparkles } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { PrimaryButton } from '@/components/primary-button';
import { OptionRow, DateRow, CalendarModal } from '@/components/form-components';
import { useThemeColor } from '@/hooks/use-theme-color';
import { todayLocalDateKey } from '@/lib/date';
import { useHabitStore } from '@/store/useHabitStore';

type Category = 'Tümü' | 'Beslenme' | 'Spor' | 'Günlük' | 'Uyku' | 'Ders' | 'Bütçe' | 'Regl';
const CATEGORIES: Category[] = ['Tümü', 'Beslenme', 'Spor', 'Günlük', 'Uyku', 'Ders', 'Bütçe', 'Regl'];

interface AIInsightsModalProps {
  visible: boolean;
  onClose: () => void;
}

export function AIInsightsModal({ visible, onClose }: AIInsightsModalProps) {
  const surface = useThemeColor({}, 'surface');
  const border = useThemeColor({}, 'border');
  const textPrimary = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const tint = useThemeColor({}, 'tint');
  const bg = useThemeColor({}, 'background');

  const store = useHabitStore();

  const [category, setCategory] = useState<Category>('Tümü');
  const [startDate, setStartDate] = useState(todayLocalDateKey());
  const [endDate, setEndDate] = useState(todayLocalDateKey());
  const [showStartCalendar, setShowStartCalendar] = useState(false);
  const [showEndCalendar, setShowEndCalendar] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [resultText, setResultText] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleAnalyze = async () => {
    setIsLoading(true);
    setResultText(null);
    setErrorMsg(null);

    try {
      const apiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY;
      if (!apiKey) {
        throw new Error('API Anahtarı bulunamadı');
      }

      // 1. Veri Filtreleme ve Formatlama
      const sDate = new Date(startDate);
      sDate.setHours(0, 0, 0, 0);
      const eDate = new Date(endDate);
      eDate.setHours(23, 59, 59, 999);

      const isDateInRange = (dateStr: string) => {
        const d = new Date(dateStr);
        return d >= sDate && d <= eDate;
      };

      let rawDataStr = '';

      if (category === 'Tümü' || category === 'Beslenme') {
        const d = store.nutritionEntries.filter((e) => isDateInRange(e.date));
        if (d.length > 0) {
          rawDataStr += `\n[Beslenme]\n`;
          d.forEach((e) => {
            rawDataStr += `- ${e.date.split('T')[0]}: ${e.mealType}, Kalori: ${e.calories}, Not/Yemekler: ${e.foods}\n`;
          });
        }
      }

      if (category === 'Tümü' || category === 'Spor') {
        const d = store.sportsEntries.filter((e) => isDateInRange(e.date));
        if (d.length > 0) {
          rawDataStr += `\n[Spor]\n`;
          d.forEach((e) => {
            rawDataStr += `- ${e.date.split('T')[0]}: ${e.workoutType}, Süre: ${e.durationMinutes} dk, Kalori: ${e.caloriesBurned}, Notlar: ${e.notes}\n`;
          });
        }
      }

      if (category === 'Tümü' || category === 'Günlük') {
        const d = store.journalEntries.filter((e) => isDateInRange(e.date));
        if (d.length > 0) {
          rawDataStr += `\n[Günlük]\n`;
          d.forEach((e) => {
            rawDataStr += `- ${e.date.split('T')[0]}: Ruh Hali Puanı (1-10): ${e.moodScore}, Etiketler: ${e.tags.join(', ')}, Notlar: ${e.content.substring(0, 50)}...\n`;
          });
        }
      }

      if (category === 'Tümü' || category === 'Uyku') {
        const d = store.sleepEntries.filter((e) => isDateInRange(e.date));
        if (d.length > 0) {
          rawDataStr += `\n[Uyku]\n`;
          d.forEach((e) => {
            rawDataStr += `- ${e.date.split('T')[0]}: Süre: ${e.durationHours} saat, Kalite Puanı (1-10): ${e.qualityScore}\n`;
          });
        }
      }

      if (category === 'Tümü' || category === 'Ders') {
        const d = store.studyEntries.filter((e) => isDateInRange(e.date));
        if (d.length > 0) {
          rawDataStr += `\n[Ders]\n`;
          d.forEach((e) => {
            rawDataStr += `- ${e.date.split('T')[0]}: Ders: ${e.subject}, Konu: ${e.topic}, Süre: ${e.durationMinutes} dk, Doğru/Yanlış: ${e.correctCount}/${e.wrongCount}\n`;
          });
        }
      }

      if (category === 'Tümü' || category === 'Bütçe') {
        const d = store.budgetEntries.filter((e) => isDateInRange(e.date));
        if (d.length > 0) {
          rawDataStr += `\n[Bütçe]\n`;
          d.forEach((e) => {
            rawDataStr += `- ${e.date.split('T')[0]}: Tür: ${e.type === 'income' ? 'Gelir' : 'Gider'}, Kategori: ${e.category}, Miktar: ${e.amount}₺\n`;
          });
        }
      }

      if (category === 'Tümü' || category === 'Regl') {
        const d = store.periodEntries.filter((e) => isDateInRange(e.startDate || e.date));
        if (d.length > 0) {
          rawDataStr += `\n[Regl]\n`;
          d.forEach((e) => {
            rawDataStr += `- Başlangıç: ${e.startDate}, Bitiş: ${e.endDate}, Notlar: ${e.notes}\n`;
          });
        }
      }

      if (!rawDataStr || typeof rawDataStr !== 'string' || rawDataStr.trim().length === 0) {
        setIsLoading(false);
        setErrorMsg('Analiz edilecek veri bulunamadı.');
        if (Platform.OS === 'web') {
          window.alert('Analiz edilecek veri bulunamadı.');
        } else {
          Alert.alert('Uyarı', 'Analiz edilecek veri bulunamadı.');
        }
        return;
      }

      // 2. Prompt Hazırlama ve API Çağrısı
      const requestBody = {
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'Sen Cultivation uygulamasının profesyonel veri asistanısın. Kullanıcının sana vereceğim şu verilerini incele, aralarındaki bağlantıları bul, samimi ve motive edici bir dille 3-4 cümlelik kısa bir analiz/tavsiye yaz.',
          },
          {
            role: 'user',
            content: rawDataStr,
          },
        ],
      };

      console.log('OPENAI_PAYLOAD:', JSON.stringify(requestBody, null, 2));

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        let errorMessage = '';
        try {
          const errorData = await response.json();
          errorMessage = JSON.stringify(errorData);
        } catch (e) {
          errorMessage = await response.text();
        }
        console.error('OPENAI_ASIL_HATA:', errorMessage);
        throw new Error(`API Hatası (400): ${errorMessage}`);
      }

      const data = await response.json();
      console.log('OPENAI_BASARILI_YANIT:', JSON.stringify(data, null, 2));

      const text = data.choices?.[0]?.message?.content;
      if (!text) {
        throw new Error('Yapay zeka sunucularına ulaşılamıyor.');
      }

      setResultText(text);
    } catch (err: any) {
      console.error('OpenAI API Hata Detayı:', err);
      const errMsg = err?.message || 'Yapay zeka sunucularına ulaşılamıyor.';
      
      if (errMsg.includes('veri bulunamadı') || errMsg.includes('API Anahtarı bulunamadı') || errMsg.includes('API Hatası (400)')) {
        setErrorMsg(errMsg);
        if (Platform.OS === 'web') {
          window.alert(errMsg);
        } else {
          Alert.alert('Hata', errMsg);
        }
      } else {
        setErrorMsg('Yapay zeka sunucularına ulaşılamıyor.');
        if (Platform.OS === 'web') {
          window.alert('Yapay zeka sunucularına ulaşılamıyor.');
        } else {
          Alert.alert('Hata', 'Yapay zeka sunucularına ulaşılamıyor.');
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <SafeAreaView style={styles.modalOverlay} edges={['top', 'bottom']}>
        <View style={[styles.modalContent, { backgroundColor: bg, borderColor: border }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: border }]}>
            <View style={styles.headerLeft}>
              <Sparkles size={20} color={tint} />
              <ThemedText style={styles.title}>İçgörü Asistanı</ThemedText>
            </View>
            <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={10}>
              <X size={24} color={textSecondary} />
            </Pressable>
          </View>

          <ScrollView style={styles.scrollBody} contentContainerStyle={styles.scrollContent}>
            {/* Form */}
            <View style={[styles.card, { backgroundColor: surface, borderColor: border }]}>
              <ThemedText style={[styles.label, { color: textSecondary }]}>Kategori</ThemedText>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {CATEGORIES.map((cat) => (
                    <Pressable
                      key={cat}
                      onPress={() => setCategory(cat)}
                      style={[
                        styles.catBadge,
                        { borderColor: category === cat ? tint : border },
                        category === cat && { backgroundColor: `${tint}15` },
                      ]}
                    >
                      <ThemedText style={[styles.catText, { color: category === cat ? tint : textSecondary }]}>
                        {cat}
                      </ThemedText>
                    </Pressable>
                  ))}
                </View>
              </ScrollView>

              <DateRow
                label="Başlangıç Tarihi"
                dateKey={startDate}
                onPress={() => setShowStartCalendar(true)}
                surface={surface}
                border={border}
                tint={tint}
                textSecondary={textSecondary}
                textColor={textPrimary}
              />
              <View style={{ height: 10 }} />
              <DateRow
                label="Bitiş Tarihi"
                dateKey={endDate}
                onPress={() => setShowEndCalendar(true)}
                surface={surface}
                border={border}
                tint={tint}
                textSecondary={textSecondary}
                textColor={textPrimary}
              />
            </View>

            <PrimaryButton
              title="Verilerimi Yorumla"
              onPress={handleAnalyze}
              disabled={isLoading}
              style={{ marginVertical: 16 }}
            />

            {/* Loading / Error / Result */}
            {isLoading && (
              <View style={styles.loadingArea}>
                <ActivityIndicator size="large" color={tint} />
                <ThemedText style={[styles.loadingText, { color: textSecondary }]}>
                  Yapay zeka verilerinizi analiz ediyor...
                </ThemedText>
              </View>
            )}

            {errorMsg && !isLoading && (
              <View style={[styles.errorArea, { backgroundColor: '#fee2e2', borderColor: '#f87171' }]}>
                <ThemedText style={{ color: '#b91c1c' }}>{errorMsg}</ThemedText>
              </View>
            )}

            {resultText && !isLoading && (
              <View style={[styles.resultArea, { backgroundColor: surface, borderColor: tint }]}>
                <ThemedText style={[styles.resultText, { color: textPrimary }]}>{resultText}</ThemedText>
              </View>
            )}
          </ScrollView>
        </View>

        <CalendarModal
          visible={showStartCalendar}
          onClose={() => setShowStartCalendar(false)}
          onSelect={(d) => { setStartDate(d); if (d > endDate) setEndDate(d); }}
          selectedDate={startDate}
          mode="record"
          surface={surface}
          tint={tint}
          textColor={textPrimary}
          textSecondary={textSecondary}
          border={border}
        />
        
        <CalendarModal
          visible={showEndCalendar}
          onClose={() => setShowEndCalendar(false)}
          onSelect={(d) => { setEndDate(d); if (d < startDate) setStartDate(d); }}
          selectedDate={endDate}
          mode="record"
          surface={surface}
          tint={tint}
          textColor={textPrimary}
          textSecondary={textSecondary}
          border={border}
        />
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderBottomWidth: 0,
    height: '90%',
    overflow: 'hidden',
    ...Platform.select({
      web: { maxWidth: 600, width: '100%', alignSelf: 'center', height: '80%', borderRadius: 24, marginVertical: 'auto' }
    }),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  closeBtn: {
    padding: 4,
  },
  scrollBody: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  catBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  catText: {
    fontWeight: '600',
    fontSize: 14,
  },
  loadingArea: {
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  errorArea: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 8,
  },
  resultArea: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 8,
  },
  resultText: {
    fontSize: 16,
    lineHeight: 24,
  },
});
