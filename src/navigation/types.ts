import type {NavigatorScreenParams} from '@react-navigation/native';

export type AuthStackParamList = {
  Splash: undefined;
  Welcome: undefined;
  Terms: undefined;
  CreateWalletName: undefined;
  CreatePinCode: {walletName: string};
  Login: undefined;
};

export type HomeStackParamList = {
  CardOverview: undefined;
  CardInfo: {credentialId: string};
  CardRecord: {credentialId: string};
};

export type CredentialStackParamList = {
  AddCredential: undefined;
  ScanQR: undefined;
  SearchCredential: undefined;
  AddResult: {success: boolean; message?: string; credentialId?: string};
  CredentialInfo: {credentialId: string};
};

export type PresentationStackParamList = {
  PresentationHome: undefined;
  VPAuthorization: {qrData: string; selectedCredentialId?: string};
  ChangeCard: {qrData: string; currentCardId?: string};
  VPResult: {success: boolean; message?: string};
};

export type SettingsStackParamList = {
  Setting: undefined;
  WalletSetting: undefined;
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
