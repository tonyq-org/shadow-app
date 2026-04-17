import React from 'react';
import {View, Text, FlatList, StyleSheet, SafeAreaView, TouchableOpacity} from 'react-native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useTranslation} from 'react-i18next';
import type {PresentationStackParamList} from '../../navigation/types';
import {useWallet} from '../../hooks/useWallet';
import CardItem from '../../components/CardItem';

type Props = NativeStackScreenProps<PresentationStackParamList, 'ChangeCard'>;

export default function ChangeCardScreen({navigation}: Props) {
  const {t} = useTranslation();
  const {currentCredentials} = useWallet();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← {t('common.back')}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{t('presentation.changeCard')}</Text>
      </View>

      <FlatList
        data={currentCredentials}
        keyExtractor={item => item.id}
        renderItem={({item}) => (
          <CardItem
            credential={item}
            onPress={() => navigation.goBack()}
          />
        )}
        contentContainerStyle={styles.list}
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
});
