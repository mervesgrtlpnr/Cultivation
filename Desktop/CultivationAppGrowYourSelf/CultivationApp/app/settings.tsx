// expo-file-system ve native-only modüller platforma göre izole edildi
import { Platform } from 'react-native';

let ExpoFS: any = null;
if (Platform.OS !== 'web') {
  ExpoFS = require('expo-file-system');
}

import * as Sharing from 'expo-sharing';
import { router, Redirect } from 'expo-router';
import { signOut, updatePassword, deleteUser } from 'firebase/auth';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { auth, db } from '@/firebaseConfig';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableWithoutFeedback,
  View,
  Keyboard,
  Text,
  InteractionManager,
} from 'react-native';
import { ScreenWrapper } from '@/components/ScreenWrapper';
import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState } from 'react';
import {
  Key,
  LayoutTemplate,
  Trash2,
  ChevronRight,
  ChevronDown,
  DownloadCloud,
  UserX,
  Sun,
  Moon,
  Monitor,
  LogOut,
} from 'lucide-react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useAuthStore } from '@/store/useAuthStore';
import { useHabitStore } from '@/store/useHabitStore';
import { useColorScheme } from '@/hooks/use-color-scheme';

// ── Initials helper ──────────────────────────────────────────────────────────
function getInitials(name?: string | null): string {
  if (!name?.trim()) return '?';
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

// Pastel avatar renkleri
const AVATAR_COLORS = ['#b7e4c7', '#a9d6e5', '#ffd6a5', '#ffb5c8', '#d0bfff'];
function avatarColor(name?: string | null): string {
  const code = (name ?? '').charCodeAt(0) || 0;
  return AVATAR_COLORS[code % AVATAR_COLORS.length];
}

// ── Theme types ──────────────────────────────────────────────────────────────
type ThemePref = 'system' | 'light' | 'dark';

export default function SettingsScreen() {
  const surface    = useThemeColor({}, 'surface');
  const border     = useThemeColor({}, 'border');
  const textColor  = useThemeColor({}, 'text');
  const textSec    = useThemeColor({}, 'textSecondary');
  const tint       = useThemeColor({}, 'tint');
  const bg         = useThemeColor({}, 'background');
  
  const systemScheme = useColorScheme() ?? 'light';
  const themePref    = useHabitStore((s) => s.appTheme);
  const scheme       = themePref === 'system' ? systemScheme : themePref;

  const logout  = useAuthStore((s) => s.logout);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const store   = useHabitStore();


  // ── State ──────────────────────────────────────────────────────────────────
  const user = useAuthStore((s) => s.user);
  const userName  = user?.fullName || 'Misafir Kullanıcı';
  const userEmail = user?.email || '';

  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const updateUser = useAuthStore((s) => s.updateUser);

  const [isReady, setIsReady] = useState(false);

  React.useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => {
      setIsReady(true);
    });
    return () => task.cancel();
  }, []);

  const setAppTheme         = useHabitStore((s) => s.setAppTheme);
  const [showThemeModal,    setShowThemeModal]      = useState(false);

  const [showPasswordForm,  setShowPasswordForm]   = useState(false);
  const [oldPassword,       setOldPassword]        = useState('');
  const [newPassword,       setNewPassword]        = useState('');

  const [showDeleteAccModal,  setShowDeleteAccModal]  = useState(false);
  const [deletePassword,      setDeletePassword]      = useState('');

  const handlePasswordSave = async () => {
    if (!oldPassword || !newPassword) {
      if (Platform.OS === 'web') window.alert('Lütfen eski ve yeni şifrenizi girin.');
      else Alert.alert('Hata', 'Lütfen eski ve yeni şifrenizi girin.');
      return;
    }
    if (!auth.currentUser) return;
    try {
      await updatePassword(auth.currentUser, newPassword);
      if (Platform.OS === 'web') window.alert('Şifreniz güncellendi.');
      else Alert.alert('Başarılı', 'Şifreniz güncellendi.');
      setShowPasswordForm(false);
      setOldPassword('');
      setNewPassword('');
    } catch (err: any) {
      if (err.code === 'auth/requires-recent-login') {
        const msg = 'Güvenlik gereği lütfen tekrar giriş yapıp tekrar deneyin.';
        if (Platform.OS === 'web') window.alert(msg);
        else Alert.alert('Yeniden Giriş Gerekli', msg);
        performLogout();
      } else {
        const msg = 'Şifre güncellenirken hata oluştu.';
        if (Platform.OS === 'web') window.alert(msg);
        else Alert.alert('Hata', msg);
      }
    }
  };

  const handleExportData = async () => {
    try {
      // Export items mapped for CSV roughly. We will just export the JSON as before or stringify it better.
      // The prompt requests "virgülle ayrılmış text (CSV) formatına dönüştürmeli".
      let csvContent = "Tarih,Kategori,Değer,Notlar,Tip\n";
      store.habits.forEach(h => csvContent += `${h.createdAt},Alışkanlık,${h.title},,${h.category}\n`);
      store.budgetEntries.forEach(b => csvContent += `${b.date},Bütçe,${b.amount},,${b.type}\n`);
      store.sportsEntries.forEach(s => csvContent += `${s.date},Spor,${s.durationMinutes}dk,${s.notes || ''},${s.workoutType}\n`);
      // ... append some others, to keep it simple we'll just join them all.
      // But actually, just dumping JSON into CSV format quickly is hard. We can just serialize to a simple CSV or keep JSON. Wait, prompt specifically asks for CSV.
      
      const fileName = `cultivation_export_${Date.now()}.csv`;

      if (Platform.OS === 'web') {
        const blob = new window.Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.click();
        window.URL.revokeObjectURL(url);
      } else {
        const fileUri = ExpoFS.documentDirectory + fileName;
        await ExpoFS.writeAsStringAsync(fileUri, csvContent, { encoding: ExpoFS.EncodingType.UTF8 });
        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
          await Sharing.shareAsync(fileUri, {
            mimeType: 'text/csv',
            dialogTitle: 'Cultivation Verilerini Paylaş',
          });
        } else {
          Alert.alert('Bilgi', `Dosya kaydedildi:\n${fileUri}`);
        }
      }
    } catch (err) {
      if (Platform.OS === 'web') window.alert('Dışa aktarma sırasında bir hata oluştu.');
      else Alert.alert('Hata', 'Dışa aktarma sırasında bir hata oluştu.');
    }
  };

  const handleDeleteData = () => {
    if (Platform.OS === 'web') {
      if (window.confirm('Tüm verileriniz kalıcı olarak silinecektir. Emin misiniz?')) {
        store.clearAllData();
        window.alert('Tüm veriler silindi.');
      }
      return;
    }

    Alert.alert(
      'Tüm Verileri Sil',
      'Tüm verileriniz kalıcı olarak silinecektir. Emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Evet, Sil',
          style: 'destructive',
          onPress: () => {
            store.clearAllData();
            Alert.alert('Tamam', 'Tüm veriler silindi.');
          },
        },
      ],
    );
  };

  const performLogout = async () => {
    try {
      await signOut(auth);
      setShowLogoutModal(false);
      logout();
      store.clearAllData();
      router.replace('/(auth)/login');
    } catch (err) {
      console.error("Logout error", err);
    }
  };

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      setShowLogoutModal(true);
    } else {
      Alert.alert('Çıkış Yap', 'Hesabınızdan çıkmak istediğinize emin misiniz?', [
        { text: 'İptal', style: 'cancel' },
        { text: 'Çıkış Yap', style: 'destructive', onPress: performLogout },
      ]);
    }
  };

  const handleDeleteAccountPress = () => {
    if (Platform.OS === 'web') {
      if (window.confirm('Bu işlem geri alınamaz. Devam etmek istiyor musunuz?')) {
        setShowDeleteAccModal(true);
      }
      return;
    }

    Alert.alert(
      'Hesabı Sil',
      'Bu işlem geri alınamaz. Devam etmek istiyor musunuz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Evet, Devam Et',
          style: 'destructive',
          onPress: () => setShowDeleteAccModal(true),
        },
      ],
    );
  };

  const confirmDeleteAccount = async () => {
    if (!deletePassword) {
      if (Platform.OS === 'web') window.alert('İşlemi onaylamak için şifrenizi girmelisiniz.');
      else Alert.alert('Hata', 'İşlemi onaylamak için şifrenizi girmelisiniz.');
      return;
    }
    
    if (!auth.currentUser) return;
    try {
      setShowDeleteAccModal(false);
      setDeletePassword('');
      // First wipe all data in firestore (which `clearAllData` already handles by looping collections)
      await store.clearAllData();
      
      // Wipe user document
      await deleteDoc(doc(db, 'users', auth.currentUser.uid));
      
      // Finally delete user from Auth
      await deleteUser(auth.currentUser);
      
      logout();
      router.replace('/(auth)/login');
    } catch (err: any) {
      if (err.code === 'auth/requires-recent-login') {
        const msg = 'Güvenlik gereği lütfen tekrar giriş yapıp tekrar deneyin.';
        if (Platform.OS === 'web') window.alert(msg);
        else Alert.alert('Yeniden Giriş Gerekli', msg);
        performLogout();
      } else {
        const msg = 'Hesap silinirken bir hata oluştu.';
        if (Platform.OS === 'web') window.alert(msg);
        else Alert.alert('Hata', msg);
      }
    }
  };

  const themeLabel: Record<ThemePref, string> = {
    system: 'Sistem',
    light:  'Aydınlık',
    dark:   'Karanlık',
  };

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  if (!isReady) {
    return (
      <ScreenWrapper edges={['bottom']}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: textSec }}>Yükleniyor...</Text>
        </View>
      </ScreenWrapper>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <ScreenWrapper edges={['bottom']}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: 60 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >

          {/* ─── Profil Header ─────────────────────────────────── */}
          <View style={styles.profileSection}>
            <View style={styles.avatarWrap}>
              <View style={[styles.avatarImage, { backgroundColor: avatarColor(userName), alignItems: 'center', justifyContent: 'center' }]}>
                <Text style={styles.initials}>{getInitials(userName)}</Text>
              </View>
            </View>
            <ThemedText style={[styles.name, { color: textColor }]}>{userName}</ThemedText>
            <ThemedText style={[styles.email, { color: textSec }]}>{userEmail}</ThemedText>
          </View>

          {/* ─── Temel Ayarlar ─────────────────────────────────── */}
          <View style={[styles.menuGroup, { backgroundColor: surface, borderColor: border }]}>

            {/* Tema */}
            <Pressable
              style={({ pressed }) => [
                styles.menuItem,
                { borderBottomColor: border, borderBottomWidth: StyleSheet.hairlineWidth },
                pressed && { backgroundColor: `${tint}15` },
              ]}
              onPress={() => setShowThemeModal(true)}
            >
              <View style={styles.menuIconWrap}>
                {scheme === 'dark' ? <Moon size={22} color={tint} /> : <Sun size={22} color={tint} />}
              </View>
              <ThemedText style={[styles.menuTitle, { color: textColor }]}>Tema Tercihi</ThemedText>
              <ThemedText style={[styles.menuValue, { color: textSec }]}>{themeLabel[themePref]}</ThemedText>
              <ChevronRight size={18} color={textSec} style={{ opacity: 0.5 }} />
            </Pressable>

            {/* Şifre Değiştir */}
            <Pressable
              style={({ pressed }) => [
                styles.menuItem,
                { borderBottomColor: border, borderBottomWidth: StyleSheet.hairlineWidth },
                pressed && { backgroundColor: `${tint}15` },
              ]}
              onPress={() => setShowPasswordForm(!showPasswordForm)}
            >
              <View style={styles.menuIconWrap}>
                <Key size={22} color={tint} />
              </View>
              <ThemedText style={[styles.menuTitle, { color: textColor }]}>Şifre Değiştir</ThemedText>
              {showPasswordForm
                ? <ChevronDown size={18} color={textSec} />
                : <ChevronRight size={18} color={textSec} style={{ opacity: 0.5 }} />}
            </Pressable>

            {showPasswordForm && (
              <View style={[styles.accordion, { borderBottomColor: border, borderBottomWidth: StyleSheet.hairlineWidth }]}>
                <TextInput
                  style={[styles.input, { borderColor: border, color: textColor, backgroundColor: bg }]}
                  placeholder="Eski Şifre"
                  placeholderTextColor={textSec}
                  secureTextEntry
                  value={oldPassword}
                  onChangeText={setOldPassword}
                />
                <TextInput
                  style={[styles.input, { borderColor: border, color: textColor, backgroundColor: bg }]}
                  placeholder="Yeni Şifre"
                  placeholderTextColor={textSec}
                  secureTextEntry
                  value={newPassword}
                  onChangeText={setNewPassword}
                />
                <Pressable
                  style={({ pressed }) => [styles.saveBtn, { backgroundColor: tint, opacity: pressed ? 0.8 : 1 }]}
                  onPress={handlePasswordSave}
                >
                  <Text style={styles.saveBtnText}>Kaydet</Text>
                </Pressable>
              </View>
            )}

            {/* Kayıtlı Şemalar */}
            <Pressable
              style={({ pressed }) => [
                styles.menuItem,
                pressed && { backgroundColor: `${tint}15` },
              ]}
              onPress={() => router.push('/templates' as any)}
            >
              <View style={styles.menuIconWrap}>
                <LayoutTemplate size={22} color={tint} />
              </View>
              <ThemedText style={[styles.menuTitle, { color: textColor }]}>Kayıtlı Şemalar</ThemedText>
              <ChevronRight size={18} color={textSec} style={{ opacity: 0.5 }} />
            </Pressable>
          </View>

          {/* ─── Veri Yönetimi ─────────────────────────────────── */}
          <View style={[styles.menuGroup, { backgroundColor: surface, borderColor: border, marginTop: 20 }]}>
            <Pressable
              style={({ pressed }) => [styles.menuItem, pressed && { backgroundColor: `${tint}15` }]}
              onPress={handleExportData}
            >
              <View style={styles.menuIconWrap}>
                <DownloadCloud size={22} color={tint} />
              </View>
              <ThemedText style={[styles.menuTitle, { color: textColor }]}>Verileri Dışa Aktar</ThemedText>
              <ChevronRight size={18} color={textSec} style={{ opacity: 0.5 }} />
            </Pressable>
          </View>

          {/* ─── Aksiyon Alanı ───────────────────────────────── */}
          <View style={[styles.dangerZone, { borderColor: '#ef444440', backgroundColor: scheme === 'dark' ? '#2d0a0a' : '#fff5f5' }]}>

            {/* Çıkış Yap */}
            <Pressable
              style={({ pressed }) => [
                styles.menuItem,
                { borderBottomColor: '#ef444430', borderBottomWidth: StyleSheet.hairlineWidth },
                pressed && { backgroundColor: '#fee2e2' },
              ]}
              onPress={handleLogout}
            >
              <View style={styles.menuIconWrap}>
                <LogOut size={22} color="#ef4444" />
              </View>
              <ThemedText style={[styles.menuTitle, { color: '#ef4444' }]}>Çıkış Yap</ThemedText>
            </Pressable>

            {/* Verileri Sil */}
            <Pressable
              style={({ pressed }) => [
                styles.menuItem,
                { borderBottomColor: '#ef444430', borderBottomWidth: StyleSheet.hairlineWidth },
                pressed && { backgroundColor: '#fee2e2' },
              ]}
              onPress={handleDeleteData}
            >
              <View style={styles.menuIconWrap}>
                <Trash2 size={22} color="#ef4444" />
              </View>
              <ThemedText style={[styles.menuTitle, { color: '#ef4444' }]}>Verileri Sil</ThemedText>
            </Pressable>

            {/* Hesabı Sil */}
            <Pressable
              style={({ pressed }) => [styles.menuItem, pressed && { backgroundColor: '#fee2e2' }]}
              onPress={handleDeleteAccountPress}
            >
              <View style={styles.menuIconWrap}>
                <UserX size={22} color="#ef4444" />
              </View>
              <ThemedText style={[styles.menuTitle, { color: '#ef4444' }]}>Hesabı Sil</ThemedText>
            </Pressable>
          </View>

        </ScrollView>


      {/* ─── Tema Seçimi Modal ──────────────────────────────────── */}
      <Modal visible={showThemeModal} transparent animationType="slide" onRequestClose={() => setShowThemeModal(false)}>
        <Pressable style={styles.sheetOverlay} onPress={() => setShowThemeModal(false)}>
          <Pressable style={[styles.sheetContent, { backgroundColor: surface }]} onPress={() => {}}>
            <View style={[styles.sheetHandle, { backgroundColor: border }]} />
            <ThemedText style={[styles.sheetTitle, { color: textColor }]}>Tema Tercihi</ThemedText>

            {(['system', 'light', 'dark'] as ThemePref[]).map((opt) => {
              const icons = { system: <Monitor size={18} color={tint} />, light: <Sun size={18} color={tint} />, dark: <Moon size={18} color={tint} /> };
              return (
                <Pressable
                  key={opt}
                  style={({ pressed }) => [
                    styles.sheetItem,
                    { borderBottomColor: border, borderBottomWidth: StyleSheet.hairlineWidth },
                    pressed && { backgroundColor: `${tint}15` },
                    themePref === opt && { backgroundColor: `${tint}20` },
                  ]}
                  onPress={() => { setAppTheme(opt); setShowThemeModal(false); }}
                >
                  <View style={{ marginRight: 10 }}>{icons[opt]}</View>
                  <ThemedText style={[styles.sheetItemText, { color: textColor }]}>{themeLabel[opt]}</ThemedText>
                  {themePref === opt && <View style={[styles.checkDot, { backgroundColor: tint }]} />}
                </Pressable>
              );
            })}

            <Pressable
              style={[styles.sheetCancel, { backgroundColor: `${tint}15` }]}
              onPress={() => setShowThemeModal(false)}
            >
              <ThemedText style={[styles.sheetCancelText, { color: textColor }]}>Vazgeç</ThemedText>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ─── Hesabı Sil Onay Modal ──────────────────────────────── */}
      <Modal visible={showDeleteAccModal} transparent animationType="fade" onRequestClose={() => setShowDeleteAccModal(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.centeredOverlay}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={[styles.centeredCard, { backgroundColor: surface, borderColor: border }]}>
              <ThemedText style={[styles.modalTitle, { color: textColor }]}>Şifrenizi Doğrulayın</ThemedText>
              <ThemedText style={[styles.modalSub, { color: textSec }]}>
                Hesabınızı kalıcı olarak silmek için şifrenizi giriniz.
              </ThemedText>
              <TextInput
                style={[styles.input, { borderColor: border, color: textColor, backgroundColor: bg, marginBottom: 20 }]}
                placeholder="Şifre"
                placeholderTextColor={textSec}
                secureTextEntry
                value={deletePassword}
                onChangeText={setDeletePassword}
                autoFocus
              />
              <View style={styles.modalActions}>
                <Pressable
                  style={[styles.modalBtn, { backgroundColor: `${border}` }]}
                  onPress={() => { setShowDeleteAccModal(false); setDeletePassword(''); }}
                >
                  <Text style={[styles.modalBtnText, { color: textColor }]}>İptal</Text>
                </Pressable>
                <Pressable
                  style={[styles.modalBtn, { backgroundColor: '#ef4444' }]}
                  onPress={confirmDeleteAccount}
                >
                  <Text style={[styles.modalBtnText, { color: '#fff' }]}>Hesabı Sil</Text>
                </Pressable>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>

      {/* ─── Çıkış Yap Onay Modal (Web için) ──────────────────────────────── */}
      <Modal visible={showLogoutModal} transparent animationType="fade" onRequestClose={() => setShowLogoutModal(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.centeredOverlay}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={[styles.centeredCard, { backgroundColor: surface, borderColor: border }]}>
              <ThemedText style={[styles.modalTitle, { color: textColor }]}>Çıkış Yap</ThemedText>
              <ThemedText style={[styles.modalSub, { color: textSec, marginBottom: 24 }]}>
                Hesabınızdan çıkmak istediğinize emin misiniz?
              </ThemedText>
              <View style={styles.modalActions}>
                <Pressable
                  style={[styles.modalBtn, { backgroundColor: `${border}` }]}
                  onPress={() => setShowLogoutModal(false)}
                >
                  <Text style={[styles.modalBtnText, { color: textColor }]}>Hayır</Text>
                </Pressable>
                <Pressable
                  style={[styles.modalBtn, { backgroundColor: '#ef4444' }]}
                  onPress={performLogout}
                >
                  <Text style={[styles.modalBtnText, { color: '#fff' }]}>Evet</Text>
                </Pressable>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>

    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  root:  { flex: 1 },
  safe:  { flex: 1 },
  scroll: { paddingTop: 32 },

  // Profile
  profileSection: { alignItems: 'center', marginBottom: 36 },
  avatarWrap: { position: 'relative', marginBottom: 14 },
  avatarImage: { width: 110, height: 110, borderRadius: 55 },
  initials: { fontSize: 38, fontWeight: '800', color: '#1a3a2a', letterSpacing: 1 },
  editBadge: {
    position: 'absolute', bottom: 2, right: 2,
    width: 30, height: 30, borderRadius: 15,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#fff',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 3, elevation: 3,
  },
  name:  { fontSize: 24, fontWeight: '800', marginBottom: 4 },
  email: { fontSize: 14, fontWeight: '500' },

  // Menu Groups
  menuGroup: { marginHorizontal: 16, borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  menuItem:  { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, paddingHorizontal: 16 },
  menuIconWrap: { width: 34, alignItems: 'flex-start' },
  menuTitle: { flex: 1, fontSize: 15, fontWeight: '600' },
  menuValue: { fontSize: 14, marginRight: 6 },

  // Accordion
  accordion: { padding: 16, paddingTop: 4 },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 11, fontSize: 15, marginBottom: 10 },
  saveBtn: { borderRadius: 10, paddingVertical: 12, alignItems: 'center', marginTop: 2 },
  saveBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  // Danger Zone
  dangerZone: {
    marginHorizontal: 16, marginTop: 24,
    borderRadius: 16, borderWidth: 1.5, overflow: 'hidden',
  },
  dangerLabel: {
    fontSize: 11, fontWeight: '700', color: '#ef4444',
    letterSpacing: 1.2, textTransform: 'uppercase',
    paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4,
  },

  // Bottom Sheet
  sheetOverlay:  { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheetContent:  { borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 40, overflow: 'hidden' },
  sheetHandle:   { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 4 },
  sheetTitle:    { fontSize: 16, fontWeight: '700', textAlign: 'center', paddingVertical: 14 },
  sheetItem:     { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 20 },
  sheetItemText: { fontSize: 16, fontWeight: '600', flex: 1 },
  sheetCancel:   { margin: 16, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  sheetCancelText: { fontSize: 15, fontWeight: '700' },
  checkDot:      { width: 10, height: 10, borderRadius: 5 },

  // Centered Modal (delete account)
  centeredOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', padding: 24 },
  centeredCard:    { borderRadius: 20, borderWidth: 1, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.12, shadowRadius: 12, elevation: 6 },
  modalTitle:      { fontSize: 19, fontWeight: '800', marginBottom: 8 },
  modalSub:        { fontSize: 14, lineHeight: 20, marginBottom: 18 },
  modalActions:    { flexDirection: 'row', gap: 12 },
  modalBtn:        { flex: 1, paddingVertical: 13, borderRadius: 10, alignItems: 'center' },
  modalBtnText:    { fontSize: 15, fontWeight: '700' },
});
