import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity, SafeAreaView} from 'react-native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useTranslation} from 'react-i18next';
import type {CredentialStackParamList} from '../../navigation/types';

type Props = NativeStackScreenProps<CredentialStackParamList, 'AddResult'>;

export default function AddResultScreen({navigation, route}: Props) {
  const {t} = useTranslation();
  const {success, message} = route.params;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.icon}>{success ? '✅' : '❌'}</Text>
        <Text style={styles.title}>
          {success ? t('credential.addSuccess') : t('credential.addFailed')}
        </Text>
        {message && <Text style={styles.message}>{message}</Text>}
      </View>
      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.popToTop()}>
        <Text style={styles.buttonText}>{t('common.done')}</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#FFFFFF', padding: 24},
  content: {flex: 1, justifyContent: 'center', alignItems: 'center'},
  icon: {fontSize: 64, marginBottom: 24},
  title: {fontSize: 22, fontWeight: '700', color: '#1F2937', marginBottom: 8},
  message: {fontSize: 14, color: '#6B7280', textAlign: 'center'},
  button: {backgroundColor: '#2563EB', borderRadius: 12, paddingVertical: 16, alignItems: 'center'},
  buttonText: {color: '#FFFFFF', fontSize: 16, fontWeight: '600'},
});
