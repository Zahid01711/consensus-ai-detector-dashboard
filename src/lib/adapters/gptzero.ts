import { ProviderAdapter, ScanResult } from './types';
import { generateMockScore, simulateNetworkDelay } from './mockUtils';

export const gptzeroAdapter: ProviderAdapter = {
  key: 'gptzero',
  name: 'GPTZero',

  async testConnection(apiKey: string, additionalConfig?: string): Promise<boolean> {
    if (apiKey === 'MOCK_KEY') {
      await simulateNetworkDelay();
      return true;
    }
    try {
      const response = await fetch('https://api.gptzero.me/v2/predict/text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
        },
        body: JSON.stringify({ document: 'This is a test document sentence.' }),
      });
      return response.status === 200 || response.status === 400; // 400 might mean invalid input, but means key is accepted
    } catch (e) {
      return false;
    }
  },

  async scanText(text: string, apiKey: string, additionalConfig?: string): Promise<ScanResult> {
    const isMock = apiKey === 'MOCK_KEY';
    
    if (isMock) {
      await simulateNetworkDelay();
      const mockScore = generateMockScore(text);
      return {
        score: mockScore,
        rawResponse: {
          mock: true,
          documents: [
            {
              completely_generated_prob: mockScore / 100,
              extracted_text: text.substring(0, 100),
              paragraphs: [{ score: mockScore / 100 }],
            },
          ],
        },
      };
    }

    const response = await fetch('https://api.gptzero.me/v2/predict/text', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: JSON.stringify({ document: text }),
    });

    if (!response.ok) {
      throw new Error(`GPTZero API returned status ${response.status}: ${await response.text()}`);
    }

    const data = await response.json();
    const documentData = data.documents?.[0];
    if (!documentData) {
      throw new Error('GPTZero API returned an unexpected response structure (missing documents).');
    }

    // Completely generated probability is 0 to 1
    const rawScore = documentData.completely_generated_prob ?? 0;
    const score = Math.round(rawScore * 100);

    return {
      score: Math.max(0, Math.min(100, score)),
      rawResponse: data,
    };
  },
};
