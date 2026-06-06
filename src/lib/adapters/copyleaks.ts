import { ProviderAdapter, ScanResult } from './types';
import { generateMockScore, simulateNetworkDelay } from './mockUtils';

// Copyleaks free API key only supports plagiarism scanning via async webhook.
// The AI Content Detector endpoint requires a paid enterprise subscription.
// We use their synchronous text submission + score approach where available,
// otherwise fallback to their free AI detection web API endpoint.

export const copyleaksAdapter: ProviderAdapter = {
  key: 'copyleaks',
  name: 'Copyleaks',

  async testConnection(apiKey: string, additionalConfig?: string): Promise<boolean> {
    const isMock = apiKey === 'MOCK_KEY';
    if (isMock) {
      await simulateNetworkDelay();
      return true;
    }

    try {
      // Extract email from additionalConfig (e.g. JSON string {"email": "..."})
      let email = '';
      if (additionalConfig) {
        try {
          const parsed = JSON.parse(additionalConfig);
          email = parsed.email || '';
        } catch (_) {
          email = additionalConfig; // fallback
        }
      }

      if (!email) return false;

      // Test login with correct endpoint
      const response = await fetch('https://id.copyleaks.com/v3/account/login/api', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, key: apiKey }),
      });
      
      return response.status === 200;
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
          scannedDocument: {
            totalWords: text.split(/\s+/).length,
          },
          summary: {
            ai: mockScore / 100,
            human: (100 - mockScore) / 100,
          },
        },
      };
    }

    let email = '';
    if (additionalConfig) {
      try {
        const parsed = JSON.parse(additionalConfig);
        email = parsed.email || '';
      } catch (_) {
        email = additionalConfig;
      }
    }

    if (!email) {
      throw new Error('Copyleaks email config is missing. Provide email in Additional Configuration.');
    }

    // Step 1: Authenticate
    const loginResponse = await fetch('https://id.copyleaks.com/v3/account/login/api', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, key: apiKey }),
    });

    if (!loginResponse.ok) {
      throw new Error(`Copyleaks login failed (${loginResponse.status}): ${await loginResponse.text()}`);
    }

    const loginData = await loginResponse.json();
    const token = loginData.access_token;
    if (!token) {
      throw new Error('Copyleaks access token was not returned in login response.');
    }

    // Step 2: Submit text for AI content detection
    // Using the correct v2 AI detection endpoint
    const scanResponse = await fetch('https://api.copyleaks.com/v2/writer-detector/scan-text', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        text,
        sandbox: false,
      }),
    });

    // If the standard endpoint fails, try the alternative
    if (!scanResponse.ok) {
      const errBody = await scanResponse.text();
      
      // Try the alternate endpoint used by their free web tool
      const altResponse = await fetch('https://api.copyleaks.com/v3/writer-detector/text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ text }),
      });

      if (!altResponse.ok) {
        const altErr = await altResponse.text();
        throw new Error(
          `Copyleaks AI detection is unavailable with the current plan. ` +
          `The free API key only supports plagiarism scanning. ` +
          `Please upgrade your Copyleaks plan or contact support. ` +
          `(Primary: ${scanResponse.status} - ${errBody.substring(0, 100)}, ` +
          `Alt: ${altResponse.status} - ${altErr.substring(0, 100)})`
        );
      }

      const altData = await altResponse.json();
      const aiFraction = altData?.summary?.ai ?? altData?.ai ?? 0;
      const score = Math.round(Number(aiFraction) * 100);

      return {
        score: Math.max(0, Math.min(100, score)),
        rawResponse: altData,
      };
    }

    const scanData = await scanResponse.json();
    
    // Copyleaks returns results with summary.ai (between 0 and 1)
    const aiFraction = scanData?.summary?.ai ?? scanData?.ai ?? 0;
    const score = Math.round(Number(aiFraction) * 100);

    return {
      score: Math.max(0, Math.min(100, score)),
      rawResponse: scanData,
    };
  },
};
