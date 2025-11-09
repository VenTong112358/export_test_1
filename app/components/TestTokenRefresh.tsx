import React from 'react';
import { HttpClient } from '../../data/api/HttpClient';

const TestTokenRefresh = () => {
  const handleRefresh = async () => {
    console.log('[测试] 开始手动刷新Token');
    try {
      const httpClient = HttpClient.getInstance();
      await httpClient.refreshAccessToken();
      console.log('[测试] Token刷新成功！');
      alert('Token刷新成功！');
    } catch (error) {
      console.error('[测试] Token刷新失败:', error);
      alert('Token刷新失败：' + error);
    }
  };

  return (
    <button 
      onClick={handleRefresh}
      style={{
        padding: '10px 20px',
        backgroundColor: '#007AFF',
        color: 'white',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer'
      }}
    >
      测试Token刷新
    </button>
  );
};

export default TestTokenRefresh;