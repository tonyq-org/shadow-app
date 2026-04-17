import type {NavigatorScreenParams} from '@react-navigation/native';

export type AuthStackParamList = {
  Splash: undefined;
  Welcome: undefined;
  Terms: undefined;
  FeaturePreview: undefined;
  CreateWalletName: undefined;
  CreatePinCode: {walletName: string};
  Login: undefined;
  PinCodeLogin: {walletId: string};
};

export type HomeStackParamList = {
  CardOverview: undefined;
  CardInfo: {credentialId: string};
  CardRecord: {credentialId: string};
  SelectWallet: undefined;
};

export type CredentialStackParamList = {
  AddCredential: undefined;
  ScanQR: undefined;
  SearchCredential: undefined;
  AddResult: {success: boolean; message?: string};
  CredentialInfo: {credentialId: string};
};

export type PresentationStackParamList = {
  PresentationHome: undefined;
  VPAuthorization: {qrData: string};
  ChangeCard: {requestId: string; currentCardId: string};
  VPResult: {success: boolean; message?: string};
};

export type SettingsStackParamList = {
  Setting: undefined;
  WalletSetting: undefined;
  ChangeWalletName: undefined;
  AutoLogoutSetting: undefined;
  FAQ: undefined;
  Contact: undefined;
  OperationLog: undefined;
};

export type MainTabParamList = {
  HomeTab: NavigatorScreenParams<HomeStackParamList>;
  CredentialTab: NavigatorScreenParams<CredentialStackParamList>;
  ShowCredentials: undefined;
  PresentationTab: NavigatorScreenParams<PresentationStackParamList>;
  SettingsTab: NavigatorScreenParams<SettingsStackParamList>;
};

export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainTabParamList>;
};
