import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import type {RootStackParamList} from './types';
import {useAuthStore} from '../store/authStore';
import {env} from '../config/env';
import AuthStack from './AuthStack';
import MainTabs from './MainTabs';

const Stack = createNativeStackNavigator<RootStackParamList>();

const linking: Parameters<typeof NavigationContainer>[0]['linking'] = {
  prefixes: [`${env.appScheme}://`, `https://${env.frontendUrl}`],
  config: {
    screens: {
      Main: {
        screens: {
          CredentialTab: {
            screens: {
              AddCredential: 'credential_offer',
            },
          },
          PresentationTab: {
            screens: {
              VPAuthorization: 'authorize',
            },
          },
        },
      },
    },
  },
};

export default function RootNavigator() {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);

  return (
    <NavigationContainer linking={linking}>
      <Stack.Navigator screenOptions={{headerShown: false}}>
        {isAuthenticated ? (
          <Stack.Screen name="Main" component={MainTabs} />
        ) : (
          <Stack.Screen name="Auth" component={AuthStack} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
