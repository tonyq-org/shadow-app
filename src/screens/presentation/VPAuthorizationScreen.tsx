import React, {useEffect, useMemo, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useTranslation} from 'react-i18next';
import type {PresentationStackParamList} from '../../navigation/types';
import {useWallet} from '../../hooks/useWallet';
import {
  parseVPRequest,
  generateVP,
  type PresentationRequest,
} from '../../services/protocol/oid4vp';
import {
  findMatchingCredential,
  extractRequestedClaimKeys,
} from '../../services/protocol/presentationMatch';
import type {DIDDocument} from '../../services/protocol/did';
import {sdJwtDecode} from '../../services/protocol/sdjwt';
import {addOperationRecord, addPresentationRecord} from '../../db/recordDao';
import {isBiometricAvailable, authenticateWithBiometric} from '../../native/BiometricAuth';
import {BiometryErrorCode} from '../../native/BiometricErrors';
import {colors, type as fonts} from '../../theme/tokens';
import CardItem from '../../components/CardItem';
import {IconClose, IconShield, IconCheck} from '../../components/icons';

type Props = NativeStackScreenProps<PresentationStackParamList, 'VPAuthorization'>;

interface FieldRow {
  key: string;
  value: string;
  required: boolean;
}

export default function VPAuthorizationScreen({navigation, route}: Props) {
  const {t} = useTranslation();
  const {qrData, selectedCredentialId} = route.params;
  const {currentWallet, currentCredentials} = useWallet();

  const [request, setRequest] = useState<PresentationRequest | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [authorizing, setAuthorizing] = useState(false);
  const [selectedId, setSelectedId] = useState<string | undefined>(selectedCredentialId);
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const parsed = await parseVPRequest(qrData);
        if (!cancelled) setRequest(parsed);
      } catch (err: unknown) {
        if (!cancelled) setParseError(err instanceof Error ? err.message : String(err));
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
      const match = findMatchingCredential(desc, currentCredentials);
      if (match) return match.id;
    }
    return undefined;
  }, [selectedId, request, currentCredentials]);

  const selectedCredential = currentCredentials.find(c => c.id === autoSelectedId);

  const {fieldRows, requiredKeys} = useMemo(() => {
    if (!selectedCredential || !request) {
      return {fieldRows: [] as FieldRow[], requiredKeys: [] as string[]};
    }
    const reqKeys = new Set<string>();
    for (const desc of request.presentationDefinition.inputDescriptors) {
      for (const k of extractRequestedClaimKeys(desc)) reqKeys.add(k);
    }
    let subject: Record<string, unknown> = {};
    try {
      const decoded = sdJwtDecode(selectedCredential.rawJwt);
      const payload = decoded.payload as Record<string, unknown>;
      const vc = (payload.vc as Record<string, unknown>) ?? payload;
      subject = (vc.credentialSubject as Record<string, unknown>) ?? {};
    } catch {}
    const rows: FieldRow[] = Object.entries(subject)
      .filter(([k]) => k !== '_sd' && k !== '_sd_alg' && k !== 'id')
      .map(([k, v]) => ({
        key: k,
        value: String(v ?? '—'),
        required: reqKeys.has(k),
      }));
    return {fieldRows: rows, requiredKeys: Array.from(reqKeys)};
  }, [selectedCredential, request]);

  useEffect(() => {
    const next: Record<string, boolean> = {};
    fieldRows.forEach(r => {
      next[r.key] = r.required || checked[r.key] !== false;
    });
    setChecked(next);
  }, [fieldRows.map(r => r.key).join('|')]);

  const discloseCount = Object.values(checked).filter(Boolean).length;

  const toggle = (key: string, required: boolean) => {
    if (required) return;
    setChecked(prev => ({...prev, [key]: !prev[key]}));
  };

  const handleAuthorize = async () => {
    if (!request || !currentWallet?.didDocument || !selectedCredential) return;
    if (currentWallet.biometricEnabled) {
      const available = await isBiometricAvailable();
      if (!available) {
        Alert.alert(t('common.error'), t('auth.biometricUnavailable'));
        return;
      }
      const auth = await authenticateWithBiometric(
        t('presentation.authorizePrompt'),
        t('common.cancel'),
      );
      if (!auth.success) {
        if (auth.error.code === BiometryErrorCode.UserCancel) return;
        if (auth.error.code === BiometryErrorCode.Lockout) {
          Alert.alert(t('common.error'), t('auth.biometricLocked'));
          return;
        }
        if (auth.error.code === BiometryErrorCode.LockoutPermanent) {
          Alert.alert(t('common.error'), t('auth.biometricLockedPermanent'));
          return;
        }
        Alert.alert(t('common.error'), t('presentation.biometricRequired'));
        return;
      }
    }
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
      navigation.replace('VPResult', {success, message: result.message});
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      if (currentWallet) addOperationRecord(currentWallet.id, 'present', message);
      navigation.replace('VPResult', {success: false, message});
    } finally {
      setAuthorizing(false);
    }
  };

  if (parseError) {
    return (
      <SafeAreaView style={styles.container}>
        <HeaderClose onPress={() => navigation.goBack()} />
        <View style={styles.center}>
          <Text style={styles.errorText}>{parseError}</Text>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backBtnText}>{t('common.back')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!request) {
    return (
      <SafeAreaView style={styles.container}>
        <HeaderClose onPress={() => navigation.goBack()} />
        <View style={styles.center}>
          <ActivityIndicator color={colors.brand.brass} />
          <Text style={styles.loadingText}>{t('common.loading')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const verifierName = request.clientId ?? request.verifierDid ?? 'VERIFIER';
  const verifierInitial = verifierName.slice(0, 1).toUpperCase();

  return (
    <SafeAreaView style={styles.container}>
      <HeaderClose onPress={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.microLabel}>VERIFIER · REQUEST</Text>
        <Text style={styles.title}>授權出示</Text>

        <View style={styles.verifierCard}>
          <View style={styles.verifierRow}>
            <View style={styles.verifierTile}>
              <Text style={styles.verifierInitial}>{verifierInitial}</Text>
            </View>
            <View style={{flex: 1}}>
              <Text style={styles.verifierName} numberOfLines={1}>
                {verifierName}
              </Text>
              <Text style={styles.verifierDid} numberOfLines={1}>
                {request.verifierDid ?? request.clientId ?? '—'}
              </Text>
            </View>
            <View style={styles.trustedChip}>
              <Text style={styles.trustedText}>TRUSTED</Text>
            </View>
          </View>
          <Text style={styles.verifierBody}>
            驗證方將以 OID4VP 協議接收您授權的欄位。未勾選的資料以 SD-JWT 鹽值遮蔽，驗證方無法反推。
          </Text>
        </View>

        <View style={styles.sectionHeaderRow}>
          <Text style={styles.microLabel}>USING · CREDENTIAL</Text>
          {currentCredentials.length > 1 ? (
            <TouchableOpacity
              activeOpacity={0.6}
              onPress={() =>
                navigation.navigate('ChangeCard', {
                  qrData,
                  currentCardId: autoSelectedId,
                })
              }>
              <Text style={styles.changeLink}>更換 →</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {selectedCredential ? (
          <View style={styles.cardSlot}>
            <CardItem credential={selectedCredential} width={320} />
          </View>
        ) : (
          <Text style={styles.placeholder}>{t('home.noCredentials')}</Text>
        )}

        {fieldRows.length > 0 ? (
          <>
            <Text style={styles.microLabel}>
              {`DISCLOSE · ${discloseCount} · OF · ${fieldRows.length} · FIELDS`}
            </Text>
            <View style={styles.fieldGroup}>
              {fieldRows.map((r, i) => {
                const on = !!checked[r.key];
                return (
                  <TouchableOpacity
                    key={r.key}
                    activeOpacity={0.7}
                    onPress={() => toggle(r.key, r.required)}
                    disabled={r.required}
                    style={[
                      styles.fieldRow,
                      i !== fieldRows.length - 1 && styles.fieldDivider,
                    ]}>
                    <View style={[styles.checkbox, on && styles.checkboxOn]}>
                      {on ? <IconCheck size={10} color={colors.brand.ink} /> : null}
                    </View>
                    <View style={{flex: 1}}>
                      <View style={styles.keyRow}>
                        <Text style={styles.fieldKey}>{r.key.toUpperCase()}</Text>
                        {r.required ? (
                          <Text style={styles.requiredTag}>· REQUIRED</Text>
                        ) : null}
                      </View>
                      <Text style={styles.fieldValue}>
                        {on ? r.value : '••••'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.shieldCallout}>
              <IconShield size={18} color={colors.brand.brass} />
              <Text style={styles.shieldText}>
                僅簽發所選欄位 · 其餘內容以 SD-JWT 鹽值遮蔽，驗證方無法反推。
              </Text>
            </View>
          </>
        ) : null}
      </ScrollView>

      <View style={styles.ctaWrap}>
        <TouchableOpacity
          style={[styles.primaryBtn, !selectedCredential && styles.primaryBtnDisabled]}
          activeOpacity={0.85}
          onPress={handleAuthorize}
          disabled={authorizing || !selectedCredential}>
          {authorizing ? (
            <ActivityIndicator color={colors.brand.ink} />
          ) : (
            <Text style={styles.primaryBtnText}>授權並簽名</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function HeaderClose({onPress}: {onPress: () => void}) {
  return (
    <View style={styles.header}>
      <TouchableOpacity style={styles.closeBtn} onPress={onPress} activeOpacity={0.7}>
        <IconClose size={16} color={colors.text.primary} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: colors.surface.bg},
  header: {paddingHorizontal: 16, paddingTop: 8, paddingBottom: 8},
  closeBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.surface.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {paddingHorizontal: 24, paddingBottom: 140},
  center: {flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24},
  microLabel: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 2,
    color: colors.brand.brass,
    marginTop: 20,
    marginBottom: 8,
  },
  title: {
    fontFamily: fonts.serifTC,
    fontSize: 30,
    color: colors.text.primary,
    fontWeight: '700',
    marginBottom: 24,
  },
  verifierCard: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.surface.line,
    backgroundColor: colors.surface.surface,
    padding: 16,
  },
  verifierRow: {flexDirection: 'row', alignItems: 'center', gap: 12},
  verifierTile: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: colors.brand.brass15,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.brand.brass55,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifierInitial: {
    fontFamily: fonts.serif,
    fontSize: 20,
    color: colors.brand.brass,
  },
  verifierName: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 15,
    color: colors.text.primary,
  },
  verifierDid: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 1,
    color: colors.text.dim,
    marginTop: 2,
  },
  trustedChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(232,201,122,0.18)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.brand.brass55,
  },
  trustedText: {
    fontFamily: fonts.mono,
    fontSize: 9,
    letterSpacing: 1.2,
    color: colors.brand.brass,
  },
  verifierBody: {
    fontFamily: fonts.sans,
    fontSize: 12,
    color: colors.text.dim,
    lineHeight: 18,
    marginTop: 12,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  changeLink: {
    fontFamily: fonts.mono,
    fontSize: 11,
    letterSpacing: 1,
    color: colors.brand.brass,
    marginBottom: 8,
  },
  cardSlot: {alignItems: 'center', marginVertical: 8},
  placeholder: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.text.mute,
    textAlign: 'center',
    paddingVertical: 40,
  },
  fieldGroup: {
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.surface.line,
    backgroundColor: colors.surface.surface,
    paddingHorizontal: 14,
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 14,
    gap: 12,
  },
  fieldDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.surface.line,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: colors.surface.line,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxOn: {
    backgroundColor: colors.brand.brass,
    borderColor: colors.brand.brass,
  },
  keyRow: {flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3},
  fieldKey: {
    fontFamily: fonts.mono,
    fontSize: 11,
    letterSpacing: 1.5,
    color: colors.text.dim,
  },
  requiredTag: {
    fontFamily: fonts.mono,
    fontSize: 9,
    letterSpacing: 1.2,
    color: colors.brand.brass,
  },
  fieldValue: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.text.primary,
  },
  shieldCallout: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 14,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(232,201,122,0.33)',
    backgroundColor: 'rgba(232,201,122,0.08)',
    marginTop: 14,
  },
  shieldText: {
    flex: 1,
    fontFamily: fonts.sans,
    fontSize: 12,
    color: colors.text.dim,
    lineHeight: 18,
  },
  ctaWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 24,
    paddingTop: 14,
    paddingBottom: 24,
    backgroundColor: colors.surface.bg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.surface.line,
  },
  primaryBtn: {
    height: 52,
    borderRadius: 14,
    backgroundColor: colors.brand.brass,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnDisabled: {opacity: 0.4},
  primaryBtnText: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 15,
    color: colors.brand.ink,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  errorText: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.status.danger,
    textAlign: 'center',
    marginBottom: 20,
  },
  loadingText: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.text.dim,
    marginTop: 14,
  },
  backBtn: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.surface.line,
  },
  backBtnText: {
    fontFamily: fonts.sansMedium,
    fontSize: 14,
    color: colors.text.primary,
  },
});
