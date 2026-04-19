import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useTranslation} from 'react-i18next';
import type {SettingsStackParamList} from '../../navigation/types';
import {useAuthStore} from '../../store/authStore';
import {useWallet} from '../../hooks/useWallet';
import {useBiometricToggle} from '../../hooks/useBiometricToggle';
import {isBiometricAvailable} from '../../native/BiometricAuth';
import PinVerifyModal from '../../components/PinVerifyModal';
import {colors, type as fonts} from '../../theme/tokens';
import {IconChevron, IconShield, IconFingerprint, IconLog} from '../../components/icons';

type Props = NativeStackScreenProps<SettingsStackParamList, 'Setting'>;

type RowType =
  | {kind: 'chevron'; onPress: () => void; value?: string}
  | {kind: 'value'; value: string; onPress?: () => void}
  | {kind: 'toggle'; value: boolean; onChange: (v: boolean) => void};

interface Row {
  icon: React.ReactNode;
  label: string;
  right: RowType;
}

export default function SettingScreen({navigation}: Props) {
  const {t} = useTranslation();
  const logout = useAuthStore(s => s.logout);
  const {currentWallet} = useWallet();
  const [bioSupported, setBioSupported] = useState(false);
  const {askingPin, toggle, onPinVerified, cancelPinPrompt} = useBiometricToggle(currentWallet);

  useEffect(() => {
    isBiometricAvailable().then(setBioSupported);
  }, []);

  const didShort = shortDid(currentWallet?.didDocument ?? null);
  const initial = currentWallet?.name?.slice(0, 1) ?? '·';

  const securityRows: Row[] = [
    {
      icon: <IconShield size={14} color={colors.text.dim} />,
      label: t('settings.changePinCode'),
      right: {kind: 'chevron', onPress: () => navigation.navigate('WalletSetting')},
    },
    ...(bioSupported
      ? [
          {
            icon: <IconFingerprint size={14} color={colors.text.dim} />,
            label: t('settings.biometricLogin'),
            right: {
              kind: 'toggle' as const,
              value: currentWallet?.biometricEnabled ?? false,
              onChange: toggle,
            },
          },
        ]
      : []),
  ];

  const dataRows: Row[] = [
    {
      icon: <IconLog size={14} color={colors.text.dim} />,
      label: t('settings.operationLog'),
      right: {kind: 'chevron', onPress: () => navigation.navigate('OperationLog')},
    },
    {
      icon: <IconShield size={14} color={colors.text.dim} />,
      label: t('settings.autoLogout'),
      right: {
        kind: 'value',
        value: t('settings.autoLogoutMinutes', {minutes: currentWallet?.autoLogoutMinutes ?? 5}),
        onPress: () => navigation.navigate('WalletSetting'),
      },
    },
  ];

  const aboutRows: Row[] = [
    {
      icon: <IconShield size={14} color={colors.text.dim} />,
      label: t('settings.faq'),
      right: {kind: 'chevron', onPress: () => {}},
    },
    {
      icon: <IconShield size={14} color={colors.text.dim} />,
      label: t('settings.contact'),
      right: {kind: 'chevron', onPress: () => {}},
    },
    {
      icon: <IconShield size={14} color={colors.text.dim} />,
      label: t('settings.version'),
      right: {kind: 'value', value: '1.0.0'},
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.versionLabel}>SETTINGS · v1.0.0</Text>
        <Text style={styles.title}>{t('settings.title')}</Text>

        <TouchableOpacity
          style={styles.identity}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('WalletSetting')}>
          <View style={styles.identityAvatar}>
            <Text style={styles.identityInitial}>{initial}</Text>
          </View>
          <View style={{flex: 1}}>
            <Text style={styles.identityLabel}>MAIN · WALLET</Text>
            <Text style={styles.identityName}>{currentWallet?.name ?? '—'}</Text>
            <Text style={styles.identityDid} numberOfLines={1}>
              {didShort}
            </Text>
          </View>
          <IconChevron size={14} color={colors.text.dim} />
        </TouchableOpacity>

        <Section title="SECURITY" rows={securityRows} />
        <Section title="DATA" rows={dataRows} />
        <Section title="ABOUT" rows={aboutRows} />

        <TouchableOpacity style={styles.logoutBtn} activeOpacity={0.7} onPress={logout}>
          <Text style={styles.logoutText}>{t('settings.logout')}</Text>
        </TouchableOpacity>
      </ScrollView>
      {currentWallet ? (
        <PinVerifyModal
          visible={askingPin}
          title={t('auth.verifyPinToEnableBiometric')}
          pinSalt={currentWallet.pinSalt}
          pinHash={currentWallet.pinHash}
          onVerified={onPinVerified}
          onCancel={cancelPinPrompt}
        />
      ) : null}
    </SafeAreaView>
  );
}

function Section({title, rows}: {title: string; rows: Row[]}) {
  return (
    <View style={styles.sectionBlock}>
      <Text style={styles.sectionLabel}>{title}</Text>
      <View style={styles.sectionGroup}>
        {rows.map((r, i) => (
          <SettingRow key={r.label} row={r} last={i === rows.length - 1} />
        ))}
      </View>
    </View>
  );
}

function SettingRow({row, last}: {row: Row; last: boolean}) {
  const Container = row.right.kind === 'toggle' ? View : TouchableOpacity;
  const onPress =
    row.right.kind === 'chevron'
      ? row.right.onPress
      : row.right.kind === 'value'
      ? row.right.onPress
      : undefined;

  return (
    <Container
      style={[styles.row, !last && styles.rowDivider]}
      activeOpacity={0.7}
      {...(onPress ? {onPress} : {})}>
      <View style={styles.iconTile}>{row.icon}</View>
      <Text style={styles.rowLabel}>{row.label}</Text>
      <View style={styles.rowRight}>
        {row.right.kind === 'chevron' ? (
          <IconChevron size={14} color={colors.text.dim} />
        ) : row.right.kind === 'value' ? (
          <Text style={styles.rowValue}>{row.right.value}</Text>
        ) : (
          <Switch
            value={row.right.value}
            onValueChange={row.right.onChange}
            trackColor={{true: colors.brand.brass, false: 'rgba(246,241,227,0.15)'}}
            thumbColor="#FFFFFF"
          />
        )}
      </View>
    </Container>
  );
}

function shortDid(didDocument: string | null): string {
  if (!didDocument) return 'DID · PENDING';
  try {
    const doc = JSON.parse(didDocument);
    const id = doc.id as string | undefined;
    if (!id) return 'DID · —';
    if (id.length <= 30) return id;
    return id.slice(0, 18) + '…' + id.slice(-8);
  } catch {
    return 'DID · —';
  }
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: colors.surface.bg},
  scroll: {paddingHorizontal: 24, paddingTop: 16, paddingBottom: 140},
  versionLabel: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 2,
    color: colors.brand.brass,
    marginBottom: 8,
  },
  title: {
    fontFamily: fonts.serifTC,
    fontSize: 36,
    color: colors.text.primary,
    fontWeight: '700',
    lineHeight: 40,
    marginBottom: 24,
  },
  identity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: 16,
    backgroundColor: colors.surface.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.surface.line,
    marginBottom: 8,
  },
  identityAvatar: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: colors.brand.brass,
    alignItems: 'center',
    justifyContent: 'center',
  },
  identityInitial: {
    fontFamily: fonts.serifTC,
    fontSize: 26,
    color: colors.brand.ink,
    fontWeight: '700',
  },
  identityLabel: {
    fontFamily: fonts.mono,
    fontSize: 9,
    letterSpacing: 2,
    color: colors.brand.brass,
    marginBottom: 3,
  },
  identityName: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 15,
    color: colors.text.primary,
    fontWeight: '600',
  },
  identityDid: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 1,
    color: colors.text.dim,
    marginTop: 2,
  },
  sectionBlock: {marginTop: 24},
  sectionLabel: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 2,
    color: colors.brand.brass,
    marginBottom: 10,
    marginLeft: 4,
  },
  sectionGroup: {
    borderRadius: 18,
    backgroundColor: colors.surface.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.surface.line,
    paddingHorizontal: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 12,
  },
  rowDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.surface.line,
  },
  iconTile: {
    width: 30,
    height: 30,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.surface.line,
    backgroundColor: 'rgba(246,241,227,0.04)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: {
    flex: 1,
    fontFamily: fonts.sansMedium,
    fontSize: 14,
    color: colors.text.primary,
  },
  rowRight: {flexDirection: 'row', alignItems: 'center', gap: 8},
  rowValue: {
    fontFamily: fonts.mono,
    fontSize: 11,
    letterSpacing: 1.2,
    color: colors.text.dim,
  },
  logoutBtn: {
    marginTop: 28,
    height: 48,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(232,138,138,0.25)',
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutText: {
    fontFamily: fonts.sansMedium,
    fontSize: 14,
    color: colors.status.danger,
    letterSpacing: 0.5,
  },
});
