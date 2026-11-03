import React, { useState, useEffect } from 'react';
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
import { Ionicons } from '@expo/vector-icons';  
import Button from '../components/UI/Button';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE = process.env.EXPO_PUBLIC_API_URL;

interface LoginScreenProps {
  onLogin?: (email: string, password: string) => void;
  onForgotPassword?: () => void;
  onCreateAccount?: () => void;
}

export default function LoginScreen({
  onLogin,
  onForgotPassword,
  onCreateAccount,
}: LoginScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleLogin = async () => {
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Login falhou');
      }

      await AsyncStorage.setItem('token', data.token);

      await AsyncStorage.setItem(
        'user',
        JSON.stringify({
          name: data.user.name,
          email: data.user.email,
        })
      );

      onLogin?.(email, password);
    } catch (err: any) {
      setErrorMessage('Credenciais inválidas. Tente novamente.');
      console.error(err);
    }
  };

    useEffect(() => {
    const checkLogin = async () => {
      try {
        const token = await AsyncStorage.getItem('token');

        if (token) {
          onLogin?.('', '');
        }
      } catch (error) {
        console.error('Erro ao verificar token', error);
      }
    };

    checkLogin();
  }, []);
console.log('API_BASE', process.env.EXPO_PUBLIC_API_URL);
  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#1A6FBF" />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header azul */}
          <View style={styles.header}>
            <View style={styles.logoCard}>
              <Image
                source={require('../../assets/logos/uri-logo-removebg-preview.png')}
                style={styles.logoImageLarge}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.appName}>CaronaURI</Text>
            <Text style={styles.appSubtitle}>Sua carona universitária</Text>
          </View>

          {/* Formulário */}
          <View style={styles.formContainer}>
            <Text style={styles.welcomeTitle}>Bem-vindo de volta</Text>
            <Text style={styles.welcomeSubtitle}>
              Entre com seu e-mail para continuar
            </Text>

            {/* Campo E-mail */}
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

            {/* Campo Senha */}
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
                  style={[styles.input, styles.inputPassword]}
                  placeholder="Sua senha"
                  placeholderTextColor="#AAAAAA"
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeButton}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons
                    name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                    size={20}
                    color="#888888"
                  />
                </TouchableOpacity>

              </View>
            </View>

            {/* Esqueceu a senha */}
            <TouchableOpacity
              style={styles.forgotContainer}
              onPress={onForgotPassword}
            >
              <Text style={styles.forgotText}>Esqueceu a senha?</Text>
            </TouchableOpacity>

            {errorMessage ? (
              <Text style={styles.errorText}>
                {errorMessage}
              </Text>
            ) : null}

            {/* Botão Entrar */}
            <Button title="Entrar" onPress={handleLogin} fullWidth />

            {/* Divisor */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>ou</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Botão Criar conta */}
            <Button title="Criar nova conta" onPress={onCreateAccount} variant="secondary" fullWidth />

            <Text style={styles.footerText}>Feito para estudantes da URI</Text>
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
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 18,
    paddingHorizontal: 24,
  },
  logoContainer: {
    marginBottom: 12,
  },
  logoPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImage: {
    width: 64,
    height: 64,
    borderRadius: 16,
  },
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
  appName: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  appSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 4,
    paddingBottom: 5,

  },

  // Form
  formContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 24,
  },
  welcomeTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#353535cb',
    marginBottom: 4,
  },
  welcomeSubtitle: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 28,
  },

  // Fields
  fieldGroup: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4e4e4e',
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
  inputPassword: {
    paddingRight: 4,
  },
  eyeButton: {
    padding: 4,
  },

  // Forgot
  forgotContainer: {
    alignSelf: 'flex-end',
    marginTop: 4,
    marginBottom: 24,
  },
  forgotText: {
    fontSize: 14,
    color: BLUE_LIGHT,
    fontWeight: '500',
  },

  // Buttons
  primaryButton: {
    backgroundColor: BLUE_LIGHT,
    borderRadius: 12,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
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
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E5E5',
  },
  dividerText: {
    marginHorizontal: 12,
    fontSize: 13,
    color: '#AAAAAA',
  },
  secondaryButton: {
    borderWidth: 1.5,
    borderColor: '#DDDDDD',
    borderRadius: 12,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    color: '#444444',
    backgroundColor: '#FFFFFF',
  },
  secondaryButtonText: {
    color: '#444444',
    fontSize: 16,
    fontWeight: '600',
  },
  footerText: {
    textAlign: 'center',
    marginTop: 24,
    fontSize: 12,
    color: '#AAAAAA',
  },
  errorText: {
    color: '#E53935',
    fontSize: 14,
    marginBottom: 12,
    textAlign: 'center',
  },
});
