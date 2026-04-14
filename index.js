import { registerRootComponent } from 'expo';
import { Platform } from 'react-native';

// Inject global CSS for web to fix the flex height chain (html → body → #root)
// This ensures ScrollView/FlatList parents have constrained heights so scrolling works
if (Platform.OS === 'web' && typeof document !== 'undefined') {
    const style = document.createElement('style');
    style.textContent = `
        html, body, #root {
            height: 100%;
            overflow: hidden;
            margin: 0;
            padding: 0;
        }
        #root > div {
            display: flex;
            flex-direction: column;
            height: 100%;
        }
    `;
    document.head.appendChild(style);
}

import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
