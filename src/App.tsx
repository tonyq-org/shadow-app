import React, {useEffect, useState} from 'react';
import {
  StatusBar,
  View,
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import RootNavigator from './navigation/RootNavigator';
import {initDatabase, DatabaseUnlockError, resetDatabaseHard} from './db/database';
import './config/i18n';

type BootState =
  | {status: 'loading'}
  | {status: 'ready'}
  | {status: 'unlockFailed'; error: unknown};

export default function App() {
  const [boot, setBoot] = useState<BootState>({status: 'loading'});

  useEffect(() => {
    void (async () => {
      try {
        await initDatabase();
        setBoot({status: 'ready'});
      } catch (err) {
        if (err instanceof DatabaseUnlockError) {
          setBoot({status: 'unlockFailed', error: err});
        } else {
          throw err;
        }
      }
    })();
  }, []);

  if (boot.status === 'loading') {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  if (boot.status === 'unlockFailed') {
    return (
      <View style={styles.unlockFail}>
        <Text style={styles.unlockTitle}>無法解鎖皮夾資料庫</Text>
        <Text style={styles.unlockBody}>
          偵測到現有的皮夾資料，但目前的金鑰無法解開（可能是系統還原或金鑰環異動）。
          為了避免資料遺失，App 不會自動刪除資料。{'\n\n'}
          如果你確定要放棄現有皮夾並重新開始，可以選擇「清除並重建」；
          否則請不要繼續，並聯絡支援。
        </Text>
        <TouchableOpacity
          style={styles.unlockBtn}
          onPress={() =>
            Alert.alert(
              '確定清除？',
              '此操作會刪除裝置上所有皮夾資料，且無法復原。',
              [
                {text: '取消', style: 'cancel'},
                {
                  text: '清除並重建',
                  style: 'destructive',
                  onPress: async () => {
                    await resetDatabaseHard();
                    setBoot({status: 'loading'});
                    try {
                      await initDatabase();
                      setBoot({status: 'ready'});
                    } catch (err) {
                      setBoot({status: 'unlockFailed', error: err});
                    }
                  },
                },
              ],
            )
          }>
          <Text style={styles.unlockBtnText}>清除並重建</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <RootNavigator />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  unlockFail: {
    flex: 1,
    padding: 32,
    justifyContent: 'center',
    backgroundColor: '#0E0E10',
  },
  unlockTitle: {
    color: '#F6F1E3',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 16,
  },
  unlockBody: {
    color: 'rgba(246,241,227,0.7)',
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 28,
  },
  unlockBtn: {
    alignSelf: 'flex-start',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(232,138,138,0.4)',
  },
  unlockBtnText: {
    color: '#E88A8A',
    fontSize: 14,
    fontWeight: '600',
  },
});
