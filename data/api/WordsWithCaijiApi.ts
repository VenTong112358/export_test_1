import { API_ENDPOINTS } from './ApiConfig';
import { HttpClient } from './HttpClient';

/**
 * Word with learning factor interface
 */
export interface WordWithCaiji {
  word: string;
  learning_factor: number;
  phonetic?: string;
  definition?: string;
  // Add other fields as needed based on actual API response
  [key: string]: any;
}

/**
 * Words with Caiji API Response Interface
 * Response contains recent learned words and their learning factor
 */
export interface WordsWithCaijiResponse {
  words?: WordWithCaiji[];
  // Add other fields as needed based on actual API response
  [key: string]: any;
}

/**
 * Words with Caiji API class
 * GET /test/words_with_caiji
 * Fetch recent learned words and their learning factor
 * Should be called when user clicks "word" page to see learning progress
 */
export class WordsWithCaijiApi {
  private static instance: WordsWithCaijiApi;
  private httpClient: HttpClient;

  private constructor() {
    this.httpClient = HttpClient.getInstance();
  }

  public static getInstance(): WordsWithCaijiApi {
    if (!WordsWithCaijiApi.instance) {
      WordsWithCaijiApi.instance = new WordsWithCaijiApi();
    }
    return WordsWithCaijiApi.instance;
  }

  /**
   * GET method to fetch recent learned words and their learning factor
   * No request body required
   * @returns Words with Caiji response data
   */
  public async getWordsWithCaiji(): Promise<WordsWithCaijiResponse> {
    try {
      console.log('[WordsWithCaijiApi] Calling getWordsWithCaiji, endpoint:', API_ENDPOINTS.WORDS_WITH_CAIJI);
      const response = await this.httpClient.get<WordsWithCaijiResponse>(
        API_ENDPOINTS.WORDS_WITH_CAIJI
      );
      
      console.log('[WordsWithCaijiApi] Successfully fetched words with caiji, response:', JSON.stringify(response, null, 2));
      console.log('[WordsWithCaijiApi] Words count:', response?.words?.length || 0);
      if (response?.words && response.words.length > 0) {
        console.log('[WordsWithCaijiApi] First word sample (full):', JSON.stringify(response.words[0], null, 2));
        console.log('[WordsWithCaijiApi] First word keys:', Object.keys(response.words[0]));
        // Check for possible field names
        const firstWord = response.words[0] as any;
        console.log('[WordsWithCaijiApi] Possible learning_factor fields:', {
          learning_factor: firstWord.learning_factor,
          caiji: firstWord.caiji,
          learningFactor: firstWord.learningFactor,
          factor: firstWord.factor,
          caiji_factor: firstWord.caiji_factor,
          mastery: firstWord.mastery,
          mastery_factor: firstWord.mastery_factor,
        });
      }
      
      return response;
    } catch (error: any) {
      console.error('[WordsWithCaijiApi] Failed to get words with caiji:', error);
      throw error;
    }
  }
}
