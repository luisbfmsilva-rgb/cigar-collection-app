import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { ComponentProps, ReactNode } from 'react';
import {
  ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleProp, StyleSheet, Text,
  TextInput, TextInputProps, View, ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { initials } from '@/lib/format';
import { colors, fonts, radius, space, TOUCH, type } from '@/lib/theme';

export type IconName = ComponentProps<typeof Ionicons>['name'];

export function Icon({ name, size = 22, color = colors.text }: { name: IconName; size?: number; color?: string }) {
  return <Ionicons name={name} size={size} color={color} />;
}

/** Full-screen container with the app background and optional scroll. */
export function Screen({
  children, scroll = true, padded = true, footer, style, keyboard = false, refreshControl,
}: {
  children: ReactNode; scroll?: boolean; padded?: boolean; footer?: ReactNode; style?: StyleProp<ViewStyle>;
  keyboard?: boolean; refreshControl?: ComponentProps<typeof ScrollView>['refreshControl'];
}) {
  const insets = useSafeAreaInsets();
  const inner = scroll ? (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
      refreshControl={refreshControl}
      contentContainerStyle={[padded && { padding: space.xl }, { paddingBottom: space.xxl + (footer ? 0 : insets.bottom) }, style]}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[{ flex: 1 }, padded && { padding: space.xl }, style]}>{children}</View>
  );
  const body = (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {inner}
      {footer ? (
        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, space.lg) }]}>{footer}</View>
      ) : null}
    </View>
  );
  if (!keyboard) return body;
  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
      {body}
    </KeyboardAvoidingView>
  );
}

type ButtonProps = {
  label: string; onPress?: () => void; variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  icon?: IconName; loading?: boolean; disabled?: boolean; style?: StyleProp<ViewStyle>; small?: boolean;
  accessibilityLabel?: string;
};

export function Button({ label, onPress, variant = 'primary', icon, loading, disabled, style, small, accessibilityLabel }: ButtonProps) {
  const v = buttonVariants[variant];
  const off = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: !!off, busy: !!loading }}
      onPress={off ? undefined : onPress}
      style={({ pressed }) => [
        styles.button, small && styles.buttonSmall, v.box, off && { opacity: 0.5 }, pressed && { opacity: 0.8 }, style,
      ]}
    >
      {loading ? <ActivityIndicator color={v.text.color} /> : (
        <>
          {icon ? <Icon name={icon} size={small ? 16 : 18} color={v.text.color} /> : null}
          <Text style={[styles.buttonText, small && { fontSize: 13 }, v.text]} numberOfLines={1}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}

const buttonVariants = {
  primary: { box: { backgroundColor: colors.accent }, text: { color: colors.onAccent } },
  secondary: { box: { borderWidth: 1, borderColor: colors.borderStrong }, text: { color: colors.text } },
  ghost: { box: {}, text: { color: colors.accent } },
  danger: { box: { backgroundColor: colors.danger }, text: { color: colors.onDanger } },
};

export function IconButton({
  icon, onPress, label, size = 22, color = colors.text, filled,
}: { icon: IconName; onPress?: () => void; label: string; size?: number; color?: string; filled?: boolean }) {
  return (
    <Pressable
      accessibilityRole="button" accessibilityLabel={label} onPress={onPress} hitSlop={6}
      style={({ pressed }) => [styles.iconButton, filled && styles.iconButtonFilled, pressed && { opacity: 0.7 }]}
    >
      <Icon name={icon} size={size} color={color} />
    </Pressable>
  );
}

export function Field({
  label, hint, error, style, ...input
}: TextInputProps & { label?: string; hint?: string; error?: string | null; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[{ gap: 6 }, style]}>
      {label ? <Text style={type.label}>{label}</Text> : null}
      <TextInput
        placeholderTextColor={colors.textMuted}
        selectionColor={colors.accent}
        accessibilityLabel={label}
        {...input}
        style={[styles.input, input.multiline && { minHeight: 96, textAlignVertical: 'top', paddingTop: 12 }, error && { borderColor: colors.danger }]}
      />
      {error ? <Text style={[type.caption, { color: colors.danger }]}>{error}</Text> : hint ? <Text style={type.caption}>{hint}</Text> : null}
    </View>
  );
}

export function Chip({
  label, selected, onPress, color, icon, small,
}: { label: string; selected?: boolean; onPress?: () => void; color?: string; icon?: IconName; small?: boolean }) {
  const bg = selected ? (color ?? colors.accent) : colors.chip;
  const fg = selected ? colors.onAccent : colors.text;
  const content = (
    <View style={[styles.chip, small && { paddingVertical: 4, paddingHorizontal: 8 }, { backgroundColor: bg }]}>
      {icon ? <Icon name={icon} size={14} color={fg} /> : null}
      <Text style={[styles.chipText, { color: fg }, selected && { fontFamily: fonts.bold }]}>{label}</Text>
    </View>
  );
  if (!onPress) return content;
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ selected: !!selected }} onPress={onPress} hitSlop={4}>
      {content}
    </Pressable>
  );
}

export function Segmented<T extends string>({
  options, value, onChange,
}: { options: { value: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <View style={styles.segmented} accessibilityRole="tablist">
      {options.map((o) => {
        const on = o.value === value;
        return (
          <Pressable
            key={o.value} accessibilityRole="tab" accessibilityState={{ selected: on }}
            onPress={() => onChange(o.value)} style={[styles.segment, on && styles.segmentOn]}
          >
            <Text style={[styles.segmentText, on && { color: colors.text, fontFamily: fonts.bold }]} numberOfLines={1}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Card({ children, style, onPress }: { children: ReactNode; style?: StyleProp<ViewStyle>; onPress?: () => void }) {
  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }, style]}>
        {children}
      </Pressable>
    );
  }
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Avatar({ name, url, size = 40, seed }: { name: string; url?: string | null; size?: number; seed?: string }) {
  const s = seed ?? name;
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  const bg = colors.avatar[h % colors.avatar.length];
  if (url) {
    return <Image source={{ uri: url }} style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: bg }} accessibilityIgnoresInvertColors />;
  }
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontFamily: fonts.bold, color: colors.text, fontSize: size * 0.36 }}>{initials(name)}</Text>
    </View>
  );
}

/** Star display, 0.25 steps. */
export function Stars({ value, size = 16 }: { value: number | null | undefined; size?: number }) {
  const v = value ?? 0;
  return (
    <View style={{ flexDirection: 'row', gap: 1 }} accessible accessibilityLabel={`${v} / 5`}>
      {[0, 1, 2, 3, 4].map((i) => {
        const fill = Math.max(0, Math.min(1, v - i));
        const name: IconName = fill >= 0.75 ? 'star' : fill >= 0.25 ? 'star-half' : 'star-outline';
        return <Icon key={i} name={name} size={size} color={colors.accent} />;
      })}
    </View>
  );
}

/** Tap-to-rate input with 0.25 steps (tap a star, then fine-tune with − / +). */
export function RatingInput({ value, onChange }: { value: number | null; onChange: (v: number) => void }) {
  const v = value ?? 0;
  const step = (d: number) => onChange(Math.min(5, Math.max(0.25, Math.round((v + d) * 4) / 4)));
  return (
    <View style={{ alignItems: 'center', gap: space.sm }}>
      <View style={{ flexDirection: 'row', gap: 6 }}>
        {[1, 2, 3, 4, 5].map((n) => {
          const fill = Math.max(0, Math.min(1, v - (n - 1)));
          const name: IconName = fill >= 0.75 ? 'star' : fill >= 0.25 ? 'star-half' : 'star-outline';
          return (
            <Pressable key={n} accessibilityRole="button" accessibilityLabel={`${n}`} onPress={() => onChange(n)} hitSlop={4}>
              <Icon name={name} size={38} color={colors.accent} />
            </Pressable>
          );
        })}
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.lg }}>
        <IconButton icon="remove" label="−0.25" onPress={() => step(-0.25)} filled />
        <Text style={{ fontFamily: fonts.bold, fontSize: 24, color: colors.text, minWidth: 64, textAlign: 'center' }}>
          {v ? v.toFixed(2).replace(/0$/, '') : '–'}
        </Text>
        <IconButton icon="add" label="+0.25" onPress={() => step(0.25)} filled />
      </View>
    </View>
  );
}

export function SectionTitle({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: space.lg, marginBottom: space.sm }}>
      <Text style={type.heading} accessibilityRole="header">{title}</Text>
      {action ? (
        <Pressable onPress={onAction} hitSlop={8} accessibilityRole="button">
          <Text style={{ color: colors.accent, fontFamily: fonts.bold, fontSize: 13 }}>{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function Empty({ text, action, onAction, icon = 'leaf-outline' }: { text: string; action?: string; onAction?: () => void; icon?: IconName }) {
  return (
    <View style={{ alignItems: 'center', padding: space.xxl, gap: space.md }}>
      <Icon name={icon} size={36} color={colors.textMuted} />
      <Text style={[type.body, { textAlign: 'center', color: colors.textMuted }]}>{text}</Text>
      {action ? <Button label={action} onPress={onAction} variant="secondary" small /> : null}
    </View>
  );
}

export function Loading() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: space.xxl, backgroundColor: colors.bg }}>
      <ActivityIndicator color={colors.accent} />
    </View>
  );
}

export function ErrorText({ message }: { message: string | null | undefined }) {
  if (!message) return null;
  return <Text style={[type.caption, { color: colors.danger, marginVertical: space.sm }]} accessibilityLiveRegion="polite">{message}</Text>;
}

export function Row({ children, style, gap = space.sm }: { children: ReactNode; style?: StyleProp<ViewStyle>; gap?: number }) {
  return <View style={[{ flexDirection: 'row', alignItems: 'center', gap }, style]}>{children}</View>;
}

export function Bar({ value, max = 1, color = colors.accent }: { value: number; max?: number; color?: string }) {
  const pct = Math.max(0, Math.min(1, max ? value / max : 0));
  return (
    <View style={{ height: 8, borderRadius: 4, backgroundColor: colors.border, flex: 1 }}>
      <View style={{ width: `${pct * 100}%`, height: 8, borderRadius: 4, backgroundColor: color }} />
    </View>
  );
}

export function Pill({ label, tone = 'neutral' }: { label: string; tone?: 'neutral' | 'success' | 'warning' | 'accent' }) {
  const map = {
    neutral: { bg: colors.chip, fg: colors.gold },
    success: { bg: colors.success, fg: colors.onSuccess },
    warning: { bg: colors.warning, fg: colors.onWarning },
    accent: { bg: colors.accent, fg: colors.onAccent },
  }[tone];
  return (
    <View style={{ backgroundColor: map.bg, borderRadius: radius.sm, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start' }}>
      <Text style={{ color: map.fg, fontFamily: fonts.bold, fontSize: 11 }}>{label}</Text>
    </View>
  );
}

export function Stepper({ value, onChange, min = 0, max = 9999, label }: { value: number; onChange: (v: number) => void; min?: number; max?: number; label: string }) {
  return (
    <Row gap={space.md}>
      <Text style={[type.label, { flex: 1 }]}>{label}</Text>
      <IconButton icon="remove" label={`${label} −1`} filled onPress={() => onChange(Math.max(min, value - 1))} />
      <Text style={{ fontFamily: fonts.bold, color: colors.text, fontSize: 18, minWidth: 36, textAlign: 'center' }}>{value}</Text>
      <IconButton icon="add" label={`${label} +1`} filled onPress={() => onChange(Math.min(max, value + 1))} />
    </Row>
  );
}

const styles = StyleSheet.create({
  footer: {
    paddingHorizontal: space.xl, paddingTop: space.md, borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border, backgroundColor: colors.bgDeep, flexDirection: 'row', gap: space.sm,
  },
  button: {
    minHeight: 52, borderRadius: radius.md, paddingHorizontal: space.lg, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: space.sm,
  },
  buttonSmall: { minHeight: TOUCH, borderRadius: radius.md, paddingHorizontal: space.md },
  buttonText: { fontFamily: fonts.bold, fontSize: 15 },
  iconButton: { width: TOUCH, height: TOUCH, borderRadius: TOUCH / 2, alignItems: 'center', justifyContent: 'center' },
  iconButtonFilled: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  input: {
    minHeight: 48, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface,
    color: colors.text, paddingHorizontal: space.md, fontFamily: fonts.regular, fontSize: 15,
  },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: radius.md, paddingVertical: 7, paddingHorizontal: 11 },
  chipText: { fontFamily: fonts.medium, fontSize: 12.5 },
  segmented: { flexDirection: 'row', backgroundColor: colors.surface, borderRadius: radius.md, padding: 4 },
  segment: { flex: 1, minHeight: 40, borderRadius: 9, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  segmentOn: { backgroundColor: colors.chip },
  segmentText: { fontFamily: fonts.semibold, fontSize: 13.5, color: colors.textMuted },
  card: { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: radius.lg, padding: space.lg },
});
