import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export const PROVIDER_DEFAULT: any = null;

export const Marker = (_props: any) => {
  // placeholder marker — no-op in the shim
  return null;
};

export default function MapView({ style, children }: any) {
  return (
    <View style={[styles.container, style]}>
      <Text style={styles.text}>Mapa não disponível no preview</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#e6e6e6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { color: '#333', fontSize: 13 },
});
