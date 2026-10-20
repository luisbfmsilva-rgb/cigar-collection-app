import { useAudioPlayer } from 'expo-audio';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { Button, ErrorText, Field, Icon, IconButton, Screen } from '@/components/ui';
import { useI18n } from '@/i18n';
import { useCheckinDraft } from '@/lib/checkinDraft';
import { musicFromLink, searchAppleMusic } from '@/lib/links';
import { colors, fonts, radius, space, type } from '@/lib/theme';
import type { Music } from '@/lib/types';
import { useSearch } from '@/lib/useSearch';

export default function MusicPicker() {
  const { t, locale } = useI18n();
  const router = useRouter();
  const { update } = useCheckinDraft();
  const [q, setQ] = useState('');
  const search = useSearch(q, (term) => searchAppleMusic(term, locale === 'pt' ? 'BR' : 'US'), { delay: 350 });
  const results = search.data ?? [];
  const loading = search.loading;
  const [link, setLink] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [playing, setPlaying] = useState<string | null>(null);
  const player = useAudioPlayer(null);


  useEffect(() => () => player.pause(), [player]);

  function preview(m: Music) {
    if (!m.previewUrl) return;
    if (playing === m.url) {
      player.pause();
      setPlaying(null);
      return;
    }
    player.replace({ uri: m.previewUrl });
    player.play();
    setPlaying(m.url);
  }

  function choose(m: Music) {
    player.pause();
    update({ music: m });
    router.back();
  }

  async function useLink() {
    setError(null);
    const m = await musicFromLink(link);
    if (!m) setError(t('music.invalidLink'));
    else choose(m);
  }

  return (
    <Screen keyboard>
      <View style={{ gap: space.md }}>
        <Text style={type.display} accessibilityRole="header">{t('music.title')}</Text>
        <Field value={q} onChangeText={setQ} placeholder={t('music.searchPlaceholder')} autoFocus autoCorrect={false} />
        {loading ? <ActivityIndicator color={colors.accent} /> : null}
        <View style={{ gap: space.sm }}>
          {results.map((m) => (
            <Pressable key={m.url} onPress={() => choose(m)} accessibilityRole="button"
              style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.sm, borderRadius: radius.md, backgroundColor: colors.surface, opacity: pressed ? 0.85 : 1 })}>
              {m.artworkUrl ? <Image source={{ uri: m.artworkUrl }} style={{ width: 52, height: 52, borderRadius: 6 }} /> : <Icon name="musical-notes" />}
              <View style={{ flex: 1 }}>
                <Text style={[type.label, { fontFamily: fonts.semibold }]} numberOfLines={1}>{m.title}</Text>
                <Text style={type.caption} numberOfLines={1}>{m.artist}</Text>
              </View>
              {m.previewUrl ? <IconButton icon={playing === m.url ? 'pause' : 'play'} label={t('music.preview')} onPress={() => preview(m)} /> : null}
            </Pressable>
          ))}
        </View>
        {results.length > 0 ? <Text style={[type.caption, { textAlign: 'center' }]}>{t('music.poweredBy')}</Text> : null}
        <View style={{ gap: space.sm, marginTop: space.lg }}>
          <Field label={t('music.pasteLink')} value={link} onChangeText={setLink} placeholder={t('music.linkPlaceholder')} autoCapitalize="none" autoCorrect={false} keyboardType="url" />
          <Button label={t('music.useLink')} variant="secondary" onPress={useLink} disabled={!/^https?:\/\//.test(link.trim())} />
          <ErrorText message={error ?? search.error} />
        </View>
      </View>
    </Screen>
  );
}
