import Anthropic from '@anthropic-ai/sdk';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { checkUsage, incrementUsage } from '@/lib/usage';

export async function POST(request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: 'unauthorized' }, { status: 401 });

  const service = createServiceClient();
  const { data: profile } = await service
    .from('profiles')
    .select('tier')
    .eq('id', user.id)
    .single();

  if (profile?.tier !== 'pro') {
    return Response.json({ error: 'pro_required' }, { status: 403 });
  }

  const check = await checkUsage(service, user.id, 'pro', 'insight');
  if (!check.allowed) {
    return Response.json({ error: check.reason }, { status: 429 });
  }

  let body;
  try { body = await request.json(); }
  catch { return Response.json({ error: 'invalid_body' }, { status: 400 }); }

  const { deckId, deckName, format, cards } = body;
  if (!deckId || !cards?.length) return Response.json({ error: 'missing_data' }, { status: 400 });

  // Verify deck belongs to user
  const { data: deck } = await supabase.from('decks').select('id, updated_at').eq('id', deckId).eq('user_id', user.id).single();
  if (!deck) return Response.json({ error: 'deck_not_found' }, { status: 404 });

  // Format deck list for prompt
  const commanders = cards.filter(c => c.isCommander);
  const nonCmdrs   = cards.filter(c => !c.isCommander);

  const deckList = [
    commanders.length ? `=== COMMANDERS ===\n${commanders.map(c => `${c.name} (${c.type})`).join('\n')}` : '',
    `=== CARDS (${nonCmdrs.reduce((s,c) => s+c.count, 0)} total) ===`,
    ...nonCmdrs.map(c => `${c.count}x ${c.name} [${c.type ?? ''}] CMC:${c.cmc ?? 0}`),
  ].filter(Boolean).join('\n');

  const prompt = `You are an expert Magic: The Gathering deck analyst. Analyse this ${format} deck:

Deck: "${deckName}"
Format: ${format}

${deckList}

Provide a structured analysis covering:

1. **Archetype & Strategy** — What is the deck trying to do? What's the win condition?
2. **Bracket Estimate** — For Commander: rate 1 (precon power) to 5 (cEDH). Explain why.
3. **Strengths** — 3 specific strengths of this build.
4. **Weaknesses** — 3 specific weaknesses or gaps.
5. **Card Swap Recommendations** — Suggest 3–5 specific swaps (card OUT → card IN) with brief reasoning.
6. **Mana Base Assessment** — Comment on land count, colour fixing, ramp.
7. **Overall Rating** — Score /10 with one-line verdict.

Be specific and reference actual card names. Be honest about weaknesses.`;

  try {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1200,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = message.content[0]?.text ?? '';

    // Save insight to database
    const { data: insight } = await supabase.from('insights').insert({
      deck_id: deckId,
      content,
      card_count_snapshot: cards.reduce((s,c) => s + c.count, 0),
      deck_updated_at: deck.updated_at,
    }).select().single();

    await incrementUsage(service, user.id, 'pro', 'insight');

    return Response.json({ insight, remaining: check.remaining - 1 });
  } catch (e) {
    console.error('Anthropic insights error:', e);
    return Response.json({ error: 'ai_error', message: e.message }, { status: 500 });
  }
}
