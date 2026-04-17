import React from 'react';
import {View, Text, ScrollView, StyleSheet, SafeAreaView, TouchableOpacity} from 'react-native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useTranslation} from 'react-i18next';
import type {HomeStackParamList} from '../../navigation/types';
import {useWalletStore, CredentialStatus} from '../../store/walletStore';
import {sdJwtDecode} from '../../services/protocol/sdjwt';

type Props = NativeStackScreenProps<HomeStackParamList, 'CardInfo'>;

export default function CardInfoScreen({navigation, route}: Props) {
  const {t} = useTranslation();
  const {credentialId} = route.params;
  const credential = useWalletStore(s =>
    s.credentials.find(c => c.id === credentialId),
  );

  if (!credential) {
    return (
      <SafeAreaView style={styles.container}>
        <Text>Credential not found</Text>
      </SafeAreaView>
    );
  }

  let decodedPayload: Record<string, unknown> = {};
  try {
    const decoded = sdJwtDecode(credential.rawJwt);
    decodedPayload = decoded.payload;
  } catch {}

  const credentialSubject =
    (decodedPayload.vc as Record<string, unknown>)?.credentialSubject as
      | Record<string, unknown>
      | undefined;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← {t('common.back')}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{t('credential.detail')}</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            {credential.displayName ?? credential.credentialType ?? t('credential.defaultName')}
          </Text>
          <InfoRow label={t('credential.issuer')} value={credential.issuerName ?? '-'} />
          <InfoRow
            label={t('credential.issuedAt')}
            value={credential.issuedAt ? new Date(credential.issuedAt * 1000).toLocaleDateString() : '-'}
          />
          <InfoRow
            label={t('credential.expiresAt')}
            value={credential.expiresAt ? new Date(credential.expiresAt * 1000).toLocaleDateString() : '-'}
          />
        </View>

        {credentialSubject && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('credential.content')}</Text>
            {Object.entries(credentialSubject)
              .filter(([key]) => key !== '_sd' && key !== '_sd_alg')
              .map(([key, value]) => (
                <InfoRow key={key} label={key} value={String(value)} />
              ))}
          </View>
        )}

        <TouchableOpacity
          style={styles.recordButton}
          onPress={() => navigation.navigate('CardRecord', {credentialId})}>
          <Text style={styles.recordButtonText}>{t('home.cardRecord')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({label, value}: {label: string; value: string}) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#F9FAFB'},
  header: {flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#FFFFFF'},
  backButton: {fontSize: 16, color: '#2563EB', marginRight: 16},
  title: {fontSize: 18, fontWeight: '700', color: '#1F2937'},
  content: {padding: 16},
  card: {backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20, marginBottom: 16},
  cardTitle: {fontSize: 20, fontWeight: '700', color: '#1F2937', marginBottom: 16},
  section: {backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20, marginBottom: 16},
  sectionTitle: {fontSize: 16, fontWeight: '600', color: '#1F2937', marginBottom: 12},
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  infoLabel: {fontSize: 14, color: '#6B7280'},
  infoValue: {fontSize: 14, color: '#1F2937', fontWeight: '500', flex: 1, textAlign: 'right', marginLeft: 16},
  recordButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  recordButtonText: {fontSize: 14, color: '#2563EB', fontWeight: '600'},
});
