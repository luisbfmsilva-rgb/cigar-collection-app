import { Pressable, Text, View } from 'react-native';
import Svg, { G, Path, Text as SvgText } from 'react-native-svg';
import { localized, useI18n } from '@/i18n';
import { colors, fonts } from '@/lib/theme';
import type { FlavorFamily } from '@/lib/types';

/**
 * Donut of the flavor families. Families with at least one picked note are filled with their color;
 * tapping a segment (or its label below) selects the family so its notes can be picked.
 */
export function FlavorWheel({
  families, activeFamilies, selected, onSelect, size = 220,
}: { families: FlavorFamily[]; activeFamilies: Set<string>; selected: string | null; onSelect: (code: string) => void; size?: number }) {
  const { locale, t } = useI18n();
  const cx = size / 2, cy = size / 2, ro = size / 2 - 4, ri = ro * 0.58;
  const n = families.length || 1;
  const step = (2 * Math.PI) / n;
  const pt = (r: number, a: number) => `${(cx + r * Math.cos(a)).toFixed(2)} ${(cy + r * Math.sin(a)).toFixed(2)}`;

  return (
    <View style={{ alignItems: 'center' }}>
      <Svg width={size} height={size} accessibilityLabel={t('review.flavors')}>
        {families.map((f, i) => {
          const a0 = -Math.PI / 2 + i * step, a1 = a0 + step;
          const d = `M${pt(ro, a0)} A${ro} ${ro} 0 0 1 ${pt(ro, a1)} L${pt(ri, a1)} A${ri} ${ri} 0 0 0 ${pt(ri, a0)} Z`;
          const on = activeFamilies.has(f.code);
          const isSel = selected === f.code;
          return (
            <G key={f.code} onPress={() => onSelect(f.code)}>
              <Path d={d} fill={on ? f.color : colors.surfaceAlt} stroke={isSel ? colors.text : colors.bg} strokeWidth={isSel ? 3 : 3} />
            </G>
          );
        })}
        <SvgText x={cx} y={cy - 2} fill={colors.text} fontSize={15} fontWeight="700" textAnchor="middle" fontFamily={fonts.bold}>
          {`${activeFamilies.size}/${n}`}
        </SvgText>
        <SvgText x={cx} y={cy + 16} fill={colors.textMuted} fontSize={11} textAnchor="middle" fontFamily={fonts.medium}>
          {t('review.families')}
        </SvgText>
      </Svg>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 6, marginTop: 8 }}>
        {families.map((f) => {
          const isSel = selected === f.code;
          return (
            <Pressable
              key={f.code} onPress={() => onSelect(f.code)} accessibilityRole="button" accessibilityState={{ selected: isSel }}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 9, minHeight: 34, borderRadius: 17, borderWidth: 1, borderColor: isSel ? colors.text : colors.border }}
            >
              <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: f.color }} />
              <Text style={{ color: colors.text, fontSize: 12, fontFamily: isSel ? fonts.bold : fonts.medium }}>{localized(f, locale)}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
