// lib/deepseek.ts
const DEEPSEEK_API = process.env.DEEPSEEK_API_BASE ?? 'https://api.deepseek.com';
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY!;
const MODEL = process.env.DEEPSEEK_MODEL ?? 'deepseek-chat';

if (!DEEPSEEK_API_KEY) {
  console.warn('Missing DEEPSEEK_API_KEY');
}

type Message = { role: 'system' | 'user' | 'assistant'; content: string };

async function callDeepseek(messages: Message[], jsonMode = false): Promise<string> {
  const url = `${DEEPSEEK_API}/chat/completions`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
  };

  const body: any = {
    model: MODEL,
    messages,
    temperature: 0.3,
  };

  if (jsonMode) {
    body.response_format = { type: 'json_object' };
  }

  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Deepseek error: ${res.status} ${text}`);
  }

  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error('No content from Deepseek');
  return content;
}

export async function chatJSON(system: string, user: string) {
  return callDeepseek(
    [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
    true
  );
}

export async function chatText(system: string, user: string) {
  return callDeepseek([
    { role: 'system', content: system },
    { role: 'user', content: user },
  ]);
}
