import React, {useEffect, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
} from 'react-native';
import {useTranslation} from 'react-i18next';
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
  useCodeScanner,
} from 'react-native-vision-camera';
import {colors, type as fonts} from '../theme/tokens';
import {IconClose} from './icons';

interface Props {
  onScan: (data: string) => void;
  onCancel: () => void;
  active?: boolean;
  title?: string;
  caption?: string;
  hint?: string;
  /** Increment to re-arm the one-shot guard without toggling the camera. */
  resetKey?: number;
}

const FRAME_SIZE = 240;
const CORNER_SIZE = 36;
const CORNER_WIDTH = 2;

export default function QRScanner({
  onScan,
  onCancel,
  active = true,
  title = 'SCAN · CREDENTIAL · OFFER',
  caption = '對準 QR Code',
  hint = '保持裝置穩定 · 將驗證方或發行者的 QR Code 置於框內',
  resetKey = 0,
}: Props) {
  const {t} = useTranslation();
  const {hasPermission, requestPermission} = useCameraPermission();
  const device = useCameraDevice('back');
  const handledRef = useRef(false);

  useEffect(() => {
    if (!hasPermission) requestPermission();
  }, [hasPermission, requestPermission]);

  useEffect(() => {
    handledRef.current = false;
  }, [active, resetKey]);

  const codeScanner = useCodeScanner({
    codeTypes: ['qr'],
    onCodeScanned: codes => {
      if (handledRef.current || !active) return;
      const value = codes[0]?.value;
      if (value) {
        handledRef.current = true;
        console.log('[QRScanner] scanned len=', value.length, 'value=', JSON.stringify(value));
        onScan(value);
      }
    },
  });

  if (!hasPermission) {
    return (
      <View style={styles.centered}>
        <Text style={styles.permissionText}>{t('scan.permissionDenied')}</Text>
        <TouchableOpacity style={styles.permissionBtn} onPress={() => Linking.openSettings()}>
          <Text style={styles.permissionBtnText}>{t('common.retry')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.permissionSecondary} onPress={onCancel}>
          <Text style={styles.permissionSecondaryText}>{t('common.cancel')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!device) {
    return (
      <View style={styles.centered}>
        <Text style={styles.permissionText}>{t('common.loading')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Camera
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={active}
        codeScanner={codeScanner}
        onError={err => {
          console.log('[QRScanner] camera error', err.code, err.message);
        }}
      />
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <View style={styles.vignetteTop} />
        <View style={styles.vignetteBottom} />
      </View>

      <View style={styles.topBar}>
        <TouchableOpacity style={styles.closeBtn} activeOpacity={0.7} onPress={onCancel}>
          <IconClose size={16} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.topLabel}>{title}</Text>
        <View style={{width: 38}} />
      </View>

      <View style={styles.frameWrap} pointerEvents="none">
        <View style={styles.frame}>
          <View style={[styles.corner, styles.cornerTL]} />
          <View style={[styles.corner, styles.cornerTR]} />
          <View style={[styles.corner, styles.cornerBL]} />
          <View style={[styles.corner, styles.cornerBR]} />
          <View style={styles.scanLine} />
          <View style={styles.crosshair} />
        </View>
        <Text style={styles.caption}>{caption}</Text>
        <Text style={styles.hint}>{hint}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#000'},
  centered: {
    flex: 1,
    backgroundColor: colors.surface.bg,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  vignetteTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 220,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  vignetteBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 260,
    backgroundColor: 'rgba(0,0,0,0.65)',
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingTop: 48,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  closeBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(246,241,227,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topLabel: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 2,
    color: colors.brand.brass,
  },
  frameWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 80,
  },
  frame: {
    width: FRAME_SIZE,
    height: FRAME_SIZE,
    marginBottom: 26,
  },
  corner: {
    position: 'absolute',
    width: CORNER_SIZE,
    height: CORNER_SIZE,
    borderColor: colors.brand.brass,
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderTopWidth: CORNER_WIDTH,
    borderLeftWidth: CORNER_WIDTH,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderTopWidth: CORNER_WIDTH,
    borderRightWidth: CORNER_WIDTH,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: CORNER_WIDTH,
    borderLeftWidth: CORNER_WIDTH,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: CORNER_WIDTH,
    borderRightWidth: CORNER_WIDTH,
  },
  scanLine: {
    position: 'absolute',
    left: 8,
    right: 8,
    top: FRAME_SIZE / 2,
    height: 1,
    backgroundColor: colors.brand.brass,
    shadowColor: colors.brand.brass,
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 0.9,
    shadowRadius: 10,
    elevation: 6,
  },
  crosshair: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: colors.brand.brass,
    top: FRAME_SIZE / 2 - 5,
    left: FRAME_SIZE / 2 - 5,
  },
  caption: {
    fontFamily: fonts.serifTC,
    fontSize: 22,
    color: colors.text.primary,
    marginTop: 24,
    textAlign: 'center',
  },
  hint: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.text.dim,
    marginTop: 8,
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 18,
  },
  permissionText: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: 20,
  },
  permissionBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: colors.brand.brass,
  },
  permissionBtnText: {
    fontFamily: fonts.sansSemiBold,
    color: colors.brand.ink,
    fontSize: 14,
    fontWeight: '700',
  },
  permissionSecondary: {marginTop: 16, padding: 12},
  permissionSecondaryText: {
    fontFamily: fonts.sans,
    color: colors.text.dim,
    fontSize: 13,
  },
});
