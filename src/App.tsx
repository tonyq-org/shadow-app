import React from 'react';
import {StatusBar} from 'react-native';
import RootNavigator from './navigation/RootNavigator';
import './config/i18n';

export default function App() {
  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <RootNavigator />
    </>
  );
}
