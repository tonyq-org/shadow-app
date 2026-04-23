// Configuration values
// When react-native-config is properly linked, replace with:
// import Config from 'react-native-config';

const Config: Record<string, string | undefined> = {};

try {
  const RNConfig = require('react-native-config');
  Object.assign(Config, RNConfig.default ?? RNConfig);
} catch {
  // react-native-config not linked yet, use defaults
}

export const env = {
  appName: Config.APP_NAME ?? 'TW Shadow Digital Identity Wallet',
  appScheme: Config.APP_SCHEME ?? 'shadowwallet',
  frontendUrl: Config.FRONTEND_URL ?? 'https://frontend.wallet.gov.tw',
  trustListApiUrl: Config.TRUST_LIST_API_URL ?? 'https://frontend.wallet.gov.tw',
  supportEmail: Config.SUPPORT_EMAIL ?? 'support@example.com',
};

export const DID_SDK_CHANNEL = 'did_sdk_channel';

export const SDK_METHODS = {
  GENERATE_KEY: 'generateKey',
  GENERATE_DID: 'generateDID',
  APPLY_VC: 'applyVC',
  DECODE_VC: 'decodeVC',
  VERIFY_VC: 'verifyVC',
  VERIFY_VC_OFFLINE: 'verifyVCOffline',
  PARSE_VP_QRCODE: 'parseVPQrcode',
  GENERATE_VP: 'generateVP',
  DOWNLOAD_ISS_LIST: 'downloadIssList',
  DOWNLOAD_ALL_VC_LIST: 'downloadAllVCList',
} as const;
