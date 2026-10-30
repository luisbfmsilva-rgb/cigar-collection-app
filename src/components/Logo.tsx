import { Text, View } from 'react-native';
import Svg, { Defs, G, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { colors, fonts } from '@/lib/theme';

/** The Long Ash mark: a cigar with a long ash (a third of its length) and a glowing ember. */
export function LogoMark({ size = 32 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="-420 -300 840 600" accessibilityLabel="Long Ash">
      <Defs>
        <LinearGradient id="w" x1="0" y1="-75" x2="0" y2="75" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor="#9A6A3C" /><Stop offset="0.4" stopColor="#6E431F" /><Stop offset="1" stopColor="#36200E" />
        </LinearGradient>
        <LinearGradient id="a" x1="0" y1="-75" x2="0" y2="75" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor="#F0EBE3" /><Stop offset="0.55" stopColor="#C4BDB2" /><Stop offset="1" stopColor="#8B847A" />
        </LinearGradient>
      </Defs>
      <G rotation={-33} origin="0, 0">
        <Path d="M-392,-60 Q-392,-75 -352,-75 L130,-75 L130,75 L-352,75 Q-392,75 -392,60 Z" fill="url(#w)" />
        <Rect x={-262} y={-79} width={84} height={158} rx={4} fill="#D2A85E" />
        <Rect x={-262} y={-30} width={84} height={6} fill="#8E1F1A" />
        <Rect x={-262} y={24} width={84} height={6} fill="#8E1F1A" />
        <Path d="M120,-72 L384,-66 Q400,-62 398,-40 L402,-12 Q394,8 402,28 L388,56 Q372,74 340,70 L120,72 Z" fill="url(#a)" />
        <Rect x={112} y={-75} width={26} height={150} fill="#FF8A2A" />
      </G>
    </Svg>
  );
}

/** Mark + wordmark. */
export function Logo({ size = 32, showText = true, color = colors.text }: { size?: number; showText?: boolean; color?: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: size * 0.28 }} accessibilityRole="image" accessibilityLabel="Long Ash">
      <LogoMark size={size * 1.25} />
      {showText ? <Text style={{ fontFamily: fonts.display, fontSize: size, color, lineHeight: size * 1.2 }}>Long Ash</Text> : null}
    </View>
  );
}
