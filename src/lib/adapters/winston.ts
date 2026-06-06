import { ProviderAdapter, ScanResult } from './types';
import { generateMockScore, simulateNetworkDelay } from './mockUtils';

export const winstonAdapter: ProviderAdapter = {
  key: 'winston',
  name: 'Winston AI',

  async testConnection(apiKey: string): Promise<boolean> {
    const isMock = apiKey === 'MOCK_KEY';
    if (isMock) {
      await simulateNetworkDelay();
      return true;
    }

    try {
      const response = await fetch('https://api.gowinston.ai/v2/aidetect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({ text: 'This is a test document sentence.' }),
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
          score: 100 - mockScore, // Winston returns "human score" where 100 is fully human
        },
      };
    }

    const response = await fetch('https://api.gowinston.ai/v2/aidetect', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      throw new Error(`Winston AI API returned status ${response.status}: ${await response.text()}`);
    }

    const data = await response.json();
    
    // Winston AI returns a "human score" (0-100) where 100 is fully human
    // Normalized AI-risk score = 100 - humanScore
    const humanScore = data.score ?? 100;
    const score = 100 - humanScore;

    return {
      score: Math.max(0, Math.min(100, Math.round(score))),
      rawResponse: data,
    };
  },
};
