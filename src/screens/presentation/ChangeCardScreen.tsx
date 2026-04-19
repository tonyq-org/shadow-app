import React from 'react';
import {View, Text, FlatList, StyleSheet, TouchableOpacity} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useTranslation} from 'react-i18next';
import type {PresentationStackParamList} from '../../navigation/types';
import {useWallet} from '../../hooks/useWallet';
import CardItem from '../../components/CardItem';
import {colors} from '../../theme/tokens';

type Props = NativeStackScreenProps<PresentationStackParamList, 'ChangeCard'>;

export default function ChangeCardScreen({navigation, route}: Props) {
  const {t} = useTranslation();
  const {currentCredentials} = useWallet();
  const {qrData, currentCardId} = route.params;

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
            selected={item.id === currentCardId}
            onPress={() =>
              navigation.navigate('VPAuthorization', {
                qrData,
                selectedCredentialId: item.id,
              })
            }
          />
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
  container: {flex: 1, backgroundColor: colors.surface.bg},
  header: {flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: colors.surface.surface},
  backButton: {fontSize: 16, color: colors.brand.brass, marginRight: 16},
  title: {fontSize: 18, fontWeight: '700', color: colors.text.primary},
  list: {padding: 16},
  emptyText: {fontSize: 14, color: colors.text.mute, textAlign: 'center', paddingTop: 40},
});
