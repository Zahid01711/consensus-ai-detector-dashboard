import { ProviderAdapter, ScanResult } from './types';
import { generateMockScore, simulateNetworkDelay } from './mockUtils';

// Sapling free tier has per-request and per-minute limits. Cap at 1500 words.
const MAX_WORDS = 1500;

function truncateToWords(text: string, maxWords: number): string {
  const words = text.trim().split(/\s+/);
  if (words.length <= maxWords) return text;
  return words.slice(0, maxWords).join(' ');
}

async function callSaplingAPI(text: string, apiKey: string): Promise<Response> {
  return fetch('https://api.sapling.ai/api/v1/aidetect', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key: apiKey, text }),
  });
}

export const saplingAdapter: ProviderAdapter = {
  key: 'sapling',
  name: 'Sapling',

  async testConnection(apiKey: string): Promise<boolean> {
    const isMock = apiKey === 'MOCK_KEY';
    if (isMock) {
      await simulateNetworkDelay();
      return true;
    }

    try {
      const response = await fetch('https://api.sapling.ai/api/v1/aidetect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: apiKey, text: 'This is a test sentence for checking connection.' }),
      });
      return response.status === 200 || response.status === 400; // 400 means invalid input, key verified
    } catch (e) {
      return false;
    }
  },

  async scanText(text: string, apiKey: string): Promise<ScanResult> {
    const isMock = apiKey === 'MOCK_KEY';

    if (isMock) {
      await simulateNetworkDelay();
      const mockScore = generateMockScore(text);
      return {
        score: mockScore,
        rawResponse: {
          mock: true,
          score: mockScore / 100,
          sentences: [
            { text: text.substring(0, 50), score: mockScore / 100 }
          ],
        },
      };
    }

    // Truncate to MAX_WORDS to reduce token consumption on free tier
    const truncatedText = truncateToWords(text, MAX_WORDS);

    let response = await callSaplingAPI(truncatedText, apiKey);

    // Retry once after 3s on rate-limit (429)
    if (response.status === 429) {
      await new Promise((resolve) => setTimeout(resolve, 3000));
      response = await callSaplingAPI(truncatedText, apiKey);
    }

    if (!response.ok) {
      const body = await response.text();
      if (response.status === 429) {
        throw new Error(`Sapling API is rate-limited (free tier capacity reached). Please try again in a few minutes or upgrade your Sapling plan.`);
      }
      throw new Error(`Sapling API returned status ${response.status}: ${body}`);
    }

    const data = await response.json();
    
    // Sapling returns { score: 0.85 } representing AI probability
    const rawScore = data.score ?? 0;
    const score = Math.round(rawScore * 100);

    return {
      score: Math.max(0, Math.min(100, score)),
      rawResponse: data,
    };
  },
};
