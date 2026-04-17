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

interface Props {
  onScan: (data: string) => void;
  onCancel: () => void;
  active?: boolean;
}

export default function QRScanner({onScan, onCancel, active = true}: Props) {
  const {t} = useTranslation();
  const {hasPermission, requestPermission} = useCameraPermission();
  const device = useCameraDevice('back');
  const handledRef = useRef(false);

  useEffect(() => {
    if (!hasPermission) {
      requestPermission();
    }
  }, [hasPermission, requestPermission]);

  useEffect(() => {
    handledRef.current = false;
  }, [active]);

  const codeScanner = useCodeScanner({
    codeTypes: ['qr'],
    onCodeScanned: codes => {
      if (handledRef.current || !active) return;
      const value = codes[0]?.value;
      if (value) {
        handledRef.current = true;
        onScan(value);
      }
    },
  });

  if (!hasPermission) {
    return (
      <View style={styles.centered}>
        <Text style={styles.hint}>{t('scan.permissionDenied')}</Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() => Linking.openSettings()}>
          <Text style={styles.buttonText}>{t('common.retry')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
          <Text style={styles.cancelText}>{t('common.cancel')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!device) {
    return (
      <View style={styles.centered}>
        <Text style={styles.hint}>{t('common.loading')}</Text>
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
      />
      <View style={styles.overlay} pointerEvents="box-none">
        <View style={styles.scanFrame} />
        <Text style={styles.hint}>{t('scan.hint')}</Text>
        <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
          <Text style={styles.cancelText}>{t('common.cancel')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#000000'},
  centered: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  scanFrame: {
    width: 260,
    height: 260,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 32,
  },
  hint: {fontSize: 14, color: '#FFFFFF', opacity: 0.9, marginBottom: 24},
  button: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  buttonText: {color: '#FFFFFF', fontSize: 15, fontWeight: '600'},
  cancelBtn: {marginTop: 16, padding: 12},
  cancelText: {fontSize: 15, color: '#FFFFFF', opacity: 0.9},
});
