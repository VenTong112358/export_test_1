import { HttpClient } from './HttpClient';
import { API_ENDPOINTS } from './ApiConfig';

/**
 * 获取用户保存的短语
 * @returns 保存的短语数据
 */
export async function getSavedPhrases() {
  const httpClient = HttpClient.getInstance();
  const response = await httpClient.get(
    API_ENDPOINTS.SAVED_PHRASES // 移除userId参数，使用test前缀端点
  );
  return response;
}