import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useTranslation} from 'react-i18next';
import type {AuthStackParamList} from '../../navigation/types';
import {colors} from '../../theme/tokens';

type Props = NativeStackScreenProps<AuthStackParamList, 'Terms'>;

export default function TermsScreen({navigation}: Props) {
  const {t} = useTranslation();
  const [agreed, setAgreed] = useState(false);

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>{t('auth.termsTitle')}</Text>

      <ScrollView style={styles.scrollView}>
        <Text style={styles.termsText}>
          {TERMS_CONTENT}
        </Text>
      </ScrollView>

      <TouchableOpacity
        style={styles.checkboxRow}
        onPress={() => setAgreed(!agreed)}>
        <View style={[styles.checkbox, agreed && styles.checkboxChecked]}>
          {agreed && <Text style={styles.checkmark}>✓</Text>}
        </View>
        <Text style={styles.checkboxLabel}>{t('auth.termsAgree')}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, !agreed && styles.buttonDisabled]}
        onPress={() => navigation.navigate('CreateWalletName')}
        disabled={!agreed}>
        <Text style={styles.buttonText}>{t('common.next')}</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const TERMS_CONTENT = `Shadow Wallet 服務條款

1. 服務說明
Shadow Wallet 是一個開源的數位憑證管理工具，遵循 W3C Verifiable Credentials 標準。

2. 使用者責任
使用者應妥善保管 PIN 碼和生物辨識資訊。遺失 PIN 碼將無法存取皮夾內的憑證。

3. 隱私保護
本應用程式不會收集或傳送使用者的個人資訊至第三方。所有憑證資料均加密儲存在本機裝置上。

4. 免責聲明
本軟體以「現狀」提供，不提供任何明示或暗示的擔保。

5. 開源授權
本專案採用 MIT 授權條款。`;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface.surface,
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 16,
  },
  scrollView: {
    flex: 1,
    backgroundColor: colors.surface.bg,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  termsText: {
    fontSize: 14,
    color: colors.text.primary,
    lineHeight: 22,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.surface.line,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  checkboxChecked: {
    backgroundColor: colors.brand.brass,
    borderColor: colors.brand.brass,
  },
  checkmark: {
    color: colors.brand.ink,
    fontSize: 14,
    fontWeight: '700',
  },
  checkboxLabel: {
    fontSize: 14,
    color: colors.text.primary,
    flex: 1,
  },
  button: {
    backgroundColor: colors.brand.brass,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: colors.brand.ivory15,
  },
  buttonText: {
    color: colors.brand.ink,
    fontSize: 16,
    fontWeight: '600',
  },
});
