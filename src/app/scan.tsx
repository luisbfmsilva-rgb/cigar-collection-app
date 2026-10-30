import { CameraView, scanFromURLAsync, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CigarRow } from '@/components/CigarRow';
import { Button, Chip, ErrorText, Field, IconButton } from '@/components/ui';
import { useI18n } from '@/i18n';
import {
  BandReading, barcodeInfo, cigarsByBarcode, finishBandScan, identifyBand, linkBarcode, searchCigars,
} from '@/lib/api';
import { useCheckinDraft } from '@/lib/checkinDraft';
import { colors, radius, space, type } from '@/lib/theme';
import type { Cigar } from '@/lib/types';
import { errorMessage } from '@/lib/useAsync';
import { useSearch } from '@/lib/useSearch';

const BARCODE_TYPES = ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128', 'code39', 'code93', 'itf14', 'codabar', 'datamatrix', 'qr', 'pdf417'] as const;
const SCAN_SETTINGS = { barcodeTypes: [...BARCODE_TYPES] };

type Then = 'cigar' | 'checkin' | 'humidor' | 'new';
type Mode = 'barcode' | 'band';
type Band = { uri: string; scanId: string | null; ai: BandReading | null; candidates: Cigar[] };

/**
 * Identifies a cigar two ways: reading the box barcode, or photographing the band (AI).
 * An unknown barcode can be linked to a catalog cigar by the user; a band reading is confirmed by the user and kept for training.
 */
export default function Scan() {
  const { t } = useI18n();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { then = 'cigar', humidorId, mode: startMode } = useLocalSearchParams<{ then?: Then; humidorId?: string; mode?: Mode }>();
  const [permission, requestPermission] = useCameraPermissions();
  const [mode, setMode] = useState<Mode>(startMode === 'band' ? 'band' : 'barcode');
  const [missing, setMissing] = useState<{ code: string; name: string | null; maker: string | null } | null>(null);
  const [band, setBand] = useState<Band | null>(null);
  const [working, setWorking] = useState(false);
  const [torch, setTorch] = useState(false);
  const [seen, setSeen] = useState<string | null>(null);
  const [typed, setTyped] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const camera = useRef<CameraView>(null);
  const busy = useRef(false);
  const { update } = useCheckinDraft();
  const hints = useSearch(q, searchCigars).data ?? [];

  function open(cigar: Cigar) {
    if (then === 'checkin') {
      update({ cigar });
      router.replace('/checkin/new');
    } else if (then === 'humidor') {
      router.replace({ pathname: '/humidor/add', params: { cigarId: cigar.id, humidorId: humidorId ?? '' } });
    } else {
      router.replace(`/cigar/${cigar.id}`);
    }
  }

  async function onCode(code: string) {
    if (busy.current || missing) return;
    busy.current = true;
    if (then === 'new') {
      router.dismissTo({ pathname: '/cigar/new', params: { barcode: code } });
      return;
    }
    const found = await cigarsByBarcode(code).catch(() => []);
    if (found.length) return open(found[0]);
    const info = await barcodeInfo(code).catch(() => null);
    setQ(info?.name?.replace(/\s*\d+(?: \d\/\d)? x \d+.*$/i, '') ?? info?.maker ?? '');
    setMissing({ code, name: info?.exact ? info.name : null, maker: info?.maker ?? null });
  }

  async function linkAndOpen(cigar: Cigar) {
    if (!missing) return;
    await linkBarcode(missing.code, cigar.id).catch(() => null);
    open(cigar);
  }

  async function shoot() {
    if (!camera.current || working) return;
    setWorking(true);
    setError(null);
    try {
      const pic = await camera.current.takePictureAsync({ quality: 0.5, base64: true, skipProcessing: false });
      if (!pic.base64) throw new Error('NO_IMAGE');
      await identify(pic.base64, pic.uri);
    } catch (e) {
      const m = errorMessage(e);
      setError(m.includes('DAILY_LIMIT') ? t('scan.limit') : m);
    } finally {
      setWorking(false);
    }
  }

  /** Sends a photo to the AI (band or printed barcode digits) and shows the candidates. */
  async function identify(base64: string, uri: string) {
    const r = await identifyBand(base64);
    if (r.ai?.barcode && /^\d{8,14}$/.test(r.ai.barcode.replace(/\s/g, ''))) {
      const found = await cigarsByBarcode(r.ai.barcode.replace(/\s/g, '')).catch(() => []);
      if (found.length) r.candidates = [...found, ...r.candidates.filter((c) => !found.some((f) => f.id === c.id))];
    }
    setBand({ uri, scanId: r.scan_id, ai: r.ai, candidates: r.candidates });
  }

  /**
   * Barcode from a photo: the phone's own camera app (sharp focus, flash) or the gallery, then the code is decoded from the picture.
   * If no code can be decoded, the photo goes to the AI, which also reads the printed digits and the band.
   */
  async function barcodeFromPhoto(source: 'camera' | 'library') {
    if (working) return;
    setError(null);
    try {
      let res: ImagePicker.ImagePickerResult;
      if (source === 'camera') {
        const perm = await ImagePicker.requestCameraPermissionsAsync();
        if (!perm.granted) return;
        res = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.8, base64: true });
      } else {
        res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8, base64: true });
      }
      if (res.canceled) return;
      const asset = res.assets[0];
      setWorking(true);
      const hits = await scanFromURLAsync(asset.uri, [...BARCODE_TYPES]).catch(() => []);
      if (hits.length) {
        setSeen(hits[0].data);
        await onCode(hits[0].data);
        return;
      }
      if (!asset.base64) throw new Error('NO_IMAGE');
      await identify(asset.base64, asset.uri);
    } catch (e) {
      const m = errorMessage(e);
      setError(m.includes('DAILY_LIMIT') ? t('scan.limit') : m);
    } finally {
      setWorking(false);
    }
  }

  async function pickBand(cigar: Cigar, index: number) {
    if (band?.scanId) await finishBandScan(band.scanId, index === 0 ? 'confirmed' : 'other', cigar.id, band.uri).catch(() => null);
    open(cigar);
  }

  async function noneOfThese() {
    if (band?.scanId) await finishBandScan(band.scanId, 'none', null, band.uri).catch(() => null);
    router.replace({ pathname: '/cigar/new', params: { q: [band?.ai?.brand, band?.ai?.line].filter(Boolean).join(' ') } });
  }

  if (!permission) return <View style={{ flex: 1, backgroundColor: colors.bg }} />;
  const showCamera = permission.granted && !missing && !band;

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      {permission.granted ? (
        <CameraView
          ref={camera}
          style={{ flex: 1 }}
          facing="back"
          barcodeScannerSettings={SCAN_SETTINGS}
          autofocus="on"
          enableTorch={torch}
          onBarcodeScanned={mode === 'barcode' && !missing && !band ? (r) => { setSeen(r.data); onCode(r.data); } : undefined}
        />
      ) : (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: space.xxl, gap: space.lg, backgroundColor: colors.bg }}>
          <Text style={[type.body, { textAlign: 'center' }]}>{t('scan.permission')}</Text>
          <Button label={t('scan.allow')} onPress={requestPermission} />
        </View>
      )}

      <View style={{ position: 'absolute', top: insets.top + space.sm, left: space.md, right: space.md, flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
        <IconButton icon="close" label={t('common.close')} onPress={() => router.back()} filled />
        <Text style={[type.heading, { flex: 1 }]}>{mode === 'band' ? t('scan.bandTitle') : t('scan.title')}</Text>
        {permission.granted ? <IconButton icon={torch ? 'flash' : 'flash-outline'} label={t('scan.torch')} onPress={() => setTorch(!torch)} filled /> : null}
      </View>

      {showCamera ? (
        <>
          {mode === 'barcode' ? (
            <View pointerEvents="none" style={{ position: 'absolute', top: '35%', left: '10%', right: '10%', height: 160, borderWidth: 2, borderColor: colors.accent, borderRadius: radius.lg }} />
          ) : (
            <View pointerEvents="none" style={{ position: 'absolute', top: '30%', left: '8%', right: '8%', height: 200, borderWidth: 2, borderColor: colors.accent, borderRadius: radius.lg }} />
          )}
          <View style={{ position: 'absolute', left: 0, right: 0, bottom: insets.bottom + space.lg, alignItems: 'center', gap: space.md }}>
            {mode === 'barcode' ? (
              <View style={{ width: '88%', gap: space.sm }}>
                <Text style={[type.caption, { color: '#fff', textAlign: 'center' }]}>{seen ? t('scan.seen', { code: seen }) : t('scan.barcodeHint')}</Text>
                <ErrorText message={error} />
                <View style={{ flexDirection: 'row', gap: space.sm }}>
                  <Button label={working ? t('scan.reading') : t('scan.photoCode')} icon="camera-outline" small loading={working} onPress={() => barcodeFromPhoto('camera')} style={{ flex: 1 }} />
                  <Button label={t('scan.fromGallery')} icon="images-outline" variant="secondary" small onPress={() => barcodeFromPhoto('library')} style={{ flex: 1 }} />
                </View>
                <View style={{ flexDirection: 'row', gap: space.sm, alignItems: 'center' }}>
                  <Field placeholder={t('scan.typeCode')} value={typed} onChangeText={(v) => setTyped(v.replace(/\D/g, ''))} keyboardType="number-pad" style={{ flex: 1 }} />
                  <Button label={t('scan.search')} small disabled={typed.length < 6} onPress={() => onCode(typed)} />
                </View>
              </View>
            ) : null}
            {mode === 'band' ? (
              <>
                <Text style={[type.caption, { color: '#fff', textAlign: 'center', paddingHorizontal: space.xl }]}>{t('scan.bandHint')}</Text>
                <ErrorText message={error} />
                <Pressable onPress={shoot} disabled={working} accessibilityRole="button" accessibilityLabel={t('scan.shoot')}
                  style={{ width: 72, height: 72, borderRadius: 36, borderWidth: 4, borderColor: '#fff', alignItems: 'center', justifyContent: 'center' }}>
                  {working ? <ActivityIndicator color="#fff" /> : <View style={{ width: 54, height: 54, borderRadius: 27, backgroundColor: '#fff' }} />}
                </Pressable>
              </>
            ) : null}
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Chip label={t('scan.modeBarcode')} selected={mode === 'barcode'} onPress={() => setMode('barcode')} />
              <Chip label={t('scan.modeBand')} selected={mode === 'band'} onPress={() => setMode('band')} />
            </View>
          </View>
        </>
      ) : null}

      {missing ? (
        <View style={{ position: 'absolute', left: space.md, right: space.md, bottom: insets.bottom + space.md, top: insets.top + 70, backgroundColor: colors.surface, borderRadius: radius.lg, padding: space.lg, gap: space.md }}>
          <Text style={type.body}>{missing.name ? t('scan.knownCode', { name: missing.name }) : missing.maker ? t('scan.knownMaker', { maker: missing.maker }) : t('scan.notFound', { code: missing.code })}</Text>
          <Text style={type.label}>{t('scan.whichOne')}</Text>
          <Field placeholder={t('explore.searchPlaceholder')} value={q} onChangeText={setQ} />
          <ScrollView contentContainerStyle={{ gap: 8 }} keyboardShouldPersistTaps="handled">
            {hints.slice(0, 8).map((c) => <CigarRow key={c.id} cigar={c} onPress={() => linkAndOpen(c)} />)}
          </ScrollView>
          <Button label={t('scan.addWithCode')} variant="secondary" onPress={() => router.replace({ pathname: '/cigar/new', params: { barcode: missing.code, q: q } })} />
          <Button label={t('scan.scanAgain')} variant="ghost" onPress={() => { busy.current = false; setMissing(null); }} />
        </View>
      ) : null}

      {band ? (
        <View style={{ position: 'absolute', left: space.md, right: space.md, bottom: insets.bottom + space.md, top: insets.top + 70, backgroundColor: colors.surface, borderRadius: radius.lg, padding: space.lg, gap: space.md }}>
          {band.ai?.is_cigar_band ? (
            <Text style={type.caption}>{t('scan.aiRead')}: {[band.ai.brand, band.ai.line, band.ai.vitola].filter(Boolean).join(' · ') || band.ai.text_read}</Text>
          ) : (
            <Text style={type.body}>{t('scan.notBand')}</Text>
          )}
          {band.candidates.length ? <Text style={type.label}>{t('scan.isItOne')}</Text> : <Text style={type.body}>{t('scan.noCandidates')}</Text>}
          <ScrollView contentContainerStyle={{ gap: 8 }}>
            {band.candidates.slice(0, 6).map((c, i) => <CigarRow key={c.id} cigar={c} onPress={() => pickBand(c, i)} />)}
          </ScrollView>
          <Button label={t('scan.noneOfThese')} variant="secondary" onPress={noneOfThese} />
          <Button label={t('scan.tryAgain')} variant="ghost" onPress={() => { setBand(null); setError(null); }} />
        </View>
      ) : null}
    </View>
  );
}
