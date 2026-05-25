import Anthropic from '@anthropic-ai/sdk';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { checkUsage, incrementUsage } from '@/lib/usage';

export async function POST(request) {
  // Auth check
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: 'unauthorized' }, { status: 401 });

  // Get tier
  const service = createServiceClient();
  const { data: profile } = await service
    .from('profiles')
    .select('tier, lifetime_scans')
    .eq('id', user.id)
    .single();

  const tier = profile?.tier ?? 'free';

  // Check limit
  const check = await checkUsage(service, user.id, tier, 'scan');
  if (!check.allowed) {
    return Response.json({ error: check.reason, limit: check.limit, used: check.used }, { status: 429 });
  }

  // Parse body
  let imageBase64, mediaType;
  try {
    ({ imageBase64, mediaType } = await request.json());
  } catch {
    return Response.json({ error: 'invalid_body' }, { status: 400 });
  }

  if (!imageBase64 || !mediaType) {
    return Response.json({ error: 'missing_image' }, { status: 400 });
  }

  // Call Anthropic (server-side — key never leaves server)
  try {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 100,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: mediaType, data: imageBase64 },
          },
          {
            type: 'text',
            text: 'If this is a Magic: The Gathering card, reply with ONLY the exact card name as printed on the card. If it is not a recognisable MTG card or the image is unclear, reply with exactly: NOT_A_CARD',
          },
        ],
      }],
    });

    const cardName = message.content[0]?.text?.trim() ?? 'NOT_A_CARD';

    if (cardName === 'NOT_A_CARD' || cardName.length < 2) {
      return Response.json({ cardName: null });
    }

    // Increment usage only on successful recognition
    await incrementUsage(service, user.id, tier, 'scan');

    return Response.json({ cardName, remaining: check.remaining - 1 });
  } catch (e) {
    console.error('Anthropic scan error:', e);
    return Response.json({ error: 'ai_error', message: e.message }, { status: 500 });
  }
}
