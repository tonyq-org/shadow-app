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

  const handleDone = () => {
    // Always reset the PresentationStack to PresentationHome first. The VP
    // flow is often entered cross-tab (ScanQR → VPAuthorization → replace
    // VPResult), leaving the stack with just [VPResult]; popToTop throws
    // "POP_TO_TOP was not handled" and re-entering the tab would land back
    // on the result. Resetting makes the tab return to scenarios/scan entry.
    navigation.reset({index: 0, routes: [{name: 'PresentationHome'}]});
    // On success, route the user to the card list (the natural "done"
    // destination). On failure, stay inside PresentationTab so they can
    // retry from PresentationHome without hunting through tabs.
    if (success) {
      navigation.getParent()?.navigate('HomeTab', {screen: 'CardOverview'});
    }
  };

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
      <TouchableOpacity style={styles.button} onPress={handleDone}>
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
