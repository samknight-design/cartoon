// Proxy Scryfall search to avoid any potential CORS issues on mobile browsers
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');
  const name = searchParams.get('name');

  try {
    let url;
    if (name) {
      url = `https://api.scryfall.com/cards/named?fuzzy=${encodeURIComponent(name)}`;
    } else if (q) {
      url = `https://api.scryfall.com/cards/search?q=${encodeURIComponent(q)}&order=name`;
    } else {
      return Response.json({ error: 'missing_query' }, { status: 400 });
    }

    const res = await fetch(url, {
      headers: { 'User-Agent': 'MTGCompanion/1.0 (contact@example.com)' },
    });

    const data = await res.json();
    return Response.json(data, { status: res.status });
  } catch (e) {
    return Response.json({ error: 'scryfall_error' }, { status: 502 });
  }
}
