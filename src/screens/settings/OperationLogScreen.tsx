import React, {useEffect, useState} from 'react';
import {View, Text, FlatList, StyleSheet, SafeAreaView, TouchableOpacity} from 'react-native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useTranslation} from 'react-i18next';
import type {SettingsStackParamList} from '../../navigation/types';
import {useWallet} from '../../hooks/useWallet';
import {getOperationRecords, type OperationRecord} from '../../db/recordDao';

type Props = NativeStackScreenProps<SettingsStackParamList, 'OperationLog'>;

export default function OperationLogScreen({navigation}: Props) {
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
        <Text style={styles.title}>{t('settings.operationLog')}</Text>
      </View>

      <FlatList
        data={records}
        keyExtractor={item => item.id}
        renderItem={({item}) => (
          <View style={styles.item}>
            <View style={styles.itemHeader}>
              <Text style={styles.itemType}>{item.type}</Text>
              <Text style={styles.itemDate}>
                {new Date(item.createdAt).toLocaleString()}
              </Text>
            </View>
            <Text style={styles.itemDetail}>{item.detail ?? '-'}</Text>
          </View>
        )}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.emptyText}>{t('home.noCredentials')}</Text>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#F9FAFB'},
  header: {flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#FFFFFF'},
  backButton: {fontSize: 16, color: '#2563EB', marginRight: 16},
  title: {fontSize: 18, fontWeight: '700', color: '#1F2937'},
  list: {padding: 16},
  item: {backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, marginBottom: 8},
  itemHeader: {flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4},
  itemType: {fontSize: 14, fontWeight: '600', color: '#1F2937'},
  itemDate: {fontSize: 12, color: '#9CA3AF'},
  itemDetail: {fontSize: 13, color: '#6B7280'},
  emptyText: {fontSize: 14, color: '#9CA3AF', textAlign: 'center', paddingTop: 40},
});
