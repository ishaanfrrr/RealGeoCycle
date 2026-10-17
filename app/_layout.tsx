import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { Image, Text, View } from 'react-native';
import { MD3DarkTheme, PaperProvider } from 'react-native-paper';
import { colors } from '@/constants/theme';

function LogoTitle() {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <Image style={{ width: 28, height: 28 }} source={require('@/assets/images/logo.png')} />
      <Text style={{ color: colors.text, fontWeight: '800', fontSize: 18, letterSpacing: -0.3 }}>GeoCycle</Text>
    </View>
  );
}

const navTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.background,
    card: colors.background,
    border: colors.border,
    primary: colors.primary,
    text: colors.text,
  },
};

const paperTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: colors.primary,
    background: colors.background,
    surface: colors.surface,
  },
};

const headerOptions = {
  headerTitleAlign: 'center' as const,
  headerTitle: () => <LogoTitle />,
  headerShadowVisible: false,
  headerStyle: { backgroundColor: colors.background },
  headerTintColor: colors.text,
};

export default function RootLayout() {
  return (
    <PaperProvider theme={paperTheme}>
      <ThemeProvider value={navTheme}>
        <Stack>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="(back)" options={headerOptions} />
          <Stack.Screen name="article" options={{ ...headerOptions, headerBackTitle: 'News' }} />
          <Stack.Screen name="+not-found" options={headerOptions} />
        </Stack>
      </ThemeProvider>
    </PaperProvider>
  );
}
