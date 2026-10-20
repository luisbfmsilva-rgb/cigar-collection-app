import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { CigarRow } from '@/components/CigarRow';
import { Button, Chip, ErrorText, Field, Icon, Screen } from '@/components/ui';
import { useI18n } from '@/i18n';
import { addCreatorLink, searchCigars } from '@/lib/api';
import { guessLinkKind, isHttpsUrl, isStoreOrAffiliateLink, previewLink } from '@/lib/links';
import { colors, space, type } from '@/lib/theme';
import { Cigar, LINK_KINDS, LinkKind } from '@/lib/types';
import { errorMessage } from '@/lib/useAsync';
import { useSearch } from '@/lib/useSearch';

export default function AddCreatorLink() {
  const { t, s } = useI18n();
  const router = useRouter();
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [kind, setKind] = useState<LinkKind>('youtube');
  const [thumb, setThumb] = useState<string | null>(null);
  const [sponsored, setSponsored] = useState(false);
  const [cq, setCq] = useState('');
  const [cigar, setCigar] = useState<Cigar | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const store = isStoreOrAffiliateLink(url);

  useEffect(() => {
    if (!isHttpsUrl(url)) return;
    const id = setTimeout(() => previewLink(url).then((p) => {
      if (p.title && !title) setTitle(p.title.slice(0, 140));
      setThumb(p.thumbnail);
    }).catch(() => {}), 400);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]);

  const cigars = useSearch(cq, searchCigars).data ?? [];

  async function save() {
    setBusy(true);
    setError(null);
    try {
      await addCreatorLink({ kind, url: url.trim(), title: title.trim(), thumbnail_url: thumb, cigar_id: cigar?.id ?? null, is_sponsored: sponsored });
      router.back();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  const valid = isHttpsUrl(url) && !store && title.trim().length >= 2;

  return (
    <Screen keyboard footer={<Button label={t('common.save')} onPress={save} loading={busy} disabled={!valid} style={{ flex: 1 }} />}>
      <View style={{ gap: space.lg }}>
        <Text style={type.display} accessibilityRole="header">{t('creator.linkTitle')}</Text>
        <Field label={t('creator.url')} value={url} onChangeText={(v) => { setUrl(v); if (isHttpsUrl(v)) setKind(guessLinkKind(v)); }} autoCapitalize="none" autoCorrect={false} keyboardType="url" error={store ? t('creator.storeLink') : null} />
        <Field label={t('creator.titleField')} value={title} onChangeText={setTitle} maxLength={140} />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          {LINK_KINDS.map((k) => <Chip key={k} label={s.creator.kinds[k]} selected={kind === k} onPress={() => setKind(k)} />)}
        </View>
        <View style={{ gap: 6 }}>
          <Field label={t('creator.cigar')} value={cigar ? `${cigar.brand_name} ${cigar.line}` : cq} onChangeText={(v) => { setCigar(null); setCq(v); }} />
          {!cigar ? cigars.slice(0, 5).map((c) => <CigarRow key={c.id} cigar={c} onPress={() => { setCigar(c); setCq(''); }} />) : null}
        </View>
        <Pressable onPress={() => setSponsored(!sponsored)} accessibilityRole="checkbox" accessibilityState={{ checked: sponsored }} style={{ flexDirection: 'row', gap: space.md, alignItems: 'center', minHeight: 44 }}>
          <Icon name={sponsored ? 'checkbox' : 'square-outline'} color={sponsored ? colors.accent : colors.textMuted} size={26} />
          <Text style={[type.body, { flex: 1 }]}>{t('creator.sponsoredToggle')}</Text>
        </Pressable>
        <Text style={type.caption}>{t('creator.rules')}</Text>
        <ErrorText message={error} />
      </View>
    </Screen>
  );
}
