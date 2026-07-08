import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { Eye, EyeOff, AlertCircle, CheckCircle2 } from 'lucide-react-native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/firebaseConfig';
import { useAuthStore } from '@/store/useAuthStore';
import { useThemeColor } from '@/hooks/use-theme-color';
import { ThemedView } from '@/components/themed-view';
import { ScreenWrapper } from '@/components/ScreenWrapper';

export default function LoginScreen() {
  const login = useAuthStore((s) => s.login);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      setErrorMessage('Lütfen e-posta ve şifrenizi girin.');
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, email.toLowerCase(), password);
      
      setErrorMessage('');
      setIsSuccess(true);
      // Auth state listener in _layout.tsx will handle the store update and redirect
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setErrorMessage('Hatalı e-posta veya şifre girdiniz.');
      } else {
        setErrorMessage('Giriş yapılırken bir hata oluştu.');
      }
    }
  };

  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');
  const surfaceColor = useThemeColor({}, 'surface');
  const border = useThemeColor({}, 'border');
  const textSec = useThemeColor({}, 'textSecondary');

  const innerContent = (
    <View style={styles.inner}>
      
      <View style={styles.headerContainer}>
            <Text style={[styles.title, { color: textColor }]}>Cultivation</Text>
            <Text style={[styles.subtitle, { color: textSec }]}>Verimlilik dünyasına tekrar hoş geldin.</Text>
          </View>

          <View style={styles.formContainer}>
            <View style={styles.inputWrapper}>
              <TextInput
                style={[styles.input, { backgroundColor: surfaceColor, borderColor: border, color: textColor }]}
                placeholder="E-posta"
                placeholderTextColor="#A0A0A0"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={(val) => {
                  setEmail(val);
                  if (errorMessage) setErrorMessage('');
                }}
              />
            </View>

            <View style={styles.inputWrapper}>
              <TextInput
                style={[styles.input, { paddingRight: 50, backgroundColor: surfaceColor, borderColor: border, color: textColor }]}
                placeholder="Şifre"
                placeholderTextColor="#A0A0A0"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={(val) => {
                  setPassword(val);
                  if (errorMessage) setErrorMessage('');
                }}
              />
              <Pressable
                style={({ pressed }) => [styles.eyeIcon, { opacity: pressed ? 0.7 : 1 }]}
                onPress={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff size={22} color="#A0A0A0" />
                ) : (
                  <Eye size={22} color="#A0A0A0" />
                )}
              </Pressable>
            </View>

            {errorMessage ? (
              <View style={styles.errorBox}>
                <AlertCircle size={20} color="#ef4444" />
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            ) : null}

            {isSuccess ? (
              <View style={styles.successBox}>
                <CheckCircle2 size={20} color="#10b981" />
                <Text style={styles.successText}>Giriş başarılı, yönlendiriliyor...</Text>
              </View>
            ) : null}

            <Pressable 
              style={({ pressed }) => [
                styles.loginButton, 
                { backgroundColor: tintColor, opacity: pressed || isSuccess ? 0.8 : 1 }
              ]} 
              disabled={isSuccess}
              onPress={handleLogin}
            >
              <Text style={styles.loginButtonText}>{isSuccess ? 'Bekleniyor...' : 'Giriş Yap'}</Text>
            </Pressable>
          </View>

          <View style={styles.footerContainer}>
            <Text style={[styles.footerText, { color: textSec }]}>Hesabın yok mu? </Text>
            <Pressable 
              style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]} 
              onPress={() => router.push('/(auth)/signup')}
            >
              <Text style={[styles.footerLink, { color: tintColor }]}>Kayıt Ol</Text>
            </Pressable>
          </View>

    </View>
  );

  return (
    <ScreenWrapper>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={[styles.container, { backgroundColor: 'transparent' }]}
      >
        {Platform.OS === 'web' ? innerContent : (
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            {innerContent}
          </TouchableWithoutFeedback>
        )}
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  inner: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  headerContainer: {
    marginBottom: 40,
    alignItems: 'center',
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  formContainer: {
    width: '100%',
  },
  inputWrapper: {
    marginBottom: 16,
    position: 'relative',
    justifyContent: 'center',
  },
  input: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  eyeIcon: {
    position: 'absolute',
    right: 16,
  },
  loginButton: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#B5EAD7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  footerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 32,
  },
  footerText: {
    fontSize: 15,
  },
  footerLink: {
    fontSize: 15,
    fontWeight: '700',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#ef4444',
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  successBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  successText: {
    color: '#10b981',
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
  },
});
