import { ProviderAdapter, ScanResult } from './types';
import { generateMockScore, simulateNetworkDelay } from './mockUtils';

function createPlaceholderAdapter(key: string, name: string): ProviderAdapter {
  return {
    key,
    name,
    async testConnection(apiKey: string): Promise<boolean> {
      const isMock = apiKey === 'MOCK_KEY';
      if (isMock) {
        await simulateNetworkDelay();
        return true;
      }
      // Live mode always fails for placeholders, prompting manual integration
      throw new Error(`${name} requires manual integration setup. Please contact the provider for API access.`);
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
            message: `${name} is running in Mock Mode.`,
            score: mockScore,
          },
        };
      }
      throw new Error(`${name} API adapter is in placeholder mode. Contact admin to set up manual API integration.`);
    },
  };
}

export const writerAdapter = createPlaceholderAdapter('writer', 'Writer');
export const crossplagAdapter = createPlaceholderAdapter('crossplag', 'Crossplag');
export const zerogptAdapter = createPlaceholderAdapter('zerogpt', 'ZeroGPT');
