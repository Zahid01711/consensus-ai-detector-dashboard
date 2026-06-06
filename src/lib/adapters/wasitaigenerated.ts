import { ProviderAdapter, ScanResult } from './types';
import { generateMockScore, simulateNetworkDelay } from './mockUtils';

// Free tier charges 1 credit per word. Cap at 800 words to stay within typical free allowances.
const MAX_WORDS = 800;

function truncateToWords(text: string, maxWords: number): string {
  const words = text.trim().split(/\s+/);
  if (words.length <= maxWords) return text;
  return words.slice(0, maxWords).join(' ');
}

export const wasitaigeneratedAdapter: ProviderAdapter = {
  key: 'wasitaigenerated',
  name: 'WasItAIGenerated',

  async testConnection(apiKey: string): Promise<boolean> {
    if (apiKey === 'MOCK_KEY') {
      await simulateNetworkDelay();
      return true;
    }
    try {
      const r = await fetch('https://www.wasitaigenerated.com/api/v1/detect/text', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: 'Hello world. This is a test sentence for connection validation.' }),
      });
      return r.status === 200 || r.status === 201;
    } catch {
      return false;
    }
  },

  async scanText(text: string, apiKey: string): Promise<ScanResult> {
    if (apiKey === 'MOCK_KEY') {
      await simulateNetworkDelay();
      const mockScore = generateMockScore(text);
      return {
        score: mockScore,
        rawResponse: { mock: true, confidence: mockScore / 100 },
      };
    }

    // Truncate to MAX_WORDS to conserve free-tier credits (1 credit = 1 word)
    const truncatedText = truncateToWords(text, MAX_WORDS);

    const response = await fetch('https://www.wasitaigenerated.com/api/v1/detect/text', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content: truncatedText }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`WasItAIGenerated scan failed (${response.status}): ${err}`);
    }

    const data = await response.json();

    // API returns: { isAI: bool, confidence: 0-1, analysis: {...}, sentences: [...] }
    // confidence is the probability the text is AI-generated (0 = human, 1 = AI)
    const confidence = typeof data.confidence === 'number' ? data.confidence : 0;
    const score = Math.round(confidence * 100);

    return {
      score: Math.max(0, Math.min(100, score)),
      rawResponse: data,
    };
  },
};
