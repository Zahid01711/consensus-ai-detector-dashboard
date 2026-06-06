import mammoth from 'mammoth';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PDFParse } = require('pdf-parse');

/**
 * Extracts clean plain text from document buffers.
 * Supports PDF, DOCX, and TXT.
 */
export async function extractText(buffer: Buffer, fileType: string): Promise<string> {
  let rawText = '';

  let normalizedType = fileType.toLowerCase();
  if (normalizedType.includes('.')) {
    normalizedType = normalizedType.split('.').pop() || '';
  }
  normalizedType = normalizedType.replace(/^\./, '');

  switch (normalizedType) {
    case 'txt':
    case 'text/plain':
      rawText = buffer.toString('utf8');
      break;

    case 'docx':
    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      try {
        const result = await mammoth.extractRawText({ buffer });
        rawText = result.value;
      } catch (err: any) {
        console.error('DOCX text extraction failed:', err);
        throw new Error(`Failed to parse DOCX document: ${err.message}`);
      }
      break;

    case 'pdf':
    case 'application/pdf':
      try {
        const parser = new PDFParse({ data: buffer });
        const data = await parser.getText();
        await parser.destroy();
        rawText = data.text;
      } catch (err: any) {
        console.error('PDF text extraction failed:', err);
        throw new Error(`Failed to parse PDF document: ${err.message}`);
      }
      break;

    default:
      throw new Error(`Unsupported file type: ${fileType}. Only PDF, DOCX, and TXT are supported.`);
  }

  // Post-process text: normalize whitespaces and strip duplicate spacing
  const cleanedText = rawText
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\t/g, ' ')
    .replace(/ +/g, ' ')
    .replace(/\n +/g, '\n')
    .replace(/\n\n+/g, '\n\n')
    .trim();

  if (!cleanedText) {
    throw new Error('The document appears to be empty or contains no parseable text.');
  }

  return cleanedText;
}
