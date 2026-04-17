import React, {useState} from 'react';
import {View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, ActivityIndicator} from 'react-native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useTranslation} from 'react-i18next';
import type {PresentationStackParamList} from '../../navigation/types';

type Props = NativeStackScreenProps<PresentationStackParamList, 'VPAuthorization'>;

export default function VPAuthorizationScreen({navigation, route}: Props) {
  const {t} = useTranslation();
  const {qrData} = route.params;
  const [loading, setLoading] = useState(false);

  // TODO: parse VP request from qrData using oid4vp.parseVPRequest()

  const handleAuthorize = async () => {
    setLoading(true);
    try {
      // TODO: generate VP and send to verifier
      navigation.navigate('VPResult', {success: true});
    } catch (error: any) {
      navigation.navigate('VPResult', {success: false, message: error.message});
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        <Text style={styles.title}>{t('presentation.title')}</Text>

        <View style={styles.verifierCard}>
          <Text style={styles.verifierLabel}>{t('presentation.verifierRequest')}</Text>
          <Text style={styles.verifierName}>驗證方名稱</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('presentation.selectFields')}</Text>
          <Text style={styles.placeholder}>選擇要揭露的欄位...</Text>
        </View>
      </ScrollView>

      <TouchableOpacity
        style={styles.button}
        onPress={handleAuthorize}
        disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.buttonText}>{t('presentation.authorize')}</Text>
        )}
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#F9FAFB'},
  content: {flex: 1, padding: 24},
  title: {fontSize: 24, fontWeight: '700', color: '#1F2937', marginBottom: 24},
  verifierCard: {backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20, marginBottom: 16},
  verifierLabel: {fontSize: 13, color: '#6B7280', marginBottom: 4},
  verifierName: {fontSize: 18, fontWeight: '600', color: '#1F2937'},
  section: {backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20, marginBottom: 16},
  sectionTitle: {fontSize: 16, fontWeight: '600', color: '#1F2937', marginBottom: 12},
  placeholder: {fontSize: 14, color: '#9CA3AF'},
  button: {backgroundColor: '#2563EB', borderRadius: 12, paddingVertical: 16, alignItems: 'center', margin: 24},
  buttonText: {color: '#FFFFFF', fontSize: 16, fontWeight: '600'},
});
