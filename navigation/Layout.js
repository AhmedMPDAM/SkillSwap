import React, { useEffect } from 'react';
import { NavigationContainer, useNavigation } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar, Alert } from 'react-native';
import AppNavigator from './AppNavigator';
import { useSocket } from '../context/SocketContext';

const SocketNotificationHandler = () => {
    const { socket } = useSocket();
    const navigation = useNavigation();

    useEffect(() => {
        if (!socket) return;

        const handleNotification = (data) => {
            console.log("Received notification:", data);
            Alert.alert(
                "New Notification",
                data.message,
                [
                    { text: "Cancel", style: "cancel" },
                    {
                        text: "View",
                        onPress: () => {
                            // Navigate to Chat screen with parameters
                            navigation.navigate("Chat", {
                                requestId: data.requestId,
                                proposalId: data.proposalId,
                                proposerId: data.proposerId
                            });
                        }
                    }
                ]
            );
        };

        socket.on("notification", handleNotification);

        return () => {
            socket.off("notification", handleNotification);
        };
    }, [socket, navigation]);

    return null;
};

const Layout = () => {
    return (
        <SafeAreaProvider>
            <StatusBar barStyle="dark-content" backgroundColor="#F2F2F7" />
            <NavigationContainer>
                <SocketNotificationHandler />
                <AppNavigator />
            </NavigationContainer>
        </SafeAreaProvider>
    );
};

export default Layout;
