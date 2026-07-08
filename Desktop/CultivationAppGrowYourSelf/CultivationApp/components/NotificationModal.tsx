import React from 'react';
import {
  Modal,
  View,
  StyleSheet,
  Pressable,
  ScrollView,
  Platform,
} from 'react-native';
import { X, Trash2, Bell } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useNotificationStore } from '@/store/useNotificationStore';

interface NotificationModalProps {
  visible: boolean;
  onClose: () => void;
}

export function NotificationModal({ visible, onClose }: NotificationModalProps) {
  const surface = useThemeColor({}, 'surface');
  const border = useThemeColor({}, 'border');
  const textPrimary = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const tint = useThemeColor({}, 'tint');
  const bg = useThemeColor({}, 'background');

  const { notifications, clearNotifications } = useNotificationStore();

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <SafeAreaView style={styles.modalOverlay} edges={['top', 'bottom']}>
        <View style={[styles.modalContent, { backgroundColor: bg, borderColor: border }]}>
          
          {/* ─── Header ────────────────────────────────────── */}
          <View style={[styles.header, { borderBottomColor: border }]}>
            <View style={styles.headerLeft}>
              <Bell size={20} color={tint} />
              <ThemedText style={styles.title}>Bildirimler</ThemedText>
            </View>
            <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={10}>
              <X size={24} color={textSecondary} />
            </Pressable>
          </View>

          {/* ─── Body / List ────────────────────────────────── */}
          {notifications.length > 0 ? (
            <View style={{ flex: 1 }}>
              <ScrollView style={styles.scrollBody} contentContainerStyle={styles.scrollContent}>
                {notifications.map((item) => (
                  <View key={item.id} style={[styles.notificationCard, { backgroundColor: surface, borderColor: border }]}>
                    <ThemedText style={[styles.messageText, { color: textPrimary }]}>
                      {item.message}
                    </ThemedText>
                    <View style={styles.cardFooter}>
                      <ThemedText style={[styles.dateText, { color: textSecondary }]}>
                        {item.date}
                      </ThemedText>
                    </View>
                  </View>
                ))}
              </ScrollView>
              
              {/* Footer Actions (Clear All) */}
              <View style={[styles.footer, { borderTopColor: border }]}>
                <Pressable
                  onPress={clearNotifications}
                  style={({ pressed }) => [
                    styles.clearBtn,
                    pressed && { opacity: 0.7 },
                  ]}
                  hitSlop={12}
                >
                  <Trash2 size={20} color="#ef4444" style={{ marginRight: 6 }} />
                  <ThemedText style={styles.clearText}>Tümünü Temizle</ThemedText>
                </Pressable>
              </View>
            </View>
          ) : (
            /* ─── Empty State (Pastel Tree Art) ──────────────── */
            <View style={styles.emptyContainer}>
              <View style={styles.treeArtWrapper}>
                {/* Stylized Pastel Tree Concept using absolute positioned circle blobs */}
                <View style={styles.treeGlow} />
                
                {/* Trunk */}
                <View style={styles.treeTrunk} />

                {/* Leaves / Blobs */}
                <View style={[styles.leafBlob, styles.leafCenter, { backgroundColor: '#a3b899' }]} />
                <View style={[styles.leafBlob, styles.leafLeft, { backgroundColor: '#b2c7a9' }]} />
                <View style={[styles.leafBlob, styles.leafRight, { backgroundColor: '#cce3c4' }]} />
                <View style={[styles.leafBlob, styles.leafTop, { backgroundColor: '#dceee0' }]} />
                <View style={[styles.leafBlob, styles.leafSmall1, { backgroundColor: '#f2eae1' }]} />
                <View style={[styles.leafBlob, styles.leafSmall2, { backgroundColor: '#ebd5c8' }]} />
              </View>

              <ThemedText style={[styles.emptyTitle, { color: textPrimary }]}>
                Yeni Bildirim Yok
              </ThemedText>
              <ThemedText style={[styles.emptySubtitle, { color: textSecondary }]}>
                Şu an için yeni bir bildirim bulunmuyor.
              </ThemedText>
            </View>
          )}
        </View>
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
    height: '80%',
    overflow: 'hidden',
    ...Platform.select({
      web: { maxWidth: 600, width: '100%', alignSelf: 'center', height: '70%', borderRadius: 24, marginVertical: 'auto' }
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
    gap: 12,
  },
  notificationCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '500',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
  },
  dateText: {
    fontSize: 11,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 16,
    borderTopWidth: 1,
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  clearText: {
    color: '#ef4444',
    fontWeight: '700',
    fontSize: 14,
  },
  // Empty State & Tree
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  treeArtWrapper: {
    width: 140,
    height: 140,
    position: 'relative',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: 20,
    opacity: 0.6,
  },
  treeGlow: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#e8f0e6',
    opacity: 0.3,
    top: 10,
  },
  treeTrunk: {
    width: 5,
    height: 60,
    backgroundColor: '#b8a698',
    borderRadius: 3,
    zIndex: 1,
  },
  leafBlob: {
    position: 'absolute',
    borderRadius: 100,
    opacity: 0.85,
  },
  leafCenter: {
    width: 56,
    height: 56,
    top: 25,
    left: 42,
  },
  leafLeft: {
    width: 44,
    height: 44,
    top: 40,
    left: 20,
  },
  leafRight: {
    width: 48,
    height: 48,
    top: 35,
    left: 78,
  },
  leafTop: {
    width: 38,
    height: 38,
    top: 10,
    left: 51,
  },
  leafSmall1: {
    width: 24,
    height: 24,
    top: 60,
    left: 15,
  },
  leafSmall2: {
    width: 20,
    height: 20,
    top: 55,
    left: 100,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});
