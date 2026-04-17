import React, {useState} from 'react';
import {View, Text, FlatList, StyleSheet, SafeAreaView} from 'react-native';
import {useTranslation} from 'react-i18next';
import SearchBar from '../../components/SearchBar';

export default function ShowCredentialsScreen() {
  const {t} = useTranslation();
  const [query, setQuery] = useState('');

  // TODO: fetch browsable credentials from API / trust list
  const credentials: Array<{id: string; name: string; issuer: string}> = [];

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>瀏覽憑證</Text>
      <View style={styles.content}>
        <SearchBar value={query} onChangeText={setQuery} />
        <FlatList
          data={credentials}
          keyExtractor={item => item.id}
          renderItem={({item}) => (
            <View style={styles.item}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemIssuer}>{item.issuer}</Text>
            </View>
          )}
          ListEmptyComponent={
            <Text style={styles.emptyText}>暫無可瀏覽的憑證</Text>
          }
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#F9FAFB'},
  title: {fontSize: 24, fontWeight: '700', color: '#1F2937', padding: 24, paddingBottom: 0, backgroundColor: '#FFFFFF'},
  content: {padding: 16},
  item: {backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, marginBottom: 8},
  itemName: {fontSize: 16, fontWeight: '600', color: '#1F2937'},
  itemIssuer: {fontSize: 13, color: '#6B7280', marginTop: 4},
  emptyText: {fontSize: 14, color: '#9CA3AF', textAlign: 'center', paddingTop: 40},
});
