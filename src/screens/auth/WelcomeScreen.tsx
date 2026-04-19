import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useTranslation} from 'react-i18next';
import type {AuthStackParamList} from '../../navigation/types';
import {colors, type as fonts} from '../../theme/tokens';
import Seal from '../../components/Seal';

type Props = NativeStackScreenProps<AuthStackParamList, 'Welcome'>;

interface Feature {
  index: string;
  title: string;
  subtitle: string;
}

export default function WelcomeScreen({navigation}: Props) {
  const {t} = useTranslation();

  const features: Feature[] = [
    {
      index: '01',
      title: '硬體層級加密',
      subtitle: 'ANDROID KEYSTORE · SECURE ENCLAVE',
    },
    {
      index: '02',
      title: '選擇性揭露',
      subtitle: 'SD · JWT · ZERO · KNOWLEDGE',
    },
    {
      index: '03',
      title: '離線驗證',
      subtitle: 'TRUST · LIST · SIGNATURE · VERIFY',
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.heroSpacer} />
        <View style={styles.heroBlock}>
          <Seal size={110} />
          <Text style={styles.brandLabel}>SHADOW · WALLET</Text>
          <Text style={styles.headline}>
            數位憑證{'\n'}由您親自保管
          </Text>
          <Text style={styles.subline}>
            主權式錢包 · 硬體加密 · 選擇性揭露
          </Text>
        </View>

        <View style={styles.features}>
          {features.map(f => (
            <View key={f.index} style={styles.featureItem}>
              <Text style={styles.featureIndex}>{f.index}</Text>
              <View style={{flex: 1}}>
                <Text style={styles.featureTitle}>{f.title}</Text>
                <Text style={styles.featureSubtitle}>{f.subtitle}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.ctaWrap}>
        <TouchableOpacity
          style={styles.primaryBtn}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('Terms')}>
          <Text style={styles.primaryBtnText}>建立我的皮夾</Text>
        </TouchableOpacity>
        <TouchableOpacity activeOpacity={0.6} style={styles.secondaryLink}>
          <Text style={styles.secondaryLinkText}>匯入現有皮夾 →</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: colors.surface.bg, paddingHorizontal: 24},
  content: {flex: 1},
  heroSpacer: {height: 40},
  heroBlock: {alignItems: 'center', marginBottom: 36},
  brandLabel: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 9,
    color: colors.brand.brass,
    marginTop: 24,
    marginBottom: 20,
  },
  headline: {
    fontFamily: fonts.serifTC,
    fontSize: 34,
    lineHeight: 42,
    color: colors.text.primary,
    textAlign: 'center',
    fontWeight: '700',
  },
  subline: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.text.dim,
    textAlign: 'center',
    marginTop: 14,
    letterSpacing: 0.3,
  },
  features: {gap: 10},
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.surface.line,
    backgroundColor: 'rgba(246,241,227,0.02)',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  featureIndex: {
    fontFamily: fonts.mono,
    fontSize: 12,
    letterSpacing: 2,
    color: colors.brand.brass,
    width: 22,
  },
  featureTitle: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 14,
    color: colors.text.primary,
    marginBottom: 2,
  },
  featureSubtitle: {
    fontFamily: fonts.mono,
    fontSize: 9,
    letterSpacing: 1.8,
    color: colors.text.mute,
  },
  ctaWrap: {paddingBottom: 24, gap: 14, alignItems: 'center'},
  primaryBtn: {
    alignSelf: 'stretch',
    height: 52,
    borderRadius: 14,
    backgroundColor: colors.brand.brass,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    fontFamily: fonts.sansSemiBold,
    color: colors.brand.ink,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  secondaryLink: {paddingVertical: 6},
  secondaryLinkText: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.text.dim,
    letterSpacing: 0.3,
  },
});
