import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { Image, Text, View } from 'react-native';
import { PaperProvider } from 'react-native-paper';

function LogoTitle() {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <Image style={{ width: 32, height: 32 }} source={require('@/assets/images/logo.png')} />
      <Text style={{ color: '#8BC34A', fontWeight: '700', fontSize: 18, letterSpacing: 1 }}>GeoCycle</Text>
    </View>
  );
}

const earthTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: '#0E1A0A',
    card: '#1C2B14',
    border: '#3D5C28',
    primary: '#8BC34A',
    text: '#E8F0DC',
  },
};

export default function RootLayout() {
  return (
    <PaperProvider>
      <ThemeProvider value={earthTheme}>
        <Stack>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          {/*@ts-ignore*/}
          <Stack.Screen name="(back)" options={{ headerTitleAlign: 'center', headerTitle: (props) => <LogoTitle {...props} /> }} />
          {/*@ts-ignore*/}
          <Stack.Screen name="article" options={{ headerTitleAlign: 'center', headerTitle: (props) => <LogoTitle {...props} /> }} />
          {/*@ts-ignore*/}
          <Stack.Screen name="+not-found" options={{ headerTitleAlign: 'center', headerTitle: (props) => <LogoTitle {...props} /> }} />
        </Stack>
      </ThemeProvider>
    </PaperProvider>
  );
}
