import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { APP_ENVIRONMENT } from '../config/environment';

export default function EnvironmentWatermark({ label = APP_ENVIRONMENT.watermark }) {
  if (!label) return null;
  return (
    <View pointerEvents="none" style={styles.bar} accessibilityLabel={`${label} environment`}>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}
const styles = StyleSheet.create({
  bar: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#ead8bf', paddingVertical: 3, borderBottomWidth: 1, borderBottomColor: '#dfcfba' },
  label: { color: '#8a4b20', fontSize: 11, fontWeight: '900', letterSpacing: 3 },
});
