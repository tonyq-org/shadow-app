import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView} from 'react-native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useTranslation} from 'react-i18next';
import type {SettingsStackParamList} from '../../navigation/types';
import {useAuthStore} from '../../store/authStore';

type Props = NativeStackScreenProps<SettingsStackParamList, 'Setting'>;

export default function SettingScreen({navigation}: Props) {
  const {t} = useTranslation();
  const logout = useAuthStore(s => s.logout);

  const menuItems = [
    {label: t('settings.walletSettings'), onPress: () => navigation.navigate('WalletSetting')},
    {label: t('settings.operationLog'), onPress: () => navigation.navigate('OperationLog')},
    {label: t('settings.faq'), onPress: () => navigation.navigate('FAQ')},
    {label: t('settings.contact'), onPress: () => navigation.navigate('Contact')},
  ];

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>{t('settings.title')}</Text>

      <ScrollView>
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.menuItem}
            onPress={item.onPress}>
            <Text style={styles.menuText}>{item.label}</Text>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>
        ))}

        <View style={styles.divider} />

        <TouchableOpacity style={styles.menuItem} onPress={logout}>
          <Text style={[styles.menuText, styles.logoutText]}>登出</Text>
        </TouchableOpacity>

        <Text style={styles.version}>
          {t('settings.version')} 1.0.0
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#F9FAFB'},
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    padding: 24,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
  },
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
  arrow: {fontSize: 20, color: '#9CA3AF'},
  divider: {height: 16},
  logoutText: {color: '#EF4444'},
  version: {fontSize: 12, color: '#9CA3AF', textAlign: 'center', paddingTop: 32},
});
