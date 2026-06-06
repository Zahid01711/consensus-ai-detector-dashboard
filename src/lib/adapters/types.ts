export interface ScanResult {
  score: number; // Normalized AI risk percentage (0 to 100)
  rawResponse: any; // Raw JSON response object from provider
}

export interface ProviderAdapter {
  key: string;
  name: string;
  
  /**
   * Tests the connection with the given API key.
   * Returns true if successful, false or throws otherwise.
   */
  testConnection(apiKey: string, additionalConfig?: string): Promise<boolean>;
  
  /**
   * Scans a string of text and returns a normalized score and raw JSON.
   */
  scanText(text: string, apiKey: string, additionalConfig?: string): Promise<ScanResult>;
}
