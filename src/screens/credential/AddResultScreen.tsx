import React, {useEffect, useRef, useState} from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useTranslation} from 'react-i18next';
import type {CredentialStackParamList} from '../../navigation/types';
import {colors} from '../../theme/tokens';

type Props = NativeStackScreenProps<CredentialStackParamList, 'AddResult'>;

const AUTO_OPEN_SECONDS = 3;

export default function AddResultScreen({navigation, route}: Props) {
  const {t} = useTranslation();
  const {success, message, credentialId} = route.params;

  const [remaining, setRemaining] = useState(AUTO_OPEN_SECONDS);
  const cancelledRef = useRef(false);

  const goToCard = () => {
    cancelledRef.current = true;
    if (!credentialId) {
      navigation.popToTop();
      return;
    }
    navigation.getParent()?.navigate('HomeTab', {
      screen: 'CardInfo',
      params: {credentialId},
      initial: false,
    });
  };

  useEffect(() => {
    if (!success || !credentialId) return;
    let shouldNavigate = false;
    const interval = setInterval(() => {
      if (cancelledRef.current) return;
      setRemaining(r => {
        if (r <= 1) {
          clearInterval(interval);
          shouldNavigate = true;
          return 0;
        }
        return r - 1;
      });
      if (shouldNavigate) {
        shouldNavigate = false;
        goToCard();
      }
    }, 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [success, credentialId]);

  const showViewCard = success && credentialId;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.icon}>{success ? '✅' : '❌'}</Text>
        <Text style={styles.title}>
          {success ? t('credential.addSuccess') : t('credential.addFailed')}
        </Text>
        {message && <Text style={styles.message}>{message}</Text>}
        {showViewCard && remaining > 0 && (
          <Text style={styles.hint}>
            {t('credential.autoOpenHint', {seconds: remaining})}
          </Text>
        )}
      </View>
      {showViewCard ? (
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.button, styles.buttonSecondary]}
            onPress={() => {
              cancelledRef.current = true;
              navigation.popToTop();
            }}>
            <Text style={[styles.buttonText, styles.buttonTextSecondary]}>
              {t('common.done')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.button, styles.buttonPrimary]} onPress={goToCard}>
            <Text style={styles.buttonText}>{t('credential.viewCard')}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          style={[styles.button, styles.buttonPrimary]}
          onPress={() => navigation.popToTop()}>
          <Text style={styles.buttonText}>{t('common.done')}</Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: colors.surface.surface, padding: 24},
  content: {flex: 1, justifyContent: 'center', alignItems: 'center'},
  icon: {fontSize: 64, marginBottom: 24},
  title: {fontSize: 22, fontWeight: '700', color: colors.text.primary, marginBottom: 8},
  message: {fontSize: 14, color: colors.text.dim, textAlign: 'center'},
  hint: {fontSize: 13, color: colors.text.dim, marginTop: 16},
  buttonRow: {flexDirection: 'row', gap: 12},
  button: {borderRadius: 12, paddingVertical: 16, alignItems: 'center', flex: 1},
  buttonPrimary: {backgroundColor: colors.brand.brass},
  buttonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.surface.line,
  },
  buttonText: {color: '#FFFFFF', fontSize: 16, fontWeight: '600'},
  buttonTextSecondary: {color: colors.text.primary},
});
