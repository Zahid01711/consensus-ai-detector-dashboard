import crypto from 'crypto';

/**
 * Generates a deterministic score between 0 and 100 based on text content.
 * This makes mock results consistent for the same document.
 */
export function generateMockScore(text: string): number {
  const hash = crypto.createHash('md5').update(text).digest('hex');
  const integer = parseInt(hash.substring(0, 8), 16);
  return integer % 101; // 0 to 100 inclusive
}

/**
 * Simulates a realistic network delay (500ms - 1500ms) for API calls.
 */
export async function simulateNetworkDelay(): Promise<void> {
  const delay = 500 + Math.random() * 1000;
  await new Promise((resolve) => setTimeout(resolve, delay));
}
