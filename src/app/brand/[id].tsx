import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Linking, Text, View } from 'react-native';
import { ArticleCard } from '@/components/ArticleCard';
import { CigarRow } from '@/components/CigarRow';
import { PersonRow } from '@/components/PersonRow';
import { Button, Card, Empty, ErrorText, Icon, Loading, Pill, Row, Screen, Segmented } from '@/components/ui';
import { useI18n } from '@/i18n';
import {
  badgeHolders, brandArticles, brandBadges, brandCigars, brandManagers, brandTopFans, deleteBrandBadge, getBrand, isBrandManager,
} from '@/lib/api';
import { useMe } from '@/lib/auth';
import { countryName, formatRating } from '@/lib/format';
import { colors, fonts, space, type } from '@/lib/theme';
import { useAsync } from '@/lib/useAsync';

type Tab = 'articles' | 'cigars' | 'fans' | 'badges';

export default function BrandScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, locale } = useI18n();
  const router = useRouter();
  const me = useMe();
  const brand = useAsync(() => getBrand(id), [id]);
  const manager = useAsync(() => isBrandManager(id), [id]);
  const officials = useAsync(() => brandManagers(id), [id]);
  const articles = useAsync(() => brandArticles(id), [id]);
  const cigars = useAsync(() => brandCigars(id), [id]);
  const fans = useAsync(() => brandTopFans(id), [id]);
  const badges = useAsync(async () => {
    const list = await brandBadges(id);
    const holders = await badgeHolders(list.map((b) => b.id));
    return { list, holders };
  }, [id]);
  const [tab, setTab] = useState<Tab>('articles');

  if (brand.loading && !brand.data) return <Loading />;
  const b = brand.data;
  if (!b) return <Screen><ErrorText message={brand.error ?? t('common.error')} /></Screen>;
  const canManage = !!manager.data || me.is_admin;
  const holdersOf = (badgeId: string) => (badges.data?.holders ?? []).filter((h) => h.badge_id === badgeId);

  return (
    <Screen>
      <Stack.Screen options={{ title: b.name }} />
      <View style={{ gap: space.md }}>
        <Text style={type.overline}>{countryName(b.country, locale) ?? ''}</Text>
        <Text style={[type.display, { fontSize: 28 }]} accessibilityRole="header">{b.name}</Text>
        {b.website ? <Text style={[type.caption, { color: colors.accent }]} onPress={() => Linking.openURL(b.website!)}>{b.website}</Text> : null}
        {(officials.data ?? []).map(({ user }) => (
          <PersonRow key={user.id} p={user} onPress={() => router.push(`/user/${user.username}`)} right={<Pill label={t('brand.official')} tone="accent" />} />
        ))}
        {canManage ? (
          <Card style={{ gap: space.sm, borderColor: colors.accent }}>
            <Text style={type.label}>{t('brand.manage')}</Text>
            <Row>
              <Button label={t('brand.newArticle')} icon="create-outline" small style={{ flex: 1 }}
                onPress={() => router.push({ pathname: '/brand/article', params: { brandId: id } })} />
              <Button label={t('brand.newBadge')} icon="ribbon-outline" small variant="secondary" style={{ flex: 1 }}
                onPress={() => router.push({ pathname: '/brand/badge-new', params: { brandId: id } })} />
            </Row>
          </Card>
        ) : null}

        <Segmented<Tab> value={tab} onChange={setTab} options={[
          { value: 'articles', label: t('brand.articles') },
          { value: 'cigars', label: `${t('brand.cigars')} (${cigars.data?.length ?? 0})` },
          { value: 'fans', label: t('brand.fans') },
          { value: 'badges', label: t('brand.badges') },
        ]} />

        {tab === 'articles' ? (
          <View style={{ gap: space.md }}>
            {(articles.data ?? []).map((a) => <ArticleCard key={a.id} article={a} onPress={() => router.push(`/article/${a.id}`)} />)}
            {!articles.loading && !articles.data?.length ? <Empty text={t('brand.noArticles')} icon="document-text-outline" /> : null}
          </View>
        ) : null}

        {tab === 'cigars' ? (
          <View style={{ gap: space.sm }}>
            {(cigars.data ?? []).map((c) => <CigarRow key={c.id} cigar={c} onPress={() => router.push(`/cigar/${c.id}`)} />)}
            {!cigars.loading && !cigars.data?.length ? <Empty text={t('common.empty')} /> : null}
          </View>
        ) : null}

        {tab === 'fans' ? (
          <View style={{ gap: space.sm }}>
            {(fans.data ?? []).map((f, i) => (
              <View key={f.user_id} style={{ gap: 4 }}>
                <PersonRow
                  p={{ id: f.user_id, username: f.username, display_name: f.display_name, avatar_url: f.avatar_url, creator_status: f.creator_status }}
                  onPress={() => router.push(`/user/${f.username}`)}
                  right={<Text style={[type.label, { fontFamily: fonts.bold, color: colors.accent }]}>#{i + 1}</Text>}
                />
                <Row style={{ paddingLeft: space.md, justifyContent: 'space-between' }}>
                  <Text style={type.caption}>
                    {t('brand.fanStats', { count: f.checkins, unique: f.unique_cigars, avg: formatRating(f.avg_rating, locale) })}
                  </Text>
                  {canManage ? (
                    <Button label={t('brand.award')} icon="ribbon-outline" variant="ghost" small
                      onPress={() => router.push({ pathname: '/brand/award', params: { brandId: id, userId: f.user_id, name: f.display_name } })} />
                  ) : null}
                </Row>
              </View>
            ))}
            {!fans.loading && !fans.data?.length ? <Empty text={t('brand.noFans')} icon="people-outline" /> : null}
          </View>
        ) : null}

        {tab === 'badges' ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
            {(badges.data?.list ?? []).map((bd) => (
              <Card key={bd.id} style={{ width: '48%', alignItems: 'center', gap: 6, padding: space.md }}>
                <Icon name={(bd.icon as never) ?? 'ribbon'} size={30} color={colors.gold} />
                <Text style={[type.label, { textAlign: 'center' }]}>{bd.name}</Text>
                {bd.description ? <Text style={[type.caption, { textAlign: 'center' }]}>{bd.description}</Text> : null}
                <Text style={[type.caption, { fontSize: 11 }]}>{t('brand.holders', { count: holdersOf(bd.id).length })}</Text>
                {canManage ? <Button label={t('common.delete')} variant="ghost" small onPress={() => deleteBrandBadge(bd.id).then(badges.reload)} /> : null}
              </Card>
            ))}
            {!badges.loading && !badges.data?.list.length ? <Empty text={t('brand.noBadges')} icon="ribbon-outline" /> : null}
          </View>
        ) : null}
      </View>
    </Screen>
  );
}
