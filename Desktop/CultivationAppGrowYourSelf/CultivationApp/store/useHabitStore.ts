import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { doc, setDoc, deleteDoc, updateDoc, collection, getDocs } from 'firebase/firestore';
import { db, auth } from '@/firebaseConfig';

import { startOfLocalDayISO, toLocalDateKey } from '@/lib/date';

// ─── Tip Yardımcıları ─────────────────────────────────────────────────────
type WithId<T> = T & { id: string };

// ─── Temel Veri Arayüzleri ───────────────────────────────────────────────

export interface Habit {
  id: string;
  title: string;
  category: string;
  createdAt: Date;
  completedDates: string[];
}

/** Görev — dueDate tam ISO 8601 string. */
export interface Task {
  id: string;
  title: string;
  dueDate: string;
  isCompleted: boolean;
}

/** Günlük — date tam ISO 8601 string; moodScore 1–5. */
export interface JournalEntry {
  id: string;
  date: string;
  content: string;
  moodScore: number;
  tags: string[];
  reminders: string[];
}

/** Regl / döngü takibi. */
export interface PeriodEntry {
  date: string;        // ISO 8601 başlangıç (geriye uyumluluk)
  startDate: string;   // YYYY-MM-DD yerel başlangıç tarihi
  endDate?: string;    // YYYY-MM-DD yerel bitiş tarihi (opsiyonel)
  notes: string;
  isPlanned?: boolean;
}

/** Ders çalışma kaydı. */
export interface StudyEntry {
  date: string;
  subject: string;
  topic: string;
  durationMinutes: number;
  questionCount: number;
  correctCount: number;
  wrongCount: number;
  accuracyRate: number;  // correctCount/questionCount*100
  isPlanned?: boolean;
}

export interface NutritionMacros {
  protein: number;
  carbs: number;
  fat: number;
}

/** Öğün / beslenme. */
export interface NutritionEntry {
  date: string;
  mealType: string;
  foods: string;
  calories: number;
  macros: NutritionMacros;
  isPlanned?: boolean;
}

export type BudgetEntryType = 'income' | 'expense';

/** Bütçe hareketi. */
export interface BudgetEntry {
  date: string;
  type: BudgetEntryType;
  amount: number;
  category: string;
  isPlanned?: boolean;
}

/** Antrenman. */
export interface SportsEntry {
  date: string;
  workoutType: string;
  durationMinutes: number;
  caloriesBurned: number;
  notes: string;
  performanceMetrics: Record<string, number | string>;
  isPlanned?: boolean;
}

/** Uyku — qualityScore 1–10. */
export interface SleepEntry {
  date: string;
  durationHours: number;
  qualityScore: number;
  isPlanned?: boolean;
}

/** Form şablonu — tekrar kullanım için. */
export type TemplateModuleKey = 'study' | 'nutrition' | 'budget' | 'sport' | 'sleep';

export interface Template {
  id: string;
  moduleKey: TemplateModuleKey;
  name: string;
  data: Record<string, unknown>;
  createdAt: string;
}

// ─── Persist yardımcıları ─────────────────────────────────────────────────

type PersistedHabit = Omit<Habit, 'createdAt'> & { createdAt: string };

function reviveHabit(raw: PersistedHabit): Habit {
  return { ...raw, createdAt: new Date(raw.createdAt) };
}

function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

function clampMood(n: number): number {
  return Math.min(5, Math.max(1, Math.round(n)));
}

function normalizeTags(tags: string[]): string[] {
  return [...new Set(tags.map((t) => t.trim()).filter(Boolean))];
}

function normalizeReminders(items: string[]): string[] {
  return [...new Set(items.map((t) => t.trim()).filter(Boolean))];
}

function reviveJournalEntry(raw: JournalEntry): JournalEntry {
  return {
    ...raw,
    reminders: Array.isArray(raw.reminders) ? normalizeReminders(raw.reminders) : [],
  };
}

function clampQualitySleep(n: number): number {
  return Math.min(10, Math.max(1, Math.round(n)));
}

function clampNonNegative(n: number): number {
  return Math.max(0, n);
}

// ─── State Arayüzü ────────────────────────────────────────────────────────

export type AppTheme = 'light' | 'dark' | 'system';

export interface CultivationState {
  appTheme: AppTheme;
  habits: Habit[];
  tasks: Task[];
  journalEntries: JournalEntry[];

  periodEntries: WithId<PeriodEntry>[];
  studyEntries: WithId<StudyEntry>[];
  nutritionEntries: WithId<NutritionEntry>[];
  budgetEntries: WithId<BudgetEntry>[];
  sportsEntries: WithId<SportsEntry>[];
  sleepEntries: WithId<SleepEntry>[];

  templates: Template[];

  // ── Ekleme ──
  addPeriodEntry: (input: PeriodEntry) => void;
  addStudyEntry: (input: StudyEntry) => void;
  addNutritionEntry: (input: NutritionEntry) => void;
  addBudgetEntry: (input: BudgetEntry) => void;
  addSportsEntry: (input: SportsEntry) => void;
  addSleepEntry: (input: SleepEntry) => void;

  // ── Güncelleme ──
  updatePeriodEntry: (id: string, patch: Partial<PeriodEntry>) => void;
  updateStudyEntry: (id: string, patch: Partial<StudyEntry>) => void;
  updateNutritionEntry: (id: string, patch: Partial<NutritionEntry>) => void;
  updateBudgetEntry: (id: string, patch: Partial<BudgetEntry>) => void;
  updateSportsEntry: (id: string, patch: Partial<SportsEntry>) => void;
  updateSleepEntry: (id: string, patch: Partial<SleepEntry>) => void;

  // ── Silme ──
  deletePeriodEntry: (id: string) => void;
  deleteStudyEntry: (id: string) => void;
  deleteNutritionEntry: (id: string) => void;
  deleteBudgetEntry: (id: string) => void;
  deleteSportsEntry: (id: string) => void;
  deleteSleepEntry: (id: string) => void;

  // ── Şablon ──
  addTemplate: (input: Omit<Template, 'id' | 'createdAt'>) => void;
  updateTemplate: (id: string, name: string, data: Record<string, unknown>) => void;
  deleteTemplate: (id: string) => void;

  // ── Veri Yönetimi ──
  clearAllData: () => void;

  // ── Alışkanlık ──
  addHabit: (input: { title: string; category: string }) => void;
  deleteHabit: (id: string) => void;
  toggleHabitCompletion: (habitId: string, date: string) => void;

  // ── Görev ──
  addTask: (input: { title: string; dueDate: string }) => void;
  updateTask: (id: string, patch: Partial<Pick<Task, 'title' | 'dueDate' | 'isCompleted'>>) => void;
  deleteTask: (id: string) => void;
  toggleTask: (id: string) => void;

  // ── Günlük ──
  addJournalEntry: (input: {
    content: string;
    moodScore: number;
    tags: string[];
    reminders?: string[];
    date?: string;
  }) => void;
  updateJournalEntry: (
    id: string,
    patch: Partial<Pick<JournalEntry, 'date' | 'content' | 'moodScore' | 'tags' | 'reminders'>>,
  ) => void;
  deleteJournalEntry: (id: string) => void;
  upsertJournalForLocalDate: (
    localDateKey: string,
    input: { content: string; moodScore: number; reminders: string[] },
  ) => void;

  // ── Tema ──
  setAppTheme: (theme: AppTheme) => void;

  // ── Veri Senkronizasyonu ──
  fetchUserData: (uid: string) => Promise<void>;
}

// ─── Yardımcı Firestore Fonksiyonları ──────────────────────────────────────
const getUid = () => auth.currentUser?.uid;

const syncDoc = async (colName: string, id: string, data: any) => {
  const uid = getUid();
  if (!uid) return;
  try { await setDoc(doc(db, 'users', uid, colName, id), data); } catch (e) { console.error(e); }
};

const updateSyncDoc = async (colName: string, id: string, patch: any) => {
  const uid = getUid();
  if (!uid) return;
  try { await updateDoc(doc(db, 'users', uid, colName, id), patch); } catch (e) { console.error(e); }
};

const deleteSyncDoc = async (colName: string, id: string) => {
  const uid = getUid();
  if (!uid) return;
  try { await deleteDoc(doc(db, 'users', uid, colName, id)); } catch (e) { console.error(e); }
};

// ─── Store ────────────────────────────────────────────────────────────────

export const useHabitStore = create<CultivationState>()(
  persist(
    (set) => ({
      appTheme: 'system',
      habits: [],
      tasks: [],
      journalEntries: [],
      periodEntries: [],
      studyEntries: [],
      nutritionEntries: [],
      budgetEntries: [],
      sportsEntries: [],
      sleepEntries: [],
      templates: [],

      // ── Tema ──────────────────────────────────────────────────────────
      setAppTheme: (theme) => set({ appTheme: theme }),

      // ── Veri Senkronizasyonu ──────────────────────────────────────────
      fetchUserData: async (uid) => {
        try {
          const collections = ['habits', 'tasks', 'journalEntries', 'periodEntries', 'studyEntries', 'nutritionEntries', 'budgetEntries', 'sportsEntries', 'sleepEntries', 'templates'];
          const data: any = {};
          
          for (const col of collections) {
            const querySnapshot = await getDocs(collection(db, 'users', uid, col));
            data[col] = querySnapshot.docs.map(doc => doc.data());
          }
          
          set((state) => ({ ...state, ...data }));
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      },

      // ── Regl ──────────────────────────────────────────────────────────
      addPeriodEntry: (input) =>
        set((state) => {
          const next = {
            id: newId(),
            date: input.startDate, // geriye uyumluluk
            startDate: input.startDate,
            endDate: input.endDate,
            notes: input.notes.trim(),
            isPlanned: input.isPlanned ?? false,
          };
          syncDoc('periodEntries', next.id, next);
          return { periodEntries: [...state.periodEntries, next] };
        }),

      deletePeriodEntry: (id) =>
        set((state) => {
          deleteSyncDoc('periodEntries', id);
          return { periodEntries: state.periodEntries.filter((e) => e.id !== id) };
        }),

      updatePeriodEntry: (id, patch) =>
        set((state) => {
          updateSyncDoc('periodEntries', id, patch);
          return { periodEntries: state.periodEntries.map((e) => (e.id === id ? { ...e, ...patch } : e)) };
        }),

      // ── Ders ──────────────────────────────────────────────────────────
      addStudyEntry: (input) =>
        set((state) => {
          const qCount = clampNonNegative(Math.round(input.questionCount));
          const correct = clampNonNegative(Math.round(input.correctCount));
          const wrong = clampNonNegative(Math.round(input.wrongCount));
          const accuracy = qCount > 0 ? Math.round((correct / qCount) * 100) : 0;
          const next = {
            id: newId(),
            date: new Date(input.date).toISOString(),
            subject: input.subject.trim(),
            topic: input.topic.trim(),
            durationMinutes: clampNonNegative(Math.round(input.durationMinutes)),
            questionCount: qCount,
            correctCount: correct,
            wrongCount: wrong,
            accuracyRate: accuracy,
            isPlanned: input.isPlanned ?? false,
          };
          syncDoc('studyEntries', next.id, next);
          return { studyEntries: [...state.studyEntries, next] };
        }),

      deleteStudyEntry: (id) =>
        set((state) => {
          deleteSyncDoc('studyEntries', id);
          return { studyEntries: state.studyEntries.filter((e) => e.id !== id) };
        }),

      updateStudyEntry: (id, patch) =>
        set((state) => {
          updateSyncDoc('studyEntries', id, patch);
          return { studyEntries: state.studyEntries.map((e) => (e.id === id ? { ...e, ...patch } : e)) };
        }),

      // ── Beslenme ──────────────────────────────────────────────────────
      addNutritionEntry: (input) =>
        set((state) => {
          const next = {
            id: newId(),
            date: new Date(input.date).toISOString(),
            mealType: input.mealType.trim(),
            foods: input.foods?.trim() ?? '',
            calories: clampNonNegative(input.calories),
            macros: {
              protein: clampNonNegative(input.macros.protein),
              carbs: clampNonNegative(input.macros.carbs),
              fat: clampNonNegative(input.macros.fat),
            },
            isPlanned: input.isPlanned ?? false,
          };
          syncDoc('nutritionEntries', next.id, next);
          return { nutritionEntries: [...state.nutritionEntries, next] };
        }),

      deleteNutritionEntry: (id) =>
        set((state) => {
          deleteSyncDoc('nutritionEntries', id);
          return { nutritionEntries: state.nutritionEntries.filter((e) => e.id !== id) };
        }),

      updateNutritionEntry: (id, patch) =>
        set((state) => {
          updateSyncDoc('nutritionEntries', id, patch);
          return { nutritionEntries: state.nutritionEntries.map((e) => (e.id === id ? { ...e, ...patch } : e)) };
        }),

      // ── Bütçe ─────────────────────────────────────────────────────────
      addBudgetEntry: (input) =>
        set((state) => {
          const next = {
            id: newId(),
            date: new Date(input.date).toISOString(),
            type: input.type,
            amount: clampNonNegative(input.amount),
            category: input.category.trim(),
            isPlanned: input.isPlanned ?? false,
          };
          syncDoc('budgetEntries', next.id, next);
          return { budgetEntries: [...state.budgetEntries, next] };
        }),

      deleteBudgetEntry: (id) =>
        set((state) => {
          deleteSyncDoc('budgetEntries', id);
          return { budgetEntries: state.budgetEntries.filter((e) => e.id !== id) };
        }),

      updateBudgetEntry: (id, patch) =>
        set((state) => {
          updateSyncDoc('budgetEntries', id, patch);
          return { budgetEntries: state.budgetEntries.map((e) => (e.id === id ? { ...e, ...patch } : e)) };
        }),

      // ── Spor ──────────────────────────────────────────────────────────
      addSportsEntry: (input) =>
        set((state) => {
          const next = {
            id: newId(),
            date: new Date(input.date).toISOString(),
            workoutType: input.workoutType.trim(),
            durationMinutes: clampNonNegative(Math.round(input.durationMinutes)),
            caloriesBurned: clampNonNegative(input.caloriesBurned),
            notes: input.notes?.trim() ?? '',
            performanceMetrics: { ...input.performanceMetrics },
            isPlanned: input.isPlanned ?? false,
          };
          syncDoc('sportsEntries', next.id, next);
          return { sportsEntries: [...state.sportsEntries, next] };
        }),

      deleteSportsEntry: (id) =>
        set((state) => {
          deleteSyncDoc('sportsEntries', id);
          return { sportsEntries: state.sportsEntries.filter((e) => e.id !== id) };
        }),

      updateSportsEntry: (id, patch) =>
        set((state) => {
          updateSyncDoc('sportsEntries', id, patch);
          return { sportsEntries: state.sportsEntries.map((e) => (e.id === id ? { ...e, ...patch } : e)) };
        }),

      // ── Uyku ──────────────────────────────────────────────────────────
      addSleepEntry: (input) =>
        set((state) => {
          const next = {
            id: newId(),
            date: new Date(input.date).toISOString(),
            durationHours: Math.max(0, input.durationHours),
            qualityScore: clampQualitySleep(input.qualityScore),
            isPlanned: input.isPlanned ?? false,
          };
          syncDoc('sleepEntries', next.id, next);
          return { sleepEntries: [...state.sleepEntries, next] };
        }),

      deleteSleepEntry: (id) =>
        set((state) => {
          deleteSyncDoc('sleepEntries', id);
          return { sleepEntries: state.sleepEntries.filter((e) => e.id !== id) };
        }),

      updateSleepEntry: (id, patch) =>
        set((state) => {
          updateSyncDoc('sleepEntries', id, patch);
          return { sleepEntries: state.sleepEntries.map((e) => (e.id === id ? { ...e, ...patch } : e)) };
        }),

      // ── Şablonlar ─────────────────────────────────────────────────────
      addTemplate: (input) =>
        set((state) => {
          const next = { id: newId(), createdAt: new Date().toISOString(), ...input };
          syncDoc('templates', next.id, next);
          return { templates: [...state.templates, next] };
        }),

      updateTemplate: (id, name, data) =>
        set((state) => {
          updateSyncDoc('templates', id, { name, data });
          return { templates: state.templates.map((t) => (t.id === id ? { ...t, name, data } : t)) };
        }),

      deleteTemplate: (id) =>
        set((state) => {
          deleteSyncDoc('templates', id);
          return { templates: state.templates.filter((t) => t.id !== id) };
        }),

      // ── Veri Yönetimi ─────────────────────────────────────────────────
      clearAllData: async () => {
        const uid = getUid();
        if (uid) {
          const collections = ['habits', 'tasks', 'journalEntries', 'periodEntries', 'studyEntries', 'nutritionEntries', 'budgetEntries', 'sportsEntries', 'sleepEntries', 'templates'];
          for (const col of collections) {
            try {
              const querySnapshot = await getDocs(collection(db, 'users', uid, col));
              querySnapshot.forEach((docSnap) => {
                deleteDoc(doc(db, 'users', uid, col, docSnap.id)).catch(console.error);
              });
            } catch (err) {
              console.error(err);
            }
          }
        }
        set(() => ({
          habits: [],
          tasks: [],
          journalEntries: [],
          periodEntries: [],
          studyEntries: [],
          nutritionEntries: [],
          budgetEntries: [],
          sportsEntries: [],
          sleepEntries: [],
          templates: [],
        }));
      },

      // ── Alışkanlık ────────────────────────────────────────────────────
      addHabit: ({ title, category }) =>
        set((state) => {
          const next = { id: newId(), title: title.trim(), category: category.trim(), createdAt: new Date(), completedDates: [] };
          syncDoc('habits', next.id, next);
          return { habits: [...state.habits, next] };
        }),

      deleteHabit: (id) =>
        set((state) => {
          deleteSyncDoc('habits', id);
          return { habits: state.habits.filter((h) => h.id !== id) };
        }),

      toggleHabitCompletion: (habitId, date) =>
        set((state) => {
          const newHabits = state.habits.map((h) => {
            if (h.id !== habitId) return h;
            const has = h.completedDates.includes(date);
            const nextCompletedDates = has
              ? h.completedDates.filter((d) => d !== date)
              : [...h.completedDates, date].sort();
            updateSyncDoc('habits', habitId, { completedDates: nextCompletedDates });
            return { ...h, completedDates: nextCompletedDates };
          });
          return { habits: newHabits };
        }),

      // ── Görev ─────────────────────────────────────────────────────────
      addTask: ({ title, dueDate }) =>
        set((state) => {
          const next = { id: newId(), title: title.trim(), dueDate: new Date(dueDate).toISOString(), isCompleted: false };
          syncDoc('tasks', next.id, next);
          return { tasks: [...state.tasks, next] };
        }),

      updateTask: (id, patch) =>
        set((state) => {
          const newTasks = state.tasks.map((t) => {
            if (t.id !== id) return t;
            const next = { ...t, ...patch };
            if (patch.dueDate !== undefined) next.dueDate = new Date(patch.dueDate).toISOString();
            return next;
          });
          updateSyncDoc('tasks', id, patch);
          return { tasks: newTasks };
        }),

      deleteTask: (id) =>
        set((state) => {
          deleteSyncDoc('tasks', id);
          return { tasks: state.tasks.filter((t) => t.id !== id) };
        }),

      toggleTask: (id) =>
        set((state) => {
          const newTasks = state.tasks.map((t) => {
            if (t.id !== id) return t;
            const isCompleted = !t.isCompleted;
            updateSyncDoc('tasks', id, { isCompleted });
            return { ...t, isCompleted };
          });
          return { tasks: newTasks };
        }),

      // ── Günlük ────────────────────────────────────────────────────────
      addJournalEntry: ({ content, moodScore, tags, reminders, date }) =>
        set((state) => {
          const iso = date ? new Date(date).toISOString() : new Date().toISOString();
          const next = {
            id: newId(),
            date: iso,
            content: content.trim(),
            moodScore: clampMood(moodScore),
            tags: normalizeTags(tags),
            reminders: normalizeReminders(reminders ?? []),
          };
          syncDoc('journalEntries', next.id, next);
          return { journalEntries: [...state.journalEntries, next] };
        }),

      updateJournalEntry: (id, patch) =>
        set((state) => {
          const newEntries = state.journalEntries.map((e) => {
            if (e.id !== id) return e;
            const next: JournalEntry = { ...e, ...patch };
            if (patch.moodScore !== undefined) next.moodScore = clampMood(patch.moodScore);
            if (patch.tags !== undefined) next.tags = normalizeTags(patch.tags);
            if (patch.reminders !== undefined) next.reminders = normalizeReminders(patch.reminders);
            if (patch.date !== undefined) next.date = new Date(patch.date).toISOString();
            if (patch.content !== undefined) next.content = patch.content.trim();
            return next;
          });
          updateSyncDoc('journalEntries', id, patch);
          return { journalEntries: newEntries };
        }),

      deleteJournalEntry: (id) =>
        set((state) => {
          deleteSyncDoc('journalEntries', id);
          return { journalEntries: state.journalEntries.filter((e) => e.id !== id) };
        }),

      upsertJournalForLocalDate: (localDateKey, input) =>
        set((state) => {
          const iso = startOfLocalDayISO(localDateKey);
          const existing = state.journalEntries.find(
            (e) => toLocalDateKey(new Date(e.date)) === localDateKey,
          );
          const content = input.content.trim();
          const moodScore = clampMood(input.moodScore);
          const reminders = normalizeReminders(input.reminders);
          if (existing) {
            updateSyncDoc('journalEntries', existing.id, { date: iso, content, moodScore, reminders });
            return {
              journalEntries: state.journalEntries.map((e) =>
                e.id === existing.id ? { ...e, date: iso, content, moodScore, reminders } : e,
              ),
            };
          }
          const next = { id: newId(), date: iso, content, moodScore, tags: [], reminders };
          syncDoc('journalEntries', next.id, next);
          return {
            journalEntries: [...state.journalEntries, next],
          };
        }),
    }),
    {
      name: 'cultivation-habits',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        appTheme: state.appTheme,
        habits: state.habits,
        tasks: state.tasks,
        journalEntries: state.journalEntries,
        periodEntries: state.periodEntries,
        studyEntries: state.studyEntries,
        nutritionEntries: state.nutritionEntries,
        budgetEntries: state.budgetEntries,
        sportsEntries: state.sportsEntries,
        sleepEntries: state.sleepEntries,
        templates: state.templates,
      }),
      merge: (persisted, current) => {
        const p = persisted as Partial<{
          appTheme: AppTheme;
          habits: PersistedHabit[];
          tasks: Task[];
          journalEntries: JournalEntry[];
          periodEntries: WithId<PeriodEntry>[];
          studyEntries: WithId<StudyEntry>[];
          nutritionEntries: WithId<NutritionEntry>[];
          budgetEntries: WithId<BudgetEntry>[];
          sportsEntries: WithId<SportsEntry>[];
          sleepEntries: WithId<SleepEntry>[];
          templates: Template[];
        }> | undefined;
        const base = current as CultivationState;
        if (!p) return base;
        return {
          ...base,
          appTheme: p.appTheme ?? base.appTheme,
          habits: p.habits?.map(reviveHabit) ?? base.habits,
          tasks: Array.isArray(p.tasks) ? p.tasks : base.tasks,
          journalEntries: Array.isArray(p.journalEntries)
            ? p.journalEntries.map((e) => reviveJournalEntry(e as JournalEntry))
            : base.journalEntries,
          periodEntries: Array.isArray(p.periodEntries) ? p.periodEntries : base.periodEntries,
          studyEntries: Array.isArray(p.studyEntries) ? p.studyEntries : base.studyEntries,
          nutritionEntries: Array.isArray(p.nutritionEntries)
            ? p.nutritionEntries
            : base.nutritionEntries,
          budgetEntries: Array.isArray(p.budgetEntries) ? p.budgetEntries : base.budgetEntries,
          sportsEntries: Array.isArray(p.sportsEntries) ? p.sportsEntries : base.sportsEntries,
          sleepEntries: Array.isArray(p.sleepEntries) ? p.sleepEntries : base.sleepEntries,
          templates: Array.isArray(p.templates) ? p.templates : base.templates,
        };
      },
    },
  ),
);
