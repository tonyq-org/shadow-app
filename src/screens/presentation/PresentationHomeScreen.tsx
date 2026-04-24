import React, {useCallback, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Image,
  Modal,
  Alert,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useFocusEffect} from '@react-navigation/native';
import {useTranslation} from 'react-i18next';
import type {PresentationStackParamList} from '../../navigation/types';
import QRScanner from '../../components/QRScanner';
import {
  fetchVpScenarios,
  startOfflineTransaction,
  type VpScenario,
} from '../../services/protocol/offlineVp';
import {colors, type as fonts} from '../../theme/tokens';

type Props = NativeStackScreenProps<PresentationStackParamList, 'PresentationHome'>;

export default function PresentationHomeScreen({navigation}: Props) {
  const {t} = useTranslation();
  const [scenarios, setScenarios] = useState<VpScenario[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [starting, setStarting] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await fetchVpScenarios();
      setScenarios(list);
    } catch {
      Alert.alert(
        t('common.error'),
        t('presentation.errors.scenarioListFailed'),
      );
      setScenarios([]);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useFocusEffect(
    useCallback(() => {
      if (scenarios === null) load();
    }, [scenarios, load]),
  );

  const handleScenarioPress = async (sc: VpScenario) => {
    if (starting) return;
    setStarting(sc.vpUid);
    try {
      const tx = await startOfflineTransaction(sc.vpUid, sc.verifierModuleUrl);
      navigation.navigate('VPAuthorization', {
        qrData: tx.deepLink,
        offline: {
          vpUid: tx.vpUid,
          verifierModuleUrl: tx.verifierModuleUrl,
          transactionId: tx.transactionId,
        },
      });
    } catch {
      Alert.alert(
        t('common.error'),
        t('presentation.errors.startTransactionFailed'),
      );
    } finally {
      setStarting(null);
    }
  };

  const handleScanned = (data: string) => {
    setScanning(false);
    navigation.navigate('VPAuthorization', {qrData: data});
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerBar}>
        <View style={{flex: 1}}>
          <Text style={styles.microLabel}>PRESENT · OFFLINE</Text>
          <Text style={styles.title}>{t('presentation.title')}</Text>
        </View>
        <TouchableOpacity
          style={styles.scanBtn}
          activeOpacity={0.8}
          onPress={() => setScanning(true)}>
          <Text style={styles.scanBtnText}>{t('presentation.scanQR')}</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.subtitle}>
        {t('presentation.scenarioListHint')}
      </Text>

      {loading && scenarios === null ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.brand.brass} />
        </View>
      ) : (
        <FlatList
          data={scenarios ?? []}
          keyExtractor={s => s.vpUid}
          refreshing={loading}
          onRefresh={load}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={styles.sep} />}
          renderItem={({item}) => (
            <TouchableOpacity
              style={styles.row}
              activeOpacity={0.7}
              onPress={() => handleScenarioPress(item)}
              disabled={starting !== null}>
              {item.logoUrl ? (
                <Image source={{uri: item.logoUrl}} style={styles.logo} />
              ) : (
                <View style={[styles.logo, styles.logoFallback]}>
                  <Text style={styles.logoInit}>
                    {item.name?.slice(0, 1) ?? '?'}
                  </Text>
                </View>
              )}
              <View style={{flex: 1}}>
                <Text style={styles.rowName} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={styles.rowUid} numberOfLines={1}>
                  {item.vpUid}
                </Text>
              </View>
              {starting === item.vpUid ? (
                <ActivityIndicator color={colors.brand.brass} />
              ) : (
                <Text style={styles.chev}>›</Text>
              )}
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            !loading ? (
              <Text style={styles.emptyText}>
                {t('presentation.noScenarios')}
              </Text>
            ) : null
          }
        />
      )}

      <Modal
        visible={scanning}
        animationType="slide"
        onRequestClose={() => setScanning(false)}>
        <QRScanner
          active={scanning}
          onScan={handleScanned}
          onCancel={() => setScanning(false)}
        />
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: colors.surface.bg},
  headerBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 4,
    gap: 12,
  },
  microLabel: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 2,
    color: colors.brand.brass,
    marginBottom: 6,
  },
  title: {
    fontFamily: fonts.serifTC,
    fontSize: 28,
    color: colors.text.primary,
    fontWeight: '700',
  },
  subtitle: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.text.dim,
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 12,
    lineHeight: 19,
  },
  scanBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.surface.line,
    backgroundColor: colors.surface.surface,
  },
  scanBtnText: {
    fontFamily: fonts.sansMedium,
    fontSize: 12,
    letterSpacing: 0.5,
    color: colors.text.primary,
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
