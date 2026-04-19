import React, {useState} from 'react';
import {Modal, View, Text, StyleSheet, TouchableOpacity, Alert} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useTranslation} from 'react-i18next';
import PinCodeInput from './PinCodeInput';
import LoadingOverlay from './LoadingOverlay';
import {verifyPinAsync} from '../utils/pin';
import {colors, type as fonts} from '../theme/tokens';
import {IconChevron} from './icons';

interface Props {
  visible: boolean;
  title: string;
  pinSalt: string;
  pinHash: string;
  onVerified: () => void;
  onCancel: () => void;
}

export default function PinVerifyModal({
  visible,
  title,
  pinSalt,
  pinHash,
  onVerified,
  onCancel,
}: Props) {
  const {t} = useTranslation();
  const [verifying, setVerifying] = useState(false);

  const handleComplete = async (pin: string) => {
    setVerifying(true);
    try {
      const ok = await verifyPinAsync(pin, pinSalt, pinHash);
      if (ok) {
        onVerified();
      } else {
        Alert.alert(t('auth.loginFailed'), t('auth.wrongPinCode'));
      }
    } finally {
      setVerifying(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onCancel}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            activeOpacity={0.7}
            onPress={onCancel}>
            <IconChevron size={18} color={colors.text.primary} direction="left" />
          </TouchableOpacity>
        </View>
        <View style={styles.content}>
          <Text style={styles.microLabel}>VERIFY · PIN</Text>
          <Text style={styles.title}>{title}</Text>
          <View style={{height: 32}} />
          <PinCodeInput length={6} onComplete={handleComplete} disabled={verifying} />
        </View>
        <LoadingOverlay visible={verifying} message={t('auth.verifyingPin')} />
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: colors.surface.bg},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.surface.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {flex: 1, paddingHorizontal: 28, paddingTop: 20},
  microLabel: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 2,
    color: colors.brand.brass,
    marginBottom: 14,
  },
  title: {
    fontFamily: fonts.serifTC,
    fontSize: 28,
    lineHeight: 38,
    color: colors.text.primary,
    fontWeight: '700',
  },
});
