import { prisma } from '../db/client.js';
import { AppError } from '../errors/app-error.js';
import {
  CatchUpSummaryDto,
  SmartRepliesDto,
  TranslationResultDto,
  ToneCheckResultDto,
} from '@realtime-chat/shared';
import { logger } from '../utils/logger.js';

export class AIService {
  private geminiApiKey: string | null = process.env.GEMINI_API_KEY || null;

  private async callGemini(prompt: string): Promise<string | null> {
    if (!this.geminiApiKey) return null;
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.geminiApiKey}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.3, maxOutputTokens: 800 },
        }),
      });

      if (!res.ok) {
        logger.warn({ status: res.status }, 'Gemini API call failed, falling back to local heuristic');
        return null;
      }

      const data: any = await res.json();
      return data?.candidates?.[0]?.content?.parts?.[0]?.text || null;
    } catch (err) {
      logger.warn({ err }, 'Gemini API network error, falling back to local heuristic');
      return null;
    }
  }

  async catchUpSummary(conversationId: string, userId: string): Promise<CatchUpSummaryDto> {
    const conv = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        memberships: { where: { userId } },
      },
    });

    if (!conv) throw AppError.notFound('Conversation not found');

    const membership = conv.memberships[0];
    const lastReadId = membership?.lastReadMessageId;

    // Fetch unread or recent messages
    const messages = await prisma.message.findMany({
      where: {
        conversationId,
        deletedAt: null,
        ...(lastReadId ? { id: { gt: lastReadId } } : {}),
      },
      orderBy: { id: 'desc' },
      take: 40,
      include: { sender: true },
    });

    // If fewer than 5 unread, fetch latest 25 messages
    const messageList =
      messages.length >= 5
        ? messages.reverse()
        : (
            await prisma.message.findMany({
              where: { conversationId, deletedAt: null },
              orderBy: { id: 'desc' },
              take: 25,
              include: { sender: true },
            })
          ).reverse();

    if (messageList.length === 0) {
      return {
        summary: 'No recent activity in this channel.',
        bulletPoints: ['Channel is quiet with no recent messages.'],
        actionItems: [],
        messageCount: 0,
        channelName: conv.name || 'Conversation',
      };
    }

    const conversationTranscript = messageList
      .map((m) => `${m.sender.displayName || m.sender.username}: ${m.body}`)
      .join('\n');

    // Try Gemini LLM first if configured
    const llmPrompt = `You are an AI assistant summarizing missed messages in a team chat channel (#${conv.name || 'chat'}).
Analyze the following chat transcript and output valid JSON with this exact structure:
{
  "summary": "1-2 sentence high-level overview of discussions",
  "bulletPoints": ["Key point 1", "Key point 2", "Key point 3"],
  "actionItems": ["Action item or decision 1", "Action item 2"]
}

Transcript:
${conversationTranscript}
`;

    const geminiResponse = await this.callGemini(llmPrompt);
    if (geminiResponse) {
      try {
        const jsonMatch = geminiResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          return {
            summary: parsed.summary || 'Summary of recent discussions.',
            bulletPoints: Array.isArray(parsed.bulletPoints) ? parsed.bulletPoints : [],
            actionItems: Array.isArray(parsed.actionItems) ? parsed.actionItems : [],
            messageCount: messageList.length,
            channelName: conv.name || 'Conversation',
          };
        }
      } catch (e) {
        logger.warn({ e }, 'Failed to parse Gemini summary JSON, using heuristic');
      }
    }

    // Heuristic & NLP Fallback
    const bulletPoints: string[] = [];
    const actionItems: string[] = [];
    const activeSenders = Array.from(new Set(messageList.map((m) => m.sender.displayName || m.sender.username)));

    for (const msg of messageList) {
      const text = msg.body;
      const author = msg.sender.displayName || msg.sender.username;

      if (text.includes('?')) {
        bulletPoints.push(`${author} asked: "${text.length > 80 ? text.substring(0, 80) + '...' : text}"`);
      } else if (
        /\b(shipped|deployed|released|merged|fixed|completed|done|finished)\b/i.test(text)
      ) {
        bulletPoints.push(`${author} announced milestone: ${text.length > 80 ? text.substring(0, 80) + '...' : text}`);
      } else if (/\b(todo|action|will do|need to|let's|please|assign)\b/i.test(text)) {
        actionItems.push(`${author}: ${text.length > 70 ? text.substring(0, 70) + '...' : text}`);
      }
    }

    if (bulletPoints.length === 0) {
      bulletPoints.push(
        `Active discussion between ${activeSenders.slice(0, 3).join(', ')} covering ${messageList.length} updates.`,
      );
      if (messageList.length > 0) {
        const latest = messageList[messageList.length - 1];
        bulletPoints.push(`Latest update from ${latest.sender.displayName}: "${latest.body.substring(0, 75)}"`);
      }
    }

    const summary = `Discussed ${messageList.length} messages involving ${activeSenders.slice(0, 3).join(', ')}${activeSenders.length > 3 ? ` and ${activeSenders.length - 3} others` : ''}. Focus was on ongoing developments and channel coordination.`;

    return {
      summary,
      bulletPoints: bulletPoints.slice(0, 5),
      actionItems: actionItems.slice(0, 4),
      messageCount: messageList.length,
      channelName: conv.name || 'Conversation',
    };
  }

  async smartReplies(conversationId: string, _userId: string): Promise<SmartRepliesDto> {
    const latestMessages = await prisma.message.findMany({
      where: { conversationId, deletedAt: null },
      orderBy: { id: 'desc' },
      take: 3,
      include: { sender: true },
    });

    if (latestMessages.length === 0) {
      return { replies: ['Hey everyone! 👋', 'Good morning!', 'Checking in.'] };
    }

    const lastMsg = latestMessages[0];
    const text = lastMsg.body.trim();

    // Check Gemini first
    if (this.geminiApiKey) {
      const prompt = `Based on this chat message: "${text}", suggest 3 short, natural, professional quick replies (each max 5 words). Return as JSON: {"replies": ["reply1", "reply2", "reply3"]}`;
      const res = await this.callGemini(prompt);
      if (res) {
        try {
          const match = res.match(/\{[\s\S]*\}/);
          if (match) {
            const parsed = JSON.parse(match[0]);
            if (Array.isArray(parsed.replies) && parsed.replies.length > 0) {
              return { replies: parsed.replies.slice(0, 3) };
            }
          }
        } catch {}
      }
    }

    // Heuristic Contextual Smart Reply Engine
    if (/\b(shipped|launched|merged|released|congrats|awesome|great job|done)\b/i.test(text)) {
      return {
        replies: ['Huge congrats! 🎉', 'Amazing work team! 🚀', 'Love to see it! 🔥'],
      };
    }

    if (text.endsWith('?') || /\b(can you|could you|what do you think|is it ready|any updates)\b/i.test(text)) {
      return {
        replies: ['Yes, on it! 👍', 'Let me check right now.', 'Will update shortly.'],
      };
    }

    if (/\b(thanks|thank you|thx|appreciate)\b/i.test(text)) {
      return {
        replies: ['Anytime! 😊', 'Glad to help!', 'No problem! 👍'],
      };
    }

    if (/\b(meet|sync|call|discuss|zoom|calendar)\b/i.test(text)) {
      return {
        replies: ['Sounds good, invite me!', 'I am free now 👍', 'Sent you calendar slots.'],
      };
    }

    return {
      replies: ['Sounds like a plan! 👍', 'I will review this.', 'Thanks for the update!'],
    };
  }

  async translateText(text: string, targetLanguage: string): Promise<TranslationResultDto> {
    const trimmed = text.trim();
    if (!trimmed) {
      return { originalText: text, translatedText: text, targetLanguage };
    }

    if (this.geminiApiKey) {
      const prompt = `Translate the following chat message accurately and naturally into ${targetLanguage}. Maintain tone, emoji, and formatting:
"${trimmed}"

Return ONLY the translated string without extra explanation.`;
      const res = await this.callGemini(prompt);
      if (res && res.trim()) {
        return {
          originalText: trimmed,
          translatedText: res.trim().replace(/^["']|["']$/g, ''),
          targetLanguage,
        };
      }
    }

    // Local Dictionary & Heuristic Fallback
    const basicDict: Record<string, Record<string, string>> = {
      es: {
        'hello': '¡Hola!',
        'good morning': '¡Buenos días!',
        'thank you': '¡Muchas gracias!',
        'sounds good': '¡Me parece bien!',
        'congratulations': '¡Felicitaciones!',
        'we shipped it!': '¡Lo enviamos!',
        'yes': 'Sí',
        'no': 'No',
      },
      fr: {
        'hello': 'Bonjour !',
        'good morning': 'Bonjour !',
        'thank you': 'Merci beaucoup !',
        'sounds good': 'Ça marche !',
        'congratulations': 'Félicitations !',
        'we shipped it!': 'Nous l\'avons expédié !',
        'yes': 'Oui',
        'no': 'Non',
      },
      de: {
        'hello': 'Hallo!',
        'good morning': 'Guten Morgen!',
        'thank you': 'Vielen Dank!',
        'sounds good': 'Klingt gut!',
        'congratulations': 'Herzlichen Glückwunsch!',
        'yes': 'Ja',
        'no': 'Nein',
      },
    };

    const targetKey = targetLanguage.toLowerCase().substring(0, 2);
    const lower = trimmed.toLowerCase();
    const dictionaryMatch = basicDict[targetKey]?.[lower];

    if (dictionaryMatch) {
      return {
        originalText: trimmed,
        translatedText: dictionaryMatch,
        targetLanguage,
      };
    }

    // Graceful presentation banner when offline/no API key
    return {
      originalText: trimmed,
      translatedText: `[${targetLanguage.toUpperCase()}] ${trimmed}`,
      targetLanguage,
    };
  }

  checkTone(text: string): ToneCheckResultDto {
    const trimmed = text.trim();
    if (!trimmed || trimmed.length < 5) {
      return { score: 10, label: 'gentle', warnings: [] };
    }

    const warnings: string[] = [];
    let score = 15; // Baseline neutral/gentle

    // 1. ALL CAPS Detection
    const alphaChars = trimmed.replace(/[^a-zA-Z]/g, '');
    if (alphaChars.length > 8) {
      const upperCount = (trimmed.match(/[A-Z]/g) || []).length;
      const upperRatio = upperCount / alphaChars.length;
      if (upperRatio > 0.6) {
        score += 45;
        warnings.push('Writing in ALL CAPS may come across as shouting.');
      }
    }

    // 2. Excessive Exclamation Marks
    if ((trimmed.match(/!{2,}/g) || []).length > 0) {
      score += 20;
      warnings.push('Multiple exclamation marks can sound aggressive.');
    }

    // 3. Passive-Aggressive Phrasing
    const harshPhrases = [
      { pattern: /\b(obviously|clearly|as i (already )?said)\b/i, advice: 'Phrases like "obviously" or "as I said" can sound dismissive.' },
      { pattern: /\b(why (can't|dont) you just)\b/i, advice: '"Why can\'t you just" may feel accusatory.' },
      { pattern: /\b(waste of time|useless|stupid|idiot|clueless)\b/i, advice: 'Harsh criticism detected; consider constructive framing.' },
      { pattern: /\b(whatever|don't care|not my problem)\b/i, advice: 'May read as uncooperative.' },
    ];

    for (const item of harshPhrases) {
      if (item.pattern.test(trimmed)) {
        score += 35;
        warnings.push(item.advice);
      }
    }

    score = Math.min(100, score);
    const label: 'gentle' | 'neutral' | 'harsh' =
      score >= 60 ? 'harsh' : score >= 35 ? 'neutral' : 'gentle';

    let suggestion: string | undefined;
    if (label === 'harsh') {
      suggestion = trimmed
        .replace(/!+/g, '.')
        .replace(/obviously,?\s*/gi, '')
        .replace(/as i already said,?\s*/gi, 'As mentioned earlier, ')
        .toLowerCase();
      // Capitalize first letter
      suggestion = suggestion.charAt(0).toUpperCase() + suggestion.slice(1);
    }

    return { score, label, warnings, suggestion };
  }
}

export const aiService = new AIService();
