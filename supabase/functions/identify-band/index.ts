// Identifies a cigar from a photo of its band (anilha) with a vision model, then finds the closest catalog cigars.
// Deploy: supabase functions deploy identify-band    Secret: supabase secrets set ANTHROPIC_API_KEY=...
import { createClient } from 'npm:@supabase/supabase-js@2';

const MODEL = Deno.env.get('BAND_MODEL') ?? 'claude-sonnet-5-5';
const DAILY_LIMIT = Number(Deno.env.get('BAND_DAILY_LIMIT') ?? '40');
const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' };
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });

const TOOL = {
  name: 'report_band',
  description: 'Report what is printed on the cigar band / box in the photo.',
  input_schema: {
    type: 'object',
    properties: {
      is_cigar_band: { type: 'boolean', description: 'False if the photo does not show a cigar band, cigar or cigar box.' },
      brand: { type: 'string', description: 'Brand as printed (e.g. "Padrón", "Drew Estate"). Empty if unreadable.' },
      line: { type: 'string', description: 'Product line / blend name (e.g. "1926 Serie", "Liga Privada No. 9"). Empty if not visible.' },
      vitola: { type: 'string', description: 'Size or shape name if printed (Robusto, Toro, 6x52...). Empty if not visible.' },
      wrapper_shade: { type: 'string', description: 'Wrapper colour if the leaf is visible: Natural, Maduro, Connecticut, Claro, Oscuro... Empty otherwise.' },
      text_read: { type: 'string', description: 'All legible text on the band, verbatim.' },
      confidence: { type: 'number', description: '0 to 1: how sure you are of brand and line.' },
    },
    required: ['is_cigar_band', 'brand', 'line', 'text_read', 'confidence'],
  },
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  try {
    const auth = req.headers.get('Authorization') ?? '';
    const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: auth } } });
    const { data: u } = await db.auth.getUser();
    if (!u.user) return json({ error: 'NOT_AUTHENTICATED' }, 401);

    if (!Deno.env.get('ANTHROPIC_API_KEY')) return json({ error: 'AI_ERROR', status: 0, detail: 'ANTHROPIC_API_KEY secret is not set' }, 500);
    const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
    const { count } = await db.from('band_scans').select('id', { count: 'exact', head: true }).gte('created_at', since);
    if ((count ?? 0) >= DAILY_LIMIT) return json({ error: 'DAILY_LIMIT' }, 429);

    const { image, mime = 'image/jpeg' } = await req.json();
    if (typeof image !== 'string' || image.length < 1000 || image.length > 9_000_000) return json({ error: 'BAD_IMAGE' }, 400);

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': Deno.env.get('ANTHROPIC_API_KEY')!, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({
        model: MODEL, max_tokens: 600, tools: [TOOL], tool_choice: { type: 'tool', name: 'report_band' },
        messages: [{ role: 'user', content: [
          { type: 'image', source: { type: 'base64', media_type: mime, data: image } },
          { type: 'text', text: 'Read this cigar band or box. Report brand, line and size exactly as printed. Do not guess: leave fields empty when not visible, and lower the confidence.' },
        ] }],
      }),
    });
    if (!res.ok) {
      const detail = (await res.text()).slice(0, 400);
      console.error('Anthropic API error', res.status, detail);
      return json({ error: 'AI_ERROR', status: res.status, detail }, 502);
    }
    const out = await res.json();
    const ai = out.content?.find((c: { type: string }) => c.type === 'tool_use')?.input;
    if (!ai) return json({ error: 'AI_EMPTY' }, 502);

    let candidates: unknown[] = [];
    if (ai.is_cigar_band && (ai.brand || ai.line)) {
      const { data } = await db.rpc('match_band', { p_brand: ai.brand ?? '', p_line: ai.line ?? '', p_vitola: ai.vitola ?? '' });
      candidates = data ?? [];
      if (!candidates.length && ai.brand) {
        const r = await db.rpc('match_band', { p_brand: ai.brand, p_line: '', p_vitola: '' });
        candidates = r.data ?? [];
      }
    }
    const { data: scan } = await db.from('band_scans').insert({
      user_id: u.user.id, ai, candidate_ids: (candidates as { id: string }[]).map((c) => c.id),
    }).select('id').single();
    return json({ scan_id: scan?.id ?? null, ai, candidates });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
