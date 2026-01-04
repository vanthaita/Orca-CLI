export type AiProvider = 'gemini' | 'openai' | 'rest' | 'zai' | 'deepseek';

export type AiChatRequest = {
  provider?: AiProvider;
  model: string;
  systemPrompt: string;
  userPrompt: string;
};

export type AiChatResponse = {
  text: string;
};
