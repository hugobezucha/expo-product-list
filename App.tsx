import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { BrandProvider } from './src/brands/BrandProvider';
import { ProductListScreen } from './src/features/products/ProductListScreen';

export default function App() {
  return (
    <SafeAreaProvider>
      <BrandProvider>
        <StatusBar style="dark" />
        <ProductListScreen />
      </BrandProvider>
    </SafeAreaProvider>
  );
}
