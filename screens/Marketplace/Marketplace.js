// Re-export MarketplaceFeed as the main Marketplace screen
import MarketplaceFeed from './MarketplaceFeed';

const MarketplaceScreen = ({ navigation }) => {
    return <MarketplaceFeed navigation={navigation} />;
};

export default MarketplaceScreen;
