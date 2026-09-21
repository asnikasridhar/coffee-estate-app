import React from 'react';
import { Alert, StyleSheet, TouchableOpacity } from 'react-native';
import AppIcon from './AppIcon';

// A tap target, rather than hover text, works on phones and with screen readers.
export default function InfoTip({ title, text }) {
  return <TouchableOpacity accessibilityRole="button" accessibilityLabel={`About ${title}`} accessibilityHint="Opens an explanation" hitSlop={8} style={styles.target} onPress={event => { event?.stopPropagation?.(); Alert.alert(title, text, [{ text: 'Got it' }]); }}>
    <AppIcon name="information-circle-outline" size={19} color="#8a4b20" />
  </TouchableOpacity>;
}
const styles = StyleSheet.create({ target: { minWidth: 36, minHeight: 36, justifyContent: 'center', alignItems: 'center' } });
