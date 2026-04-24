import React, {useCallback, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useFocusEffect} from '@react-navigation/native';
import {useTranslation} from 'react-i18next';
import type {CredentialStackParamList} from '../../navigation/types';
import {fetchVcCatalog, type VcCatalogItem} from '../../services/protocol/offlineVp';
import {colors, type as fonts} from '../../theme/tokens';

type Props = NativeStackScreenProps<CredentialStackParamList, 'IssuerCatalog'>;

export default function IssuerCatalogScreen({navigation}: Props) {
  const {t} = useTranslation();
  const [items, setItems] = useState<VcCatalogItem[] | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await fetchVcCatalog();
      setItems(list);
    } catch {
      Alert.alert(t('common.error'), t('credential.catalog.loadFailed'));
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useFocusEffect(
    useCallback(() => {
      if (items === null) load();
    }, [items, load]),
  );

  const handlePress = (it: VcCatalogItem) => {
    navigation.navigate('IssuerWebView', {
      url: it.issuerServiceUrl,
      title: it.name,
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backBtn}>← {t('common.back')}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{t('credential.catalog.title')}</Text>
      </View>

      <Text style={styles.subtitle}>{t('credential.catalog.hint')}</Text>

      {loading && items === null ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.brand.brass} />
        </View>
      ) : (
        <FlatList
          data={items ?? []}
          keyExtractor={it => it.vcUid}
          refreshing={loading}
          onRefresh={load}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={styles.sep} />}
          renderItem={({item}) => (
            <TouchableOpacity
              style={styles.row}
              activeOpacity={0.7}
              onPress={() => handlePress(item)}>
              {item.logoUrl ? (
                <Image source={{uri: item.logoUrl}} style={styles.logo} />
              ) : (
                <View style={[styles.logo, styles.logoFallback]}>
                  <Text style={styles.logoInit}>{item.name.slice(0, 1)}</Text>
                </View>
              )}
              <View style={{flex: 1}}>
                <Text style={styles.rowName} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={styles.rowUid} numberOfLines={1}>
                  {item.vcUid}
                </Text>
              </View>
              <Text style={styles.chev}>›</Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            !loading ? (
              <Text style={styles.emptyText}>
                {t('credential.catalog.empty')}
              </Text>
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: colors.surface.bg},
  header: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  backBtn: {
    fontFamily: fonts.sansMedium,
    fontSize: 14,
    color: colors.brand.brass,
  },
  title: {
    fontFamily: fonts.serifTC,
    fontSize: 22,
    color: colors.text.primary,
    fontWeight: '700',
  },
  subtitle: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.text.dim,
    paddingHorizontal: 24,
    paddingTop: 4,
    paddingBottom: 16,
    lineHeight: 19,
  },
  list: {paddingHorizontal: 24, paddingBottom: 40},
  sep: {height: 10},
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.surface.line,
    backgroundColor: colors.surface.surface,
  },
  logo: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: colors.surface.bg,
  },
  logoFallback: {alignItems: 'center', justifyContent: 'center'},
  logoInit: {
    fontFamily: fonts.serif,
    fontSize: 18,
    color: colors.brand.brass,
  },
  rowName: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 15,
    color: colors.text.primary,
  },
  rowUid: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 1,
    color: colors.text.dim,
    marginTop: 2,
  },
  chev: {
    fontFamily: fonts.serif,
    fontSize: 26,
    color: colors.text.dim,
  },
  center: {flex: 1, alignItems: 'center', justifyContent: 'center'},
  emptyText: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.text.mute,
    textAlign: 'center',
    paddingVertical: 48,
  },
});
