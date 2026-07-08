/**
 * Takvim nokta (dot) sistemi.
 *
 * Solid dot  → isPlanned = false/undefined (gerçekleşen kayıt)
 * Ghost dot  → isPlanned = true            (planlanan hedef — %50 alpha ton)
 *
 * react-native-calendars multi-dot mode "outlined" dot desteklemez,
 * bu yüzden ghost için aynı rengin açık (alpha) versiyonunu kullanıyoruz.
 */

import type { MarkedDates } from 'react-native-calendars/src/types';

import { ModuleColors } from '@/constants/colors';
import { toLocalDateKey } from '@/lib/date';
import type {
  JournalEntry,
  NutritionEntry,
  PeriodEntry,
  SleepEntry,
  SportsEntry,
  StudyEntry,
  BudgetEntry,
} from '@/store/useHabitStore';

// ─── Dışa açık renk sabitleri (stats.tsx dot-legend için) ────────────────────
export const DOT_JOURNAL   = ModuleColors.journal.solid;
export const DOT_SPORT     = ModuleColors.sport.solid;
export const DOT_NUTRITION = ModuleColors.nutrition.solid;
export const DOT_STUDY     = ModuleColors.study.solid;
export const DOT_BUDGET    = ModuleColors.budget.solid;
export const DOT_SLEEP     = ModuleColors.sleep.solid;
export const DOT_PERIOD    = ModuleColors.period.solid;

type WithDate = { date: string };
type WithPlanned = WithDate & { isPlanned?: boolean };

/** Entry'nin yerel tarih anahtarını döner. */
function dayKey(e: WithDate): string {
  return toLocalDateKey(new Date(e.date));
}

/** Verilen günde herhangi bir journal var mı? */
function hasJournalForDay(entries: JournalEntry[], day: string): boolean {
  return entries.some((j) => dayKey(j) === day);
}

/**
 * Bir modül için (day → {solid: boolean, ghost: boolean}) haritası üretir.
 * Aynı günde hem solid hem ghost varsa her ikisi de gösterilir.
 */
function buildModuleMap(entries: WithPlanned[]): Map<string, { solid: boolean; ghost: boolean }> {
  const map = new Map<string, { solid: boolean; ghost: boolean }>();
  for (const e of entries) {
    const k = dayKey(e);
    const existing = map.get(k) ?? { solid: false, ghost: false };
    if (e.isPlanned) {
      existing.ghost = true;
    } else {
      existing.solid = true;
    }
    map.set(k, existing);
  }
  return map;
}

function buildPeriodModuleMap(entries: PeriodEntry[]): Map<string, { solid: boolean; ghost: boolean }> {
  const map = new Map<string, { solid: boolean; ghost: boolean }>();
  for (const e of entries) {
    if (!e.startDate) continue;
    
    // Güvenli tarih ayrıştırma ve döngü
    const start = new Date(e.startDate);
    const end = e.endDate ? new Date(e.endDate) : start;
    
    // Eğer bitiş tarihi geçersiz veya başlangıçtan önceyse sadece başlangıcı al
    const finalEnd = (!isNaN(end.getTime()) && end >= start) ? end : start;
    
    let current = new Date(start);
    while (current <= finalEnd) {
      const k = toLocalDateKey(current);
      const existing = map.get(k) ?? { solid: false, ghost: false };
      if (e.isPlanned) {
        existing.ghost = true;
      } else {
        existing.solid = true;
      }
      map.set(k, existing);
      
      // Sonraki gün
      current.setDate(current.getDate() + 1);
    }
  }
  return map;
}

type DotDef = { key: string; color: string };

/** Solid + ghost dot çiftini üretir (varsa). */
function pushDots(
  dots: DotDef[],
  day: string,
  map: Map<string, { solid: boolean; ghost: boolean }>,
  key: string,
  solidColor: string,
  ghostColor: string,
): void {
  const entry = map.get(day);
  if (!entry) return;
  if (entry.solid) dots.push({ key, color: solidColor });
  if (entry.ghost) dots.push({ key: `${key}_ghost`, color: ghostColor });
}

export function buildMarkedDates(
  journalEntries: JournalEntry[],
  sportsEntries: SportsEntry[],
  nutritionEntries: NutritionEntry[],
  studyEntries?: StudyEntry[],
  budgetEntries?: BudgetEntry[],
  sleepEntries?: SleepEntry[],
  periodEntries?: PeriodEntry[],
): MarkedDates {
  // Modül haritaları
  const sportMap     = buildModuleMap(sportsEntries);
  const nutritionMap = buildModuleMap(nutritionEntries);
  const studyMap     = studyEntries   ? buildModuleMap(studyEntries)   : new Map();
  const budgetMap    = budgetEntries  ? buildModuleMap(budgetEntries)  : new Map();
  const sleepMap     = sleepEntries   ? buildModuleMap(sleepEntries)   : new Map();
  const periodMap    = periodEntries  ? buildPeriodModuleMap(periodEntries) : new Map();

  // Tüm günleri topla
  const allDays = new Set<string>();
  for (const j of journalEntries) allDays.add(dayKey(j));
  for (const k of sportMap.keys())     allDays.add(k);
  for (const k of nutritionMap.keys()) allDays.add(k);
  for (const k of studyMap.keys())     allDays.add(k);
  for (const k of budgetMap.keys())    allDays.add(k);
  for (const k of sleepMap.keys())     allDays.add(k);
  for (const k of periodMap.keys())    allDays.add(k);

  const marked: MarkedDates = {};

  for (const day of allDays) {
    const dots: DotDef[] = [];

    // Günlük (journal — her zaman solid; isPlanned yok)
    if (hasJournalForDay(journalEntries, day)) {
      dots.push({ key: 'journal', color: ModuleColors.journal.solid });
    }

    pushDots(dots, day, periodMap,    'period',    ModuleColors.period.solid,    ModuleColors.period.ghost);
    pushDots(dots, day, sportMap,     'sport',     ModuleColors.sport.solid,     ModuleColors.sport.ghost);
    pushDots(dots, day, studyMap,     'study',     ModuleColors.study.solid,     ModuleColors.study.ghost);
    pushDots(dots, day, nutritionMap, 'nutrition', ModuleColors.nutrition.solid, ModuleColors.nutrition.ghost);
    pushDots(dots, day, budgetMap,    'budget',    ModuleColors.budget.solid,    ModuleColors.budget.ghost);
    pushDots(dots, day, sleepMap,     'sleep',     ModuleColors.sleep.solid,     ModuleColors.sleep.ghost);

    if (dots.length > 0) {
      marked[day] = { dots };
    }
  }

  return marked;
}
