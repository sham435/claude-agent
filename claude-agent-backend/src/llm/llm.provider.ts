export interface LLMOptions {
  model: string;
  maxTokens?: number;
  temperature?: number;
}

export interface LLMProvider {
  generate(prompt: string, options: LLMOptions): Promise<string>;
}
