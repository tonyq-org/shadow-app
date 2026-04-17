import Config from 'react-native-config';

export const env = {
  appName: Config.APP_NAME ?? 'Shadow Wallet',
  appScheme: Config.APP_SCHEME ?? 'shadowwallet',
  frontendUrl: Config.FRONTEND_URL ?? 'https://example.com',
  trustListApiUrl: Config.TRUST_LIST_API_URL ?? 'https://example.com/api/trust',
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
