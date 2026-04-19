import React, {useMemo, useState} from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useTranslation} from 'react-i18next';
import type {HomeStackParamList} from '../../navigation/types';
import {useWalletStore} from '../../store/walletStore';
import * as credentialDao from '../../db/credentialDao';
import {extractCardDisplay} from '../../utils/credentialDisplay';
import {colors, type as fonts} from '../../theme/tokens';
import CardItem from '../../components/CardItem';
import {IconChevron} from '../../components/icons';

type Props = NativeStackScreenProps<HomeStackParamList, 'CardInfo'>;

export default function CardInfoScreen({navigation, route}: Props) {
  const {t} = useTranslation();
  const {credentialId} = route.params;
  const credential = useWalletStore(s =>
    s.credentials.find(c => c.id === credentialId),
  );
  const removeCredential = useWalletStore(s => s.removeCredential);
  const [tab, setTab] = useState<'content' | 'metadata'>('content');

  const {metadata, claims, holder, idNumber, picture} = useMemo(() => {
    if (!credential) {
      return {
        metadata: [] as Row[],
        claims: [] as Row[],
        holder: undefined as string | undefined,
        idNumber: undefined as string | undefined,
        picture: undefined as string | undefined,
      };
    }
    const display = extractCardDisplay(credential.rawJwt);
    const subject = display.subject;

    const meta: Row[] = [
      {label: 'ISSUER', value: credential.issuerName ?? '—', mono: false},
      {label: 'ISSUER · DID', value: shortDid(credential.issuerDid), mono: true},
      {label: 'CREDENTIAL · ID', value: credential.id, mono: true},
      {
        label: 'ISSUED',
        value: fmtDate(credential.issuedAt),
        mono: true,
      },
      {
        label: 'VALID · THRU',
        value: fmtDate(credential.expiresAt),
        mono: true,
      },
    ];

    const claimRows: Row[] = Object.entries(subject)
      .filter(([k]) => k !== '_sd' && k !== '_sd_alg' && k !== 'id')
      .map(([k, v]) => ({label: k, value: String(v ?? '—'), mono: false}));

    return {
      metadata: meta,
      claims: claimRows,
      holder: display.holder,
      idNumber: display.idNumber,
      picture: display.picture,
    };
  }, [credential]);

  if (!credential) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <BackBtn onPress={() => navigation.goBack()} />
        </View>
        <View style={styles.missing}>
          <Text style={styles.missingText}>{t('credential.notFound')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const onDelete = () => {
    Alert.alert(t('credential.detail'), t('credential.deleteConfirm'), [
      {text: t('common.cancel'), style: 'cancel'},
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: () => {
          try {
            credentialDao.deleteCredential(credential.id);
          } catch {}
          removeCredential(credential.id);
          navigation.goBack();
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <BackBtn onPress={() => navigation.goBack()} />
        <Text style={styles.headerTitle}>{t('credential.detail')}</Text>
        <View style={{width: 38}} />
      </View>

      <ScrollView
        style={{flex: 1}}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}>
        <View style={styles.cardSlot}>
          <CardItem
            credential={credential}
            width={320}
            holderName={holder}
            idNumber={idNumber}
            picture={picture}
          />
        </View>

        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tabBtn, tab === 'content' && styles.tabBtnActive]}
            activeOpacity={0.8}
            onPress={() => setTab('content')}>
            <Text style={[styles.tabText, tab === 'content' && styles.tabTextActive]}>
              {t('credential.tabContent')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabBtn, tab === 'metadata' && styles.tabBtnActive]}
            activeOpacity={0.8}
            onPress={() => setTab('metadata')}>
            <Text style={[styles.tabText, tab === 'metadata' && styles.tabTextActive]}>
              {t('credential.tabMetadata')}
            </Text>
          </TouchableOpacity>
        </View>

        {tab === 'content' ? (
          claims.length > 0 ? (
            <View style={styles.group}>
              {claims.map((r, i) => (
                <ClaimRow key={r.label} row={r} last={i === claims.length - 1} />
              ))}
            </View>
          ) : (
            <View style={[styles.group, styles.emptyGroup]}>
              <Text style={styles.emptyText}>—</Text>
            </View>
          )
        ) : (
          <View style={styles.group}>
            {metadata.map((r, i) => (
              <MetaRow key={r.label} row={r} last={i === metadata.length - 1} />
            ))}
          </View>
        )}

        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.secondaryBtn}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('CardRecord', {credentialId})}>
            <Text style={styles.secondaryBtnText}>{t('home.cardRecord')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.secondaryBtn, styles.dangerBtn]}
            activeOpacity={0.8}
            onPress={onDelete}>
            <Text style={[styles.secondaryBtnText, styles.dangerText]}>
              {t('common.delete')}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

type Row = {label: string; value: string; mono: boolean};

function MetaRow({row, last}: {row: Row; last: boolean}) {
  return (
    <View style={[styles.metaRow, !last && styles.rowDivider]}>
      <Text style={styles.metaLabel}>{row.label}</Text>
      <Text style={[styles.metaValue, row.mono && styles.metaValueMono]} numberOfLines={1}>
        {row.value}
      </Text>
    </View>
  );
}

function ClaimRow({row, last}: {row: Row; last: boolean}) {
  return (
    <View style={[styles.claimRow, !last && styles.rowDivider]}>
      <View style={styles.dot} />
      <View style={{flex: 1}}>
        <Text style={styles.claimKey}>{row.label.toUpperCase()}</Text>
        <Text style={styles.claimValue}>{row.value}</Text>
      </View>
    </View>
  );
}

function BackBtn({onPress}: {onPress: () => void}) {
  return (
    <TouchableOpacity style={styles.backBtn} onPress={onPress} activeOpacity={0.7}>
      <IconChevron size={18} color={colors.text.primary} direction="left" />
    </TouchableOpacity>
  );
}

function shortDid(did: string | null): string {
  if (!did) return '—';
  if (did.length <= 28) return did;
  return did.slice(0, 14) + '…' + did.slice(-10);
}

function fmtDate(ts: number | null): string {
  if (!ts) return '—';
  const d = new Date(ts * 1000);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()} · ${mm} · ${dd}`;
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: colors.surface.bg},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.surface.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: fonts.serifTC,
    fontSize: 18,
    color: colors.text.primary,
    fontWeight: '700',
  },
  scroll: {paddingHorizontal: 24, paddingBottom: 140},
  cardSlot: {alignItems: 'center', paddingVertical: 16, paddingBottom: 24},
  tabBar: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
    marginTop: 4,
  },
  tabBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.surface.line,
  },
  tabBtnActive: {
    backgroundColor: colors.brand.brass15,
    borderColor: colors.brand.brass66,
  },
  tabText: {
    fontFamily: fonts.sansMedium,
    fontSize: 13,
    color: colors.text.dim,
  },
  tabTextActive: {
    color: colors.brand.brass,
  },
  emptyGroup: {paddingVertical: 24, alignItems: 'center'},
  emptyText: {
    fontFamily: fonts.mono,
    fontSize: 14,
    color: colors.text.dim,
  },
  group: {
    backgroundColor: colors.surface.surface,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.surface.line,
    paddingHorizontal: 16,
  },
  rowDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.surface.line,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  metaLabel: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 1.5,
    color: colors.text.dim,
  },
  metaValue: {
    fontFamily: fonts.sansMedium,
    fontSize: 13,
    color: colors.text.primary,
    maxWidth: '60%',
    textAlign: 'right',
  },
  metaValueMono: {
    fontFamily: fonts.mono,
    fontSize: 12,
  },
  claimRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 14,
    gap: 12,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.brand.brass,
    marginTop: 7,
  },
  claimKey: {
    fontFamily: fonts.mono,
    fontSize: 11,
    letterSpacing: 1.5,
    color: colors.text.dim,
    marginBottom: 4,
  },
  claimValue: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.text.primary,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 28,
  },
  secondaryBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.surface.line,
    backgroundColor: colors.surface.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: {
    fontFamily: fonts.sansMedium,
    fontSize: 14,
    color: colors.text.primary,
  },
  dangerBtn: {
    borderColor: 'rgba(232,138,138,0.5)',
    backgroundColor: 'transparent',
  },
  dangerText: {color: colors.status.danger},
  missing: {flex: 1, alignItems: 'center', justifyContent: 'center'},
  missingText: {color: colors.text.dim, fontFamily: fonts.sans, fontSize: 14},
});
