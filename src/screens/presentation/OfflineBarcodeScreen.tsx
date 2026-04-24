import React, {useEffect, useRef, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useTranslation} from 'react-i18next';
import type {PresentationStackParamList} from '../../navigation/types';
import {useWallet} from '../../hooks/useWallet';
import {fetchOfflineBarcode} from '../../services/protocol/offlineVp';
import {IconClose} from '../../components/icons';
import {colors, type as fonts} from '../../theme/tokens';

type Props = NativeStackScreenProps<PresentationStackParamList, 'OfflineBarcode'>;

export default function OfflineBarcodeScreen({navigation, route}: Props) {
  const {t} = useTranslation();
  const {verifierModuleUrl, transactionId, scenarioName} = route.params;
  const {currentWallet} = useWallet();

  const [qrcode, setQrcode] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [loading, setLoading] = useState(true);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    if (!currentWallet) return;
    (async () => {
      try {
        const keyTag = `wallet_${currentWallet.id}`;
        const barcode = await fetchOfflineBarcode(
          verifierModuleUrl,
          transactionId,
          keyTag,
        );
        setQrcode(barcode.qrcode);
        setSecondsLeft(barcode.totptimeout);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        Alert.alert(t('common.error'), msg, [
          {text: t('common.ok'), onPress: () => navigation.goBack()},
        ]);
      } finally {
        setLoading(false);
      }
    })();
  }, [verifierModuleUrl, transactionId, currentWallet, navigation, t]);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const id = setInterval(() => {
      setSecondsLeft(s => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(id);
  }, [secondsLeft]);

  const expired = !loading && secondsLeft === 0 && qrcode !== null;

  const dismiss = () => {
    navigation.getParent()?.navigate('HomeTab', {screen: 'CardOverview'});
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.closeBtn}
          onPress={dismiss}
          activeOpacity={0.7}>
          <IconClose size={16} color={colors.text.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Text style={styles.microLabel}>PRESENT · BARCODE</Text>
        <Text style={styles.title}>
          {scenarioName ?? t('presentation.barcode.title')}
        </Text>
        <Text style={styles.subtitle}>
          {t('presentation.barcode.showToStaff')}
        </Text>

        <View style={styles.qrFrame}>
          {loading ? (
            <ActivityIndicator color={colors.brand.brass} />
          ) : qrcode ? (
            <Image
              source={{uri: qrcode}}
              style={[styles.qr, expired && styles.qrExpired]}
              resizeMode="contain"
            />
          ) : null}
          {expired ? (
            <View style={styles.expiredOverlay}>
              <Text style={styles.expiredText}>
                {t('presentation.barcode.expired')}
              </Text>
            </View>
          ) : null}
        </View>

        {!loading && qrcode && !expired ? (
          <View style={styles.timerRow}>
            <View style={styles.timerDot} />
            <Text style={styles.timerText}>
              {t('presentation.barcode.expiresIn', {seconds: secondsLeft})}
            </Text>
          </View>
        ) : null}

        {expired ? (
          <TouchableOpacity
            style={styles.backBtn}
            activeOpacity={0.8}
            onPress={dismiss}>
            <Text style={styles.backBtnText}>{t('common.close')}</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </SafeAreaView>
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
  content: {flex: 1, alignItems: 'center', paddingHorizontal: 24},
  microLabel: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 2,
    color: colors.brand.brass,
    marginBottom: 8,
  },
  title: {
    fontFamily: fonts.serifTC,
    fontSize: 26,
    fontWeight: '700',
    color: colors.text.primary,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.text.dim,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  qrFrame: {
    width: 300,
    height: 300,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.surface.line,
  },
  qr: {width: '100%', height: '100%'},
  qrExpired: {opacity: 0.2},
  expiredOverlay: {
    position: 'absolute',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.72)',
  },
  expiredText: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 14,
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  timerRow: {
    marginTop: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.brand.brass,
  },
  timerText: {
    fontFamily: fonts.mono,
    fontSize: 12,
    letterSpacing: 1,
    color: colors.text.dim,
  },
  backBtn: {
    marginTop: 24,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.surface.line,
  },
  backBtnText: {
    fontFamily: fonts.sansMedium,
    fontSize: 14,
    color: colors.text.primary,
  },
});
