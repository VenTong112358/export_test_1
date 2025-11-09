// FinishStudyApi.ts
// API utility for finish study endpoint

import { API_CONFIG, API_ENDPOINTS } from './ApiConfig';

/**
 * Call the finish study API for a given user.
 * @param userId User's ID
 * @returns Parsed response data from the API
 * @throws Error if the request fails
 */
export async function finishStudy(userId: number): Promise<any> {
  const url = API_CONFIG.BASE_URL + API_ENDPOINTS.FINISH_STUDY;
  console.log('[FinishStudyApi] Calling finish_study API for userId:', userId);
  console.log('[FinishStudyApi] Endpoint:', url);
  
  const httpClient = require('./HttpClient').HttpClient.getInstance();
  const accessToken = httpClient.getAccessToken?.() || '';
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
  });
  
  console.log('[FinishStudyApi] Response status:', response.status);
  
  if (response.status === 200) {
    const data = await response.json();
    console.log('[FinishStudyApi] Success response:', data);
    return data;
  } else if (response.status === 404) {
    throw new Error('Learning_setting does not exist');
  } else {
    const errorText = await response.text();
    console.error('[FinishStudyApi] Error response:', errorText);
    throw new Error(`Unexpected response: ${response.status}`);
  }
} 