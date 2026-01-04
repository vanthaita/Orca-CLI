import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../auth/entities/user.entity';
import type { AiChatRequest, AiChatResponse, AiProvider } from './ai.types';
import { AiUsageDaily } from './entities/ai-usage-daily.entity';

@Injectable()
export class AiService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    @InjectRepository(AiUsageDaily)
    private readonly usageRepo: Repository<AiUsageDaily>,
  ) {}

  async chat(userId: string, req: AiChatRequest): Promise<AiChatResponse> {
    if (!req || !req.model || !req.systemPrompt || !req.userPrompt) {
      throw new BadRequestException('Missing required fields: model, systemPrompt, userPrompt');
    }

    await this.enforceAndTrackQuota(userId);

    const provider: AiProvider = (req.provider ?? (process.env.AI_PROVIDER as AiProvider) ?? 'gemini') as AiProvider;

    if (provider === 'gemini') {
      const text = await this.callGemini(req.model, req.systemPrompt, req.userPrompt);
      return { text };
    }

    const text = await this.callOpenAiCompatible(provider, req.model, req.systemPrompt, req.userPrompt);
    return { text };
  }

  private async callGemini(model: string, systemPrompt: string, userPrompt: string): Promise<string> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new BadRequestException('Server not configured: missing GEMINI_API_KEY');
    }

    const modelPath = model.startsWith('models/') ? model : `models/${model}`;
    const url = `https://generativelanguage.googleapis.com/v1beta/${modelPath}:generateContent`;

    const fullPrompt = `${systemPrompt}\n\n${userPrompt}`;
    const body = {
      contents: [{ parts: [{ text: fullPrompt }] }],
    };

    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify(body),
    });

    const text = await resp.text();
    if (!resp.ok) {
      throw new BadRequestException(`Gemini API returned ${resp.status}: ${text}`);
    }

    const parsed = JSON.parse(text) as any;
    const out: string | undefined = parsed?.candidates?.[0]?.content?.parts?.[0]?.text;

    const trimmed = (out ?? '').trim();
    if (!trimmed) {
      throw new BadRequestException('Gemini returned empty text');
    }
    return trimmed;
  }

  private async callOpenAiCompatible(
    provider: AiProvider,
    model: string,
    systemPrompt: string,
    userPrompt: string,
  ): Promise<string> {
    const { baseUrl, apiKey } = this.resolveOpenAiCompatibleConfig(provider);

    const url = `${baseUrl.replace(/\/+$/, '')}/chat/completions`;
    const body = {
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      stream: false,
    };

    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });

    const text = await resp.text();
    if (!resp.ok) {
      throw new BadRequestException(`Provider API returned ${resp.status}: ${text}`);
    }

    const parsed = JSON.parse(text) as any;
    const out: string | undefined = parsed?.choices?.[0]?.message?.content;

    const trimmed = (out ?? '').trim();
    if (!trimmed) {
      throw new BadRequestException('Provider returned empty text');
    }

    return trimmed;
  }

  private resolveOpenAiCompatibleConfig(provider: AiProvider): { baseUrl: string; apiKey: string } {
    if (provider === 'openai') {
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) {
        throw new BadRequestException('Server not configured: missing OPENAI_API_KEY');
      }
      return { baseUrl: 'https://api.openai.com/v1', apiKey };
    }

    if (provider === 'deepseek') {
      const apiKey = process.env.DEEPSEEK_API_KEY;
      if (!apiKey) {
        throw new BadRequestException('Server not configured: missing DEEPSEEK_API_KEY');
      }
      return { baseUrl: 'https://api.deepseek.com', apiKey };
    }

    if (provider === 'zai') {
      const apiKey = process.env.ZAI_API_KEY;
      if (!apiKey) {
        throw new BadRequestException('Server not configured: missing ZAI_API_KEY');
      }
      return { baseUrl: 'https://api.z.ai/api/paas/v4', apiKey };
    }

    const apiKey = process.env.OPENAI_API_KEY;
    const baseUrl = process.env.AI_API_BASE_URL;

    if (!apiKey) {
      throw new BadRequestException('Server not configured: missing OPENAI_API_KEY');
    }
    if (!baseUrl) {
      throw new BadRequestException('Server not configured: missing AI_API_BASE_URL');
    }

    return { baseUrl, apiKey };
  }

  private dayKeyUtc(d: Date): string {
    const yyyy = d.getUTCFullYear();
    const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(d.getUTCDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  private async enforceAndTrackQuota(userId: string): Promise<void> {
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const plan = (user.plan ?? 'free').toLowerCase();
    if (plan !== 'free') {
      return;
    }

    const defaultLimit = Number(process.env.FREE_DAILY_REQUEST_LIMIT ?? 50);
    const limit = user.dailyRequestLimit ?? defaultLimit;

    const day = this.dayKeyUtc(new Date());
    let usage = await this.usageRepo.findOne({ where: { userId, day } });
    if (!usage) {
      usage = this.usageRepo.create({ userId, day, requestCount: 0 });
    }

    if (usage.requestCount >= limit) {
      throw new BadRequestException('Daily request limit exceeded');
    }

    usage.requestCount += 1;
    await this.usageRepo.save(usage);
  }
}
