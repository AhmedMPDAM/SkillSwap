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
import CreditHistoryScreen from '../screens/Profile/CreditHistoryScreen';
import ReceivedRatingsScreen from '../screens/Profile/ReceivedRatingsScreen';
import UserPublicProfile from '../screens/Profile/UserPublicProfile';
import AdminDashboard from '../screens/Admin/AdminDashboard';
import CategoryManagement from '../screens/Admin/CategoryManagement';
import UserManagement from '../screens/Admin/UserManagement';
import UserDetailScreen from '../screens/Admin/UserDetailScreen';
import ExchangeManagement from '../screens/Admin/ExchangeManagement';
import ExchangeDetailScreen from '../screens/Admin/ExchangeDetailScreen';
import ExaminerDashboard from '../screens/Admin/ExaminerDashboard';
import ExaminerReviewDetail from '../screens/Admin/ExaminerReviewDetail';
import ChatScreen from '../screens/Chat/ChatScreen';
import MessagesScreen from '../screens/Chat/MessagesScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import SettingsScreen from '../screens/Settings/SettingsScreen';

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
                name="CreditHistory"
                component={CreditHistoryScreen}
                options={{ animationEnabled: true }}
            />
            <Stack.Screen
                name="ReceivedRatings"
                component={ReceivedRatingsScreen}
                options={{ animationEnabled: true }}
            />
            <Stack.Screen
                name="UserPublicProfile"
                component={UserPublicProfile}
                options={{ animationEnabled: true }}
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
                options={{ animationEnabled: true }}
            />
            <Stack.Screen
                name="UserManagement"
                component={UserManagement}
                options={{ animationEnabled: true }}
            />
            <Stack.Screen
                name="UserDetail"
                component={UserDetailScreen}
                options={{ animationEnabled: true }}
            />
            <Stack.Screen
                name="ExchangeManagement"
                component={ExchangeManagement}
                options={{ animationEnabled: true }}
            />
            <Stack.Screen
                name="ExchangeDetail"
                component={ExchangeDetailScreen}
                options={{ animationEnabled: true }}
            />
            <Stack.Screen
                name="ExaminerDashboard"
                component={ExaminerDashboard}
                options={{ animationEnabled: true }}
            />
            <Stack.Screen
                name="ExaminerReviewDetail"
                component={ExaminerReviewDetail}
                options={{ animationEnabled: true }}
            />
            <Stack.Screen
                name="Chat"
                component={ChatScreen}
                options={{
                    animationEnabled: true,
                }}
            />
            <Stack.Screen
                name="Messages"
                component={MessagesScreen}
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
            <Stack.Screen
                name="Settings"
                component={SettingsScreen}
                options={{
                    animationEnabled: true,
                }}
            />
        </Stack.Navigator>
    );
};

export default AppNavigator;
