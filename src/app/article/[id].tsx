import { Image } from 'expo-image';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Alert, Linking, Text, View } from 'react-native';
import { Button, ErrorText, Loading, Pill, Row, Screen } from '@/components/ui';
import { useI18n } from '@/i18n';
import { deleteArticle, getArticle, getCigar, isBrandManager } from '@/lib/api';
import { useMe } from '@/lib/auth';
import { cigarTitle, timeAgo } from '@/lib/format';
import { publicUrl } from '@/lib/supabase';
import { colors, radius, space, type } from '@/lib/theme';
import { useAsync } from '@/lib/useAsync';

export default function ArticleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useI18n();
  const router = useRouter();
  const me = useMe();
  const data = useAsync(async () => {
    const article = await getArticle(id);
    if (!article) return null;
    const [manager, cigar] = await Promise.all([
      isBrandManager(article.brand_id),
      article.cigar_id ? getCigar(article.cigar_id) : Promise.resolve(null),
    ]);
    return { article, manager, cigar };
  }, [id]);

  if (data.loading && !data.data) return <Loading />;
  const d = data.data;
  if (!d) return <Screen><ErrorText message={data.error ?? t('common.error')} /></Screen>;
  const a = d.article;
  const canManage = d.manager || me.is_admin;

  function confirmDelete() {
    Alert.alert(t('article.deleteConfirm'), a.title, [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.delete'), style: 'destructive', onPress: () => deleteArticle(a.id).then(() => router.back()) },
    ]);
  }

  return (
    <Screen>
      <Stack.Screen options={{ title: a.brand?.name ?? '' }} />
      <View style={{ gap: space.md }}>
        {a.cover_path ? <Image source={{ uri: publicUrl('cigar-images', a.cover_path) }} style={{ width: '100%', height: 200, borderRadius: radius.md }} contentFit="cover" /> : null}
        <Row>
          <Text style={[type.overline, { color: colors.gold }]} onPress={() => router.push(`/brand/${a.brand_id}`)}>{a.brand?.name}</Text>
          <Pill label={t('brand.official')} tone="accent" />
        </Row>
        <Text style={[type.display, { fontSize: 26, lineHeight: 30 }]} accessibilityRole="header">{a.title}</Text>
        <Text style={type.caption}>{timeAgo(a.created_at, t)}</Text>
        <Text style={[type.body, { lineHeight: 23 }]}>{a.body}</Text>
        {d.cigar ? <Button label={cigarTitle(d.cigar)} icon="leaf-outline" variant="secondary" onPress={() => router.push(`/cigar/${d.cigar!.id}`)} /> : null}
        {a.link_url ? <Button label={t('article.openLink')} icon="open-outline" variant="ghost" onPress={() => Linking.openURL(a.link_url!)} /> : null}
        {canManage ? (
          <Row style={{ marginTop: space.lg }}>
            <Button label={t('article.edit')} variant="secondary" small style={{ flex: 1 }}
              onPress={() => router.push({ pathname: '/brand/article', params: { brandId: a.brand_id, id: a.id } })} />
            <Button label={t('article.delete')} variant="danger" small style={{ flex: 1 }} onPress={confirmDelete} />
          </Row>
        ) : (
          <Button label={t('common.report')} variant="ghost" small style={{ alignSelf: 'flex-start', marginTop: space.lg }}
            onPress={() => router.push({ pathname: '/report', params: { kind: 'brand_article', id: a.id } })} />
        )}
      </View>
    </Screen>
  );
}
