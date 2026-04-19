import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet, Pressable} from 'react-native';
import {createBottomTabNavigator, type BottomTabBarProps} from '@react-navigation/bottom-tabs';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {useTranslation} from 'react-i18next';
import type {
  MainTabParamList,
  HomeStackParamList,
  CredentialStackParamList,
  PresentationStackParamList,
  SettingsStackParamList,
} from './types';
import {colors, type as fonts} from '../theme/tokens';
import {IconCard, IconPlus, IconSend, IconSettings, IconScan} from '../components/icons';

import CardOverviewScreen from '../screens/home/CardOverviewScreen';
import CardInfoScreen from '../screens/home/CardInfoScreen';
import CardRecordScreen from '../screens/home/CardRecordScreen';
import AddCredentialScreen from '../screens/credential/AddCredentialScreen';
import ScanQRScreen from '../screens/credential/ScanQRScreen';
import SearchCredentialScreen from '../screens/credential/SearchCredentialScreen';
import AddResultScreen from '../screens/credential/AddResultScreen';
import ShowCredentialsScreen from '../screens/credential/ShowCredentialsScreen';
import PresentationHomeScreen from '../screens/presentation/PresentationHomeScreen';
import VPAuthorizationScreen from '../screens/presentation/VPAuthorizationScreen';
import ChangeCardScreen from '../screens/presentation/ChangeCardScreen';
import VPResultScreen from '../screens/presentation/VPResultScreen';
import SettingScreen from '../screens/settings/SettingScreen';
import WalletSettingScreen from '../screens/settings/WalletSettingScreen';
import OperationLogScreen from '../screens/settings/OperationLogScreen';

const HomeStack = createNativeStackNavigator<HomeStackParamList>();
function HomeStackScreen() {
  return (
    <HomeStack.Navigator screenOptions={{headerShown: false, contentStyle: {backgroundColor: colors.surface.bg}}}>
      <HomeStack.Screen name="CardOverview" component={CardOverviewScreen} />
      <HomeStack.Screen name="CardInfo" component={CardInfoScreen} />
      <HomeStack.Screen name="CardRecord" component={CardRecordScreen} />
    </HomeStack.Navigator>
  );
}

const CredentialStack = createNativeStackNavigator<CredentialStackParamList>();
function CredentialStackScreen() {
  return (
    <CredentialStack.Navigator screenOptions={{headerShown: false, contentStyle: {backgroundColor: colors.surface.bg}}}>
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
    <PresentationStack.Navigator screenOptions={{headerShown: false, contentStyle: {backgroundColor: colors.surface.bg}}}>
      <PresentationStack.Screen name="PresentationHome" component={PresentationHomeScreen} />
      <PresentationStack.Screen name="VPAuthorization" component={VPAuthorizationScreen} />
      <PresentationStack.Screen name="ChangeCard" component={ChangeCardScreen} />
      <PresentationStack.Screen name="VPResult" component={VPResultScreen} />
    </PresentationStack.Navigator>
  );
}

const SettingsStack = createNativeStackNavigator<SettingsStackParamList>();
function SettingsStackScreen() {
  return (
    <SettingsStack.Navigator screenOptions={{headerShown: false, contentStyle: {backgroundColor: colors.surface.bg}}}>
      <SettingsStack.Screen name="Setting" component={SettingScreen} />
      <SettingsStack.Screen name="WalletSetting" component={WalletSettingScreen} />
      <SettingsStack.Screen name="OperationLog" component={OperationLogScreen} />
    </SettingsStack.Navigator>
  );
}

const Tab = createBottomTabNavigator<MainTabParamList>();

type TabKey = 'HomeTab' | 'CredentialTab' | 'ShowCredentials' | 'PresentationTab' | 'SettingsTab';

function CustomTabBar({state, navigation}: BottomTabBarProps) {
  const {t} = useTranslation();

  const items: Array<{key: TabKey; label: string; Icon: typeof IconCard; fab?: boolean}> = [
    {key: 'HomeTab', label: t('tabs.credentials'), Icon: IconCard},
    {key: 'CredentialTab', label: t('tabs.add'), Icon: IconPlus},
    {key: 'ShowCredentials', label: '', Icon: IconScan, fab: true},
    {key: 'PresentationTab', label: t('tabs.present'), Icon: IconSend},
    {key: 'SettingsTab', label: t('tabs.settings'), Icon: IconSettings},
  ];

  const onPress = (key: TabKey, fab?: boolean) => {
    if (fab) {
      navigation.navigate('CredentialTab', {screen: 'ScanQR'});
      return;
    }
    const route = state.routes.find(r => r.name === key);
    if (!route) return;
    const isFocused = state.routes[state.index]?.name === key;
    const event = navigation.emit({type: 'tabPress', target: route.key, canPreventDefault: true});
    if (!isFocused && !event.defaultPrevented) navigation.navigate(key);
  };

  return (
    <View style={styles.tabBar} pointerEvents="box-none">
      {items.map(({key, label, Icon, fab}) => {
        const route = state.routes.find(r => r.name === key);
        const isFocused = route && state.routes[state.index]?.name === key;
        const tint = isFocused ? colors.brand.brass : colors.text.dim;

        if (fab) {
          return (
            <Pressable key={key} onPress={() => onPress(key, true)} style={styles.fabSlot}>
              <View style={styles.fab}>
                <Icon size={26} color={colors.brand.ink} />
              </View>
            </Pressable>
          );
        }
        return (
          <TouchableOpacity
            key={key}
            style={styles.tabItem}
            activeOpacity={0.7}
            onPress={() => onPress(key)}>
            <Icon size={22} color={tint} />
            <Text style={[styles.tabLabel, {color: tint}]} numberOfLines={1}>
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function MainTabs() {
  return (
    <Tab.Navigator
      tabBar={props => <CustomTabBar {...props} />}
      screenOptions={{headerShown: false, sceneStyle: {backgroundColor: colors.surface.bg}}}>
      <Tab.Screen name="HomeTab" component={HomeStackScreen} />
      <Tab.Screen name="CredentialTab" component={CredentialStackScreen} />
      <Tab.Screen name="ShowCredentials" component={ShowCredentialsScreen} />
      <Tab.Screen name="PresentationTab" component={PresentationStackScreen} />
      <Tab.Screen name="SettingsTab" component={SettingsStackScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    height: 82,
    paddingBottom: 14,
    paddingTop: 10,
    backgroundColor: colors.surface.bg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.surface.line,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  tabLabel: {
    fontSize: 10,
    fontFamily: fonts.sansMedium,
    letterSpacing: 0.2,
  },
  fabSlot: {
    width: 72,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{translateY: -14}],
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.brand.brass,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 10,
    shadowColor: colors.brand.brass,
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.45,
    shadowRadius: 12,
  },
});
