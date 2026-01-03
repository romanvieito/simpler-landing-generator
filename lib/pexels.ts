// lib/pexels.ts
const PEXELS_API_KEY = process.env.PEXELS_API_KEY;

if (!PEXELS_API_KEY) {
  console.warn('Missing PEXELS_API_KEY');
}

export async function fetchImageForQuery(query: string): Promise<string | null> {
  if (!PEXELS_API_KEY) return null;

  const params = new URLSearchParams({
    query,
    per_page: '1',
    orientation: 'landscape',
  });

  const res = await fetch(`https://api.pexels.com/v1/search?${params.toString()}`, {
    headers: {
      Authorization: PEXELS_API_KEY,
    },
    next: { revalidate: 3600 },
  });

  if (!res.ok) {
    console.warn('Pexels error', res.status);
    return null;
  }

  const data = await res.json();
  const photo = data?.photos?.[0];
  if (!photo) return null;
  const url =
    photo?.src?.landscape ||
    photo?.src?.large ||
    photo?.src?.original ||
    photo?.src?.medium ||
    photo?.url;
  return url || null;
}
