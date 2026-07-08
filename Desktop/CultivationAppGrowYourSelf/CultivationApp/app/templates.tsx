import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableWithoutFeedback,
  Keyboard,
  View,
  Text,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  BookOpen,
  Dumbbell,
  Salad,
  Wallet,
  Moon,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronRight,
  FileText,
} from 'lucide-react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useHabitStore, Template, TemplateModuleKey } from '@/store/useHabitStore';

// ── Modül meta ──────────────────────────────────────────────────────────────
const MODULE_META: Record<TemplateModuleKey, { label: string; icon: React.ReactNode; color: string }> = {
  study:     { label: 'Ders',     icon: null, color: '#6366f1' },
  sport:     { label: 'Spor',     icon: null, color: '#f59e0b' },
  nutrition: { label: 'Beslenme', icon: null, color: '#10b981' },
  budget:    { label: 'Bütçe',    icon: null, color: '#3b82f6' },
  sleep:     { label: 'Uyku',     icon: null, color: '#8b5cf6' },
};

function ModuleIcon({ moduleKey, size = 20, color }: { moduleKey: TemplateModuleKey; size?: number; color: string }) {
  switch (moduleKey) {
    case 'study':     return <BookOpen size={size} color={color} />;
    case 'sport':     return <Dumbbell size={size} color={color} />;
    case 'nutrition': return <Salad size={size} color={color} />;
    case 'budget':    return <Wallet size={size} color={color} />;
    case 'sleep':     return <Moon size={size} color={color} />;
    default:          return <FileText size={size} color={color} />;
  }
}

// ── Field helpers per module ─────────────────────────────────────────────────
type FieldDef = { key: string; label: string; placeholder: string; numeric?: boolean };

const MODULE_FIELDS: Record<TemplateModuleKey, FieldDef[]> = {
  study: [
    { key: 'subject',         label: 'Ders',             placeholder: 'Matematik' },
    { key: 'topic',           label: 'Konu',             placeholder: 'İntegral' },
    { key: 'durationMinutes', label: 'Süre (dk)',        placeholder: '60', numeric: true },
    { key: 'questionCount',   label: 'Soru Sayısı',     placeholder: '50', numeric: true },
  ],
  sport: [
    { key: 'workoutType',     label: 'Antrenman Türü',  placeholder: 'Koşu' },
    { key: 'durationMinutes', label: 'Süre (dk)',        placeholder: '45', numeric: true },
    { key: 'caloriesBurned',  label: 'Yakılan Kalori',  placeholder: '300', numeric: true },
    { key: 'notes',           label: 'Notlar',          placeholder: 'İsteğe bağlı' },
  ],
  nutrition: [
    { key: 'mealType',        label: 'Öğün',            placeholder: 'Kahvaltı' },
    { key: 'foods',           label: 'Besinler',        placeholder: 'Yulaf, muz...' },
    { key: 'calories',        label: 'Kalori',          placeholder: '400', numeric: true },
    { key: 'protein',         label: 'Protein (g)',     placeholder: '20', numeric: true },
    { key: 'carbs',           label: 'Karbonhidrat (g)', placeholder: '60', numeric: true },
    { key: 'fat',             label: 'Yağ (g)',         placeholder: '10', numeric: true },
  ],
  budget: [
    { key: 'category',        label: 'Kategori',        placeholder: 'Market' },
    { key: 'amount',          label: 'Tutar (₺)',       placeholder: '150', numeric: true },
    { key: 'type',            label: 'Tür (gelir/gider)', placeholder: 'gider' },
  ],
  sleep: [
    { key: 'durationHours',   label: 'Süre (saat)',     placeholder: '8', numeric: true },
    { key: 'qualityScore',    label: 'Kalite (1-10)',   placeholder: '8', numeric: true },
  ],
};

// Flatten nested data (e.g. macros.protein → protein)
function flattenData(data: Record<string, unknown>): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [k, v] of Object.entries(data)) {
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      for (const [subK, subV] of Object.entries(v as Record<string, unknown>)) {
        result[subK] = String(subV ?? '');
      }
    } else {
      result[k] = String(v ?? '');
    }
  }
  return result;
}

// Re-nest data back to original shape (only macros for nutrition)
function nestData(moduleKey: TemplateModuleKey, flat: Record<string, string>): Record<string, unknown> {
  if (moduleKey === 'nutrition') {
    const { protein, carbs, fat, mealType, foods, calories, ...rest } = flat;
    return {
      ...rest,
      mealType,
      foods,
      calories: Number(calories) || 0,
      macros: {
        protein: Number(protein) || 0,
        carbs:   Number(carbs)   || 0,
        fat:     Number(fat)     || 0,
      },
    };
  }
  // Convert numeric fields
  const result: Record<string, unknown> = {};
  const fields = MODULE_FIELDS[moduleKey];
  for (const f of fields) {
    result[f.key] = f.numeric ? Number(flat[f.key]) || 0 : (flat[f.key] ?? '');
  }
  return result;
}

// ── Component ────────────────────────────────────────────────────────────────
export default function TemplatesScreen() {
  const surface   = useThemeColor({}, 'surface');
  const border    = useThemeColor({}, 'border');
  const textColor = useThemeColor({}, 'text');
  const textSec   = useThemeColor({}, 'textSecondary');
  const tint      = useThemeColor({}, 'tint');
  const bg        = useThemeColor({}, 'background');

  const templates     = useHabitStore((s) => s.templates);
  const deleteTemplate = useHabitStore((s) => s.deleteTemplate);
  const updateTemplate = useHabitStore((s) => s.updateTemplate);

  // ── Collapsed groups ────────────────────────────────────────────────────
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const toggleGroup = (key: string) =>
    setCollapsed((prev) => ({ ...prev, [key]: !prev[key] }));

  // ── Edit modal ──────────────────────────────────────────────────────────
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [editName, setEditName]               = useState('');
  const [editFields, setEditFields]           = useState<Record<string, string>>({});

  const openEdit = (t: Template) => {
    setEditingTemplate(t);
    setEditName(t.name);
    setEditFields(flattenData(t.data));
  };

  const closeEdit = () => {
    setEditingTemplate(null);
    setEditName('');
    setEditFields({});
  };

  const handleUpdate = () => {
    if (!editingTemplate) return;
    if (!editName.trim()) {
      Alert.alert('Hata', 'Şablon adı boş olamaz.');
      return;
    }
    const newData = nestData(editingTemplate.moduleKey, editFields);
    updateTemplate(editingTemplate.id, editName.trim(), newData);
    closeEdit();
  };

  const handleDelete = (id: string, name: string) => {
    if (Platform.OS === 'web') {
      if (window.confirm(`"${name}" şablonu kalıcı olarak silinecek. Onaylıyor musunuz?`)) {
        deleteTemplate(id);
      }
      return;
    }
    Alert.alert('Şablonu Sil', `"${name}" şablonu kalıcı olarak silinecek.`, [
      { text: 'İptal', style: 'cancel' },
      { text: 'Sil', style: 'destructive', onPress: () => deleteTemplate(id) },
    ]);
  };

  // ── Group templates by moduleKey ────────────────────────────────────────
  const groups = (Object.keys(MODULE_META) as TemplateModuleKey[]).map((key) => ({
    key,
    items: templates.filter((t) => t.moduleKey === key),
  })).filter((g) => g.items.length > 0);

  const fields = editingTemplate ? MODULE_FIELDS[editingTemplate.moduleKey] : [];

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <ThemedView style={styles.root}>
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          {groups.length === 0 ? (
            <View style={styles.emptyWrap}>
              <FileText size={48} color={textSec} strokeWidth={1.2} />
              <ThemedText style={[styles.emptyTitle, { color: textColor }]}>Henüz şablon yok</ThemedText>
              <ThemedText style={[styles.emptySub, { color: textSec }]}>
                Modül formlarında "Şablon Kaydet" seçeneğini kullanarak şablonlar oluşturabilirsiniz.
              </ThemedText>
            </View>
          ) : (
            groups.map(({ key, items }) => {
              const meta  = MODULE_META[key as TemplateModuleKey];
              const color = meta.color;
              const isOpen = !collapsed[key];

              return (
                <View key={key} style={[styles.group, { backgroundColor: surface, borderColor: border }]}>
                  {/* Group header */}
                  <Pressable
                    style={({ pressed }) => [
                      styles.groupHeader,
                      { borderBottomColor: border, borderBottomWidth: isOpen ? StyleSheet.hairlineWidth : 0 },
                      pressed && { backgroundColor: `${color}10` },
                    ]}
                    onPress={() => toggleGroup(key)}
                  >
                    <View style={[styles.groupIconWrap, { backgroundColor: `${color}18` }]}>
                      <ModuleIcon moduleKey={key as TemplateModuleKey} size={18} color={color} />
                    </View>
                    <Text style={[styles.groupLabel, { color: textColor }]}>{meta.label}</Text>
                    <Text style={[styles.groupCount, { color: textSec }]}>{items.length}</Text>
                    {isOpen
                      ? <ChevronDown size={16} color={textSec} />
                      : <ChevronRight size={16} color={textSec} />}
                  </Pressable>

                  {/* Template rows */}
                  {isOpen && items.map((t, idx) => (
                    <View
                      key={t.id}
                      style={[
                        styles.templateRow,
                        idx < items.length - 1 && { borderBottomColor: border, borderBottomWidth: StyleSheet.hairlineWidth },
                      ]}
                    >
                      <View style={[styles.templateDot, { backgroundColor: `${color}30` }]}>
                        <ModuleIcon moduleKey={key as TemplateModuleKey} size={13} color={color} />
                      </View>
                      <View style={styles.templateInfo}>
                        <Text style={[styles.templateName, { color: textColor }]}>{t.name}</Text>
                        <Text style={[styles.templateDate, { color: textSec }]}>
                          {new Date(t.createdAt).toLocaleDateString('tr-TR')}
                        </Text>
                      </View>
                      {/* Edit */}
                      <Pressable
                        style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.6 }]}
                        onPress={() => openEdit(t)}
                        hitSlop={8}
                      >
                        <Pencil size={17} color={tint} />
                      </Pressable>
                      {/* Delete */}
                      <Pressable
                        style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.6 }]}
                        onPress={() => handleDelete(t.id, t.name)}
                        hitSlop={8}
                      >
                        <Trash2 size={17} color="#ef4444" />
                      </Pressable>
                    </View>
                  ))}
                </View>
              );
            })
          )}

        </ScrollView>
      </SafeAreaView>

      {/* ─── Edit Modal ─────────────────────────────────────────────────── */}
      <Modal
        visible={!!editingTemplate}
        transparent
        animationType="slide"
        onRequestClose={closeEdit}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <Pressable style={StyleSheet.absoluteFill} onPress={Keyboard.dismiss} />
          <View style={[styles.modalCard, { backgroundColor: surface, borderColor: border }]}>
              {/* Header */}
              <View style={styles.modalHeader}>
                <View>
                  <Text style={[styles.modalTitle, { color: textColor }]}>Şablonu Düzenle</Text>
                  {editingTemplate && (
                    <Text style={[styles.modalSub, { color: textSec }]}>
                      {MODULE_META[editingTemplate.moduleKey].label} modülü
                    </Text>
                  )}
                </View>
                <Pressable onPress={closeEdit} style={styles.closeBtn} hitSlop={10}>
                  <Text style={{ fontSize: 20, color: textSec }}>✕</Text>
                </Pressable>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                {/* Template name */}
                <Text style={[styles.fieldLabel, { color: textSec }]}>Şablon Adı</Text>
                <TextInput
                  style={[styles.input, { borderColor: tint, color: textColor, backgroundColor: bg }]}
                  value={editName}
                  onChangeText={setEditName}
                  placeholder="Şablon adı"
                  placeholderTextColor={textSec}
                />

                {/* Module fields */}
                {fields.map((f) => (
                  <View key={f.key}>
                    <Text style={[styles.fieldLabel, { color: textSec }]}>{f.label}</Text>
                    <TextInput
                      style={[styles.input, { borderColor: border, color: textColor, backgroundColor: bg }]}
                      value={editFields[f.key] ?? ''}
                      onChangeText={(v) => setEditFields((prev) => ({ ...prev, [f.key]: v }))}
                      placeholder={f.placeholder}
                      placeholderTextColor={textSec}
                      keyboardType={f.numeric ? 'numeric' : 'default'}
                    />
                  </View>
                ))}

                {/* Actions */}
                <View style={styles.modalActions}>
                  <Pressable
                    style={({ pressed }) => [styles.modalBtnSecondary, { borderColor: border, opacity: pressed ? 0.7 : 1 }]}
                    onPress={closeEdit}
                  >
                    <Text style={[styles.modalBtnSecText, { color: textColor }]}>İptal</Text>
                  </Pressable>
                  <Pressable
                    style={({ pressed }) => [styles.modalBtnPrimary, { backgroundColor: tint, opacity: pressed ? 0.85 : 1 }]}
                    onPress={handleUpdate}
                  >
                    <Text style={styles.modalBtnPrimText}>Güncelle</Text>
                  </Pressable>
                </View>
              </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  root:  { flex: 1 },
  safe:  { flex: 1 },
  scroll: { padding: 16, paddingBottom: 48 },

  // Empty state
  emptyWrap:  { alignItems: 'center', marginTop: 80, paddingHorizontal: 32 },
  emptyTitle: { fontSize: 18, fontWeight: '700', marginTop: 16, marginBottom: 8 },
  emptySub:   { fontSize: 14, textAlign: 'center', lineHeight: 20 },

  // Group card
  group:       { borderRadius: 16, borderWidth: 1, overflow: 'hidden', marginBottom: 16 },
  groupHeader: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 14, gap: 10 },
  groupIconWrap: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  groupLabel:  { flex: 1, fontSize: 15, fontWeight: '700' },
  groupCount:  { fontSize: 13, fontWeight: '600', marginRight: 4 },

  // Template row
  templateRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 13, paddingHorizontal: 14, gap: 10 },
  templateDot: { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  templateInfo: { flex: 1 },
  templateName: { fontSize: 14, fontWeight: '600' },
  templateDate: { fontSize: 12, marginTop: 2 },
  iconBtn:     { padding: 4 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modalCard: {
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    borderWidth: 1, padding: 24, maxHeight: '90%',
  },
  modalHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  modalTitle:   { fontSize: 18, fontWeight: '800' },
  modalSub:     { fontSize: 13, marginTop: 3 },
  closeBtn:     { padding: 4 },
  fieldLabel:   { fontSize: 12, fontWeight: '600', marginBottom: 6, marginTop: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: {
    borderWidth: 1, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 11,
    fontSize: 15,
  },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 24, marginBottom: 8 },
  modalBtnSecondary: { flex: 1, paddingVertical: 13, borderRadius: 10, alignItems: 'center', borderWidth: 1 },
  modalBtnSecText:   { fontSize: 15, fontWeight: '700' },
  modalBtnPrimary:   { flex: 1, paddingVertical: 13, borderRadius: 10, alignItems: 'center' },
  modalBtnPrimText:  { fontSize: 15, fontWeight: '700', color: '#fff' },
});
