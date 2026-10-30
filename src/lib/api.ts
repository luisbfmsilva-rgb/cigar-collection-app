import { supabase } from './supabase';
import type {
  AccountApplication, AccountType, Brand, BrandArticle, BrandBadge, BrandBadgeAward, BrandFan, CigarPatch, CigarSuggestion,
  Badge, BovedaPack, CheckinFeedRow, Cigar, Club, ClubRole, CreatorLink, FlavorFamily, FlavorNote, FlavorPick, Humidor,
  HumidorItem, LinkKind, MemberStatus, Music, Pairing, Profile, Reading, Strength, Venue, VenueKind, Visibility,
} from './types';

function must<T>(res: { data: T | null; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message);
  return res.data as T;
}

async function uid() {
  const { data } = await supabase.auth.getSession();
  const id = data.session?.user.id;
  if (!id) throw new Error('Not signed in');
  return id;
}

// ---------------------------------------------------------------------------
// Storage
// ---------------------------------------------------------------------------

/** Uploads a local file (from the camera / photo library) to `<bucket>/<uid>/<name>` and returns the path. */
export async function uploadImage(bucket: string, localUri: string, mime = 'image/jpeg') {
  const me = await uid();
  const ext = mime === 'image/png' ? 'png' : mime === 'image/webp' ? 'webp' : 'jpg';
  const path = `${me}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const body = await (await fetch(localUri)).arrayBuffer();
  const { error } = await supabase.storage.from(bucket).upload(path, body, { contentType: mime, upsert: false });
  if (error) throw new Error(error.message);
  return path;
}

// ---------------------------------------------------------------------------
// Profiles
// ---------------------------------------------------------------------------

export async function createProfile(input: {
  username: string; display_name: string; birthdate: string; country: string | null; locale: string;
}) {
  const me = await uid();
  // private data first: the age trigger rejects under-21 birthdates before a public profile exists
  must(await supabase.from('profiles').insert({
    id: me, username: input.username.toLowerCase(), display_name: input.display_name,
    country: input.country, locale: input.locale,
  }));
  const priv = await supabase.from('private_profiles').insert({ id: me, birthdate: input.birthdate });
  if (priv.error) {
    await supabase.from('profiles').delete().eq('id', me);
    throw new Error(priv.error.message);
  }
}

export async function usernameAvailable(username: string) {
  const { count } = await supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('username', username.toLowerCase());
  return (count ?? 0) === 0;
}

export async function updateProfile(patch: Partial<Pick<Profile, 'display_name' | 'bio' | 'city' | 'country' | 'locale' | 'avatar_url' | 'creator_headline'>>) {
  const me = await uid();
  must(await supabase.from('profiles').update(patch).eq('id', me));
}

export async function getProfileByUsername(username: string) {
  return must(await supabase.from('profiles').select('*').eq('username', username).maybeSingle()) as Profile | null;
}

export async function getProfile(id: string) {
  return must(await supabase.from('profiles').select('*').eq('id', id).maybeSingle()) as Profile | null;
}

export async function searchPeople(q: string) {
  const term = q.trim().toLowerCase();
  if (term.length < 2) return [] as Profile[];
  return must(await supabase.from('profiles').select('*')
    .or(`username.ilike.%${term.replace(/[%,()]/g, '')}%,display_name.ilike.%${term.replace(/[%,()]/g, '')}%`)
    .limit(20)) as Profile[];
}

export async function isFollowing(target: string) {
  const me = await uid();
  const { count } = await supabase.from('follows').select('*', { count: 'exact', head: true })
    .eq('follower_id', me).eq('followee_id', target);
  return (count ?? 0) > 0;
}

export async function setFollow(target: string, follow: boolean) {
  const me = await uid();
  if (follow) must(await supabase.from('follows').insert({ follower_id: me, followee_id: target }));
  else must(await supabase.from('follows').delete().eq('follower_id', me).eq('followee_id', target));
}

export async function setBlock(target: string, block: boolean) {
  const me = await uid();
  if (block) {
    must(await supabase.from('blocks').insert({ blocker_id: me, blocked_id: target }));
    await supabase.from('follows').delete().or(`and(follower_id.eq.${me},followee_id.eq.${target}),and(follower_id.eq.${target},followee_id.eq.${me})`);
  } else {
    must(await supabase.from('blocks').delete().eq('blocker_id', me).eq('blocked_id', target));
  }
}

export async function myBlocks() {
  const me = await uid();
  const rows = must(await supabase.from('blocks').select('blocked_id, profile:profiles!blocks_blocked_id_fkey(*)').eq('blocker_id', me)) as unknown as { profile: Profile }[];
  return rows.map((r) => r.profile);
}

export async function userBadges(userId: string) {
  return must(await supabase.from('user_badges').select('earned_at, badge:badges(*)').eq('user_id', userId)
    .order('earned_at', { ascending: false })) as unknown as { earned_at: string; badge: Badge }[];
}

export async function userFlavorProfile(userId: string) {
  const rows = must(await supabase.from('checkin_flavors').select('note, checkin:checkins!inner(user_id)')
    .eq('checkin.user_id', userId).limit(500)) as unknown as { note: string }[];
  const counts = new Map<string, number>();
  rows.forEach((r) => counts.set(r.note, (counts.get(r.note) ?? 0) + 1));
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([note, n]) => ({ note, n }));
}

export async function deleteMyAccount() {
  must(await supabase.rpc('delete_my_account'));
  await supabase.auth.signOut();
}

// ---------------------------------------------------------------------------
// Catalog
// ---------------------------------------------------------------------------

export async function searchCigars(q: string) {
  const term = q.trim();
  if (!term) return [] as Cigar[];
  return must(await supabase.rpc('search_cigars', { q: term, max_results: 40 })) as Cigar[];
}

export async function cigarsByBarcode(code: string) {
  return must(await supabase.rpc('find_cigars_by_barcode', { p_code: code })) as Cigar[];
}

export async function cigarByBarcode(code: string) {
  return (await cigarsByBarcode(code))[0] ?? null;
}

/** What is known about a code that is not linked to a cigar yet: product name and/or maker. */
export async function barcodeInfo(code: string) {
  const rows = must(await supabase.rpc('barcode_info', { p_code: code })) as { name: string | null; maker: string | null; exact: boolean }[];
  return rows[0] ?? null;
}

/** The user says "this code is this cigar". Trusted accounts count at once; others need a second user to agree. */
export async function linkBarcode(code: string, cigarId: string) {
  const me = await uid();
  const { error } = await supabase.from('barcode_links').insert({ code, cigar_id: cigarId, user_id: me });
  if (error && !/duplicate/i.test(error.message)) throw new Error(error.message);
}

export type BandReading = {
  is_cigar_band: boolean; brand: string; line: string; vitola?: string; wrapper_shade?: string; text_read: string; confidence: number; barcode?: string;
};

/** Sends a photo (base64) of a cigar band to the AI and gets back what it read plus the closest catalog cigars. */
export async function identifyBand(image: string, mime = 'image/jpeg') {
  const { data, error } = await supabase.functions.invoke('identify-band', { body: { image, mime } });
  if (error) {
    const body = await (error as { context?: Response }).context?.json?.().catch(() => null);
    throw new Error(body?.error ? `${body.error}${body.status != null ? ` (${body.status})` : ''}${body.detail ? `: ${body.detail}` : ''}` : error.message);
  }
  return data as { scan_id: string | null; ai: BandReading; candidates: Cigar[] };
}

/** Records what the user decided, and keeps the photo so the recognition can be trained. */
export async function finishBandScan(scanId: string, outcome: 'confirmed' | 'other' | 'none', cigarId: string | null, photoUri?: string) {
  let photo_path: string | undefined;
  if (photoUri) photo_path = await uploadImage('band-photos', photoUri).catch(() => undefined);
  must(await supabase.from('band_scans').update({ outcome, chosen_cigar_id: cigarId, ...(photo_path ? { photo_path } : {}) }).eq('id', scanId));
}

export async function topCigars(country?: string) {
  return must(await supabase.rpc('top_cigars', { min_ratings: 1, country_filter: country ?? null, max_results: 30 })) as Cigar[];
}

export async function recentCigars() {
  return must(await supabase.from('cigar_list').select('*').eq('approved', true)
    .order('rating_count', { ascending: false }).limit(30)) as Cigar[];
}

export async function getCigar(id: string) {
  return must(await supabase.from('cigar_list').select('*').eq('id', id).maybeSingle()) as Cigar | null;
}

export async function cigarStats(id: string) {
  const [flavors, pairings, friends] = await Promise.all([
    supabase.rpc('cigar_flavor_profile', { c: id }),
    supabase.rpc('cigar_top_pairings', { c: id }),
    supabase.rpc('cigar_friends_rating', { c: id }),
  ]);
  return {
    flavors: (flavors.data ?? []) as { note: string; family: string; mentions: number }[],
    pairings: (pairings.data ?? []) as { kind: string; name: string; mentions: number }[],
    friends: ((friends.data ?? [])[0] ?? null) as { avg_rating: number | null; rating_count: number } | null,
  };
}

export async function brandsLike(q: string) {
  const term = q.trim().replace(/[%,()]/g, '');
  if (term.length < 1) return [] as { id: string; name: string }[];
  return must(await supabase.from('brands').select('id, name').ilike('name', `%${term}%`).order('name').limit(10)) as { id: string; name: string }[];
}

export async function submitCigar(input: {
  brandName: string; line: string; vitola?: string; length_in?: number | null; ring_gauge?: number | null;
  wrapper?: string; wrapper_shade?: string; binder?: string; filler?: string; country?: string | null;
  strength?: Strength | null; barcode?: string; bandPhotoUri?: string | null;
}) {
  const me = await uid();
  const brandName = input.brandName.trim();
  let brand = must(await supabase.from('brands').select('id').ilike('name', brandName).maybeSingle()) as { id: string } | null;
  if (!brand) {
    brand = must(await supabase.from('brands').insert({ name: brandName, country: input.country, created_by: me }).select('id').single()) as { id: string };
  }
  let image_url: string | null = null;
  if (input.bandPhotoUri) image_url = await uploadImage('cigar-images', input.bandPhotoUri);
  const row = must(await supabase.from('cigars').insert({
    brand_id: brand.id, line: input.line.trim(), vitola: input.vitola?.trim() || null,
    length_in: input.length_in || null, ring_gauge: input.ring_gauge || null,
    wrapper: input.wrapper?.trim() || null, wrapper_shade: input.wrapper_shade?.trim() || null,
    binder: input.binder?.trim() || null, filler: input.filler?.trim() || null,
    country: input.country?.toUpperCase() || null, strength: input.strength ?? null,
    barcodes: input.barcode ? [input.barcode.trim()] : [], image_url, created_by: me,
  }).select('id').single()) as { id: string };
  return row.id;
}

export async function wishlistHas(cigarId: string) {
  const me = await uid();
  const { count } = await supabase.from('wishlist').select('*', { count: 'exact', head: true }).eq('user_id', me).eq('cigar_id', cigarId);
  return (count ?? 0) > 0;
}

export async function setWishlist(cigarId: string, on: boolean) {
  const me = await uid();
  if (on) must(await supabase.from('wishlist').insert({ user_id: me, cigar_id: cigarId }));
  else must(await supabase.from('wishlist').delete().eq('user_id', me).eq('cigar_id', cigarId));
}

export async function myWishlist() {
  const me = await uid();
  const rows = must(await supabase.from('wishlist').select('cigar_id').eq('user_id', me)) as { cigar_id: string }[];
  if (!rows.length) return [] as Cigar[];
  return must(await supabase.from('cigar_list').select('*').in('id', rows.map((r) => r.cigar_id))) as Cigar[];
}

export async function flavorReference() {
  const [fam, notes] = await Promise.all([
    supabase.from('flavor_families').select('*').order('position'),
    supabase.from('flavor_notes').select('*'),
  ]);
  return { families: must(fam) as FlavorFamily[], notes: must(notes) as FlavorNote[] };
}

// ---------------------------------------------------------------------------
// Venues and events
// ---------------------------------------------------------------------------

export async function nearbyVenues(lat: number, lng: number) {
  return must(await supabase.rpc('nearby_venues', { p_lat: lat, p_lng: lng, radius_km: 50 })) as Venue[];
}

export async function searchVenues(q: string) {
  const term = q.trim().replace(/[%,()]/g, '');
  if (term.length < 2) return [] as Venue[];
  return must(await supabase.from('venues').select('*').or(`name.ilike.%${term}%,city.ilike.%${term}%`).limit(20)) as Venue[];
}

export async function createVenue(input: { name: string; kind: VenueKind; city?: string; region?: string; country?: string | null; lat?: number | null; lng?: number | null }) {
  const me = await uid();
  return must(await supabase.from('venues').insert({ ...input, created_by: me }).select('*').single()) as Venue;
}

export async function findOrCreateEvent(title: string, venueId: string | null) {
  const me = await uid();
  const today = new Date().toISOString().slice(0, 10);
  let q = supabase.from('events').select('id, title').ilike('title', title.trim()).eq('starts_on', today);
  q = venueId ? q.eq('venue_id', venueId) : q.is('venue_id', null);
  const existing = must(await q.maybeSingle()) as { id: string } | null;
  if (existing) return existing.id;
  const row = must(await supabase.from('events').insert({ title: title.trim(), venue_id: venueId, created_by: me }).select('id').single()) as { id: string };
  return row.id;
}

// ---------------------------------------------------------------------------
// Check-ins
// ---------------------------------------------------------------------------

export type CheckinDraftInput = {
  cigarId: string; rating: number; note: string; venueId: string | null; eventTitle: string; atHome: boolean;
  visibility: Visibility; music: Music | null; pairings: Pairing[]; photos: { uri: string; mime?: string }[];
  scores: Partial<Record<'appearance' | 'draw' | 'burn' | 'flavor' | 'aroma' | 'overall', number>> | null;
  strength: number | null; body: number | null; duration: number | null; flavors: FlavorPick[];
  clubId: string | null; humidorItemId: string | null;
};

export async function createCheckin(d: CheckinDraftInput) {
  const me = await uid();
  const eventId = d.eventTitle.trim() ? await findOrCreateEvent(d.eventTitle, d.venueId) : null;
  const s = d.scores;
  const full = s && ['appearance', 'draw', 'burn', 'flavor', 'aroma', 'overall'].every((k) => typeof s[k as keyof typeof s] === 'number');
  const row = must(await supabase.from('checkins').insert({
    user_id: me, cigar_id: d.cigarId, rating: d.rating, note: d.note.trim() || null,
    venue_id: d.atHome ? null : d.venueId, event_id: eventId, at_home: d.atHome, visibility: d.visibility,
    music_source: d.music?.source ?? null, music_title: d.music?.title ?? null, music_artist: d.music?.artist ?? null,
    music_artwork_url: d.music?.artworkUrl ?? null, music_preview_url: d.music?.previewUrl ?? null, music_url: d.music?.url ?? null,
    score_appearance: full ? s!.appearance : null, score_draw: full ? s!.draw : null, score_burn: full ? s!.burn : null,
    score_flavor: full ? s!.flavor : null, score_aroma: full ? s!.aroma : null, score_overall: full ? s!.overall : null,
    strength: d.strength, body: d.body, duration_min: d.duration,
  }).select('id').single()) as { id: string };

  const id = row.id;
  if (d.pairings.length) {
    must(await supabase.from('checkin_pairings').insert(d.pairings.map((p) => ({ checkin_id: id, kind: p.kind, name: p.name }))));
  }
  if (d.flavors.length) {
    must(await supabase.from('checkin_flavors').insert(d.flavors.map((f) => ({ checkin_id: id, ...f }))));
  }
  for (let i = 0; i < Math.min(5, d.photos.length); i++) {
    const p = d.photos[i];
    const path = await uploadImage('checkin-photos', p.uri, p.mime);
    must(await supabase.from('checkin_photos').insert({ checkin_id: id, path, position: i }));
  }
  if (d.clubId) {
    must(await supabase.from('club_posts').insert({ club_id: d.clubId, user_id: me, checkin_id: id }));
  }
  if (d.humidorItemId) {
    const item = must(await supabase.from('humidor_items').select('quantity').eq('id', d.humidorItemId).maybeSingle()) as { quantity: number } | null;
    if (item && item.quantity > 0) {
      must(await supabase.from('humidor_items').update({ quantity: item.quantity - 1 }).eq('id', d.humidorItemId));
    }
  }
  return id;
}

export type FeedScope = { kind: 'following' } | { kind: 'global' } | { kind: 'user'; userId: string } | { kind: 'cigar'; cigarId: string } | { kind: 'saved' };

export async function feed(scope: FeedScope, before?: string) {
  let q = supabase.from('checkin_feed').select('*').order('created_at', { ascending: false }).limit(20);
  if (before) q = q.lt('created_at', before);
  if (scope.kind === 'global') q = q.eq('visibility', 'public');
  if (scope.kind === 'user') q = q.eq('user_id', scope.userId);
  if (scope.kind === 'cigar') q = q.eq('cigar_id', scope.cigarId).eq('visibility', 'public');
  if (scope.kind === 'following') {
    const me = await uid();
    const follows = must(await supabase.from('follows').select('followee_id').eq('follower_id', me)) as { followee_id: string }[];
    q = q.in('user_id', [me, ...follows.map((f) => f.followee_id)]);
  }
  if (scope.kind === 'saved') {
    const me = await uid();
    const saved = must(await supabase.from('saves').select('checkin_id').eq('user_id', me)) as { checkin_id: string }[];
    if (!saved.length) return [] as CheckinFeedRow[];
    q = q.in('id', saved.map((s) => s.checkin_id));
  }
  return must(await q) as CheckinFeedRow[];
}

export async function getCheckin(id: string) {
  return must(await supabase.from('checkin_feed').select('*').eq('id', id).maybeSingle()) as CheckinFeedRow | null;
}

export async function checkinFlavors(id: string) {
  return must(await supabase.from('checkin_flavors').select('third, note, intensity').eq('checkin_id', id)) as FlavorPick[];
}

export async function deleteCheckin(id: string) {
  must(await supabase.from('checkins').delete().eq('id', id));
}

export async function setToast(kind: 'checkin' | 'club_post' | 'comment', targetId: string, on: boolean) {
  const me = await uid();
  if (on) {
    const res = await supabase.from('toasts').insert({ user_id: me, target_kind: kind, target_id: targetId });
    if (res.error && !res.error.message.includes('duplicate')) throw new Error(res.error.message);
  } else {
    must(await supabase.from('toasts').delete().eq('user_id', me).eq('target_kind', kind).eq('target_id', targetId));
  }
}

export async function setSaved(checkinId: string, on: boolean) {
  const me = await uid();
  if (on) must(await supabase.from('saves').insert({ user_id: me, checkin_id: checkinId }));
  else must(await supabase.from('saves').delete().eq('user_id', me).eq('checkin_id', checkinId));
}

export type CommentRow = { id: string; user_id: string; body: string; created_at: string; author: Pick<Profile, 'username' | 'display_name' | 'avatar_url'> };

export async function comments(kind: 'checkin' | 'club_post', targetId: string) {
  return must(await supabase.from('comments')
    .select('id, user_id, body, created_at, author:profiles!comments_user_id_fkey(username, display_name, avatar_url)')
    .eq('target_kind', kind).eq('target_id', targetId).order('created_at')) as unknown as CommentRow[];
}

export async function addComment(kind: 'checkin' | 'club_post', targetId: string, body: string) {
  const me = await uid();
  must(await supabase.from('comments').insert({ user_id: me, target_kind: kind, target_id: targetId, body: body.trim() }));
}

export async function deleteComment(id: string) {
  must(await supabase.from('comments').delete().eq('id', id));
}

export async function report(kind: string, targetId: string, reason: string) {
  const me = await uid();
  must(await supabase.from('reports').insert({ reporter_id: me, target_kind: kind, target_id: targetId, reason }));
}

// ---------------------------------------------------------------------------
// Clubs
// ---------------------------------------------------------------------------

export type Membership = { role: ClubRole; status: MemberStatus } | null;

export async function myClubs() {
  const me = await uid();
  const rows = must(await supabase.from('club_members').select('role, status, club:clubs(*)').eq('user_id', me)
    .in('status', ['active', 'invited'])) as unknown as { role: ClubRole; status: MemberStatus; club: Club }[];
  return rows;
}

export async function discoverClubs(q?: string) {
  let query = supabase.from('clubs').select('*').order('member_count', { ascending: false }).limit(30);
  const term = q?.trim().replace(/[%,()]/g, '');
  if (term) query = query.or(`name.ilike.%${term}%,city.ilike.%${term}%`);
  return must(await query) as Club[];
}

export async function getClub(id: string) {
  const me = await uid();
  const [club, mem] = await Promise.all([
    supabase.from('clubs').select('*').eq('id', id).maybeSingle(),
    supabase.from('club_members').select('role, status').eq('club_id', id).eq('user_id', me).maybeSingle(),
  ]);
  return { club: must(club) as Club | null, membership: (mem.data ?? null) as Membership };
}

export async function createClub(input: { name: string; description: string; city: string; country: string | null; privacy: 'public' | 'private'; avatarUri?: string | null }) {
  const me = await uid();
  const avatar_url = input.avatarUri ? await uploadImage('club-images', input.avatarUri) : null;
  const row = must(await supabase.from('clubs').insert({
    name: input.name.trim(), description: input.description.trim() || null, city: input.city.trim() || null,
    country: input.country, privacy: input.privacy, avatar_url, created_by: me,
  }).select('id').single()) as { id: string };
  return row.id;
}

export async function joinClub(club: Club) {
  const me = await uid();
  must(await supabase.from('club_members').insert({
    club_id: club.id, user_id: me, role: 'member', status: club.privacy === 'public' ? 'active' : 'requested',
  }));
}

export async function acceptInvite(clubId: string) {
  const me = await uid();
  must(await supabase.from('club_members').update({ status: 'active' }).eq('club_id', clubId).eq('user_id', me));
}

export async function leaveClub(clubId: string, userId?: string) {
  const who = userId ?? (await uid());
  must(await supabase.from('club_members').delete().eq('club_id', clubId).eq('user_id', who));
}

export async function inviteToClub(clubId: string, userId: string) {
  const me = await uid();
  must(await supabase.from('club_members').insert({ club_id: clubId, user_id: userId, role: 'member', status: 'invited', invited_by: me }));
}

export async function updateMember(clubId: string, userId: string, patch: { role?: ClubRole; status?: MemberStatus }) {
  must(await supabase.from('club_members').update(patch).eq('club_id', clubId).eq('user_id', userId));
}

export type ClubMemberRow = { user_id: string; role: ClubRole; status: MemberStatus; profile: Profile };

export async function clubMembers(clubId: string) {
  return must(await supabase.from('club_members').select('user_id, role, status, profile:profiles!club_members_user_id_fkey(*)')
    .eq('club_id', clubId).order('created_at')) as unknown as ClubMemberRow[];
}

export type ClubPostRow = {
  id: string; club_id: string; user_id: string; body: string | null; checkin_id: string | null; pinned: boolean;
  toast_count: number; comment_count: number; created_at: string;
  author: Pick<Profile, 'username' | 'display_name' | 'avatar_url'>;
};

export async function clubPosts(clubId: string) {
  return must(await supabase.from('club_posts')
    .select('*, author:profiles!club_posts_user_id_fkey(username, display_name, avatar_url)')
    .eq('club_id', clubId).order('pinned', { ascending: false }).order('created_at', { ascending: false }).limit(50)) as unknown as ClubPostRow[];
}

export async function postToClub(clubId: string, body: string) {
  const me = await uid();
  must(await supabase.from('club_posts').insert({ club_id: clubId, user_id: me, body: body.trim() }));
}

export async function setPinned(postId: string, pinned: boolean) {
  must(await supabase.from('club_posts').update({ pinned }).eq('id', postId));
}

export async function deleteClubPost(postId: string) {
  must(await supabase.from('club_posts').delete().eq('id', postId));
}

/** Club ranking: best-rated cigars among members' check-ins in the last 90 days. */
export async function clubRanking(clubId: string) {
  const members = (await clubMembers(clubId)).filter((m) => m.status === 'active').map((m) => m.user_id);
  if (!members.length) return [] as { cigar_id: string; title: string; avg: number; count: number }[];
  const since = new Date(Date.now() - 90 * 86400000).toISOString();
  const rows = must(await supabase.from('checkin_feed').select('cigar_id, brand_name, cigar_line, rating')
    .in('user_id', members).gte('created_at', since).not('rating', 'is', null).limit(1000)) as { cigar_id: string; brand_name: string; cigar_line: string; rating: number }[];
  const agg = new Map<string, { title: string; sum: number; count: number }>();
  rows.forEach((r) => {
    const a = agg.get(r.cigar_id) ?? { title: `${r.brand_name} ${r.cigar_line}`, sum: 0, count: 0 };
    a.sum += Number(r.rating);
    a.count += 1;
    agg.set(r.cigar_id, a);
  });
  return [...agg.entries()]
    .map(([cigar_id, a]) => ({ cigar_id, title: a.title, avg: a.sum / a.count, count: a.count }))
    .sort((x, y) => y.avg - x.avg || y.count - x.count)
    .slice(0, 20);
}

// ---------------------------------------------------------------------------
// Humidor
// ---------------------------------------------------------------------------

export async function myHumidors() {
  const me = await uid();
  return must(await supabase.from('humidors').select('*').eq('user_id', me).order('created_at')) as Humidor[];
}

export async function createHumidor(input: { name: string; kind: Humidor['kind']; capacity: number | null; target_rh_min: number; target_rh_max: number }) {
  const me = await uid();
  return must(await supabase.from('humidors').insert({ ...input, user_id: me }).select('*').single()) as Humidor;
}

export async function updateHumidor(id: string, patch: Partial<Omit<Humidor, 'id'>>) {
  must(await supabase.from('humidors').update(patch).eq('id', id));
}

export async function deleteHumidor(id: string) {
  must(await supabase.from('humidors').delete().eq('id', id));
}

export async function humidorItems(humidorId: string) {
  return must(await supabase.from('humidor_items')
    .select('*, cigar:cigars(id, line, vitola, brand:brands(name))')
    .eq('humidor_id', humidorId).gt('quantity', 0).order('acquired_on')) as unknown as HumidorItem[];
}

export async function addHumidorItem(input: { humidor_id: string; cigar_id: string; quantity: number; acquired_on: string; rest_days: number; price_each: number | null; notes: string | null }) {
  must(await supabase.from('humidor_items').insert(input));
}

export async function updateHumidorItem(id: string, patch: { quantity?: number; rest_days?: number; notes?: string | null; price_each?: number | null }) {
  must(await supabase.from('humidor_items').update(patch).eq('id', id));
}

export async function deleteHumidorItem(id: string) {
  must(await supabase.from('humidor_items').delete().eq('id', id));
}

export async function readings(humidorId: string, limit = 30) {
  return must(await supabase.from('humidor_readings').select('*').eq('humidor_id', humidorId)
    .order('recorded_at', { ascending: false }).limit(limit)) as Reading[];
}

export async function logReading(humidorId: string, rh: number | null, tempC: number | null) {
  must(await supabase.from('humidor_readings').insert({ humidor_id: humidorId, rh, temp_c: tempC, source: 'manual' }));
}

export async function bovedaPacks(humidorId: string) {
  return must(await supabase.from('humidor_boveda').select('*').eq('humidor_id', humidorId).order('created_at')) as BovedaPack[];
}

export async function addBovedaPack(input: Omit<BovedaPack, 'id'>) {
  must(await supabase.from('humidor_boveda').insert(input));
}

export async function updateBovedaPack(id: string, patch: Partial<Omit<BovedaPack, 'id' | 'humidor_id'>>) {
  must(await supabase.from('humidor_boveda').update(patch).eq('id', id));
}

export async function deleteBovedaPack(id: string) {
  must(await supabase.from('humidor_boveda').delete().eq('id', id));
}

/** Humidor items holding a given cigar (for "smoke one from the humidor"). */
export async function humidorItemsForCigar(cigarId: string) {
  const me = await uid();
  return must(await supabase.from('humidor_items').select('id, quantity, humidor:humidors!inner(name, user_id)')
    .eq('cigar_id', cigarId).eq('humidor.user_id', me).gt('quantity', 0)) as unknown as { id: string; quantity: number; humidor: { name: string } }[];
}

// ---------------------------------------------------------------------------
// Creators
// ---------------------------------------------------------------------------

export async function applyCreator(input: { channels: string; audience: string; message: string }) {
  const me = await uid();
  must(await supabase.from('creator_applications').upsert({ user_id: me, ...input }));
  must(await supabase.from('profiles').update({ creator_status: 'pending' }).eq('id', me));
}

export async function creatorLinks(userId: string) {
  return must(await supabase.from('creator_links').select('*').eq('user_id', userId).order('created_at', { ascending: false })) as CreatorLink[];
}

export async function creatorLinksForCigar(cigarId: string) {
  return must(await supabase.from('creator_links')
    .select('*, author:profiles!creator_links_user_id_fkey(username, display_name, avatar_url)')
    .eq('cigar_id', cigarId).order('created_at', { ascending: false }).limit(10)) as unknown as (CreatorLink & { author: Pick<Profile, 'username' | 'display_name' | 'avatar_url'> })[];
}

export async function addCreatorLink(input: { kind: LinkKind; url: string; title: string; thumbnail_url: string | null; cigar_id: string | null; is_sponsored: boolean }) {
  const me = await uid();
  must(await supabase.from('creator_links').insert({ ...input, user_id: me }));
}

export async function deleteCreatorLink(id: string) {
  must(await supabase.from('creator_links').delete().eq('id', id));
}

// ---------------------------------------------------------------------------
// Moderation (admins)
// ---------------------------------------------------------------------------

export async function pendingCigars() {
  return must(await supabase.from('cigar_list').select('*').eq('approved', false).order('brand_name').limit(100)) as Cigar[];
}

export async function setCigarApproved(id: string, approved: boolean) {
  if (approved) {
    const c = must(await supabase.from('cigars').select('brand_id').eq('id', id).single()) as { brand_id: string };
    must(await supabase.from('brands').update({ approved: true }).eq('id', c.brand_id));
    must(await supabase.from('cigars').update({ approved: true }).eq('id', id));
  } else {
    must(await supabase.from('cigars').delete().eq('id', id));
  }
}

export type CreatorApplication = { user_id: string; channels: string; audience: string | null; message: string | null; created_at: string; profile: Profile };

export async function pendingCreators() {
  return must(await supabase.from('creator_applications')
    .select('*, profile:profiles!creator_applications_user_id_fkey(*)')
    .is('reviewed_at', null).order('created_at')) as unknown as CreatorApplication[];
}

export async function reviewCreator(userId: string, verified: boolean) {
  const me = await uid();
  must(await supabase.from('profiles').update({ creator_status: verified ? 'verified' : 'rejected' }).eq('id', userId));
  must(await supabase.from('creator_applications').update({ reviewed_by: me, reviewed_at: new Date().toISOString() }).eq('user_id', userId));
}

export type ReportRow = { id: string; target_kind: string; target_id: string; reason: string; created_at: string };

export async function openReports() {
  return must(await supabase.from('reports').select('*').eq('status', 'open').order('created_at').limit(100)) as ReportRow[];
}

export async function resolveReport(r: ReportRow, removeContent: boolean) {
  const me = await uid();
  if (removeContent) {
    const table = { checkin: 'checkins', club_post: 'club_posts', comment: 'comments', creator_link: 'creator_links', brand_article: 'brand_articles' }[r.target_kind];
    if (table) must(await supabase.from(table).delete().eq('id', r.target_id));
  }
  must(await supabase.from('reports').update({ status: removeContent ? 'actioned' : 'dismissed', handled_by: me }).eq('id', r.id));
}

// ---------------------------------------------------------------------------
// Account types (Aficionado / Expert / Manufacturer)
// ---------------------------------------------------------------------------

export async function myApplications() {
  const me = await uid();
  return must(await supabase.from('account_applications').select('*').eq('user_id', me)
    .order('created_at', { ascending: false })) as AccountApplication[];
}

export async function applyAccountType(input: {
  requested_type: Exclude<AccountType, 'aficionado'>; experience?: string; company?: string; brand_names?: string;
  website?: string; contact?: string; message?: string;
}) {
  const me = await uid();
  const clean = (v?: string) => v?.trim() || null;
  must(await supabase.from('account_applications').insert({
    user_id: me, requested_type: input.requested_type, experience: clean(input.experience), company: clean(input.company),
    brand_names: clean(input.brand_names), website: clean(input.website), contact: clean(input.contact), message: clean(input.message),
  }));
}

export async function cancelApplication(id: string) {
  must(await supabase.from('account_applications').delete().eq('id', id));
}

export type AccountApplicationRow = AccountApplication & { profile: Profile };

export async function pendingApplications() {
  return must(await supabase.from('account_applications')
    .select('*, profile:profiles!account_applications_user_id_fkey(*)')
    .eq('status', 'pending').order('created_at')) as unknown as AccountApplicationRow[];
}

export async function reviewApplication(id: string, approve: boolean, brandIds: string[] = []) {
  must(await supabase.rpc('review_account_application', { app: id, approve, brand_ids: brandIds }));
}

// ---------------------------------------------------------------------------
// Brands, manufacturers, articles and brand badges
// ---------------------------------------------------------------------------

export async function getBrand(id: string) {
  return must(await supabase.from('brands').select('id, name, country, website, approved').eq('id', id).maybeSingle()) as Brand | null;
}

export async function brandCigars(brandId: string) {
  return must(await supabase.from('cigar_list').select('*').eq('brand_id', brandId).eq('approved', true)
    .order('line').order('ring_gauge').limit(300)) as Cigar[];
}

export async function brandManagers(brandId: string) {
  return must(await supabase.from('brand_managers').select('user:profiles!brand_managers_user_id_fkey(*)')
    .eq('brand_id', brandId)) as unknown as { user: Profile }[];
}

/** Brands the signed-in manufacturer manages. */
export async function myBrands() {
  const me = await uid();
  return must(await supabase.from('brand_managers').select('brand:brands(id, name, country, website, approved)')
    .eq('user_id', me)) as unknown as { brand: Brand }[];
}

export async function isBrandManager(brandId: string) {
  return must(await supabase.rpc('is_brand_manager', { b: brandId })) as boolean;
}

const ARTICLE_SELECT = '*, brand:brands(id, name)';

export async function featuredArticles(limit = 6) {
  return must(await supabase.from('brand_articles').select(ARTICLE_SELECT).eq('featured', true)
    .order('created_at', { ascending: false }).limit(limit)) as unknown as BrandArticle[];
}

export async function brandArticles(brandId: string) {
  return must(await supabase.from('brand_articles').select(ARTICLE_SELECT).eq('brand_id', brandId)
    .order('created_at', { ascending: false }).limit(50)) as unknown as BrandArticle[];
}

export async function getArticle(id: string) {
  return must(await supabase.from('brand_articles').select(ARTICLE_SELECT).eq('id', id).maybeSingle()) as unknown as BrandArticle | null;
}

export async function saveArticle(input: {
  id?: string; brand_id: string; title: string; body: string; link_url: string | null; cigar_id: string | null;
  featured: boolean; coverUri?: string | null; cover_path?: string | null;
}) {
  const me = await uid();
  let cover_path = input.cover_path ?? null;
  if (input.coverUri) cover_path = await uploadImage('cigar-images', input.coverUri);
  const row = {
    brand_id: input.brand_id, title: input.title.trim(), body: input.body.trim(), link_url: input.link_url?.trim() || null,
    cigar_id: input.cigar_id, featured: input.featured, cover_path,
  };
  if (input.id) {
    must(await supabase.from('brand_articles').update(row).eq('id', input.id));
    return input.id;
  }
  const r = must(await supabase.from('brand_articles').insert({ ...row, author_id: me }).select('id').single()) as { id: string };
  return r.id;
}

export async function deleteArticle(id: string) {
  must(await supabase.from('brand_articles').delete().eq('id', id));
}

export async function brandBadges(brandId: string) {
  return must(await supabase.from('brand_badges').select('*').eq('brand_id', brandId).order('created_at')) as BrandBadge[];
}

export async function createBrandBadge(input: { brand_id: string; name: string; description: string; icon: string }) {
  const me = await uid();
  must(await supabase.from('brand_badges').insert({
    brand_id: input.brand_id, name: input.name.trim(), description: input.description.trim() || null, icon: input.icon, created_by: me,
  }));
}

export async function deleteBrandBadge(id: string) {
  must(await supabase.from('brand_badges').delete().eq('id', id));
}

export async function awardBrandBadge(badgeId: string, userId: string, message: string) {
  const me = await uid();
  must(await supabase.from('brand_badge_awards').upsert({ badge_id: badgeId, user_id: userId, awarded_by: me, message: message.trim() || null }));
}

export async function badgeHolders(badgeIds: string[]) {
  if (!badgeIds.length) return [] as { badge_id: string; user_id: string }[];
  return must(await supabase.from('brand_badge_awards').select('badge_id, user_id').in('badge_id', badgeIds)) as { badge_id: string; user_id: string }[];
}

export async function userBrandBadges(userId: string) {
  return must(await supabase.from('brand_badge_awards').select('awarded_at, message, badge:brand_badges(*, brand:brands(id, name))')
    .eq('user_id', userId).order('awarded_at', { ascending: false })) as unknown as BrandBadgeAward[];
}

export async function brandTopFans(brandId: string) {
  return must(await supabase.rpc('brand_top_fans', { b: brandId, max_results: 30 })) as BrandFan[];
}

// ---------------------------------------------------------------------------
// Catalog corrections
// ---------------------------------------------------------------------------

/** Manufacturers (own brand) and admins change a cigar directly. */
export async function updateCigar(id: string, patch: CigarPatch) {
  must(await supabase.from('cigars').update(patch).eq('id', id));
}

/** Experts propose a change; moderators approve it. */
export async function suggestCigarChange(cigarId: string, changes: CigarPatch, note: string) {
  const me = await uid();
  must(await supabase.from('cigar_suggestions').insert({ cigar_id: cigarId, author_id: me, changes, note: note.trim() || null }));
}

export async function mySuggestions() {
  const me = await uid();
  return must(await supabase.from('cigar_suggestions').select('*').eq('author_id', me)
    .order('created_at', { ascending: false }).limit(50)) as CigarSuggestion[];
}

export type SuggestionRow = CigarSuggestion & { author: Profile | null; cigar: Cigar | null };

export async function pendingSuggestions() {
  const rows = must(await supabase.from('cigar_suggestions')
    .select('*, author:profiles!cigar_suggestions_author_id_fkey(*)')
    .eq('status', 'pending').order('created_at').limit(100)) as unknown as (CigarSuggestion & { author: Profile | null })[];
  const ids = [...new Set(rows.map((r) => r.cigar_id))];
  const cigars = ids.length ? (must(await supabase.from('cigar_list').select('*').in('id', ids)) as Cigar[]) : [];
  const byId = new Map(cigars.map((c) => [c.id, c]));
  return rows.map((r) => ({ ...r, cigar: byId.get(r.cigar_id) ?? null })) as SuggestionRow[];
}

export async function reviewSuggestion(id: string, approve: boolean) {
  must(await supabase.rpc('review_cigar_suggestion', { sug: id, approve }));
}
