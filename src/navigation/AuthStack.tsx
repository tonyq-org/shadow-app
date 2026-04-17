import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import type {AuthStackParamList} from './types';
import SplashScreen from '../screens/auth/SplashScreen';
import WelcomeScreen from '../screens/auth/WelcomeScreen';
import TermsScreen from '../screens/auth/TermsScreen';
import CreateWalletNameScreen from '../screens/auth/CreateWalletNameScreen';
import CreatePinCodeScreen from '../screens/auth/CreatePinCodeScreen';
import LoginScreen from '../screens/auth/LoginScreen';

const Stack = createNativeStackNavigator<AuthStackParamList>();

export default function AuthStack() {
  return (
    <Stack.Navigator
      screenOptions={{headerShown: false, animation: 'slide_from_right'}}>
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="Terms" component={TermsScreen} />
      <Stack.Screen name="CreateWalletName" component={CreateWalletNameScreen} />
      <Stack.Screen name="CreatePinCode" component={CreatePinCodeScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
    </Stack.Navigator>
  );
}
