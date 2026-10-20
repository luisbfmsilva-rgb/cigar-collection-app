import { Link, Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { colors, type } from '@/lib/theme';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Long Ash' }} />
      <View style={styles.container}>
        <Text style={type.title}>404</Text>
        <Link href="/" style={styles.link}>
          <Text style={{ color: colors.accent }}>Home</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20, backgroundColor: colors.bg },
  link: { marginTop: 15, paddingVertical: 15 },
});
