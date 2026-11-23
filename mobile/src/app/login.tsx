import { Link } from 'expo-router';
import { Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function LoginScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF', padding: 24 }}>
      <Link href="/">Voltar</Link>
      <Text style={{ color: '#14213D', fontSize: 28 }}>Entrar na conta</Text>
    </SafeAreaView>
  );
}