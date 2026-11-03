import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { COLORS } from '../types';
import { Ionicons } from '@expo/vector-icons';
import Button from '../components/UI/Button';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE = process.env.EXPO_PUBLIC_API_URL;

interface RegisterScreenProps {
  onRegister?: (data: RegisterData) => void;
  onGoToLogin?: () => void;
}

interface RegisterData {
  fullName: string;
  email: string;
  whatsapp: string;
  password: string;
  confirmPassword: string;
}

export default function RegisterScreen({
  onRegister,
  onGoToLogin,
}: RegisterScreenProps) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [logoError, setLogoError] = useState(false);

  const handleRegister = async () => {
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: fullName,
          email,
          whatsapp,
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Erro no cadastro');
      }

      if (data.token) {
        await AsyncStorage.setItem('token', data.token);
      }

      if (data.user) {
        await AsyncStorage.setItem(
          'user',
          JSON.stringify({
            name: data.user.name,
            email: data.user.email,
          })
        );
      }

      onRegister?.(data.user);

    } catch (err) {
      console.error(err);
    }
  };

  // Formata o número de WhatsApp automaticamente: (XX) XXXXX-XXXX
  const formatWhatsApp = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 2) return `(${digits}`;
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#00668F" />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoCard}>
              <Image
                source={require('../../assets/logos/uri-logo-removebg-preview.png')}
                style={styles.logoImageLarge}
                resizeMode="contain"
              />
            </View>
            <View style={styles.headerText}>
              <Text style={styles.headerTitle}>Criar conta</Text>
              <Text style={styles.headerSubtitle}>
                Preencha seus dados para começar
              </Text>
            </View>
          </View>

          {/* Formulário */}
          <View style={styles.formContainer}>
            <Text style={styles.sectionLabel}>DADOS PESSOAIS</Text>

            {/* Nome Completo */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>NOME COMPLETO</Text>
              <View style={styles.inputWrapper}>
                <Ionicons
                  name="person-outline"
                  size={18}
                  color="#1A6FBF"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="João da Silva"
                  placeholderTextColor="#AAAAAA"
                  autoCapitalize="words"
                  value={fullName}
                  onChangeText={setFullName}
                />
              </View>
            </View>

            {/* E-mail */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>E-MAIL</Text>
              <View style={styles.inputWrapper}>
                <Ionicons
                  name="mail-outline"
                  size={18}
                  color="#1A6FBF"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="seu@email.com"
                  placeholderTextColor="#AAAAAA"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={email}
                  onChangeText={setEmail}
                />
              </View>
            </View>

            {/* WhatsApp */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>WHATSAPP</Text>
              <View style={styles.inputWrapper}>
                <Ionicons
                  name="call-outline"
                  size={18}
                  color="#1A6FBF"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="(54) 99999-9999"
                  placeholderTextColor="#AAAAAA"
                  keyboardType="phone-pad"
                  value={whatsapp}
                  onChangeText={(v) => setWhatsapp(formatWhatsApp(v))}
                  maxLength={15}
                />
              </View>
            </View>

            {/* Senha */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>SENHA</Text>
              <View style={styles.inputWrapper}>
                <Ionicons
                  name="lock-closed-outline"
                  size={18}
                  color="#1A6FBF"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Crie uma senha"
                  placeholderTextColor="#AAAAAA"
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                />
              </View>
            </View>

            {/* Confirmar Senha */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>CONFIRMAR SENHA</Text>
              <View style={styles.inputWrapper}>
                <Ionicons
                  name="lock-closed-outline"
                  size={18}
                  color="#1A6FBF"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Confirme a senha"
                  placeholderTextColor="#AAAAAA"
                  secureTextEntry
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                />
              </View>
            </View>

            {/* Botão Criar conta */}
            <Button title="Criar conta" onPress={handleRegister} fullWidth />

            {/* Link para login */}
            <View style={styles.loginRow}>
              <Text style={styles.loginText}>Já tem uma conta? </Text>
              <TouchableOpacity onPress={onGoToLogin}>
                <Text style={styles.loginLink}>Entrar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const BLUE = '#00668F';
const BLUE_LIGHT = '#00668F';

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: BLUE,
  },
  flex: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
  },

  // Header
  header: {
    backgroundColor: BLUE,
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 16,
    paddingHorizontal: 20,
    gap: 14,
  },
  logoContainer: {},
  logoCard: {
    width: 96,
    height: 96,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    overflow: 'hidden',
  },
  logoImageLarge: {
    width: 92,
    height: 92,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
  },

  // Form
  formContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 32,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#888888',
    letterSpacing: 1,
    marginBottom: 20,
  },

  // Fields
  fieldGroup: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#444444',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    backgroundColor: '#FAFAFA',
    paddingHorizontal: 12,
    height: 50,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#1A1A1A',
    paddingVertical: 0,
  },

  // Button
  primaryButton: {
    backgroundColor: BLUE_LIGHT,
    borderRadius: 12,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: BLUE,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  // Login link
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  loginText: {
    fontSize: 14,
    color: '#666666',
  },
  loginLink: {
    fontSize: 14,
    color: BLUE_LIGHT,
    fontWeight: '600',
  },
});
