import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import HomeScreen from '../screens/Home/home';
import MarketplaceScreen from '../screens/Marketplace/Marketplace';
import MarketplaceFeed from '../screens/Marketplace/MarketplaceFeed';
import CreateExchangeRequest from '../screens/Marketplace/CreateExchangeRequest';
import ExchangeRequestDetail from '../screens/Marketplace/ExchangeRequestDetail';
import TopRatedScreen from '../screens/TopRated/TopRated';
import ProfileScreen from '../screens/Profile/Profile';
import AdminDashboard from '../screens/Admin/AdminDashboard';
import CategoryManagement from '../screens/Admin/CategoryManagement';
import ChatScreen from '../screens/Chat/ChatScreen';
import NotificationsScreen from '../screens/NotificationsScreen';

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
                name="MarketplaceFeed"
                component={MarketplaceFeed}
                options={{
                    animationEnabled: true,
                }}
            />
            <Stack.Screen
                name="CreateExchangeRequest"
                component={CreateExchangeRequest}
                options={{
                    animationEnabled: true,
                }}
            />
            <Stack.Screen
                name="ExchangeRequestDetail"
                component={ExchangeRequestDetail}
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
            <Stack.Screen
                name="AdminDashboard"
                component={AdminDashboard}
                options={{
                    animationEnabled: true,
                }}
            />
            <Stack.Screen
                name="CategoryManagement"
                component={CategoryManagement}
                options={{
                    animationEnabled: true,
                }}
            />
            <Stack.Screen
                name="Chat"
                component={ChatScreen}
                options={{
                    animationEnabled: true,
                }}
            />
            <Stack.Screen
                name="Notifications"
                component={NotificationsScreen}
                options={{
                    animationEnabled: true,
                }}
            />
        </Stack.Navigator>
    );
};

export default AppNavigator;
