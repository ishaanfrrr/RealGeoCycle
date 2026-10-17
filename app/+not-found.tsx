import { View } from 'react-native';
import { router } from 'expo-router';
import { Button, EmptyState } from '@/components/ui';
import { colors } from '@/constants/theme';

export default function NotFound() {
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <EmptyState
        icon="compass-outline"
        title="Page not found"
        message="The page you're looking for doesn't exist."
        action={<Button label="Go home" icon="home-outline" onPress={() => router.replace('/')} />}
      />
    </View>
  );
}
