import React, {useMemo} from 'react';
import {View, Text, Image, StyleSheet, TouchableOpacity, useWindowDimensions} from 'react-native';
import {useTranslation} from 'react-i18next';
import type {Credential} from '../store/walletStore';
import {CredentialStatus} from '../store/walletStore';
import {colors, type as fonts} from '../theme/tokens';
import {
  CardGradient,
  Emblem,
  GuillochePattern,
  HolographicStripe,
  MicrotextBorder,
  type EmblemKey,
} from './emblems';

type CardTone = 'midnight' | 'graphite' | 'ink';

interface Props {
  credential: Credential;
  onPress?: () => void;
  selected?: boolean;
  width?: number;
  tone?: CardTone;
  emblem?: EmblemKey;
  holderName?: string;
  idNumber?: string;
  picture?: string;
}

function pictureUri(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  if (raw.startsWith('data:') || raw.startsWith('http')) return raw;
  // Bare base64 — assume JPEG (TWDIW portraits) and wrap it.
  return `data:image/jpeg;base64,${raw}`;
}

function inferEmblem(credType: string | null): EmblemKey {
  if (!credType) return 'id';
  const lower = credType.toLowerCase();
  if (lower.includes('diploma') || lower.includes('degree') || lower.includes('edu')) return 'diploma';
  if (lower.includes('health') || lower.includes('medical')) return 'health';
  if (lower.includes('driver') || lower.includes('license')) return 'driver';
  if (lower.includes('member') || lower.includes('library')) return 'membership';
  return 'id';
}

function issuerShort(issuerName: string | null, issuerDid: string | null): string {
  if (issuerName) {
    return issuerName
      .toUpperCase()
      .replace(/[^A-Z0-9\u4E00-\u9FFF]+/g, ' · ')
      .trim();
  }
  if (issuerDid) {
    const last = issuerDid.split(':').pop() ?? issuerDid;
    return last.slice(0, 24).toUpperCase();
  }
  return 'ISSUER · AUTHORITY';
}

function formatExpiry(expiresAt: number | null): string {
  if (!expiresAt) return '— · —';
  const d = new Date(expiresAt * 1000);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${mm} · ${yyyy}`;
}

export default function CardItem({
  credential,
  onPress,
  selected,
  width,
  tone = 'midnight',
  emblem,
  holderName,
  idNumber,
  picture,
}: Props) {
  const portrait = pictureUri(picture);
  const {t} = useTranslation();
  const {width: screenWidth} = useWindowDimensions();
  const cardWidth = width ?? Math.min(screenWidth - 48, 354);
  const cardHeight = Math.round(cardWidth * 0.62);

  const verified = credential.status === CredentialStatus.Verified;
  const isExpired =
    credential.expiresAt !== null && credential.expiresAt < Date.now() / 1000;

  const toneColors = colors.cardTone[tone];
  const emblemKey = emblem ?? inferEmblem(credential.credentialType);
  const issuerLabel = useMemo(
    () => issuerShort(credential.issuerName, credential.issuerDid),
    [credential.issuerName, credential.issuerDid],
  );

  const displayName =
    credential.displayName ?? credential.credentialType ?? t('credential.defaultName');
  const holder = holderName ?? '— · —';
  const idLabel = idNumber ?? (credential.id.slice(0, 4).toUpperCase() + ' · ' + credential.id.slice(-8).toUpperCase());
  const validThru = formatExpiry(credential.expiresAt);

  const Container = onPress ? TouchableOpacity : View;
  const hasArtwork = !!credential.displayImage;

  // When the issuer supplies a full-bleed card background, let it own the
  // visual treatment — no gradient/guilloche/holo/scrim — and use dark ink
  // text to read on (typically light) artwork. Matches TWDIW official app.
  if (hasArtwork) {
    const statusBadge = isExpired
      ? {label: t('credential.status.expired'), tone: 'danger' as const}
      : credential.status === CredentialStatus.Revoked
        ? {label: t('credential.status.revoked'), tone: 'danger' as const}
        : credential.status === CredentialStatus.Verified
          ? {label: t('credential.status.verified'), tone: 'ok' as const}
          : {label: t('credential.status.unverified'), tone: 'muted' as const};

    return (
      <Container
        style={[
          styles.wrapper,
          {width: cardWidth, height: cardHeight},
          selected && styles.selected,
        ]}
        activeOpacity={onPress ? 0.85 : 1}
        onPress={onPress}>
        <Image
          source={{uri: credential.displayImage!}}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
        />
        {isExpired && (
          <View
            style={[StyleSheet.absoluteFill, styles.expiredOverlay]}
            pointerEvents="none"
          />
        )}

        <View style={styles.artworkContent} pointerEvents="none">
          <View style={styles.artworkTopRow}>
            <View style={{flex: 1, paddingRight: 12}}>
              <Text style={styles.artworkCategory} numberOfLines={1}>
                {credential.credentialType ?? ' '}
              </Text>
              <Text style={styles.artworkName} numberOfLines={2}>
                {displayName}
              </Text>
            </View>
          </View>

          <View style={styles.artworkBottomRow}>
            <Text style={styles.artworkIdNumber} numberOfLines={1}>
              {idNumber ?? idLabel}
            </Text>
            <View
              style={[
                styles.artworkBadge,
                statusBadge.tone === 'danger' && styles.artworkBadgeDanger,
                statusBadge.tone === 'ok' && styles.artworkBadgeOk,
              ]}>
              <Text
                style={[
                  styles.artworkBadgeText,
                  statusBadge.tone === 'danger' && styles.artworkBadgeTextDanger,
                  statusBadge.tone === 'ok' && styles.artworkBadgeTextOk,
                ]}>
                {statusBadge.label}
              </Text>
            </View>
          </View>
        </View>
      </Container>
    );
  }

  return (
    <Container
      style={[
        styles.wrapper,
        {width: cardWidth, height: cardHeight},
        selected && styles.selected,
      ]}
      activeOpacity={onPress ? 0.85 : 1}
      onPress={onPress}>
      <View style={StyleSheet.absoluteFill}>
        <CardGradient start={toneColors.start} end={toneColors.end} />
      </View>
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <GuillochePattern color={colors.brand.brass} opacity={0.1} />
      </View>
      {verified && (
        <View style={[styles.holoStripe, {right: 30, width: 12}]} pointerEvents="none">
          <HolographicStripe />
        </View>
      )}
      <MicrotextBorder width={cardWidth} height={cardHeight} />

      <View style={styles.content} pointerEvents="none">
        <View style={styles.topRow}>
          <View style={{flex: 1, paddingRight: 12}}>
            <Text style={styles.issuerMono} numberOfLines={1}>
              {issuerLabel}
            </Text>
            <Text style={styles.displayName} numberOfLines={2}>
              {displayName}
            </Text>
          </View>
          {portrait ? (
            <Image source={{uri: portrait}} style={styles.portrait} resizeMode="cover" />
          ) : (
            <Emblem emblem={emblemKey} size={42} color={colors.brand.brass} />
          )}
        </View>

        <View style={styles.bottomBlock}>
          <View style={styles.fieldGrid}>
            <View style={{flex: 1}}>
              <Text style={styles.fieldLabel}>HOLDER</Text>
              <Text style={styles.fieldValue} numberOfLines={1}>{holder}</Text>
            </View>
            <View style={{flex: 1}}>
              <Text style={styles.fieldLabel}>VALID · THRU</Text>
              <Text style={styles.fieldValueMono}>{validThru}</Text>
            </View>
          </View>

          <View style={styles.bottomRow}>
            <Text style={styles.idNumber} numberOfLines={1}>
              {idLabel}
            </Text>
            {verified ? (
              <View style={styles.verifiedChip}>
                <View style={styles.verifiedDot} />
                <Text style={styles.verifiedText}>VERIFIED</Text>
              </View>
            ) : isExpired ? (
              <View style={[styles.verifiedChip, styles.expiredChip]}>
                <Text style={[styles.verifiedText, {color: colors.status.danger}]}>EXPIRED</Text>
              </View>
            ) : credential.status === CredentialStatus.Revoked ? (
              <View style={[styles.verifiedChip, styles.revokedChip]}>
                <Text style={[styles.verifiedText, {color: colors.status.danger}]}>REVOKED</Text>
              </View>
            ) : (
              <View style={[styles.verifiedChip, styles.pendingChip]}>
                <Text style={[styles.verifiedText, {color: colors.text.dim}]}>UNVERIFIED</Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </Container>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: colors.cardTone.midnight.end,
    marginBottom: 16,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 12},
    shadowOpacity: 0.55,
    shadowRadius: 24,
  },
  selected: {
    borderWidth: 1,
    borderColor: colors.brand.brass,
  },
  holoStripe: {
    position: 'absolute',
    top: 0,
    bottom: 0,
  },
  content: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    paddingVertical: 20,
    paddingHorizontal: 22,
    justifyContent: 'space-between',
  },
  bgScrim: {backgroundColor: 'rgba(8,12,20,0.55)'},
  expiredOverlay: {
    backgroundColor: 'rgba(246,241,227,0.55)',
  },
  artworkContent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    paddingVertical: 18,
    paddingHorizontal: 20,
    justifyContent: 'space-between',
  },
  artworkTopRow: {flexDirection: 'row', alignItems: 'flex-start'},
  artworkCategory: {
    fontFamily: fonts.sans,
    fontSize: 11,
    letterSpacing: 0.4,
    color: 'rgba(20,20,20,0.65)',
    marginBottom: 4,
  },
  artworkName: {
    fontFamily: fonts.serifTC ?? fonts.serif,
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.2,
    lineHeight: 24,
    color: '#141414',
  },
  artworkBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(20,20,20,0.08)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(20,20,20,0.18)',
  },
  artworkBadgeDanger: {
    backgroundColor: 'rgba(200,50,50,0.12)',
    borderColor: 'rgba(200,50,50,0.45)',
  },
  artworkBadgeOk: {
    backgroundColor: 'rgba(20,120,70,0.14)',
    borderColor: 'rgba(20,120,70,0.45)',
  },
  artworkBadgeText: {
    fontFamily: fonts.sansMedium,
    fontSize: 10,
    letterSpacing: 0.4,
    color: 'rgba(20,20,20,0.75)',
  },
  artworkBadgeTextDanger: {color: '#8A1F1F'},
  artworkBadgeTextOk: {color: '#1F6B42'},
  artworkIdNumber: {
    fontFamily: fonts.monoMedium,
    fontSize: 13,
    letterSpacing: 1.5,
    color: '#141414',
    opacity: 0.85,
    flex: 1,
    marginRight: 12,
  },
  artworkBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  topRow: {flexDirection: 'row', alignItems: 'flex-start'},
  portrait: {
    width: 52,
    height: 64,
    borderRadius: 6,
    borderWidth: 0.5,
    borderColor: colors.brand.brass66,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  issuerMono: {
    fontFamily: fonts.mono,
    fontSize: 9,
    letterSpacing: 2,
    color: colors.brand.brass,
    opacity: 0.85,
    marginBottom: 6,
  },
  displayName: {
    fontFamily: fonts.serif,
    fontSize: 22,
    letterSpacing: -0.3,
    lineHeight: 24,
    color: colors.text.primary,
  },
  bottomBlock: {},
  fieldGrid: {flexDirection: 'row', gap: 12, marginBottom: 10},
  fieldLabel: {
    fontFamily: fonts.mono,
    fontSize: 8,
    letterSpacing: 1.5,
    color: colors.text.primary,
    opacity: 0.45,
    marginBottom: 2,
  },
  fieldValue: {
    fontFamily: fonts.sansMedium,
    fontSize: 13,
    color: colors.text.primary,
  },
  fieldValueMono: {
    fontFamily: fonts.monoMedium,
    fontSize: 13,
    color: colors.text.primary,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  idNumber: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 1.2,
    color: colors.text.primary,
    opacity: 0.7,
    flex: 1,
    marginRight: 12,
  },
  verifiedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: colors.brand.brass15,
    borderWidth: 0.5,
    borderColor: colors.brand.brass66,
  },
  expiredChip: {
    backgroundColor: 'rgba(232,138,138,0.12)',
    borderColor: 'rgba(232,138,138,0.5)',
  },
  revokedChip: {
    backgroundColor: 'rgba(232,138,138,0.12)',
    borderColor: 'rgba(232,138,138,0.5)',
  },
  pendingChip: {
    backgroundColor: 'rgba(246,241,227,0.08)',
    borderColor: 'rgba(246,241,227,0.2)',
  },
  verifiedDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.brand.brass,
  },
  verifiedText: {
    fontFamily: fonts.mono,
    fontSize: 9,
    letterSpacing: 1,
    color: colors.brand.brass,
  },
});
