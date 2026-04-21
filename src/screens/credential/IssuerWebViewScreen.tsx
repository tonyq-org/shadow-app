import React, {useRef, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  BackHandler,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {WebView, type WebViewNavigation} from 'react-native-webview';
import {useFocusEffect} from '@react-navigation/native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useTranslation} from 'react-i18next';
import type {CredentialStackParamList} from '../../navigation/types';
import {unwrapQr} from '../../services/protocol/qr';
import {colors, type as fonts} from '../../theme/tokens';

type Props = NativeStackScreenProps<CredentialStackParamList, 'IssuerWebView'>;

const INTERCEPT_SCHEME = 'modadigitalwallet://';

/**
 * Convert an Android `intent://path?query#Intent;scheme=foo;...;end` URL to
 * its equivalent `foo://path?query` form. Returns the input untouched if it
 * isn't an intent URL we can map.
 */
function intentToScheme(url: string): string | null {
  if (!url.startsWith('intent://')) return null;
  const hashIdx = url.indexOf('#Intent;');
  if (hashIdx < 0) return null;
  const body = url.slice('intent://'.length, hashIdx);
  const opts = url.slice(hashIdx + '#Intent;'.length);
  const schemeMatch = /(?:^|;)scheme=([^;]+)/.exec(opts);
  if (!schemeMatch) return null;
  return `${schemeMatch[1]}://${body}`;
}

function isTwdiwWrapper(url: string): boolean {
  try {
    const u = new URL(url);
    return (
      /(^|\.)wallet\.gov\.tw$/.test(u.hostname.toLowerCase()) &&
      /\/(vc|vp)qrcode(\/|$)/.test(u.pathname)
    );
  } catch {
    return false;
  }
}

export default function IssuerWebViewScreen({navigation, route}: Props) {
  const {t} = useTranslation();
  const {url, title} = route.params;
  const webViewRef = useRef<WebView>(null);
  const [loading, setLoading] = useState(true);
  const [canGoBack, setCanGoBack] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      const onBack = () => {
        if (canGoBack && webViewRef.current) {
          webViewRef.current.goBack();
          return true;
        }
        return false;
      };
      const sub = BackHandler.addEventListener('hardwareBackPress', onBack);
      return () => sub.remove();
    }, [canGoBack]),
  );

  const handleIntercept = (incoming: string, src: string): boolean => {
    const mapped = incoming.startsWith('intent://')
      ? intentToScheme(incoming)
      : incoming;
    console.log(`[IssuerWebView][${src}] url=`, incoming);
    if (mapped !== incoming) {
      console.log(`[IssuerWebView][${src}] intent→scheme=`, mapped);
    }
    if (!mapped) return false;
    if (mapped.startsWith(INTERCEPT_SCHEME)) {
      console.log(`[IssuerWebView][${src}] INTERCEPT scheme →`, mapped);
      navigation.replace('ScanQR', {initialQr: mapped});
      return true;
    }
    if (isTwdiwWrapper(mapped)) {
      const unwrapped = unwrapQr(mapped);
      console.log(`[IssuerWebView][${src}] wrapper unwrap →`, unwrapped);
      if (unwrapped.startsWith(INTERCEPT_SCHEME)) {
        navigation.replace('ScanQR', {initialQr: unwrapped});
        return true;
      }
    }
    return false;
  };

  const onShouldStartLoadWithRequest = (req: WebViewNavigation) => {
    if (handleIntercept(req.url, 'shouldStart')) return false;
    return true;
  };

  const onOpenWindow = (e: {nativeEvent: {targetUrl: string}}) => {
    const target = e.nativeEvent?.targetUrl;
    console.log('[IssuerWebView][openWindow] url=', target);
    if (!target) return;
    if (handleIntercept(target, 'openWindow')) return;
    webViewRef.current?.injectJavaScript(
      `window.location.href = ${JSON.stringify(target)}; true;`,
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}>
          <Text style={styles.headerBtnText}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {title ?? t('credential.catalog.webviewTitle')}
        </Text>
        <TouchableOpacity
          style={styles.headerBtn}
          onPress={() => webViewRef.current?.reload()}
          activeOpacity={0.7}>
          <Text style={styles.headerBtnText}>↻</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.urlBar}>
        <Text style={styles.urlText} numberOfLines={1}>
          {url}
        </Text>
      </View>

      <View style={styles.webviewWrap}>
        <WebView
          ref={webViewRef}
          source={{uri: url}}
          originWhitelist={['http://*', 'https://*']}
          onShouldStartLoadWithRequest={onShouldStartLoadWithRequest}
          onOpenWindow={onOpenWindow}
          setSupportMultipleWindows={false}
          onNavigationStateChange={(s: WebViewNavigation) => {
            setCanGoBack(s.canGoBack);
            handleIntercept(s.url, 'navState');
          }}
          onLoadStart={() => setLoading(true)}
          onLoadEnd={() => setLoading(false)}
          onError={({nativeEvent}) => {
            setLoading(false);
            Alert.alert(
              t('common.error'),
              nativeEvent.description ?? t('credential.catalog.webviewLoadFailed'),
              [{text: t('common.ok')}],
            );
          }}
          javaScriptEnabled
          domStorageEnabled
          thirdPartyCookiesEnabled
          sharedCookiesEnabled
          allowsBackForwardNavigationGestures
        />
        {loading ? (
          <View style={styles.loadingOverlay} pointerEvents="none">
            <ActivityIndicator color={colors.brand.brass} />
          </View>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: colors.surface.bg},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: colors.surface.bg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.surface.line,
    gap: 12,
  },
  headerBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.surface.line,
  },
  headerBtnText: {
    fontFamily: fonts.sans,
    fontSize: 16,
    color: colors.text.primary,
  },
  headerTitle: {
    flex: 1,
    fontFamily: fonts.sansSemiBold,
    fontSize: 14,
    color: colors.text.primary,
    textAlign: 'center',
  },
  urlBar: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: colors.surface.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.surface.line,
  },
  urlText: {
    fontFamily: fonts.mono,
    fontSize: 10,
    color: colors.text.dim,
    letterSpacing: 0.3,
  },
  webviewWrap: {flex: 1, backgroundColor: '#FFFFFF'},
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 80,
  },
});
