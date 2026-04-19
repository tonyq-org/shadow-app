import React, {useEffect, useMemo} from 'react';
import {View, Text, FlatList, StyleSheet} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useTranslation} from 'react-i18next';
import type {HomeStackParamList} from '../../navigation/types';
import {useWallet} from '../../hooks/useWallet';
import {useAutoLogout} from '../../hooks/useAutoLogout';
import CardItem from '../../components/CardItem';
import TopChrome from '../../components/TopChrome';
import {colors, type as fonts} from '../../theme/tokens';
import {extractCardDisplay} from '../../utils/credentialDisplay';

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

  const count = currentCredentials.length;
  const issuers = new Set(
    currentCredentials.map(c => c.issuerName ?? c.issuerDid).filter(Boolean),
  ).size;

  const displayByCredential = useMemo(() => {
    const map = new Map<string, ReturnType<typeof extractCardDisplay>>();
    for (const c of currentCredentials) {
      map.set(c.id, extractCardDisplay(c.rawJwt));
    }
    return map;
  }, [currentCredentials]);

  return (
    <SafeAreaView style={styles.container}>
      <TopChrome walletName={currentWallet?.name} subtitle="MAIN · WALLET" />

      <FlatList
        data={currentCredentials}
        keyExtractor={item => item.id}
        renderItem={({item}) => {
          const d = displayByCredential.get(item.id);
          return (
            <CardItem
              credential={item}
              holderName={d?.holder}
              idNumber={d?.idNumber}
              picture={d?.picture}
              onPress={() => navigation.navigate('CardInfo', {credentialId: item.id})}
            />
          );
        }}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.intro}>
            <Text style={styles.microLabel}>MY · CREDENTIALS</Text>
            <View style={styles.titleRow}>
              <Text style={styles.title}>{t('home.title')}</Text>
              {count > 0 ? (
                <Text style={styles.countBadge}>· {count}</Text>
              ) : null}
            </View>
            {count > 0 ? (
              <Text style={styles.subtitle}>
                {t('home.issuersLine', {count: issuers, defaultValue: `由 ${issuers} 個發行者簽發`})}
              </Text>
            ) : null}
          </View>
        }
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
  container: {flex: 1, backgroundColor: colors.surface.bg},
  list: {paddingHorizontal: 24, paddingBottom: 120},
  intro: {marginTop: 8, marginBottom: 24},
  microLabel: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 2,
    color: colors.brand.brass,
    marginBottom: 8,
  },
  titleRow: {flexDirection: 'row', alignItems: 'flex-end', gap: 8},
  title: {
    fontFamily: fonts.serifTC,
    fontSize: 36,
    fontWeight: '700',
    color: colors.text.primary,
    lineHeight: 40,
  },
  countBadge: {
    fontFamily: fonts.mono,
    fontSize: 14,
    color: colors.text.dim,
    marginBottom: 6,
  },
  subtitle: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.text.dim,
    marginTop: 8,
  },
  empty: {alignItems: 'center', paddingTop: 80},
  emptyText: {
    fontFamily: fonts.serif,
    fontSize: 20,
    color: colors.text.primary,
    marginBottom: 8,
  },
  emptyHint: {fontSize: 14, color: colors.text.dim},
});
