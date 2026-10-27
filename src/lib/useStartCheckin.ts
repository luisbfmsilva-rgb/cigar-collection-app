import { useRouter } from 'expo-router';
import { Alert } from 'react-native';
import { useI18n } from '@/i18n';
import { CheckinDraft, useCheckinDraft } from './checkinDraft';

/** Starts a check-in for a cigar. If another check-in is still open, asks whether to resume it or replace it. */
export function useStartCheckin() {
  const { t } = useI18n();
  const router = useRouter();
  const { draft, reset } = useCheckinDraft();
  return (start: Partial<CheckinDraft> & { cigar: NonNullable<CheckinDraft['cigar']> }) => {
    const go = () => {
      reset(start);
      router.push('/checkin/new');
    };
    if (!draft.cigar || draft.cigar.id === start.cigar.id) {
      if (draft.cigar) router.push('/checkin/new');
      else go();
      return;
    }
    Alert.alert(t('checkin.openTitle'), t('checkin.openBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('checkin.resume'), onPress: () => router.push('/checkin/new') },
      { text: t('checkin.startNew'), style: 'destructive', onPress: go },
    ]);
  };
}
