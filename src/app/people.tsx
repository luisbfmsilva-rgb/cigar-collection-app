import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { PersonRow } from '@/components/PersonRow';
import { Field, Screen } from '@/components/ui';
import { useI18n } from '@/i18n';
import { searchPeople } from '@/lib/api';
import { space, type } from '@/lib/theme';
import type { Profile } from '@/lib/types';

export default function People() {
  const { t } = useI18n();
  const router = useRouter();
  const [q, setQ] = useState('');
  const [list, setList] = useState<Profile[]>([]);

  useEffect(() => {
    const id = setTimeout(() => searchPeople(q).then(setList).catch(() => {}), 300);
    return () => clearTimeout(id);
  }, [q]);

  return (
    <Screen keyboard>
      <View style={{ gap: space.md }}>
        <Text style={type.display} accessibilityRole="header">{t('explore.people')}</Text>
        <Field value={q} onChangeText={setQ} placeholder={t('clubs.inviteSearch')} autoFocus autoCapitalize="none" autoCorrect={false} />
        {list.map((p) => <PersonRow key={p.id} p={p} onPress={() => router.push(`/user/${p.username}`)} />)}
      </View>
    </Screen>
  );
}
