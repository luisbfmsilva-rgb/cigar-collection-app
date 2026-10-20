import type { LinkKind, Music } from './types';

// ---------------------------------------------------------------------------
// Music: Apple Music catalog search (iTunes Search API, no key needed) + pasted links
// ---------------------------------------------------------------------------

type ItunesTrack = {
  trackId: number;
  trackName: string;
  artistName: string;
  artworkUrl100?: string;
  previewUrl?: string;
  trackViewUrl: string;
};

export async function searchAppleMusic(term: string, country = 'US'): Promise<Music[]> {
  const q = term.trim();
  if (q.length < 2) return [];
  const url = `https://itunes.apple.com/search?term=${encodeURIComponent(q)}&media=music&entity=song&limit=20&country=${country}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Apple Music search failed (${res.status})`);
  const json = (await res.json()) as { results: ItunesTrack[] };
  return json.results.map((r) => ({
    source: 'apple_music',
    title: r.trackName,
    artist: r.artistName,
    artworkUrl: r.artworkUrl100?.replace('100x100', '300x300') ?? null,
    previewUrl: r.previewUrl ?? null,
    url: r.trackViewUrl,
  }));
}

type OEmbed = { title?: string; author_name?: string; thumbnail_url?: string };

async function oembed(endpoint: string): Promise<OEmbed | null> {
  try {
    const res = await fetch(endpoint);
    if (!res.ok) return null;
    return (await res.json()) as OEmbed;
  } catch {
    return null;
  }
}

function parseUrl(raw: string) {
  try {
    const u = new URL(raw.trim());
    return u.protocol === 'https:' || u.protocol === 'http:' ? u : null;
  } catch {
    return null;
  }
}

/** Turns a pasted Spotify / YouTube / Apple Music link into a music attachment. */
export async function musicFromLink(raw: string): Promise<Music | null> {
  const u = parseUrl(raw);
  if (!u) return null;
  const host = u.hostname.replace(/^www\./, '');

  if (host === 'open.spotify.com') {
    const data = await oembed(`https://open.spotify.com/oembed?url=${encodeURIComponent(u.toString())}`);
    if (!data?.title) return null;
    return { source: 'spotify', title: data.title, artist: null, artworkUrl: data.thumbnail_url ?? null, previewUrl: null, url: u.toString() };
  }

  if (host === 'youtube.com' || host === 'music.youtube.com' || host === 'youtu.be' || host === 'm.youtube.com') {
    const data = await oembed(`https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(u.toString())}`);
    if (!data?.title) return null;
    return {
      source: 'youtube', title: data.title, artist: data.author_name ?? null,
      artworkUrl: data.thumbnail_url ?? null, previewUrl: null, url: u.toString(),
    };
  }

  if (host === 'music.apple.com') {
    const trackId = u.searchParams.get('i') ?? u.pathname.split('/').pop();
    if (trackId && /^\d+$/.test(trackId)) {
      const res = await fetch(`https://itunes.apple.com/lookup?id=${trackId}&entity=song`);
      if (res.ok) {
        const json = (await res.json()) as { results: ItunesTrack[] };
        const r = json.results.find((x) => x.trackName);
        if (r) {
          return {
            source: 'apple_music', title: r.trackName, artist: r.artistName,
            artworkUrl: r.artworkUrl100?.replace('100x100', '300x300') ?? null,
            previewUrl: r.previewUrl ?? null, url: u.toString(),
          };
        }
      }
    }
    return null;
  }

  return null;
}

// ---------------------------------------------------------------------------
// Creator content links
// ---------------------------------------------------------------------------

export function guessLinkKind(raw: string): LinkKind {
  const u = parseUrl(raw);
  if (!u) return 'other';
  const host = u.hostname.replace(/^www\./, '');
  if (host.endsWith('youtube.com') || host === 'youtu.be') return 'youtube';
  if (host.endsWith('instagram.com')) return 'instagram';
  if (host.endsWith('tiktok.com')) return 'tiktok';
  if (host.includes('spotify.com') || host.includes('podcasts.apple.com')) return 'podcast';
  return 'article';
}

export async function previewLink(raw: string): Promise<{ title: string | null; thumbnail: string | null }> {
  const u = parseUrl(raw);
  if (!u) return { title: null, thumbnail: null };
  const kind = guessLinkKind(raw);
  if (kind === 'youtube') {
    const d = await oembed(`https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(u.toString())}`);
    return { title: d?.title ?? null, thumbnail: d?.thumbnail_url ?? null };
  }
  if (kind === 'tiktok') {
    const d = await oembed(`https://www.tiktok.com/oembed?url=${encodeURIComponent(u.toString())}`);
    return { title: d?.title ?? null, thumbnail: d?.thumbnail_url ?? null };
  }
  return { title: null, thumbnail: null };
}

/**
 * Apple guideline 1.4.3 forbids facilitating tobacco sales, so creator links
 * may not point to stores or carry affiliate tracking.
 */
const STORE_HOSTS = [
  'jrcigars.com', 'famous-smoke.com', 'famoussmoke.com', 'cigarsinternational.com', 'thompsoncigar.com',
  'bestcigarprices.com', 'cigar.com', 'holts.com', 'smallbatchcigar.com', 'atlanticcigar.com',
  'neptunecigar.com', 'cigarpage.com', 'cigarbid.com', 'amazon.com', 'amzn.to', 'ebay.com', 'mercadolivre.com.br',
];
const AFFILIATE_PARAMS = ['tag', 'aff', 'affid', 'affiliate', 'ref', 'ref_id', 'refid', 'utm_campaign', 'irclickid', 'clickid'];

export function isStoreOrAffiliateLink(raw: string) {
  const u = parseUrl(raw);
  if (!u) return false;
  const host = u.hostname.replace(/^www\./, '').toLowerCase();
  if (STORE_HOSTS.some((h) => host === h || host.endsWith(`.${h}`))) return true;
  return AFFILIATE_PARAMS.some((p) => u.searchParams.has(p));
}

export function isHttpsUrl(raw: string) {
  return parseUrl(raw)?.protocol === 'https:';
}
