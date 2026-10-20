import { Redirect } from 'expo-router';

/** Placeholder: the center tab button opens the check-in flow instead of this screen. */
export default function CheckinTab() {
  return <Redirect href="/checkin/pick-cigar" />;
}
