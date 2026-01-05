import { DailyLearningLogsResponse } from '@data/model/DailyLearningLog';
import { API_ENDPOINTS } from './ApiConfig';
import { HttpClient } from './HttpClient';

/**
 * Daily Learning Logs API
 * Uses HttpClient for HTTP requests with automatic JWT authentication and token refresh
 */
export class DailyLearningLogsApi {
  private static instance: DailyLearningLogsApi;
  private httpClient: HttpClient;

  private constructor() {
    this.httpClient = HttpClient.getInstance();
  }

  public static getInstance(): DailyLearningLogsApi {
    if (!DailyLearningLogsApi.instance) {
      DailyLearningLogsApi.instance = new DailyLearningLogsApi();
    }
    return DailyLearningLogsApi.instance;
  }

  /**
   * Fetch all daily learning logs for the user
   * The backend will determine the user from the access token
   */
  async fetchDailyLearningLogs(): Promise<DailyLearningLogsResponse> {
    const response = await this.httpClient.get<DailyLearningLogsResponse>(
      API_ENDPOINTS.DAILY_LEARNING_LOGS
    );
    return response;
  }
}