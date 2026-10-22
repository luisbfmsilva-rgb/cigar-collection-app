import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { FlatList, RefreshControl, ScrollView, Text, View } from 'react-native';
import { ArticleCard } from '@/components/ArticleCard';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CheckinCard } from '@/components/CheckinCard';
import { Empty, ErrorText, IconButton, Loading, Segmented } from '@/components/ui';
import { useI18n } from '@/i18n';
import { featuredArticles, feed } from '@/lib/api';
import { colors, space, type } from '@/lib/theme';
import type { CheckinFeedRow } from '@/lib/types';
import { useAsync } from '@/lib/useAsync';

type Scope = 'following' | 'global';

export default function FeedScreen() {
  const { t } = useI18n();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [scope, setScope] = useState<Scope>('following');
  const [more, setMore] = useState<CheckinFeedRow[]>([]);
  const [end, setEnd] = useState(false);
  const { data, loading, error, reload } = useAsync(() => {
    setMore([]);
    setEnd(false);
    return feed({ kind: scope });
  }, [scope]);

  const articles = useAsync(() => featuredArticles(), []);

  const rows = useMemo(() => [...(data ?? []), ...more], [data, more]);

  const loadMore = useCallback(async () => {
    if (end || !rows.length) return;
    const last = rows[rows.length - 1];
    const next = await feed({ kind: scope }, last.created_at).catch(() => []);
    if (!next.length) setEnd(true);
    else setMore((m) => [...m, ...next]);
  }, [end, rows, scope]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: space.xl, paddingTop: space.md }}>
        <Text style={type.display} accessibilityRole="header">Long Ash</Text>
        <View style={{ flexDirection: 'row', gap: space.sm }}>
          <IconButton icon="people-outline" label={t('clubs.title')} onPress={() => router.push('/clubs')} filled />
          <IconButton icon="search-outline" label={t('common.search')} onPress={() => router.push('/people')} filled />
        </View>
      </View>
      <View style={{ paddingHorizontal: space.xl, paddingVertical: space.md }}>
        <Segmented<Scope>
          value={scope}
          onChange={setScope}
          options={[{ value: 'following', label: t('feed.following') }, { value: 'global', label: t('feed.global') }]}
        />
      </View>
      {loading && !data ? <Loading /> : (
        <FlatList
          data={rows}
          keyExtractor={(r) => r.id}
          contentContainerStyle={{ paddingHorizontal: space.xl, paddingBottom: space.xxl, gap: space.md }}
          renderItem={({ item }) => <CheckinCard row={item} onChanged={reload} />}
          refreshControl={<RefreshControl refreshing={false} onRefresh={() => { reload(); articles.reload(); }} tintColor={colors.accent} />}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListHeaderComponent={
            <View style={{ gap: space.sm }}>
              <ErrorText message={error} />
              {(articles.data ?? []).length > 0 ? (
                <>
                  <Text style={[type.overline, { color: colors.gold }]}>{t('brand.featured')}</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space.md }}>
                    {articles.data!.map((a) => (
                      <View key={a.id} style={{ width: 260 }}>
                        <ArticleCard article={a} showBrand onPress={() => router.push(`/article/${a.id}`)} />
                      </View>
                    ))}
                  </ScrollView>
                </>
              ) : null}
            </View>
          }
          ListEmptyComponent={
            scope === 'following'
              ? <Empty text={t('feed.emptyFollowing')} action={t('feed.findPeople')} onAction={() => setScope('global')} icon="people-outline" />
              : <Empty text={t('common.empty')} />
          }
        />
      )}
    </View>
  );
}
