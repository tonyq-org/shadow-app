import React, {useEffect, useMemo, useState} from 'react';
import {
  Alert,
  View,
  Text,
  FlatList,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import {useTranslation} from 'react-i18next';
import SearchBar from '../../components/SearchBar';
import {fetchTrustList} from '../../services/api/trustList';
import type {Issuer} from '../../services/verification/vcVerifier';

export default function ShowCredentialsScreen() {
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

  const filtered = useMemo(() => {
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
      <Text style={styles.title}>{t('credential.search')}</Text>
      <View style={styles.content}>
        <SearchBar value={query} onChangeText={setQuery} />
        {loading ? (
          <ActivityIndicator style={{marginTop: 40}} color="#2563EB" />
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={item => item.did}
            renderItem={({item}) => (
              <TouchableOpacity
                style={styles.item}
                onPress={() =>
                  Alert.alert(item.orgName ?? item.did, item.did, [
                    {text: t('common.ok')},
                  ])
                }>
                <Text style={styles.itemName}>{item.orgName ?? item.did}</Text>
                <Text style={styles.itemIssuer}>{item.did}</Text>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <Text style={styles.emptyText}>{t('home.noCredentials')}</Text>
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#F9FAFB'},
  title: {fontSize: 24, fontWeight: '700', color: '#1F2937', padding: 24, paddingBottom: 0, backgroundColor: '#FFFFFF'},
  content: {padding: 16, flex: 1},
  item: {backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, marginBottom: 8},
  itemName: {fontSize: 16, fontWeight: '600', color: '#1F2937'},
  itemIssuer: {fontSize: 12, color: '#6B7280', marginTop: 4},
  emptyText: {fontSize: 14, color: '#9CA3AF', textAlign: 'center', paddingTop: 40},
});
