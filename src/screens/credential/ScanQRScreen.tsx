import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  Alert,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useFocusEffect} from '@react-navigation/native';
import {useTranslation} from 'react-i18next';
import type {CredentialStackParamList} from '../../navigation/types';
import QRScanner from '../../components/QRScanner';
import LoadingOverlay from '../../components/LoadingOverlay';
import {useWallet} from '../../hooks/useWallet';
import {
  applyVC,
  getCredentialOffer,
  isCredentialOfferQr,
  pickCredentialDisplay,
  type CredentialOffer,
} from '../../services/protocol/oid4vci';
import {isVPAuthorizeQr, getKnownVPRejection} from '../../services/protocol/oid4vp';
import i18n from '../../config/i18n';
import {sdJwtDecode} from '../../services/protocol/sdjwt';
import {resolveDisplayImage} from '../../utils/credentialDisplay';
import type {DIDDocument} from '../../services/protocol/did';
import {saveCredential} from '../../db/credentialDao';
import {addOperationRecord} from '../../db/recordDao';
import {useWalletStore} from '../../store/walletStore';
import {colors, type as fonts} from '../../theme/tokens';

type Props = NativeStackScreenProps<CredentialStackParamList, 'ScanQR'>;

export default function ScanQRScreen({navigation, route}: Props) {
  const {t} = useTranslation();
  const {currentWallet} = useWallet();
  const addCredential = useWalletStore(s => s.addCredential);
  const initialQr = route.params?.initialQr;

  const [busy, setBusy] = useState(!!initialQr);
  const [pendingOffer, setPendingOffer] = useState<{
    qrCode: string;
    offer: CredentialOffer;
  } | null>(null);
  const [txCode, setTxCode] = useState('');
  const [resetKey, setResetKey] = useState(0);

  useFocusEffect(
    useCallback(() => {
      setResetKey(k => k + 1);
    }, []),
  );

  const initialQrConsumed = useRef(false);
  useEffect(() => {
    if (!initialQr || initialQrConsumed.current) return;
    initialQrConsumed.current = true;
    handleScan(initialQr);
  }, [initialQr]);

  const handleScan = async (data: string) => {
    if (!currentWallet?.didDocument) {
      Alert.alert(t('common.error'), t('auth.login'));
      navigation.goBack();
      return;
    }
    if (isVPAuthorizeQr(data)) {
      const rejection = getKnownVPRejection(data);
      if (rejection) {
        Alert.alert(
          t('common.error'),
          t(`presentation.errors.${rejection}`),
          [{text: t('common.ok'), onPress: () => setResetKey(k => k + 1)}],
        );
        return;
      }
      navigation.getParent()?.navigate('PresentationTab', {
        screen: 'VPAuthorization',
        params: {qrData: data},
      });
      return;
    }
    if (!isCredentialOfferQr(data)) {
      Alert.alert(t('credential.addFailed'), t('scan.unsupportedQr'), [
        {text: t('common.cancel'), onPress: () => navigation.goBack(), style: 'cancel'},
        {text: t('common.retry'), onPress: () => setResetKey(k => k + 1)},
      ]);
      return;
    }
    setBusy(true);
    try {
      const offer = await getCredentialOffer(data);
      if (offer.txCode) {
        setPendingOffer({qrCode: data, offer});
        setBusy(false);
        return;
      }
      await runApply(offer, '');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setBusy(false);
      navigation.replace('AddResult', {success: false, message});
    }
  };

  const runApply = async (offer: CredentialOffer, code: string) => {
    if (!currentWallet?.didDocument) return;
    setBusy(true);
    try {
      const didDocument = JSON.parse(currentWallet.didDocument) as DIDDocument;
      const keyTag = `wallet_${currentWallet.id}`;
      const result = await applyVC(keyTag, didDocument, offer, code);

      if (result.code !== '0' || !result.data?.credential) {
        addOperationRecord(currentWallet.id, 'add', result.message);
        navigation.replace('AddResult', {
          success: false,
          message: result.message,
        });
        return;
      }

      const jwt = result.data.credential;
      const issuerDid = result.data.metadata?.credentialIssuer;
      const credentialId = result.data.credentialId;

      let displayName: string | undefined;
      let issuedAt: number | undefined;
      let expiresAt: number | undefined;
      try {
        const decoded = sdJwtDecode(jwt);
        const vc = decoded.payload.vc as Record<string, unknown> | undefined;
        displayName = vc?.name as string | undefined;
        issuedAt = decoded.payload.iat as number | undefined;
        expiresAt = decoded.payload.exp as number | undefined;
      } catch {}

      let displayImage: string | undefined;
      if (result.data.metadata && credentialId) {
        const display = pickCredentialDisplay(
          result.data.metadata.credentialConfigurationsSupported,
          credentialId,
          i18n.language,
        );
        // Issuer-supplied name beats the JWT's vc.name; the credentialId is
        // an opaque key like "00000000_test111" — only use it as a last resort.
        displayName = display?.name ?? displayName ?? credentialId;
        const uri = display?.background_image?.uri ?? display?.logo?.uri;
        displayImage = await resolveDisplayImage(uri);
      } else {
        displayName = displayName ?? credentialId;
      }

      const saved = saveCredential(
        currentWallet.id,
        jwt,
        issuerDid,
        undefined,
        credentialId,
        displayName,
        displayImage,
        issuedAt,
        expiresAt,
      );
      addCredential(saved);
      addOperationRecord(
        currentWallet.id,
        'add',
        displayName ?? credentialId ?? issuerDid,
      );

      navigation.replace('AddResult', {success: true, credentialId: saved.id});
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      addOperationRecord(currentWallet.id, 'add', message);
      navigation.replace('AddResult', {success: false, message});
    } finally {
      setBusy(false);
    }
  };

  const submitTxCode = () => {
    if (!pendingOffer) return;
    const expected = pendingOffer.offer.txCode?.length;
    if (expected && txCode.length !== expected) return;
    const {offer} = pendingOffer;
    setPendingOffer(null);
    setTxCode('');
    runApply(offer, txCode);
  };

  return (
    <SafeAreaView style={styles.container}>
      <QRScanner
        onScan={handleScan}
        onCancel={() => navigation.goBack()}
        active={!busy && pendingOffer === null && !initialQr}
        resetKey={resetKey}
      />
      <Modal
        visible={pendingOffer !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setPendingOffer(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{t('credential.enterOTP')}</Text>
            {pendingOffer?.offer.txCode?.description ? (
              <Text style={styles.modalDesc}>
                {pendingOffer.offer.txCode.description}
              </Text>
            ) : null}
            <TextInput
              style={styles.input}
              value={txCode}
              onChangeText={setTxCode}
              keyboardType={
                pendingOffer?.offer.txCode?.inputMode === 'text'
                  ? 'default'
                  : 'number-pad'
              }
              maxLength={pendingOffer?.offer.txCode?.length}
              autoFocus
              secureTextEntry
            />
            <View style={styles.modalRow}>
              <TouchableOpacity
                style={styles.modalBtn}
                onPress={() => {
                  setPendingOffer(null);
                  setTxCode('');
                  navigation.goBack();
                }}>
                <Text style={styles.modalBtnText}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnPrimary]}
                onPress={submitTxCode}>
                <Text style={[styles.modalBtnText, styles.modalBtnTextPrimary]}>
                  {t('common.confirm')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      <LoadingOverlay visible={busy} message={t('credential.applying')} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#000000'},
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    padding: 32,
  },
  modalCard: {
    backgroundColor: colors.surface.surface,
    borderRadius: 18,
    padding: 24,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.surface.line,
  },
  modalTitle: {
    fontFamily: fonts.serifTC,
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
  },
  modalDesc: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.text.dim,
    marginTop: 8,
  },
  input: {
    marginTop: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.surface.line,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 18,
    letterSpacing: 4,
    textAlign: 'center',
    color: colors.text.primary,
    backgroundColor: 'rgba(246,241,227,0.03)',
  },
  modalRow: {flexDirection: 'row', marginTop: 20, gap: 12},
  modalBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.surface.line,
    backgroundColor: 'transparent',
  },
  modalBtnPrimary: {
    backgroundColor: colors.brand.brass,
    borderColor: colors.brand.brass,
  },
  modalBtnText: {
    fontFamily: fonts.sansMedium,
    fontSize: 14,
    color: colors.text.primary,
    fontWeight: '600',
  },
  modalBtnTextPrimary: {color: colors.brand.ink, fontWeight: '700'},
});
