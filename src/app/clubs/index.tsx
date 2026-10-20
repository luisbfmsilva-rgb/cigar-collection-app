import { Stack, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { ClubRow } from '@/components/ClubRow';
import { Button, Empty, Field, Screen, SectionTitle } from '@/components/ui';
import { useI18n } from '@/i18n';
import { discoverClubs, myClubs } from '@/lib/api';
import { space } from '@/lib/theme';
import type { Club } from '@/lib/types';
import { useAsync } from '@/lib/useAsync';

export default function Clubs() {
  const { t } = useI18n();
  const router = useRouter();
  const mine = useAsync(() => myClubs(), []);
  const [q, setQ] = useState('');
  const [found, setFound] = useState<Club[]>([]);

  useEffect(() => {
    const id = setTimeout(() => discoverClubs(q).then(setFound).catch(() => {}), 300);
    return () => clearTimeout(id);
  }, [q]);

  const myIds = new Set((mine.data ?? []).map((m) => m.club.id));

  return (
    <Screen keyboard>
      <Stack.Screen options={{ title: t('clubs.title') }} />
      <View style={{ gap: space.sm }}>
        <Button label={t('clubs.create')} icon="add" onPress={() => router.push('/clubs/new')} />
        <SectionTitle title={t('clubs.mine')} />
        {(mine.data ?? []).map((m) => (
          <ClubRow key={m.club.id} club={m.club} badge={m.status === 'invited' ? t('clubs.invited') : undefined} onPress={() => router.push(`/clubs/${m.club.id}`)} />
        ))}
        {(mine.data ?? []).length === 0 && !mine.loading ? <Empty text={t('clubs.noneYet')} icon="people-outline" /> : null}
        <SectionTitle title={t('clubs.discover')} />
        <Field value={q} onChangeText={setQ} placeholder={t('common.search')} autoCorrect={false} />
        {found.filter((c) => !myIds.has(c.id)).map((c) => <ClubRow key={c.id} club={c} onPress={() => router.push(`/clubs/${c.id}`)} />)}
      </View>
    </Screen>
  );
}
