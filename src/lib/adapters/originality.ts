import { ProviderAdapter, ScanResult } from './types';
import { generateMockScore, simulateNetworkDelay } from './mockUtils';

export const originalityAdapter: ProviderAdapter = {
  key: 'originality',
  name: 'Originality.ai',

  async testConnection(apiKey: string): Promise<boolean> {
    const isMock = apiKey === 'MOCK_KEY';
    if (isMock) {
      await simulateNetworkDelay();
      return true;
    }

    try {
      const response = await fetch('https://api.originality.ai/api/v1/scan/ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-OAI-API-KEY': apiKey,
        },
        body: JSON.stringify({ content: 'Test sentence.' }),
      });
      return response.status === 200 || response.status === 401; // 401 means credentials checked, 200 means success
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
          score: {
            ai: mockScore / 100,
            original: (100 - mockScore) / 100,
          },
        },
      };
    }

    const response = await fetch('https://api.originality.ai/api/v1/scan/ai', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-OAI-API-KEY': apiKey,
      },
      body: JSON.stringify({ content: text }),
    });

    if (!response.ok) {
      throw new Error(`Originality.ai API returned status ${response.status}: ${await response.text()}`);
    }

    const data = await response.json();
    
    // Originality returns { score: { ai: 0.85, original: 0.15 } }
    const aiFraction = data.score?.ai ?? 0;
    const score = Math.round(aiFraction * 100);

    return {
      score: Math.max(0, Math.min(100, score)),
      rawResponse: data,
    };
  },
};
