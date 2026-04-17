import React, {useEffect} from 'react';
import {View, Text, FlatList, StyleSheet, SafeAreaView} from 'react-native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useTranslation} from 'react-i18next';
import type {HomeStackParamList} from '../../navigation/types';
import {useWallet} from '../../hooks/useWallet';
import {useAutoLogout} from '../../hooks/useAutoLogout';
import CardItem from '../../components/CardItem';

type Props = NativeStackScreenProps<HomeStackParamList, 'CardOverview'>;

export default function CardOverviewScreen({navigation}: Props) {
  const {t} = useTranslation();
  const {currentWallet, currentCredentials, loadCredentials} = useWallet();
  useAutoLogout();

  useEffect(() => {
    if (currentWallet) {
      loadCredentials(currentWallet.id);
    }
  }, [currentWallet, loadCredentials]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('home.title')}</Text>
        {currentWallet && (
          <Text style={styles.walletName}>{currentWallet.name}</Text>
        )}
      </View>

      <FlatList
        data={currentCredentials}
        keyExtractor={item => item.id}
        renderItem={({item}) => (
          <CardItem
            credential={item}
            onPress={() => navigation.navigate('CardInfo', {credentialId: item.id})}
          />
        )}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>{t('home.noCredentials')}</Text>
            <Text style={styles.emptyHint}>{t('home.noCredentialsHint')}</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#F9FAFB'},
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
  },
  title: {fontSize: 24, fontWeight: '700', color: '#1F2937'},
  walletName: {fontSize: 14, color: '#2563EB', fontWeight: '600'},
  list: {padding: 16},
  empty: {alignItems: 'center', paddingTop: 80},
  emptyText: {fontSize: 18, fontWeight: '600', color: '#9CA3AF', marginBottom: 8},
  emptyHint: {fontSize: 14, color: '#D1D5DB'},
});
