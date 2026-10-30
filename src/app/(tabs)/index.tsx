import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { ArticleCard } from '@/components/ArticleCard';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Logo } from '@/components/Logo';
import { CheckinCard } from '@/components/CheckinCard';
import { Empty, ErrorText, Icon, IconButton, Loading, Segmented } from '@/components/ui';
import { useI18n } from '@/i18n';
import { deleteSuperPost, featuredArticles, feed, feedSuperPosts } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { SuperPostCard } from '@/components/SuperPostCard';
import { useCheckinDraft } from '@/lib/checkinDraft';
import { cigarTitle } from '@/lib/format';
import { colors, radius, space, type } from '@/lib/theme';
import type { CheckinFeedRow } from '@/lib/types';
import { useAsync } from '@/lib/useAsync';

type Scope = 'following' | 'global';

export default function FeedScreen() {
  const { t } = useI18n();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { draft } = useCheckinDraft();
  const [scope, setScope] = useState<Scope>('following');
  const [more, setMore] = useState<CheckinFeedRow[]>([]);
  const [end, setEnd] = useState(false);
  const { data, loading, error, reload } = useAsync(() => {
    setMore([]);
    setEnd(false);
    return feed({ kind: scope });
  }, [scope]);

  const articles = useAsync(() => featuredArticles(), []);
  const superPosts = useAsync(() => feedSuperPosts(), []);
  const { profile } = useAuth();
  const canSuper = profile?.account_type === 'manufacturer' || profile?.creator_status === 'verified';

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
        <Logo size={26} />
        <View style={{ flexDirection: 'row', gap: space.sm }}>
          {canSuper ? <IconButton icon="star-outline" label={t('super.title')} onPress={() => router.push('/superpost/new')} filled /> : null}
          <IconButton icon="people-outline" label={t('clubs.title')} onPress={() => router.push('/clubs')} filled />
          <IconButton icon="search-outline" label={t('common.search')} onPress={() => router.push('/people')} filled />
        </View>
      </View>
      {draft.cigar ? (
        <Pressable onPress={() => router.push('/checkin/new')} accessibilityRole="button"
          style={{ marginHorizontal: space.xl, marginTop: space.md, padding: space.md, borderRadius: radius.lg, backgroundColor: colors.accent, flexDirection: 'row', alignItems: 'center', gap: space.md }}>
          <Icon name={draft.startedAt && !draft.endedAt ? 'flame' : 'create-outline'} size={22} color={colors.onAccent} />
          <View style={{ flex: 1 }}>
            <Text style={[type.label, { color: colors.onAccent }]}>{t('checkin.inProgress')}</Text>
            <Text style={[type.caption, { color: colors.onAccent }]} numberOfLines={1}>{cigarTitle(draft.cigar)}</Text>
          </View>
          <Icon name="chevron-forward" size={18} color={colors.onAccent} />
        </Pressable>
      ) : null}
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
              {(superPosts.data ?? []).length > 0 ? (
                <>
                  <Text style={[type.overline, { color: colors.gold }]}>{t('super.title')}</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space.md, paddingBottom: space.sm }}>
                    {superPosts.data!.map((p) => (
                      <SuperPostCard key={p.id} post={p} mine={p.user_id === profile?.id}
                        onDelete={() => deleteSuperPost(p.id).then(superPosts.reload).catch(() => {})} />
                    ))}
                  </ScrollView>
                </>
              ) : null}
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
