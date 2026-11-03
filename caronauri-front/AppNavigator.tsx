// AppNavigator.tsx
// Navegação principal do CaronaURI usando React Navigation
//
// Instalação necessária:
//   npm install @react-navigation/native @react-navigation/native-stack @react-navigation/bottom-tabs
//   npm install react-native-screens react-native-safe-area-context

import React, { useState } from 'react';
import { NavigationContainer, NavigatorScreenParams } from '@react-navigation/native';
import {
  createNativeStackNavigator,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';
import {
  createBottomTabNavigator,
  BottomTabScreenProps,
} from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// ─── Importação das telas ──────────────────────────────────────────────────────
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import HomeScreen from './src/screens/HomeScreen';
import PublicarScreen from './src/screens/PublicarScreen';
import AvaliacoesScreen from './src/screens/AvaliacoesScreen';
import { PerfilScreen, EditarPerfilScreen } from './src/screens/PerfilScreen';
import DetalhesCarona from './src/screens/DetalhesCarona';
import DetalhesCaronaView from './src/screens/DetalhesCaronaView';
import { COLORS } from './src/types';

// ─── Tipagem das rotas ─────────────────────────────────────────────────────────

// Stack raiz (auth + app)
type DetailsStackParamList = {
  Detalhes: { ride: any };
  DetalhesView: { ride: any };
};

export type RootStackParamList = {
  Auth: undefined;
  App: undefined;
  DetalhesStack: NavigatorScreenParams<DetailsStackParamList> | undefined;
};

// Stack de autenticação
export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

// Tabs principais
export type TabParamList = {
  Home: undefined;
  Publicar: undefined;
  Avaliacoes: undefined;
  Perfil: undefined;
};

// Stack do perfil (Perfil + EditarPerfil)
export type PerfilStackParamList = {
  Perfil: undefined;
  EditarPerfil: undefined;
};

// ─── Navigators ───────────────────────────────────────────────────────────────
const RootStack = createNativeStackNavigator<RootStackParamList>();
const DetailsStack = createNativeStackNavigator<DetailsStackParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();
const PerfilStack = createNativeStackNavigator<PerfilStackParamList>();

// ─── Auth Stack ────────────────────────────────────────────────────────────────
function AuthNavigator({
  onLogin,
  onRegister,
}: {
  onLogin?: () => void;
  onRegister?: () => void;
}) {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login">
        {(props) => (
          <LoginScreen
            {...props}
            onLogin={() => {
              onLogin?.();
            }}
            onCreateAccount={() => props.navigation.navigate('Register')}
          />
        )}
      </AuthStack.Screen>

      <AuthStack.Screen name="Register">
        {(props) => (
          <RegisterScreen
            {...props}
            onRegister={() => {
              onRegister?.();
            }}
            onGoToLogin={() => props.navigation.navigate('Login')}
          />
        )}
      </AuthStack.Screen>
    </AuthStack.Navigator>
  );
}

// ─── Perfil Stack (Perfil + Editar) ───────────────────────────────────────────
function PerfilNavigator({ onLogout }: { onLogout?: () => void }) {
  return (
    <PerfilStack.Navigator screenOptions={{ headerShown: false }}>
      <PerfilStack.Screen name="Perfil">
        {(props) => <PerfilScreen {...props} onLogout={onLogout} />}
      </PerfilStack.Screen>
      <PerfilStack.Screen name="EditarPerfil" component={EditarPerfilScreen} />
    </PerfilStack.Navigator>
  );
}

// ─── Bottom Tab Navigator ──────────────────────────────────────────────────────
function AppTabs({ onLogout }: { onLogout?: () => void }) {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: COLORS.primaryLight,
        tabBarInactiveTintColor: COLORS.textLight,
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarIcon: ({ focused, color, size }) => {
          const icons: Record<keyof TabParamList, { active: string; inactive: string }> = {
            Home:       { active: 'home',        inactive: 'home-outline' },
            Publicar:   { active: 'add-circle',  inactive: 'add-circle-outline' },
            Avaliacoes: { active: 'star',        inactive: 'star-outline' },
            Perfil:     { active: 'person',      inactive: 'person-outline' },
          };
          const name = focused ? icons[route.name].active : icons[route.name].inactive;
          return <Ionicons name={name as any} size={22} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarLabel: 'Início' }} />
      <Tab.Screen name="Publicar" component={PublicarScreen} options={{ tabBarLabel: 'Publicar' }} />
      <Tab.Screen name="Avaliacoes" component={AvaliacoesScreen} options={{ tabBarLabel: 'Avaliações' }} />
      <Tab.Screen name="Perfil">{() => <PerfilNavigator onLogout={onLogout} />}</Tab.Screen>
    </Tab.Navigator>
  );
}

function DetailsNavigator() {
  return (
    <DetailsStack.Navigator screenOptions={{ headerShown: false }}>
      <DetailsStack.Screen
        name="Detalhes"
        component={DetalhesCarona}
        initialParams={{ ride: undefined }}
      />
      <DetailsStack.Screen
        name="DetalhesView"
        component={DetalhesCaronaView}
        initialParams={{ ride: undefined }}
      />
    </DetailsStack.Navigator>
  );
}

// ─── Root Navigator ────────────────────────────────────────────────────────────
// Controla se o usuário está autenticado ou não.
// Em produção, troque `isLoggedIn` por um contexto de auth real (ex: AsyncStorage, Zustand, Context API).

export default function AppNavigator() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  return (
    <NavigationContainer>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {isLoggedIn ? (
          <>
            <RootStack.Screen name="App">
              {() => <AppTabs onLogout={() => setIsLoggedIn(false)} />}
            </RootStack.Screen>
            <RootStack.Screen name="DetalhesStack" component={DetailsNavigator} />
          </>
        ) : (
          <RootStack.Screen name="Auth">
            {() => <AuthNavigator onLogin={() => setIsLoggedIn(true)} onRegister={() => setIsLoggedIn(true)}/>}
          </RootStack.Screen>
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
}

// ─── Estilos ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 6,
    paddingBottom: 8,
    height: 62,
  },
  tabBarLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
});
