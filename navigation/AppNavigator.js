import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import HomeScreen from '../screens/Home/home';
import MarketplaceScreen from '../screens/Marketplace/Marketplace';
import TopRatedScreen from '../screens/TopRated/TopRated';
import ProfileScreen from '../screens/Profile/Profile';

const Stack = createStackNavigator();

const AppNavigator = () => {
    return (
        <Stack.Navigator
            initialRouteName="Login"
            screenOptions={{
                headerShown: false,
                cardStyleInterpolator: ({ current: { progress } }) => ({
                    cardStyle: {
                        opacity: progress,
                    },
                }),
            }}
        >
            {/* Auth Screens */}
            <Stack.Screen
                name="Login"
                component={LoginScreen}
                options={{
                    animationEnabled: true,
                }}
            />
            <Stack.Screen
                name="Register"
                component={RegisterScreen}
                options={{
                    animationEnabled: true,
                }}
            />

            {/* Main App Screens */}
            <Stack.Screen
                name="Home"
                component={HomeScreen}
                options={{
                    animationEnabled: true,
                }}
            />
            <Stack.Screen
                name="Marketplace"
                component={MarketplaceScreen}
                options={{
                    animationEnabled: true,
                }}
            />
            <Stack.Screen
                name="TopRated"
                component={TopRatedScreen}
                options={{
                    animationEnabled: true,
                }}
            />
            <Stack.Screen
                name="Profile"
                component={ProfileScreen}
                options={{
                    animationEnabled: true,
                }}
            />
        </Stack.Navigator>
    );
};

export default AppNavigator;
