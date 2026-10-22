import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { Alert, Linking, Pressable, Text, View } from 'react-native';
import { LanguagePicker } from '@/components/LanguagePicker';
import { PersonRow } from '@/components/PersonRow';
import { Button, Icon, IconName, Screen, SectionTitle } from '@/components/ui';
import { useI18n } from '@/i18n';
import { deleteMyAccount, myBlocks, setBlock, updateProfile } from '@/lib/api';
import { useAuth, useMe } from '@/lib/auth';
import { colors, fonts, space, type } from '@/lib/theme';
import { useAsync } from '@/lib/useAsync';

const LEGAL = {
  terms: process.env.EXPO_PUBLIC_TERMS_URL ?? 'https://longash.app/terms',
  privacy: process.env.EXPO_PUBLIC_PRIVACY_URL ?? 'https://longash.app/privacy',
};

export default function Settings() {
  const { t } = useI18n();
  const router = useRouter();
  const me = useMe();
  const { signOut, refreshProfile } = useAuth();
  const blocked = useAsync(() => myBlocks(), []);

  function confirmDelete() {
    Alert.alert(t('settings.deleteAccount'), t('settings.deleteConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.delete'), style: 'destructive', onPress: () => deleteMyAccount().catch((e) => Alert.alert(t('common.error'), String(e?.message ?? e))) },
    ]);
  }

  return (
    <Screen>
      <View style={{ gap: space.sm }}>
        <Text style={type.display} accessibilityRole="header">{t('settings.title')}</Text>

        <SectionTitle title={t('settings.language')} />
        <LanguagePicker onChange={(locale) => updateProfile({ locale }).then(refreshProfile).catch(() => {})} />

        <SectionTitle title={t('account.title')} />
        <Item icon="id-card-outline" label={`${t('account.title')}: ${t(`account.types.${me.account_type}`)}`} onPress={() => router.push('/account')} />

        {me.is_admin ? (
          <>
            <SectionTitle title={t('settings.admin')} />
            <Item icon="shield-checkmark-outline" label={t('admin.title')} onPress={() => router.push('/admin')} />
          </>
        ) : null}

        <SectionTitle title={t('settings.blocked')} />
        {(blocked.data ?? []).length === 0 ? <Text style={type.caption}>{t('common.empty')}</Text> : null}
        {(blocked.data ?? []).map((p) => (
          <PersonRow key={p.id} p={p} right={<Button label={t('common.unblock')} small variant="secondary" onPress={() => setBlock(p.id, false).then(blocked.reload)} />} />
        ))}

        <SectionTitle title={t('settings.legal')} />
        <Item icon="document-text-outline" label={t('settings.terms')} onPress={() => Linking.openURL(LEGAL.terms)} />
        <Item icon="lock-closed-outline" label={t('settings.privacy')} onPress={() => Linking.openURL(LEGAL.privacy)} />

        <SectionTitle title={t('settings.account')} />
        <Item icon="log-out-outline" label={t('auth.signOut')} onPress={signOut} />
        <Item icon="trash-outline" label={t('settings.deleteAccount')} onPress={confirmDelete} danger />

        <Text style={[type.caption, { textAlign: 'center', marginTop: space.xl }]}>
          {t('settings.version', { v: Constants.expoConfig?.version ?? '1.0.0' })} · @{me.username}
        </Text>
      </View>
    </Screen>
  );
}

function Item({ icon, label, onPress, danger }: { icon: IconName; label: string; onPress: () => void; danger?: boolean }) {
  const color = danger ? colors.danger : colors.text;
  return (
    <Pressable onPress={onPress} accessibilityRole="button"
      style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: space.md, minHeight: 52, paddingHorizontal: space.md, borderRadius: 12, backgroundColor: colors.surface, opacity: pressed ? 0.85 : 1 })}>
      <Icon name={icon} size={20} color={color} />
      <Text style={{ flex: 1, color, fontFamily: fonts.semibold, fontSize: 15 }}>{label}</Text>
      <Icon name="chevron-forward" size={18} color={colors.textMuted} />
    </Pressable>
  );
}
