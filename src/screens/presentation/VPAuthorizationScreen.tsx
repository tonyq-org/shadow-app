import React, {useEffect, useMemo, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useTranslation} from 'react-i18next';
import type {PresentationStackParamList} from '../../navigation/types';
import {useWallet} from '../../hooks/useWallet';
import {
  parseVPRequest,
  generateVP,
  type PresentationRequest,
} from '../../services/protocol/oid4vp';
import type {DIDDocument} from '../../services/protocol/did';
import {addOperationRecord, addPresentationRecord} from '../../db/recordDao';

type Props = NativeStackScreenProps<PresentationStackParamList, 'VPAuthorization'>;

export default function VPAuthorizationScreen({navigation, route}: Props) {
  const {t} = useTranslation();
  const {qrData, selectedCredentialId} = route.params;
  const {currentWallet, currentCredentials} = useWallet();

  const [request, setRequest] = useState<PresentationRequest | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [authorizing, setAuthorizing] = useState(false);
  const [selectedId, setSelectedId] = useState<string | undefined>(
    selectedCredentialId,
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const parsed = await parseVPRequest(qrData);
        if (!cancelled) setRequest(parsed);
      } catch (err: unknown) {
        if (!cancelled) {
          setParseError(err instanceof Error ? err.message : String(err));
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [qrData]);

  useEffect(() => {
    if (selectedCredentialId) setSelectedId(selectedCredentialId);
  }, [selectedCredentialId]);

  const autoSelectedId = useMemo(() => {
    if (selectedId) return selectedId;
    if (!request) return undefined;
    for (const desc of request.presentationDefinition.inputDescriptors) {
      const match = currentCredentials.find(c => c.credentialType === desc.id);
      if (match) return match.id;
    }
    return currentCredentials[0]?.id;
  }, [selectedId, request, currentCredentials]);

  const selectedCredential = currentCredentials.find(
    c => c.id === autoSelectedId,
  );

  const handleAuthorize = async () => {
    if (!request || !currentWallet?.didDocument || !selectedCredential) return;
    setAuthorizing(true);
    try {
      const didDocument = JSON.parse(currentWallet.didDocument) as DIDDocument;
      const keyTag = `wallet_${currentWallet.id}`;

      const result = await generateVP(keyTag, didDocument, request, [
        {jwt: selectedCredential.rawJwt},
      ]);

      const success = result.code === '0';
      addPresentationRecord(
        currentWallet.id,
        request.verifierDid ?? request.clientId ?? null,
        [selectedCredential.id],
        success ? 1 : 0,
      );
      addOperationRecord(
        currentWallet.id,
        'present',
        request.verifierDid ?? request.clientId ?? undefined,
      );

      navigation.replace('VPResult', {
        success,
        message: result.message,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      addOperationRecord(currentWallet.id, 'present', message);
      navigation.replace('VPResult', {success: false, message});
    } finally {
      setAuthorizing(false);
    }
  };

  if (parseError) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Text style={styles.errorText}>{parseError}</Text>
          <TouchableOpacity
            style={styles.button}
            onPress={() => navigation.goBack()}>
            <Text style={styles.buttonText}>{t('common.back')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!request) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>{t('common.loading')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        <Text style={styles.title}>{t('presentation.title')}</Text>

        <View style={styles.verifierCard}>
          <Text style={styles.verifierLabel}>{t('presentation.verifierRequest')}</Text>
          <Text style={styles.verifierName}>
            {request.verifierDid ?? request.clientId ?? '-'}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('presentation.selectFields')}</Text>
          {request.presentationDefinition.inputDescriptors.map(desc => (
            <View key={desc.id} style={styles.descriptor}>
              <Text style={styles.descriptorName}>{desc.name ?? desc.id}</Text>
              {desc.purpose ? (
                <Text style={styles.descriptorPurpose}>{desc.purpose}</Text>
              ) : null}
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {t('presentation.selectCredential')}
            </Text>
            {currentCredentials.length > 1 ? (
              <TouchableOpacity
                onPress={() =>
                  navigation.navigate('ChangeCard', {
                    qrData,
                    currentCardId: autoSelectedId,
                  })
                }>
                <Text style={styles.changeLink}>
                  {t('presentation.changeCard')}
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>
          {selectedCredential ? (
            <View style={styles.descriptor}>
              <Text style={styles.descriptorName}>
                {selectedCredential.displayName ??
                  selectedCredential.credentialType ??
                  selectedCredential.id}
              </Text>
              <Text style={styles.descriptorPurpose}>
                {selectedCredential.issuerName ??
                  selectedCredential.issuerDid ??
                  ''}
              </Text>
            </View>
          ) : (
            <Text style={styles.placeholder}>{t('home.noCredentials')}</Text>
          )}
        </View>
      </ScrollView>

      <TouchableOpacity
        style={[styles.button, !selectedCredential && styles.buttonDisabled]}
        onPress={handleAuthorize}
        disabled={authorizing || !selectedCredential}>
        {authorizing ? (
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
  center: {flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24},
  title: {fontSize: 24, fontWeight: '700', color: '#1F2937', marginBottom: 24},
  verifierCard: {backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20, marginBottom: 16},
  verifierLabel: {fontSize: 13, color: '#6B7280', marginBottom: 4},
  verifierName: {fontSize: 16, fontWeight: '600', color: '#1F2937'},
  section: {backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20, marginBottom: 16},
  sectionHeader: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12},
  sectionTitle: {fontSize: 16, fontWeight: '600', color: '#1F2937'},
  changeLink: {fontSize: 13, color: '#2563EB', fontWeight: '600'},
  descriptor: {paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#F3F4F6'},
  descriptorName: {fontSize: 15, color: '#1F2937'},
  descriptorPurpose: {fontSize: 13, color: '#6B7280', marginTop: 2},
  placeholder: {fontSize: 14, color: '#9CA3AF'},
  errorText: {fontSize: 14, color: '#DC2626', textAlign: 'center', marginBottom: 24},
  loadingText: {fontSize: 14, color: '#6B7280', marginTop: 16},
  button: {backgroundColor: '#2563EB', borderRadius: 12, paddingVertical: 16, alignItems: 'center', margin: 24},
  buttonDisabled: {backgroundColor: '#9CA3AF'},
  buttonText: {color: '#FFFFFF', fontSize: 16, fontWeight: '600'},
});
