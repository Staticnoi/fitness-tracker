import { Redirect } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useApp } from '@/context/AppContext';
import colors from '@/constants/colors';

export default function Index() {
  const { state, isLoading } = useApp();

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.dark.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.dark.neonCyan} size="large" />
      </View>
    );
  }

  if (!state.onboardingCompleted) {
    return <Redirect href="/landing" />;
  }

  return <Redirect href="/(tabs)" />;
}
