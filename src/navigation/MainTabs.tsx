import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import type {
  MainTabParamList,
  HomeStackParamList,
  CredentialStackParamList,
  PresentationStackParamList,
  SettingsStackParamList,
} from './types';

import CardOverviewScreen from '../screens/home/CardOverviewScreen';
import CardInfoScreen from '../screens/home/CardInfoScreen';
import CardRecordScreen from '../screens/home/CardRecordScreen';
import AddCredentialScreen from '../screens/credential/AddCredentialScreen';
import ScanQRScreen from '../screens/credential/ScanQRScreen';
import SearchCredentialScreen from '../screens/credential/SearchCredentialScreen';
import AddResultScreen from '../screens/credential/AddResultScreen';
import ShowCredentialsScreen from '../screens/credential/ShowCredentialsScreen';
import VPAuthorizationScreen from '../screens/presentation/VPAuthorizationScreen';
import ChangeCardScreen from '../screens/presentation/ChangeCardScreen';
import VPResultScreen from '../screens/presentation/VPResultScreen';
import SettingScreen from '../screens/settings/SettingScreen';
import WalletSettingScreen from '../screens/settings/WalletSettingScreen';
import OperationLogScreen from '../screens/settings/OperationLogScreen';

const HomeStack = createNativeStackNavigator<HomeStackParamList>();
function HomeStackScreen() {
  return (
    <HomeStack.Navigator screenOptions={{headerShown: false}}>
      <HomeStack.Screen name="CardOverview" component={CardOverviewScreen} />
      <HomeStack.Screen name="CardInfo" component={CardInfoScreen} />
      <HomeStack.Screen name="CardRecord" component={CardRecordScreen} />
    </HomeStack.Navigator>
  );
}

const CredentialStack = createNativeStackNavigator<CredentialStackParamList>();
function CredentialStackScreen() {
  return (
    <CredentialStack.Navigator screenOptions={{headerShown: false}}>
      <CredentialStack.Screen name="AddCredential" component={AddCredentialScreen} />
      <CredentialStack.Screen name="ScanQR" component={ScanQRScreen} />
      <CredentialStack.Screen name="SearchCredential" component={SearchCredentialScreen} />
      <CredentialStack.Screen name="AddResult" component={AddResultScreen} />
    </CredentialStack.Navigator>
  );
}

const PresentationStack = createNativeStackNavigator<PresentationStackParamList>();
function PresentationStackScreen() {
  return (
    <PresentationStack.Navigator screenOptions={{headerShown: false}}>
      <PresentationStack.Screen name="VPAuthorization" component={VPAuthorizationScreen} />
      <PresentationStack.Screen name="ChangeCard" component={ChangeCardScreen} />
      <PresentationStack.Screen name="VPResult" component={VPResultScreen} />
    </PresentationStack.Navigator>
  );
}

const SettingsStack = createNativeStackNavigator<SettingsStackParamList>();
function SettingsStackScreen() {
  return (
    <SettingsStack.Navigator screenOptions={{headerShown: false}}>
      <SettingsStack.Screen name="Setting" component={SettingScreen} />
      <SettingsStack.Screen name="WalletSetting" component={WalletSettingScreen} />
      <SettingsStack.Screen name="OperationLog" component={OperationLogScreen} />
    </SettingsStack.Navigator>
  );
}

const Tab = createBottomTabNavigator<MainTabParamList>();

export default function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#2563EB',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: '#E5E7EB',
          paddingBottom: 8,
          paddingTop: 8,
          height: 64,
        },
      }}>
      <Tab.Screen
        name="HomeTab"
        component={HomeStackScreen}
        options={{tabBarLabel: '我的憑證'}}
      />
      <Tab.Screen
        name="CredentialTab"
        component={CredentialStackScreen}
        options={{tabBarLabel: '新增憑證'}}
      />
      <Tab.Screen
        name="ShowCredentials"
        component={ShowCredentialsScreen}
        options={{tabBarLabel: '瀏覽'}}
      />
      <Tab.Screen
        name="PresentationTab"
        component={PresentationStackScreen}
        options={{tabBarLabel: '授權出示'}}
      />
      <Tab.Screen
        name="SettingsTab"
        component={SettingsStackScreen}
        options={{tabBarLabel: '設定'}}
      />
    </Tab.Navigator>
  );
}
