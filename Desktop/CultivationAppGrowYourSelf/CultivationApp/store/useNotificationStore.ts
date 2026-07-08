import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export interface NotificationItem {
  id: string;
  message: string;
  date: string; // Örn: '2 Haziran'
}

interface NotificationState {
  notifications: NotificationItem[];
  hasUnread: boolean;
  addNotification: (message: string) => void;
  clearNotifications: () => void;
  markAsRead: () => void;
}

function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set) => ({
      notifications: [],
      hasUnread: false,

      addNotification: (message) =>
        set((state) => {
          // Aynı gün içinde tamamen aynı mesajın mükerrer eklenmesini önlemek için
          // store katmanında da küçük bir güvenlik kontrolü yapabiliriz.
          const d = new Date();
          const dateStr = d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' });
          
          const isDuplicate = state.notifications.some(
            (n) => n.message === message && n.date === dateStr
          );

          if (isDuplicate) {
            return state;
          }

          const newItem: NotificationItem = {
            id: newId(),
            message,
            date: dateStr,
          };

          return {
            notifications: [newItem, ...state.notifications],
            hasUnread: true,
          };
        }),

      clearNotifications: () =>
        set(() => ({
          notifications: [],
          hasUnread: false,
        })),

      markAsRead: () =>
        set(() => ({
          hasUnread: false,
        })),
    }),
    {
      name: 'cultivation-notifications',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
