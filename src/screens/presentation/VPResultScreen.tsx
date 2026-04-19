import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useTranslation} from 'react-i18next';
import type {PresentationStackParamList} from '../../navigation/types';
import {colors} from '../../theme/tokens';

type Props = NativeStackScreenProps<PresentationStackParamList, 'VPResult'>;

export default function VPResultScreen({navigation, route}: Props) {
  const {t} = useTranslation();
  const {success, message} = route.params;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.icon}>{success ? '✅' : '❌'}</Text>
        <Text style={styles.title}>
          {success
            ? t('presentation.result.success')
            : t('presentation.result.failed')}
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
  container: {flex: 1, backgroundColor: colors.surface.surface, padding: 24},
  content: {flex: 1, justifyContent: 'center', alignItems: 'center'},
  icon: {fontSize: 64, marginBottom: 24},
  title: {fontSize: 22, fontWeight: '700', color: colors.text.primary, marginBottom: 8},
  message: {fontSize: 14, color: colors.text.dim, textAlign: 'center'},
  button: {backgroundColor: colors.brand.brass, borderRadius: 12, paddingVertical: 16, alignItems: 'center'},
  buttonText: {color: '#FFFFFF', fontSize: 16, fontWeight: '600'},
});
