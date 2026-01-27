// lib/deepseek.ts
const DEEPSEEK_API = process.env.DEEPSEEK_API_BASE ?? 'https://api.deepseek.com';
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY!;
const MODEL = process.env.DEEPSEEK_MODEL ?? 'deepseek-chat';

if (!DEEPSEEK_API_KEY) {
  console.warn('Missing DEEPSEEK_API_KEY');
}

type Message = { role: 'system' | 'user' | 'assistant'; content: string };

type ApiResponse = {
  content: string;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  cost: number; // Cost in USD cents
};

// DeepSeek pricing (as of 2025): Input cache hit $0.028, cache miss $0.28, output $0.42 per million tokens
const DEEPSEEK_INPUT_CACHE_HIT_PRICE_PER_MILLION = 0.028; // $0.000028 per token
const DEEPSEEK_INPUT_CACHE_MISS_PRICE_PER_MILLION = 0.28; // $0.00028 per token
const DEEPSEEK_OUTPUT_PRICE_PER_MILLION = 0.42; // $0.00042 per token

function calculateApiCost(promptTokens: number, completionTokens: number): number {
  // Using cache miss pricing as conservative estimate (cache hits are $0.028/M vs $0.28/M for cache misses)
  const inputCost = (promptTokens / 1000000) * DEEPSEEK_INPUT_CACHE_MISS_PRICE_PER_MILLION;
  const outputCost = (completionTokens / 1000000) * DEEPSEEK_OUTPUT_PRICE_PER_MILLION;
  const totalCost = inputCost + outputCost;
  // Add 50% markup (return in dollars, not cents)
  return totalCost * 1.5;
}

async function callDeepseek(messages: Message[], jsonMode = false, maxTokens = 4096): Promise<ApiResponse> {
  const url = `${DEEPSEEK_API}/chat/completions`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
  };

  const body: any = {
    model: MODEL,
    messages,
    temperature: 0.3,
    max_tokens: maxTokens,
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

  const usage = data?.usage;
  if (!usage) throw new Error('No usage data from Deepseek');

  const cost = calculateApiCost(usage.prompt_tokens, usage.completion_tokens);

  return {
    content,
    usage,
    cost
  };
}

export async function chatJSON(system: string, user: string, maxTokens = 4096): Promise<ApiResponse> {
  return callDeepseek(
    [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
    true,
    maxTokens
  );
}

export async function chatText(system: string, user: string, maxTokens = 8192): Promise<ApiResponse> {
  return callDeepseek([
    { role: 'system', content: system },
    { role: 'user', content: user },
  ], false, maxTokens);
}
