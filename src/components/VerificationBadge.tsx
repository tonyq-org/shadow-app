// Verification overlay that sits on TOP of the issuer's card artwork.
// Our app does NOT design the card face — the issuer owns that. We contribute
// exactly one thing: a stacked list of trust-list chips (plus a count header)
// telling the holder who vouches for this credential.

import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import Svg, {Circle, Path} from 'react-native-svg';
import {type as fonts} from '../theme/tokens';
import {
  getTrustList,
  type CredentialVerification,
} from '../services/trust/trustListRegistry';

interface Props {
  verifications: CredentialVerification[];
}

function CheckCircle({color, size}: {color: string; size: number}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 14 14">
      <Circle
        cx={7}
        cy={7}
        r={6.5}
        stroke={color}
        strokeWidth={0.8}
        fill={`${color}22`}
      />
      <Path
        d="M4 7.2 L6 9 L10 5"
        stroke={color}
        strokeWidth={1.4}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function WarningCircle({color, size}: {color: string; size: number}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 14 14">
      <Circle
        cx={7}
        cy={7}
        r={6.5}
        stroke={color}
        strokeWidth={0.8}
        fill="transparent"
      />
      <Path
        d="M7 4 V7.5 M7 9.5 V10"
        stroke={color}
        strokeWidth={1.3}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export default function VerificationBadge({verifications}: Props) {
  const verifiedCount = verifications.filter(v => v.status === 'verified')
    .length;

  return (
    <View style={styles.stack} pointerEvents="none">
      {verifiedCount > 0 ? (
        <View style={styles.headerChip}>
          <CheckCircle color="#F6F1E3" size={12} />
          <Text style={styles.headerLabel}>TRUSTED · BY</Text>
          <Text style={styles.headerCount}>· {verifiedCount}</Text>
        </View>
      ) : null}

      {verifications.map((v, i) => {
        const tl = getTrustList(v.trustList);
        const isVerified = v.status === 'verified';
        const color = isVerified ? tl.color : '#A8A8A8';
        return (
          <View
            key={`${v.trustList}-${i}`}
            style={[styles.chip, {borderColor: `${color}66`}]}>
            {isVerified ? (
              <CheckCircle color={color} size={11} />
            ) : (
              <WarningCircle color={color} size={11} />
            )}
            <Text style={[styles.chipLabel, {color}]}>
              {isVerified ? tl.short : 'UNKNOWN'}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  stack: {
    position: 'absolute',
    top: 12,
    left: 12,
    zIndex: 3,
    gap: 4,
    alignItems: 'flex-start',
  },
  headerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(10,11,16,0.82)',
    borderWidth: 0.5,
    borderColor: 'rgba(246,241,227,0.18)',
  },
  headerLabel: {
    fontFamily: fonts.mono,
    fontSize: 8,
    letterSpacing: 1.5,
    color: 'rgba(246,241,227,0.65)',
  },
  headerCount: {
    fontFamily: fonts.mono,
    fontSize: 9,
    color: '#F6F1E3',
    fontWeight: '500',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(10,11,16,0.82)',
    borderWidth: 0.5,
  },
  chipLabel: {
    fontFamily: fonts.mono,
    fontSize: 9,
    letterSpacing: 1.3,
    fontWeight: '500',
  },
});
