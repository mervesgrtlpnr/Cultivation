/**
 * Ortak form bileşenleri — Kayıt/Plan toggle, Takvim modal, Şablon modal.
 * Tüm modül formları bu dosyadan import eder.
 */
import { useCallback, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import { ThemedText } from '@/components/themed-text';
import { todayLocalDateKey } from '@/lib/date';
import { Template, TemplateModuleKey, useHabitStore } from '@/store/useHabitStore';

// ─── Segmented Control (Kayıt / Plan modu) ───────────────────────────────

export type EntryMode = 'record' | 'plan';

type SegmentedControlProps = {
  mode: EntryMode;
  onChange: (mode: EntryMode) => void;
  accentColor: string;
  border: string;
  surface: string;
  textColor: string;
  textSecondary: string;
};

export function ModeSegmentedControl({
  mode,
  onChange,
  accentColor,
  border,
  surface,
  textColor,
  textSecondary,
}: SegmentedControlProps) {
  return (
    <View style={[styles.segContainer, { backgroundColor: surface, borderColor: border }]}>
      {(['record', 'plan'] as EntryMode[]).map((m) => {
        const active = mode === m;
        return (
          <Pressable
            key={m}
            onPress={() => onChange(m)}
            style={[
              styles.segButton,
              active && { backgroundColor: accentColor },
            ]}>
            <ThemedText
              style={[
                styles.segText,
                { color: active ? '#fff' : textSecondary },
                active && { fontWeight: '700' },
              ]}>
              {m === 'record' ? 'Kayıt Modu' : 'Plan Modu'}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}

// ─── Takvim Modal ─────────────────────────────────────────────────────────

type CalendarModalProps = {
  visible: boolean;
  onClose: () => void;
  onSelect: (dateKey: string) => void;
  selectedDate: string;
  mode: EntryMode;
  surface: string;
  tint: string;
  textColor: string;
  textSecondary: string;
  border: string;
  /** İkinci bir tarih seçilmesine izin ver (Regl bitiş tarihi için) */
  secondDate?: string;
  onSelectSecond?: (dateKey: string) => void;
};

export function CalendarModal({
  visible,
  onClose,
  onSelect,
  selectedDate,
  mode,
  surface,
  tint,
  textColor,
  textSecondary,
  border,
  secondDate,
  onSelectSecond,
}: CalendarModalProps) {
  const today = todayLocalDateKey();

  const minDate = mode === 'plan' ? today : undefined;
  const maxDate = mode === 'record' ? today : undefined;

  const marked: Record<string, { selected?: boolean; selectedColor?: string; marked?: boolean; dotColor?: string }> = {
    [selectedDate]: { selected: true, selectedColor: tint },
  };
  if (secondDate && secondDate !== selectedDate) {
    marked[secondDate] = { selected: true, selectedColor: `${tint}88` };
  }

  const handleDayPress = (day: { dateString: string }) => {
    if (onSelectSecond && secondDate !== undefined) {
      // İki tarih modunda: önce başlangıç, sonra bitiş
      if (!secondDate || day.dateString <= selectedDate) {
        onSelect(day.dateString);
      } else {
        onSelectSecond(day.dateString);
      }
    } else {
      onSelect(day.dateString);
      onClose();
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={[styles.calModalCard, { backgroundColor: surface, borderColor: border }]}>
          <ThemedText type="subtitle" style={styles.calModalTitle}>
            {mode === 'plan' ? 'Hedef Tarihi Seç' : 'Tarih Seç'}
          </ThemedText>
          {mode === 'plan' && (
            <ThemedText style={[styles.calModalHint, { color: textSecondary }]}>
              Bugün veya gelecek bir tarih seçin
            </ThemedText>
          )}
          {mode === 'record' && (
            <ThemedText style={[styles.calModalHint, { color: textSecondary }]}>
              Bugün veya geçmiş bir tarih seçin
            </ThemedText>
          )}
          <Calendar
            current={selectedDate}
            minDate={minDate}
            maxDate={maxDate}
            markedDates={marked}
            onDayPress={handleDayPress}
            theme={{
              backgroundColor: surface,
              calendarBackground: surface,
              textSectionTitleColor: textSecondary,
              selectedDayBackgroundColor: tint,
              selectedDayTextColor: '#fff',
              todayTextColor: tint,
              dayTextColor: textColor,
              textDisabledColor: `${textSecondary}55`,
              arrowColor: tint,
              monthTextColor: textColor,
              textDayFontWeight: '500',
              textMonthFontWeight: '700',
            }}
          />
          {onSelectSecond && (
            <Pressable
              onPress={onClose}
              style={[styles.calConfirmBtn, { backgroundColor: tint }]}>
              <ThemedText style={styles.calConfirmText}>Onayla</ThemedText>
            </Pressable>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ─── Tarih Seçici Satırı ──────────────────────────────────────────────────

type DateRowProps = {
  label: string;
  dateKey: string;
  onPress: () => void;
  surface: string;
  border: string;
  tint: string;
  textSecondary: string;
  textColor: string;
};

export function DateRow({
  label,
  dateKey,
  onPress,
  surface,
  border,
  tint,
  textSecondary,
  textColor,
}: DateRowProps) {
  return (
    <View style={[styles.dateRow, { backgroundColor: surface, borderColor: border }]}>
      <ThemedText style={[styles.dateLabel, { color: textSecondary }]}>{label}</ThemedText>
      <Pressable
        onPress={onPress}
        style={[styles.datePill, { borderColor: tint }]}>
        <ThemedText style={[styles.datePillText, { color: textColor }]}>{dateKey}</ThemedText>
      </Pressable>
    </View>
  );
}

// ─── Şablon Kaydetme Satırı ───────────────────────────────────────────────

type TemplateSaveRowProps = {
  saveAsTemplate: boolean;
  templateName: string;
  onToggle: (v: boolean) => void;
  onNameChange: (v: string) => void;
  surface: string;
  border: string;
  tint: string;
  textColor: string;
  textSecondary: string;
};

export function TemplateSaveRow({
  saveAsTemplate,
  templateName,
  onToggle,
  onNameChange,
  surface,
  border,
  tint,
  textColor,
  textSecondary,
}: TemplateSaveRowProps) {
  return (
    <View style={[styles.templateSaveCard, { backgroundColor: surface, borderColor: border }]}>
      <Pressable style={styles.templateToggleRow} onPress={() => onToggle(!saveAsTemplate)}>
        <View style={[styles.checkbox, { borderColor: tint, backgroundColor: saveAsTemplate ? tint : 'transparent' }]}>
          {saveAsTemplate && <ThemedText style={styles.checkmark}>✓</ThemedText>}
        </View>
        <ThemedText style={[styles.templateToggleLabel, { color: textColor }]}>
          Bunu şablon olarak kaydet
        </ThemedText>
      </Pressable>
      {saveAsTemplate && (
        <TextInput
          placeholder="Şablon adı (örn: Sabah Antrenmanı)"
          placeholderTextColor={textSecondary}
          value={templateName}
          onChangeText={onNameChange}
          style={[styles.templateNameInput, { color: textColor, borderColor: border }]}
        />
      )}
    </View>
  );
}

// ─── Şablon Seçim Modal ───────────────────────────────────────────────────

type TemplatePickerModalProps = {
  visible: boolean;
  onClose: () => void;
  moduleKey: TemplateModuleKey;
  onSelect: (template: Template) => void;
  surface: string;
  border: string;
  tint: string;
  textColor: string;
  textSecondary: string;
  background: string;
};

export function TemplatePickerModal({
  visible,
  onClose,
  moduleKey,
  onSelect,
  surface,
  border,
  tint,
  textColor,
  textSecondary,
  background,
}: TemplatePickerModalProps) {
  const templates = useHabitStore((s) => s.templates).filter((t) => t.moduleKey === moduleKey);
  const deleteTemplate = useHabitStore((s) => s.deleteTemplate);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={[styles.templateModal, { backgroundColor: surface, borderColor: border }]}>
          <ThemedText type="subtitle" style={styles.templateModalTitle}>
            Şablonlardan Seç
          </ThemedText>
          {templates.length === 0 ? (
            <ThemedText style={[styles.noTemplates, { color: textSecondary }]}>
              Henüz kaydedilmiş şablon yok.{'\n'}Formu doldurup "Şablon olarak kaydet" seçeneğini işaretleyerek kaydedebilirsiniz.
            </ThemedText>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 340 }}>
              {templates.map((t) => (
                <View key={t.id} style={[styles.templateItem, { borderColor: border, backgroundColor: background }]}>
                  <Pressable style={{ flex: 1 }} onPress={() => { onSelect(t); onClose(); }}>
                    <ThemedText style={[styles.templateItemName, { color: textColor }]}>
                      {t.name}
                    </ThemedText>
                    <ThemedText style={[styles.templateItemDate, { color: textSecondary }]}>
                      {new Date(t.createdAt).toLocaleDateString('tr-TR')}
                    </ThemedText>
                  </Pressable>
                  <Pressable onPress={() => deleteTemplate(t.id)} hitSlop={8}>
                    <ThemedText style={{ color: textSecondary, fontSize: 16 }}>✕</ThemedText>
                  </Pressable>
                </View>
              ))}
            </ScrollView>
          )}
          <Pressable
            onPress={onClose}
            style={[styles.closeBtn, { borderColor: tint }]}>
            <ThemedText style={{ color: tint, fontWeight: '700' }}>Kapat</ThemedText>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ─── Sayı Input Yardımcısı ────────────────────────────────────────────────

type NumInputProps = {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  textColor: string;
  border: string;
};

export function NumInput({ value, onChange, placeholder, textColor, border }: NumInputProps) {
  return (
    <TextInput
      value={value}
      onChangeText={onChange}
      placeholder={placeholder}
      placeholderTextColor={`${textColor}66`}
      keyboardType="numeric"
      style={[styles.numInput, { color: textColor, borderColor: border }]}
    />
  );
}

// ─── Seçenek Satırı (Öğün / Kategori vb.) ────────────────────────────────

type OptionRowProps = {
  options: string[];
  selected: string;
  onSelect: (v: string) => void;
  tint: string;
  border: string;
  textColor: string;
  textSecondary: string;
};

export function OptionRow({ options, selected, onSelect, tint, border, textColor, textSecondary }: OptionRowProps) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.optionScroll}>
      <View style={styles.optionRow}>
        {options.map((o) => {
          const active = selected === o;
          return (
            <Pressable
              key={o}
              onPress={() => onSelect(o)}
              style={[
                styles.optionChip,
                { borderColor: active ? tint : border, backgroundColor: active ? `${tint}22` : 'transparent' },
              ]}>
              <ThemedText style={{ color: active ? textColor : textSecondary, fontWeight: active ? '700' : '400', fontSize: 13 }}>
                {o}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );
}

// ─── Stil ────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // Segmented Control
  segContainer: {
    flexDirection: 'row',
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 16,
  },
  segButton: {
    flex: 1,
    paddingVertical: 11,
    alignItems: 'center',
  },
  segText: { fontSize: 13 },

  // Calendar Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  calModalCard: {
    width: '100%',
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    maxWidth: 400,
  },
  calModalTitle: { marginBottom: 4, textAlign: 'center' },
  calModalHint: { fontSize: 12, textAlign: 'center', marginBottom: 8 },
  calConfirmBtn: {
    marginTop: 12,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  calConfirmText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  // Date Row
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 12,
  },
  dateLabel: { fontSize: 14 },
  datePill: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  datePillText: { fontSize: 14, fontWeight: '600' },

  // Template Save
  templateSaveCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginTop: 8,
  },
  templateToggleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: { color: '#fff', fontSize: 13, fontWeight: '700' },
  templateToggleLabel: { fontSize: 15 },
  templateNameInput: {
    marginTop: 12,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },

  // Template Picker Modal
  templateModal: {
    width: '100%',
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    maxWidth: 420,
  },
  templateModalTitle: { marginBottom: 12, textAlign: 'center' },
  noTemplates: { textAlign: 'center', lineHeight: 22, marginVertical: 16 },
  templateItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 8,
  },
  templateItemName: { fontSize: 15, fontWeight: '600' },
  templateItemDate: { fontSize: 12, marginTop: 2 },
  closeBtn: {
    marginTop: 14,
    borderWidth: 1.5,
    borderRadius: 12,
    paddingVertical: 11,
    alignItems: 'center',
  },

  // Num Input
  numInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    flex: 1,
  },

  // Option Row
  optionScroll: { marginBottom: 4 },
  optionRow: { flexDirection: 'row', gap: 8, paddingVertical: 4 },
  optionChip: {
    borderWidth: 1.5,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
});

// ─── useTemplateState hook ────────────────────────────────────────────────

export function useTemplateState(moduleKey: TemplateModuleKey) {
  const addTemplate = useHabitStore((s) => s.addTemplate);
  const [saveAsTemplate, setSaveAsTemplate] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);

  const saveTemplateIfNeeded = useCallback(
    (data: Record<string, unknown>) => {
      if (saveAsTemplate && templateName.trim()) {
        addTemplate({ moduleKey, name: templateName.trim(), data });
        setSaveAsTemplate(false);
        setTemplateName('');
      }
    },
    [saveAsTemplate, templateName, addTemplate, moduleKey],
  );

  return {
    saveAsTemplate,
    setSaveAsTemplate,
    templateName,
    setTemplateName,
    showTemplatePicker,
    setShowTemplatePicker,
    saveTemplateIfNeeded,
  };
}
