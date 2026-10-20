import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { PersonRow } from '@/components/PersonRow';
import { Button, ErrorText, Field, Pill, Screen } from '@/components/ui';
import { useI18n } from '@/i18n';
import { clubMembers, inviteToClub, searchPeople } from '@/lib/api';
import { space, type } from '@/lib/theme';
import type { Profile } from '@/lib/types';
import { errorMessage, useAsync } from '@/lib/useAsync';

export default function InviteToClub() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useI18n();
  const [q, setQ] = useState('');
  const [list, setList] = useState<Profile[]>([]);
  const [invited, setInvited] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const members = useAsync(() => clubMembers(id), [id]);
  const inClub = new Set((members.data ?? []).map((m) => m.user_id));

  useEffect(() => {
    const h = setTimeout(() => searchPeople(q).then(setList).catch(() => {}), 300);
    return () => clearTimeout(h);
  }, [q]);

  async function invite(p: Profile) {
    setError(null);
    try {
      await inviteToClub(id, p.id);
      setInvited(new Set([...invited, p.id]));
    } catch (e) {
      setError(errorMessage(e));
    }
  }

  return (
    <Screen keyboard>
      <View style={{ gap: space.md }}>
        <Text style={type.display} accessibilityRole="header">{t('clubs.invite')}</Text>
        <Field value={q} onChangeText={setQ} placeholder={t('clubs.inviteSearch')} autoFocus autoCapitalize="none" autoCorrect={false} />
        <ErrorText message={error} />
        {list.map((p) => (
          <PersonRow key={p.id} p={p} right={
            inClub.has(p.id) || invited.has(p.id) ? <Pill label={t('clubs.invited')} /> : <Button label={t('clubs.invite')} small onPress={() => invite(p)} />
          } />
        ))}
      </View>
    </Screen>
  );
}
