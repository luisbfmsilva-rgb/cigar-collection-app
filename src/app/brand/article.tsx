import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Switch, Text, View } from 'react-native';
import { Button, Chip, ErrorText, Field, Loading, Row, Screen } from '@/components/ui';
import { useI18n } from '@/i18n';
import { brandCigars, getArticle, saveArticle } from '@/lib/api';
import { cigarTitle } from '@/lib/format';
import { publicUrl } from '@/lib/supabase';
import { colors, radius, space, type } from '@/lib/theme';
import type { BrandArticle, Cigar } from '@/lib/types';
import { errorMessage, useAsync } from '@/lib/useAsync';

/** Create or edit a manufacturer article (brandId required; id when editing). */
export default function ArticleEditor() {
  const { brandId, id } = useLocalSearchParams<{ brandId: string; id?: string }>();
  const data = useAsync(async () => ({
    article: id ? await getArticle(id) : null,
    cigars: await brandCigars(brandId),
  }), [brandId, id], { refetchOnFocus: false });
  if (data.loading && !data.data) return <Loading />;
  return <Form brandId={brandId} article={data.data?.article ?? null} cigars={data.data?.cigars ?? []} />;
}

function Form({ brandId, article, cigars }: { brandId: string; article: BrandArticle | null; cigars: Cigar[] }) {
  const { t } = useI18n();
  const router = useRouter();
  const [title, setTitle] = useState(article?.title ?? '');
  const [body, setBody] = useState(article?.body ?? '');
  const [link, setLink] = useState(article?.link_url ?? '');
  const [cigarId, setCigarId] = useState<string | null>(article?.cigar_id ?? null);
  const [featured, setFeatured] = useState(article?.featured ?? true);
  const [cover, setCover] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const linkOk = !link.trim() || /^https:\/\/\S+$/.test(link.trim());
  const valid = title.trim().length >= 3 && body.trim().length > 0 && linkOk;
  const existingCover = article?.cover_path ? publicUrl('cigar-images', article.cover_path) : undefined;

  async function pickCover() {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7, allowsEditing: true, aspect: [16, 9] });
    if (!res.canceled) setCover(res.assets[0].uri);
  }

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      const saved = await saveArticle({
        id: article?.id, brand_id: brandId, title, body, link_url: link.trim() || null, cigar_id: cigarId, featured,
        coverUri: cover, cover_path: article?.cover_path ?? null,
      });
      router.replace(`/article/${saved}`);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen keyboard footer={<Button label={t('article.publish')} onPress={submit} loading={busy} disabled={!valid} style={{ flex: 1 }} />}>
      <View style={{ gap: space.lg }}>
        <Text style={type.display} accessibilityRole="header">{article ? t('article.edit') : t('brand.newArticle')}</Text>
        <Field label={t('article.title')} value={title} onChangeText={setTitle} maxLength={140} />
        <Field label={t('article.body')} value={body} onChangeText={setBody} multiline maxLength={8000} style={{ minHeight: 200 }} />
        <Field label={t('article.link')} value={link} onChangeText={setLink} autoCapitalize="none" keyboardType="url"
          error={linkOk ? null : t('article.link')} />
        <View style={{ gap: 6 }}>
          <Text style={type.label}>{t('article.cover')}</Text>
          {cover || existingCover ? (
            <Image source={{ uri: cover ?? existingCover }} style={{ width: '100%', height: 180, borderRadius: radius.md }} contentFit="cover" />
          ) : null}
          <Button label={cover || existingCover ? t('common.change') : t('checkin.fromLibrary')} variant="secondary" icon="image-outline" small onPress={pickCover} />
        </View>
        {cigars.length > 0 ? (
          <View style={{ gap: 6 }}>
            <Text style={type.label}>{t('article.cigar')}</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
              {cigars.slice(0, 40).map((c) => (
                <Chip key={c.id} small label={cigarTitle({ line: c.line, vitola: c.vitola })} selected={cigarId === c.id}
                  onPress={() => setCigarId(cigarId === c.id ? null : c.id)} />
              ))}
            </View>
          </View>
        ) : null}
        <Row style={{ justifyContent: 'space-between' }}>
          <Text style={[type.label, { flex: 1 }]}>{t('article.featured')}</Text>
          <Switch value={featured} onValueChange={setFeatured} trackColor={{ true: colors.accent }} />
        </Row>
        <ErrorText message={error} />
      </View>
    </Screen>
  );
}
