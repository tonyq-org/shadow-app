import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useTranslation} from 'react-i18next';
import type {AuthStackParamList} from '../../navigation/types';
import {colors} from '../../theme/tokens';

type Props = NativeStackScreenProps<AuthStackParamList, 'Terms'>;

const PRIVACY_URL = 'https://digiwallet.tw/privacy/';

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
        style={styles.privacyLink}
        onPress={() => Linking.openURL(PRIVACY_URL)}>
        <Text style={styles.privacyLinkText}>查看完整隱私權政策 →</Text>
      </TouchableOpacity>

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

const TERMS_CONTENT = `台灣影子皮夾 服務條款

1. 服務說明
台灣影子皮夾（TW Shadow Digital Identity Wallet，下稱「本 App」）是一套開源的數位憑證皮夾，遵循 W3C Verifiable Credentials、OID4VCI / OID4VP、SD-JWT 等國際規範。

2. 使用者責任
使用者應妥善保管 PIN 碼與生物辨識資訊。PIN 碼遺失且未備份時，將無法還原皮夾內的憑證。

3. 隱私保護
本 App 不建立帳號、不在雲端儲存任何資料、不使用第三方分析或追蹤 SDK。
憑證以 SQLCipher 加密儲存於本機 SQLite；私鑰存於 iOS Keychain / Android Keystore，受 PIN 與生物辨識保護，不會離開裝置。
完整說明請見本頁下方「查看完整隱私權政策」。

4. 網路請求
本 App 僅在下列情況主動發出請求，且皆由你的動作觸發：
· 下載信任清單（預設為數位發展部端點，可於設定更換）
· 掃描 QR Code 領取憑證（OID4VCI）
· 面對驗證方出示憑證時，送出你逐欄授權的內容（OID4VP）

5. 免責聲明
本軟體以「現狀」提供，不提供任何明示或暗示的擔保。

6. 開源授權
本專案採用 MIT 授權條款，原始碼公開於 GitHub。`;

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
    marginBottom: 12,
  },
  termsText: {
    fontSize: 14,
    color: colors.text.primary,
    lineHeight: 22,
  },
  privacyLink: {
    paddingVertical: 10,
    marginBottom: 12,
  },
  privacyLinkText: {
    color: colors.brand.brass,
    fontSize: 13,
    fontWeight: '500',
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
