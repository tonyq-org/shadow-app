import React, {useState} from 'react';
import {View, Text, StyleSheet, TouchableOpacity, SafeAreaView} from 'react-native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useTranslation} from 'react-i18next';
import type {SettingsStackParamList} from '../../navigation/types';
import {useWallet} from '../../hooks/useWallet';
import {useAuthStore} from '../../store/authStore';
import CustomAlert from '../../components/CustomAlert';

type Props = NativeStackScreenProps<SettingsStackParamList, 'WalletSetting'>;

export default function WalletSettingScreen({navigation}: Props) {
  const {t} = useTranslation();
  const {currentWallet} = useWallet();
  const logout = useAuthStore(s => s.logout);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);

  const handleDelete = () => {
    // TODO: delete wallet from database
    logout();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← {t('common.back')}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{t('settings.walletSettings')}</Text>
      </View>

      <TouchableOpacity style={styles.menuItem}>
        <Text style={styles.menuText}>{t('settings.changeWalletName')}</Text>
        <Text style={styles.menuValue}>{currentWallet?.name ?? '-'}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.menuItem}>
        <Text style={styles.menuText}>{t('settings.autoLogout')}</Text>
        <Text style={styles.menuValue}>
          {t('settings.autoLogoutMinutes', {minutes: currentWallet?.autoLogoutMinutes ?? 5})}
        </Text>
      </TouchableOpacity>

      <View style={{flex: 1}} />

      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => setShowDeleteAlert(true)}>
        <Text style={styles.deleteText}>{t('settings.deleteWallet')}</Text>
      </TouchableOpacity>

      <CustomAlert
        visible={showDeleteAlert}
        title={t('settings.deleteWallet')}
        message={t('settings.deleteWalletConfirm')}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteAlert(false)}
        destructive
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#F9FAFB'},
  header: {flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#FFFFFF'},
  backButton: {fontSize: 16, color: '#2563EB', marginRight: 16},
  title: {fontSize: 18, fontWeight: '700', color: '#1F2937'},
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  menuText: {fontSize: 16, color: '#1F2937'},
  menuValue: {fontSize: 14, color: '#6B7280'},
  deleteButton: {
    margin: 24,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
  },
  deleteText: {fontSize: 16, fontWeight: '600', color: '#DC2626'},
});
