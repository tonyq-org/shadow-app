import React, {useEffect, useMemo, useState} from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useTranslation} from 'react-i18next';
import type {CredentialStackParamList} from '../../navigation/types';
import SearchBar from '../../components/SearchBar';
import {fetchTrustList} from '../../services/api/trustList';
import type {Issuer} from '../../services/verification/vcVerifier';

type Props = NativeStackScreenProps<CredentialStackParamList, 'SearchCredential'>;

export default function SearchCredentialScreen({navigation}: Props) {
  const {t} = useTranslation();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [issuers, setIssuers] = useState<Issuer[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await fetchTrustList(0, 100);
        if (!cancelled) setIssuers(list);
      } catch {
        if (!cancelled) setIssuers([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const results = useMemo(() => {
    if (!query) return issuers;
    const q = query.toLowerCase();
    return issuers.filter(
      i =>
        (i.orgName ?? '').toLowerCase().includes(q) ||
        (i.did ?? '').toLowerCase().includes(q),
    );
  }, [issuers, query]);

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

        {loading ? (
          <ActivityIndicator style={{marginTop: 40}} color="#2563EB" />
        ) : (
          <FlatList
            data={results}
            keyExtractor={item => item.did}
            renderItem={({item}) => (
              <TouchableOpacity style={styles.resultItem}>
                <Text style={styles.resultName}>{item.orgName ?? item.did}</Text>
                <Text style={styles.resultIssuer}>{item.did}</Text>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <Text style={styles.emptyText}>
                {query ? t('home.noCredentials') : t('credential.search')}
              </Text>
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#F9FAFB'},
  header: {flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#FFFFFF'},
  backButton: {fontSize: 16, color: '#2563EB', marginRight: 16},
  title: {fontSize: 18, fontWeight: '700', color: '#1F2937'},
  content: {padding: 16, flex: 1},
  resultItem: {backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, marginBottom: 8},
  resultName: {fontSize: 16, fontWeight: '600', color: '#1F2937'},
  resultIssuer: {fontSize: 12, color: '#6B7280', marginTop: 4},
  emptyText: {fontSize: 14, color: '#9CA3AF', textAlign: 'center', paddingTop: 40},
});
