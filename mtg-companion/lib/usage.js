// ============================================================
// Usage limits — edit these constants to tune pricing tiers
// ============================================================
export const LIMITS = {
  free: {
    lifetime_scans: 50,   // total scans before upgrade required
    insights_per_week: 0,
  },
  pro: {
    scans_per_day: 30,
    insights_per_week: 2,
  },
};

// ---- helpers -----------------------------------------------

function weekStart() {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() - d.getUTCDay()); // Sunday
  return d.toISOString().split('T')[0];
}

function today() {
  return new Date().toISOString().split('T')[0];
}

/**
 * Check whether a user can perform `action` ('scan' | 'insight').
 * Returns { allowed: boolean, reason?: string, remaining?: number }
 * Uses the service-role client to bypass RLS on usage_daily.
 */
export async function checkUsage(serviceSupabase, userId, tier, action) {
  if (action === 'scan') {
    if (tier === 'free') {
      const { data: profile } = await serviceSupabase
        .from('profiles')
        .select('lifetime_scans')
        .eq('id', userId)
        .single();

      const used = profile?.lifetime_scans ?? 0;
      const limit = LIMITS.free.lifetime_scans;
      if (used >= limit) return { allowed: false, reason: 'free_scan_limit', limit, used };
      return { allowed: true, remaining: limit - used };
    } else {
      const { data } = await serviceSupabase
        .from('usage_daily')
        .select('scan_count')
        .eq('user_id', userId)
        .eq('date', today())
        .maybeSingle();

      const used = data?.scan_count ?? 0;
      const limit = LIMITS.pro.scans_per_day;
      if (used >= limit) return { allowed: false, reason: 'pro_daily_scan_limit', limit, used };
      return { allowed: true, remaining: limit - used };
    }
  }

  if (action === 'insight') {
    if (tier !== 'pro') return { allowed: false, reason: 'pro_required' };

    // Count insights this week
    const ws = weekStart();
    const { count } = await serviceSupabase
      .from('usage_daily')
      .select('insight_count', { count: 'exact' })
      .eq('user_id', userId)
      .gte('date', ws);

    // Sum up this week's insight_count rows
    const { data: rows } = await serviceSupabase
      .from('usage_daily')
      .select('insight_count')
      .eq('user_id', userId)
      .gte('date', ws);

    const used = rows?.reduce((sum, r) => sum + (r.insight_count ?? 0), 0) ?? 0;
    const limit = LIMITS.pro.insights_per_week;
    if (used >= limit) return { allowed: false, reason: 'weekly_insight_limit', limit, used };
    return { allowed: true, remaining: limit - used };
  }

  return { allowed: false, reason: 'unknown_action' };
}

/**
 * Increment usage after a successful action.
 */
export async function incrementUsage(serviceSupabase, userId, tier, action) {
  if (action === 'scan') {
    if (tier === 'free') {
      await serviceSupabase.rpc('increment_lifetime_scans', { p_user_id: userId });
    } else {
      await serviceSupabase
        .from('usage_daily')
        .upsert(
          { user_id: userId, date: today(), scan_count: 1 },
          { onConflict: 'user_id,date', ignoreDuplicates: false }
        );
      // Increment via raw SQL workaround (Supabase doesn't support inc in upsert)
      await serviceSupabase.rpc('increment_daily_scans', { p_user_id: userId, p_date: today() });
    }
  }

  if (action === 'insight') {
    await serviceSupabase.rpc('increment_daily_insights', { p_user_id: userId, p_date: today() });
  }
}
