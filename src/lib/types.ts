export type Strength = 'mild' | 'mild_medium' | 'medium' | 'medium_full' | 'full';
export type Visibility = 'public' | 'followers' | 'private';
export type VenueKind = 'shop' | 'lounge' | 'bar' | 'restaurant' | 'other';
export type PairingKind = 'spirit' | 'wine' | 'beer' | 'coffee' | 'non_alcoholic' | 'food' | 'other';
export type ClubRole = 'owner' | 'moderator' | 'member';
export type MemberStatus = 'active' | 'invited' | 'requested';
export type HumidorKind = 'cabinet' | 'desktop' | 'tupperdor' | 'coolerdor' | 'walk_in' | 'other';
export type CreatorStatus = 'none' | 'pending' | 'verified' | 'rejected';
export type LinkKind = 'youtube' | 'instagram' | 'tiktok' | 'article' | 'podcast' | 'other';
export type MusicSource = 'apple_music' | 'spotify' | 'youtube' | 'link';
export type TargetKind = 'checkin' | 'club_post' | 'comment' | 'profile' | 'club' | 'cigar' | 'creator_link';

export const STRENGTHS: Strength[] = ['mild', 'mild_medium', 'medium', 'medium_full', 'full'];
export const PAIRING_KINDS: PairingKind[] = ['spirit', 'wine', 'beer', 'coffee', 'non_alcoholic', 'food', 'other'];
export const VENUE_KINDS: VenueKind[] = ['shop', 'lounge', 'bar', 'restaurant', 'other'];
export const HUMIDOR_KINDS: HumidorKind[] = ['cabinet', 'desktop', 'tupperdor', 'coolerdor', 'walk_in', 'other'];
export const LINK_KINDS: LinkKind[] = ['youtube', 'instagram', 'tiktok', 'article', 'podcast', 'other'];

export type Profile = {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  city: string | null;
  country: string | null;
  locale: 'en' | 'pt' | 'es';
  is_admin: boolean;
  creator_status: CreatorStatus;
  creator_headline: string | null;
  checkin_count: number;
  unique_cigar_count: number;
  follower_count: number;
  following_count: number;
  created_at: string;
};

export type Cigar = {
  id: string;
  brand_id: string;
  brand_name: string;
  line: string;
  vitola: string | null;
  shape: string | null;
  length_in: number | null;
  ring_gauge: number | null;
  wrapper: string | null;
  wrapper_shade: string | null;
  binder: string | null;
  filler: string | null;
  country: string | null;
  factory: string | null;
  strength: Strength | null;
  status: 'regular' | 'limited' | 'discontinued';
  barcodes: string[];
  image_url: string | null;
  approved: boolean;
  avg_rating: number | null;
  rating_count: number;
  avg_score100: number | null;
  created_by: string | null;
};

export type Venue = {
  id: string;
  name: string;
  kind: VenueKind;
  address: string | null;
  city: string | null;
  region: string | null;
  country: string | null;
  lat: number | null;
  lng: number | null;
};

export type Pairing = { kind: PairingKind; name: string };

export type Music = {
  source: MusicSource;
  title: string;
  artist: string | null;
  artworkUrl: string | null;
  previewUrl: string | null;
  url: string;
};

export type CheckinFeedRow = {
  id: string;
  user_id: string;
  cigar_id: string;
  rating: number | null;
  note: string | null;
  venue_id: string | null;
  event_id: string | null;
  at_home: boolean;
  visibility: Visibility;
  music_source: MusicSource | null;
  music_title: string | null;
  music_artist: string | null;
  music_artwork_url: string | null;
  music_preview_url: string | null;
  music_url: string | null;
  score_appearance: number | null;
  score_draw: number | null;
  score_burn: number | null;
  score_flavor: number | null;
  score_aroma: number | null;
  score_overall: number | null;
  score100: number | null;
  strength: number | null;
  body: number | null;
  duration_min: number | null;
  toast_count: number;
  comment_count: number;
  created_at: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  creator_status: CreatorStatus;
  brand_name: string;
  cigar_line: string;
  cigar_vitola: string | null;
  wrapper_shade: string | null;
  cigar_country: string | null;
  ring_gauge: number | null;
  length_in: number | null;
  venue_name: string | null;
  venue_city: string | null;
  venue_region: string | null;
  event_title: string | null;
  photos: { path: string; position: number }[];
  pairings: Pairing[];
  flavor_notes: string[];
  toasted_by_me: boolean;
  saved_by_me: boolean;
};

export type FlavorFamily = { code: string; position: number; label_en: string; label_pt: string; label_es: string; color: string };
export type FlavorNote = { code: string; family: string; label_en: string; label_pt: string; label_es: string };
export type FlavorPick = { third: number; note: string; intensity: number };

export type Club = {
  id: string;
  name: string;
  description: string | null;
  city: string | null;
  country: string | null;
  privacy: 'public' | 'private';
  avatar_url: string | null;
  cover_url: string | null;
  member_count: number;
  created_by: string | null;
};

export type Humidor = {
  id: string;
  name: string;
  kind: HumidorKind;
  capacity: number | null;
  target_rh_min: number;
  target_rh_max: number;
};

export type HumidorItem = {
  id: string;
  humidor_id: string;
  cigar_id: string;
  quantity: number;
  acquired_on: string;
  rest_days: number;
  price_each: number | null;
  notes: string | null;
  cigar: { id: string; line: string; vitola: string | null; brand: { name: string } | null } | null;
};

export type Reading = { id: string; rh: number | null; temp_c: number | null; source: 'manual' | 'sensor'; recorded_at: string };

export type CreatorLink = {
  id: string;
  user_id: string;
  kind: LinkKind;
  url: string;
  title: string;
  thumbnail_url: string | null;
  cigar_id: string | null;
  is_sponsored: boolean;
  created_at: string;
};

export type Badge = {
  code: string;
  label_en: string; label_pt: string; label_es: string;
  description_en: string; description_pt: string; description_es: string;
  icon: string;
};
