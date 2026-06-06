import { ProviderAdapter, ScanResult } from './types';
import { generateMockScore, simulateNetworkDelay } from './mockUtils';

export const brandwellAdapter: ProviderAdapter = {
  key: 'brandwell',
  name: 'BrandWell',

  async testConnection(apiKey: string): Promise<boolean> {
    const isMock = apiKey === 'MOCK_KEY';
    if (isMock) {
      await simulateNetworkDelay();
      return true;
    }

    try {
      const response = await fetch('https://brandwell.ai/api/v1/aidetector', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': apiKey,
        },
        body: JSON.stringify({ text: 'This is a test paragraph.' }),
      });
      return response.status === 200 || response.status === 401; // 401 means auth is handled, 200 means success
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
          score: mockScore,
          isAI: mockScore > 50,
        },
      };
    }

    const response = await fetch('https://brandwell.ai/api/v1/aidetector', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': apiKey,
      },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      throw new Error(`BrandWell API returned status ${response.status}: ${await response.text()}`);
    }

    const data = await response.json();
    
    // BrandWell returns a score usually in data.score or data.aiPercent (0-100)
    const score = data.score ?? data.aiPercent ?? 0;

    return {
      score: Math.max(0, Math.min(100, Math.round(score))),
      rawResponse: data,
    };
  },
};
