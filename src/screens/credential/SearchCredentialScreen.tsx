import React, {useState} from 'react';
import {View, Text, FlatList, StyleSheet, SafeAreaView, TouchableOpacity} from 'react-native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useTranslation} from 'react-i18next';
import type {CredentialStackParamList} from '../../navigation/types';
import SearchBar from '../../components/SearchBar';

type Props = NativeStackScreenProps<CredentialStackParamList, 'SearchCredential'>;

export default function SearchCredentialScreen({navigation}: Props) {
  const {t} = useTranslation();
  const [query, setQuery] = useState('');

  // TODO: fetch available credentials from API
  const results: Array<{id: string; name: string; issuer: string}> = [];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← {t('common.back')}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{t('credential.search')}</Text>
      </View>

      <View style={styles.content}>
        <SearchBar value={query} onChangeText={setQuery} />

        <FlatList
          data={results}
          keyExtractor={item => item.id}
          renderItem={({item}) => (
            <TouchableOpacity style={styles.resultItem}>
              <Text style={styles.resultName}>{item.name}</Text>
              <Text style={styles.resultIssuer}>{item.issuer}</Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              {query ? '找不到相關憑證' : '輸入關鍵字搜尋'}
            </Text>
          }
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#F9FAFB'},
  header: {flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#FFFFFF'},
  backButton: {fontSize: 16, color: '#2563EB', marginRight: 16},
  title: {fontSize: 18, fontWeight: '700', color: '#1F2937'},
  content: {padding: 16},
  resultItem: {backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, marginBottom: 8},
  resultName: {fontSize: 16, fontWeight: '600', color: '#1F2937'},
  resultIssuer: {fontSize: 13, color: '#6B7280', marginTop: 4},
  emptyText: {fontSize: 14, color: '#9CA3AF', textAlign: 'center', paddingTop: 40},
});
