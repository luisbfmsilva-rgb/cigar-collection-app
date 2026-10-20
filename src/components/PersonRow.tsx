import { Pressable, Text, View } from 'react-native';
import { Avatar, Icon } from '@/components/ui';
import { publicUrl } from '@/lib/supabase';
import { colors, fonts, radius, space, type } from '@/lib/theme';
import type { Profile } from '@/lib/types';

export function PersonRow({ p, onPress, right }: { p: Pick<Profile, 'id' | 'username' | 'display_name' | 'avatar_url' | 'creator_status'>; onPress?: () => void; right?: React.ReactNode }) {
  return (
    <Pressable onPress={onPress} disabled={!onPress} accessibilityRole={onPress ? 'button' : undefined}
      style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.sm, minHeight: 56, borderRadius: radius.md, opacity: pressed ? 0.85 : 1 })}>
      <Avatar name={p.display_name} url={publicUrl('avatars', p.avatar_url)} seed={p.id} />
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Text style={[type.label, { fontFamily: fonts.bold }]} numberOfLines={1}>{p.display_name}</Text>
          {p.creator_status === 'verified' ? <Icon name="checkmark-circle" size={14} color={colors.accent} /> : null}
        </View>
        <Text style={type.caption}>@{p.username}</Text>
      </View>
      {right}
    </Pressable>
  );
}
