import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'react-native';
import AppNavigator from './AppNavigator';

const Layout = () => {
    return (
        <SafeAreaProvider>
            <StatusBar barStyle="dark-content" backgroundColor="#F2F2F7" />
            <NavigationContainer>
                <AppNavigator />
            </NavigationContainer>
        </SafeAreaProvider>
    );
};

export default Layout;
