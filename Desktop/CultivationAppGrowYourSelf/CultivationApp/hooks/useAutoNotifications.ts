import { useEffect } from 'react';
import { useHabitStore } from '@/store/useHabitStore';
import { useNotificationStore } from '@/store/useNotificationStore';
import { toLocalDateKey, todayLocalDateKey } from '@/lib/date';

export function useAutoNotifications() {
  const {
    periodEntries,
    studyEntries,
    nutritionEntries,
    budgetEntries,
    sportsEntries,
    sleepEntries,
    journalEntries,
  } = useHabitStore();

  const { notifications, addNotification } = useNotificationStore();

  useEffect(() => {
    const checkAndTriggerNotifications = () => {
      const now = new Date();
      const currentHour = now.getHours();
      const todayStr = todayLocalDateKey();
      const todayDateStr = now.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' });

      // ─── 1. SABAH 09:00 KONTROLÜ ──────────────────────────────────────────
      if (currentHour >= 9) {
        // Zaten bugün plan bildirimi eklendi mi?
        const hasPlanNotificationToday = notifications.some(
          (n) => n.date === todayDateStr && n.message.startsWith('Bugün planlanan bir kaydın var:')
        );

        if (!hasPlanNotificationToday) {
          // Bugün için planlanmış modülleri ara
          const plannedModules: string[] = [];

          const hasPlannedPeriod = periodEntries.some((e) => e.isPlanned && e.startDate === todayStr);
          if (hasPlannedPeriod) plannedModules.push('Regl');

          const hasPlannedStudy = studyEntries.some(
            (e) => e.isPlanned && toLocalDateKey(new Date(e.date)) === todayStr
          );
          if (hasPlannedStudy) plannedModules.push('Ders Çalışma');

          const hasPlannedNutrition = nutritionEntries.some(
            (e) => e.isPlanned && toLocalDateKey(new Date(e.date)) === todayStr
          );
          if (hasPlannedNutrition) plannedModules.push('Beslenme');

          const hasPlannedBudget = budgetEntries.some(
            (e) => e.isPlanned && toLocalDateKey(new Date(e.date)) === todayStr
          );
          if (hasPlannedBudget) plannedModules.push('Bütçe');

          const hasPlannedSports = sportsEntries.some(
            (e) => e.isPlanned && toLocalDateKey(new Date(e.date)) === todayStr
          );
          if (hasPlannedSports) plannedModules.push('Spor');

          const hasPlannedSleep = sleepEntries.some(
            (e) => e.isPlanned && toLocalDateKey(new Date(e.date)) === todayStr
          );
          if (hasPlannedSleep) plannedModules.push('Uyku');

          if (plannedModules.length > 0) {
            addNotification(`Bugün planlanan bir kaydın var: ${plannedModules.join(', ')}`);
          }
        }
      }

      // ─── 2. AKŞAM 20:00 KONTROLÜ ──────────────────────────────────────────
      if (currentHour >= 20) {
        // Zaten bugün akşam bildirimi eklendi mi?
        const hasEveningNotificationToday = notifications.some(
          (n) => n.date === todayDateStr && n.message === 'Bugün hiç kayıt yapmadın.'
        );

        if (!hasEveningNotificationToday) {
          // Bugün yapılmış herhangi bir kayıt var mı kontrol et
          const hasPeriod = periodEntries.some((e) => e.startDate === todayStr);
          const hasStudy = studyEntries.some(
            (e) => toLocalDateKey(new Date(e.date)) === todayStr
          );
          const hasNutrition = nutritionEntries.some(
            (e) => toLocalDateKey(new Date(e.date)) === todayStr
          );
          const hasBudget = budgetEntries.some(
            (e) => toLocalDateKey(new Date(e.date)) === todayStr
          );
          const hasSports = sportsEntries.some(
            (e) => toLocalDateKey(new Date(e.date)) === todayStr
          );
          const hasSleep = sleepEntries.some(
            (e) => toLocalDateKey(new Date(e.date)) === todayStr
          );
          const hasJournal = journalEntries.some(
            (e) => toLocalDateKey(new Date(e.date)) === todayStr
          );

          const hasAnyRecordToday =
            hasPeriod ||
            hasStudy ||
            hasNutrition ||
            hasBudget ||
            hasSports ||
            hasSleep ||
            hasJournal;

          if (!hasAnyRecordToday) {
            addNotification('Bugün hiç kayıt yapmadın.');
          }
        }
      }
    };

    // İlk mount anında çalıştır
    checkAndTriggerNotifications();

    // Her 60 saniyede bir kontrol et (Arka planda çalışırken güncel kalması için)
    const intervalId = setInterval(checkAndTriggerNotifications, 60000);

    return () => clearInterval(intervalId);
  }, [
    periodEntries,
    studyEntries,
    nutritionEntries,
    budgetEntries,
    sportsEntries,
    sleepEntries,
    journalEntries,
    notifications,
    addNotification,
  ]);
}
