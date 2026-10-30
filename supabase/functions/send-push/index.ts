// Sends push notifications when someone you follow publishes. Called by two Database Webhooks (INSERT on `checkins` and on `super_posts`).
// Secrets: WEBHOOK_SECRET (any long random text; the same value goes in the webhook header `x-webhook-secret`).
import { createClient } from 'npm:@supabase/supabase-js@2';

type Loc = 'en' | 'pt' | 'es';
const TEXT: Record<Loc, { checkin: (n: string, c: string) => string; superTitle: (n: string) => string }> = {
  en: { checkin: (n, c) => `${n} checked in ${c}`, superTitle: (n) => `${n} posted a Super Post` },
  pt: { checkin: (n, c) => `${n} fez check-in: ${c}`, superTitle: (n) => `${n} publicou um Super Post` },
  es: { checkin: (n, c) => `${n} hizo check-in: ${c}`, superTitle: (n) => `${n} publicó un Super Post` },
};

Deno.serve(async (req) => {
  if (req.headers.get('x-webhook-secret') !== Deno.env.get('WEBHOOK_SECRET')) return new Response('forbidden', { status: 403 });
  const payload = await req.json();
  if (payload.type !== 'INSERT') return new Response('ignored');
  const rec = payload.record;
  const table: string = payload.table;
  const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

  const { data: author } = await db.from('profiles').select('id, username, display_name, account_type, creator_status').eq('id', rec.user_id).single();
  if (!author) return new Response('no author');
  const isCreator = author.account_type === 'manufacturer' || author.creator_status === 'verified';
  const isSuper = table === 'super_posts';
  if (table === 'checkins' && rec.visibility === 'private') return new Response('private');

  let cigarName = '';
  let url = '/';
  if (table === 'checkins') {
    const { data: c } = await db.from('cigars').select('line, brand:brands(name)').eq('id', rec.cigar_id).single();
    cigarName = [(c?.brand as { name?: string } | null)?.name, c?.line].filter(Boolean).join(' ');
    url = `/checkin/${rec.id}`;
  } else {
    url = `/user/${author.username}`;
  }

  // followers who want this kind of notification
  const { data: rows } = await db.from('follows').select('follower_id, follower:profiles!follows_follower_id_fkey(locale, notify_friends, notify_creators)').eq('followee_id', author.id);
  const wanted = (rows ?? []).filter((r) => {
    const f = r.follower as unknown as { notify_friends: boolean; notify_creators: boolean } | null;
    if (!f) return false;
    return isSuper || isCreator ? f.notify_creators : f.notify_friends;
  });
  if (!wanted.length) return new Response('nobody');
  const { data: tokens } = await db.from('push_tokens').select('token, user_id').in('user_id', wanted.map((r) => r.follower_id));
  const localeOf = new Map(wanted.map((r) => [r.follower_id, ((r.follower as unknown as { locale: Loc }).locale ?? 'en') as Loc]));

  const name = author.display_name || author.username;
  const messages = (tokens ?? []).map((t) => {
    const l = TEXT[localeOf.get(t.user_id) ?? 'en'];
    return {
      to: t.token, sound: 'default', channelId: 'social', data: { url },
      title: isSuper ? l.superTitle(name) : l.checkin(name, cigarName),
      body: isSuper ? String(rec.body).slice(0, 140) : undefined,
    };
  });
  for (let i = 0; i < messages.length; i += 100) {
    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST', headers: { 'content-type': 'application/json', accept: 'application/json' }, body: JSON.stringify(messages.slice(i, i + 100)),
    }).catch(() => null);
  }
  return new Response(`sent ${messages.length}`);
});
