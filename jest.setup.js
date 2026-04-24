/* eslint-env jest */

jest.mock('@op-engineering/op-sqlite', () => ({
  open: jest.fn(() => ({
    executeSync: jest.fn(() => ({rows: []})),
    close: jest.fn(),
    delete: jest.fn(),
  })),
}));

jest.mock('react-native-keychain', () => ({
  ACCESSIBLE: {
    WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'WHEN_UNLOCKED_THIS_DEVICE_ONLY',
  },
  ACCESS_CONTROL: {
    BIOMETRY_CURRENT_SET: 'BIOMETRY_CURRENT_SET',
  },
  getGenericPassword: jest.fn(() => Promise.resolve(false)),
  setGenericPassword: jest.fn(() => Promise.resolve(true)),
  resetGenericPassword: jest.fn(() => Promise.resolve(true)),
}));

jest.mock('react-native-config', () => ({}));

jest.mock('react-native-biometrics', () => {
  return jest.fn().mockImplementation(() => ({
    isSensorAvailable: jest.fn(() =>
      Promise.resolve({available: false, biometryType: undefined}),
    ),
    simplePrompt: jest.fn(() => Promise.resolve({success: false})),
  }));
});

jest.mock('react-native-vision-camera', () => {
  const React = require('react');
  const {View} = require('react-native');

  return {
    Camera: props => React.createElement(View, props),
    useCameraDevice: jest.fn(() => ({id: 'back'})),
    useCameraPermission: jest.fn(() => ({
      hasPermission: true,
      requestPermission: jest.fn(() => Promise.resolve(true)),
    })),
    useCodeScanner: jest.fn(config => config),
  };
});

jest.mock('react-native-webview', () => {
  const React = require('react');
  const {View} = require('react-native');

  return {
    WebView: props => React.createElement(View, props),
  };
});

const {NativeModules} = require('react-native');

NativeModules.KeyManagerModule = {
  generateP256Key: jest.fn(() =>
    Promise.resolve(
      JSON.stringify({
        kty: 'EC',
        crv: 'P-256',
        x: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
        y: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
      }),
    ),
  ),
  sign: jest.fn(() => Promise.resolve('header.payload.signature')),
  deleteKey: jest.fn(() => Promise.resolve(true)),
  verifyUser: jest.fn(() => Promise.resolve(true)),
  pbkdf2: jest.fn(() => Promise.resolve('00')),
};
