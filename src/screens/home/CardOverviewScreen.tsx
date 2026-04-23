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
import {refreshIssuerTrustList} from '../../services/trust/issuerTrustList';
import {deriveVerifications} from '../../services/trust/deriveVerifications';
import {getTrustList} from '../../services/trust/trustListRegistry';

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

  useEffect(() => {
    refreshIssuerTrustList().catch(() => {});
  }, []);

  const count = currentCredentials.length;

  const displayByCredential = useMemo(() => {
    const map = new Map<string, ReturnType<typeof extractCardDisplay>>();
    for (const c of currentCredentials) {
      map.set(c.id, extractCardDisplay(c.rawJwt));
    }
    return map;
  }, [currentCredentials]);

  const trustListCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const c of currentCredentials) {
      const verifications = deriveVerifications(c.issuerDid);
      for (const v of verifications) {
        counts.set(v.trustList, (counts.get(v.trustList) ?? 0) + 1);
      }
    }
    return counts;
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
            {trustListCounts.size > 0 ? (
              <View style={styles.trustRow}>
                {Array.from(trustListCounts.entries()).map(([id, n]) => {
                  const tl = getTrustList(id);
                  return (
                    <View
                      key={id}
                      style={[
                        styles.trustPill,
                        {
                          borderColor: `${tl.color}44`,
                          backgroundColor: `${tl.color}14`,
                        },
                      ]}>
                      <View
                        style={[styles.trustDot, {backgroundColor: tl.color}]}
                      />
                      <Text style={[styles.trustShort, {color: tl.color}]}>
                        {tl.short}
                      </Text>
                      <Text style={styles.trustCount}>· {n}</Text>
                    </View>
                  );
                })}
              </View>
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
  trustRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 14,
  },
  trustPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 0.5,
  },
  trustDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  trustShort: {
    fontFamily: fonts.mono,
    fontSize: 9,
    letterSpacing: 1.3,
    fontWeight: '500',
  },
  trustCount: {
    fontFamily: fonts.mono,
    fontSize: 9,
    color: colors.text.dim,
    letterSpacing: 1,
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
