import {useEffect} from 'react';
import {Linking} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {env} from '../config/env';

export type DeepLinkResult =
  | {type: 'vc'; qrCode: string}
  | {type: 'vp'; qrCode: string}
  | {type: 'unknown'};

export function parseDeepLink(url: string): DeepLinkResult {
  try {
    const parsed = new URL(url);

    if (
      parsed.pathname.includes('credential_offer') ||
      parsed.pathname.includes('vcqrcode')
    ) {
      return {type: 'vc', qrCode: url};
    }

    if (
      parsed.pathname.includes('authorize') ||
      parsed.pathname.includes('vpqrcode')
    ) {
      return {type: 'vp', qrCode: url};
    }

    return {type: 'unknown'};
  } catch {
    return {type: 'unknown'};
  }
}

export function useDeepLink(
  onVC?: (qrCode: string) => void,
  onVP?: (qrCode: string) => void,
) {
  const navigation = useNavigation();

  useEffect(() => {
    const handleUrl = ({url}: {url: string}) => {
      const result = parseDeepLink(url);
      if (result.type === 'vc' && onVC) {
        onVC(result.qrCode);
      } else if (result.type === 'vp' && onVP) {
        onVP(result.qrCode);
      }
    };

    const subscription = Linking.addEventListener('url', handleUrl);

    Linking.getInitialURL().then(url => {
      if (url) {
        handleUrl({url});
      }
    });

    return () => subscription.remove();
  }, [navigation, onVC, onVP]);
}
