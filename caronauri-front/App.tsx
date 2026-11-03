import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import AppNavigator from './AppNavigator';
import { View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as NavigationBar from 'expo-navigation-bar';

export default function App() {
  useEffect(() => {
    // Fundo da barra inferior
    NavigationBar.setBackgroundColorAsync('#424242');

    // Ícones brancos (voltar, home, recentes)
    NavigationBar.setButtonStyleAsync('light');
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar style="light" backgroundColor="rgb(0, 102, 143)" />

      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: 'rgb(0, 102, 143)',
        }}
        edges={['top']}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: '#313131',
          }}
        >
          <SafeAreaView
            style={{ flex: 1 }}
            edges={['bottom']}
          >
            <AppNavigator />
          </SafeAreaView>
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}