import React, {useEffect} from 'react';
import {View, Text, StyleSheet, ActivityIndicator} from 'react-native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import type {AuthStackParamList} from '../../navigation/types';
import {useWallet} from '../../hooks/useWallet';

type Props = NativeStackScreenProps<AuthStackParamList, 'Splash'>;

export default function SplashScreen({navigation}: Props) {
  const {loadWallets} = useWallet();

  useEffect(() => {
    const timer = setTimeout(() => {
      const wallets = loadWallets();
      if (wallets.length > 0) {
        navigation.replace('Login');
      } else {
        navigation.replace('Welcome');
      }
    }, 1500);
    return () => clearTimeout(timer);
  }, [navigation, loadWallets]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Shadow Wallet</Text>
      <Text style={styles.subtitle}>Digital Credential Wallet</Text>
      <ActivityIndicator size="large" color="#2563EB" style={styles.spinner} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 48,
  },
  spinner: {
    marginTop: 24,
  },
});
