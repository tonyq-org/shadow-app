import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import {colors, type as fonts} from '../theme/tokens';
import {IconLog} from './icons';

interface Props {
  walletName?: string;
  walletInitial?: string;
  subtitle?: string;
  onPressLog?: () => void;
}

export default function TopChrome({
  walletName,
  walletInitial,
  subtitle,
  onPressLog,
}: Props) {
  const initial = walletInitial ?? (walletName ? walletName.slice(0, 1) : '·');
  return (
    <View style={styles.row}>
      <View style={styles.left}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initial}</Text>
        </View>
        <View style={{marginLeft: 12}}>
          <Text style={styles.microLabel}>{subtitle ?? 'MAIN · WALLET'}</Text>
          <Text style={styles.walletName} numberOfLines={1}>
            {walletName ?? '—'}
          </Text>
        </View>
      </View>
      {onPressLog ? (
        <TouchableOpacity style={styles.logBtn} onPress={onPressLog} activeOpacity={0.7}>
          <IconLog size={18} color={colors.text.dim} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 8,
  },
  left: {flexDirection: 'row', alignItems: 'center'},
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.brand.brass,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: fonts.serifTC,
    fontSize: 20,
    color: colors.brand.ink,
    fontWeight: '700',
  },
  microLabel: {
    fontFamily: fonts.mono,
    fontSize: 9,
    letterSpacing: 2,
    color: colors.brand.brass,
    marginBottom: 2,
  },
  walletName: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 14,
    color: colors.text.primary,
    fontWeight: '600',
  },
  logBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.surface.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
