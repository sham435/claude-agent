import OpenAI from 'openai';
import { LLMProvider, LLMOptions } from './llm.provider';

const MODELS = [
  'openrouter/free',
  'mistralai/mistral-small-24b-instruct-2501:free',
  'google/gemma-3-4b-it:free',
];

export interface LLMResponse {
  content: string;
  tokens?: number;
  model?: string;
}

export class OpenAIProvider implements LLMProvider {
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.OPENROUTER_API_KEY,
      baseURL: 'https://openrouter.ai/api/v1',
      defaultHeaders: {
        'HTTP-Referer': process.env.APP_URL || 'http://localhost:5174',
        'X-Title': process.env.APP_NAME || 'Claude Agent Dev',
      },
    });

    console.log('[LLM] Init OK');
  }

  async generate(prompt: string, options: LLMOptions): Promise<string> {
    const models = MODELS;

    for (const model of models) {
      try {
        console.log('[LLM] Trying model:', model);

        const res = await this.client.chat.completions.create({
          model,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: options.maxTokens ?? 500,
          temperature: options.temperature ?? 0.7,
        });

        const usage = res.usage;
        const tokens = usage?.total_tokens || 0;
        console.log(`[LLM] Used ${tokens} tokens`);

        const content = res.choices?.[0]?.message?.content;

        if (content && content.trim()) {
          return content;
        }

      } catch (err: any) {
        console.error(`[LLM] Model failed: ${model}`, err?.response?.data || err?.message);
        continue;
      }
    }

    return '⚠️ All free models failed or quota exceeded';
  }
}
