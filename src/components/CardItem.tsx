import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import {useTranslation} from 'react-i18next';
import type {Credential} from '../store/walletStore';
import {CredentialStatus} from '../store/walletStore';

interface Props {
  credential: Credential;
  onPress?: () => void;
  selected?: boolean;
}

export default function CardItem({credential, onPress, selected}: Props) {
  const {t} = useTranslation();

  const statusText = {
    [CredentialStatus.Unverified]: t('credential.status.unverified'),
    [CredentialStatus.Verified]: t('credential.status.verified'),
    [CredentialStatus.Revoked]: t('credential.status.revoked'),
  }[credential.status];

  const statusColor = {
    [CredentialStatus.Unverified]: '#F59E0B',
    [CredentialStatus.Verified]: '#10B981',
    [CredentialStatus.Revoked]: '#EF4444',
  }[credential.status];

  const isExpired =
    credential.expiresAt && credential.expiresAt < Date.now() / 1000;

  return (
    <TouchableOpacity
      style={[styles.card, selected && styles.cardSelected]}
      onPress={onPress}
      activeOpacity={0.7}>
      <View style={styles.header}>
        <Text style={styles.displayName} numberOfLines={1}>
          {credential.displayName ?? credential.credentialType ?? t('credential.defaultName')}
        </Text>
        <View style={[styles.statusBadge, {backgroundColor: statusColor + '20'}]}>
          <Text style={[styles.statusText, {color: statusColor}]}>
            {isExpired ? t('credential.status.expired') : statusText}
          </Text>
        </View>
      </View>

      {credential.issuerName && (
        <Text style={styles.issuer}>
          {t('credential.issuer')}: {credential.issuerName}
        </Text>
      )}

      {credential.expiresAt && (
        <Text style={styles.expiry}>
          {t('credential.expiresAt')}: {new Date(credential.expiresAt * 1000).toLocaleDateString()}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  cardSelected: {
    borderColor: '#2563EB',
    borderWidth: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  displayName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  issuer: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 4,
  },
  expiry: {
    fontSize: 12,
    color: '#9CA3AF',
  },
});
