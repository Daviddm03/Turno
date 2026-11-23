import { router } from 'expo-router';
import { Image, Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const blue = '#2455DB';
const ink = '#14213D';
const days = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
const schedule = [
  [true, true, false, true, false, false, false],
  [false, true, true, false, false, true, false],
  [true, false, false, true, true, false, true],
];

export default function IntroScreen() {
  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="dark-content" />

      <ScrollView contentContainerStyle={styles.page}>
        <View style={styles.brand}>
          <View style={styles.symbol} accessible={false}>
            <View style={[styles.block, styles.topBlock]} />
            <View style={styles.symbolRow}>
              <View style={styles.block} />
              <View style={styles.block} />
            </View>
          </View>

          <Text style={styles.brandText}>Turno</Text>
        </View>

        <View style={styles.content}>
          <View style={styles.copy}>
            <Text accessibilityRole="header" style={styles.title}>
              A semana da equipa,{' '}
              <Text style={styles.titleAccent}>num só lugar.</Text>
            </Text>

            <Text style={styles.subtitle}>
              Organiza turnos e folgas numa escala semanal.
            </Text>
          </View>

         <View style={styles.illustrationFrame}>
            <Image
              source={require('../../assets/images/turnoPlanner.png')}
              style={styles.illustration}
              resizeMode="contain"
              accessible={false}
            />
          </View>
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/login')}
          style={({ pressed }) => [styles.button, pressed && styles.pressed]}
        >
          <Text style={styles.buttonText}>Entrar</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  page: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 16,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: blue,
  },
  symbol: {
    gap: 3,
  },
  symbolRow: {
    flexDirection: 'row',
    gap: 3,
  },
  block: {
    width: 10,
    height: 8,
    borderRadius: 2,
    backgroundColor: blue,
  },
  topBlock: {
    width: 14,
    alignSelf: 'flex-end',
  },
  brandText: {
    color: ink,
    fontSize: 24,
    fontWeight: '700',
  },
  content: {
    flexGrow: 1,
    paddingTop: 32,
    paddingBottom: 24,
    gap: 24,
  },
  copy: {
    gap: 8,
  },
  title: {
    color: ink,
    fontSize: 32,
    lineHeight: 38,
    fontWeight: '700',
  },
  titleAccent: {
    color: blue,
  },
  subtitle: {
    color: '#53627D',
    fontSize: 16,
    lineHeight: 24,
  },
  illustrationFrame: {
    marginTop: 40,
    shadowColor: '#14213D',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 12,
  },
  illustration: {
    width: '100%',
    height: 200,
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    borderRadius: 12,
    backgroundColor: blue,
  },
  pressed: {
    opacity: 0.8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});