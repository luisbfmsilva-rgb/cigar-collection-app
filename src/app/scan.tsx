import { CameraView, useCameraPermissions } from 'expo-camera';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, IconButton } from '@/components/ui';
import { useI18n } from '@/i18n';
import { cigarByBarcode } from '@/lib/api';
import { useCheckinDraft } from '@/lib/checkinDraft';
import { colors, radius, space, type } from '@/lib/theme';

type Then = 'cigar' | 'checkin' | 'humidor' | 'new';

/** Reads a box barcode and routes to the cigar, the check-in, the humidor or the "add cigar" form. */
export default function Scan() {
  const { t } = useI18n();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { then = 'cigar', humidorId } = useLocalSearchParams<{ then?: Then; humidorId?: string }>();
  const [permission, requestPermission] = useCameraPermissions();
  const [missing, setMissing] = useState<string | null>(null);
  const busy = useRef(false);
  const { update } = useCheckinDraft();

  async function onCode(code: string) {
    if (busy.current || missing) return;
    busy.current = true;
    if (then === 'new') {
      router.dismissTo({ pathname: '/cigar/new', params: { barcode: code } });
      return;
    }
    const cigar = await cigarByBarcode(code).catch(() => null);
    if (!cigar) {
      setMissing(code);
      return;
    }
    if (then === 'checkin') {
      update({ cigar });
      router.replace('/checkin/new');
    } else if (then === 'humidor') {
      router.replace({ pathname: '/humidor/add', params: { cigarId: cigar.id, humidorId: humidorId ?? '' } });
    } else {
      router.replace(`/cigar/${cigar.id}`);
    }
  }

  if (!permission) return <View style={{ flex: 1, backgroundColor: colors.bg }} />;

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      {permission.granted ? (
        <CameraView
          style={{ flex: 1 }}
          facing="back"
          barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128', 'code39'] }}
          onBarcodeScanned={missing ? undefined : (r) => onCode(r.data)}
        />
      ) : (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: space.xxl, gap: space.lg, backgroundColor: colors.bg }}>
          <Text style={[type.body, { textAlign: 'center' }]}>{t('scan.permission')}</Text>
          <Button label={t('scan.allow')} onPress={requestPermission} />
        </View>
      )}

      <View style={{ position: 'absolute', top: insets.top + space.sm, left: space.md, right: space.md, flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
        <IconButton icon="close" label={t('common.close')} onPress={() => router.back()} filled />
        <Text style={[type.heading, { flex: 1 }]}>{t('scan.title')}</Text>
      </View>

      {permission.granted && !missing ? (
        <View pointerEvents="none" style={{ position: 'absolute', top: '35%', left: '10%', right: '10%', height: 160, borderWidth: 2, borderColor: colors.accent, borderRadius: radius.lg }} />
      ) : null}

      {missing ? (
        <View style={{ position: 'absolute', left: space.lg, right: space.lg, bottom: insets.bottom + space.lg, backgroundColor: colors.surface, borderRadius: radius.lg, padding: space.lg, gap: space.md }}>
          <Text style={type.body}>{t('scan.notFound', { code: missing })}</Text>
          <Button label={t('scan.addWithCode')} onPress={() => router.replace({ pathname: '/cigar/new', params: { barcode: missing } })} />
          <Button label={t('scan.scanAgain')} variant="secondary" onPress={() => { busy.current = false; setMissing(null); }} />
        </View>
      ) : null}
    </View>
  );
}
