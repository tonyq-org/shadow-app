import React, {useEffect, useState} from 'react';
import {View, Text, FlatList, StyleSheet, TouchableOpacity} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useTranslation} from 'react-i18next';
import type {HomeStackParamList} from '../../navigation/types';
import {useWallet} from '../../hooks/useWallet';
import {getOperationRecords, type OperationRecord} from '../../db/recordDao';
import {colors} from '../../theme/tokens';

type Props = NativeStackScreenProps<HomeStackParamList, 'CardRecord'>;

export default function CardRecordScreen({navigation}: Props) {
  const {t} = useTranslation();
  const {currentWallet} = useWallet();
  const [records, setRecords] = useState<OperationRecord[]>([]);

  useEffect(() => {
    if (!currentWallet) return;
    try {
      setRecords(getOperationRecords(currentWallet.id));
    } catch {
      setRecords([]);
    }
  }, [currentWallet]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← {t('common.back')}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{t('home.cardRecord')}</Text>
      </View>

      <FlatList
        data={records}
        keyExtractor={item => item.id}
        renderItem={({item}) => (
          <View style={styles.recordItem}>
            <Text style={styles.recordType}>
              {t(`operations.${item.type}`, {defaultValue: item.type})}
            </Text>
            <Text style={styles.recordDetail}>{item.detail ?? '-'}</Text>
            <Text style={styles.recordDate}>
              {new Date(item.createdAt).toLocaleString()}
            </Text>
          </View>
        )}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>{t('operations.noRecords')}</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: colors.surface.bg},
  header: {flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: colors.surface.surface},
  backButton: {fontSize: 16, color: colors.brand.brass, marginRight: 16},
  title: {fontSize: 18, fontWeight: '700', color: colors.text.primary},
  list: {padding: 16},
  recordItem: {
    backgroundColor: colors.surface.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  recordType: {fontSize: 14, fontWeight: '600', color: colors.text.primary},
  recordDetail: {fontSize: 13, color: colors.text.dim, marginTop: 4},
  recordDate: {fontSize: 12, color: colors.text.mute, marginTop: 4},
  empty: {alignItems: 'center', paddingTop: 80},
  emptyText: {fontSize: 16, color: colors.text.mute},
});
