import AsyncStorage from '@react-native-async-storage/async-storage';

export class SafeJsonUtils {
  /**
   * 安全解析JSON字符串
   */
  static safeParse<T = any>(jsonString: string | null | undefined, defaultValue: T | null = null): T | null {
    if (!jsonString || typeof jsonString !== 'string') {
      return defaultValue;
    }

    try {
      // 清理可能的转义字符问题
      const cleanedString = jsonString
        .replace(/\\n/g, '\n')
        .replace(/\\r/g, '\r')
        .replace(/\\t/g, '\t')
        .replace(/\\\\/g, '\\');
      
      return JSON.parse(cleanedString);
    } catch (error) {
      // console.warn('JSON解析失败:', error, '原始字符串:', jsonString); // 屏蔽大段日志
      return defaultValue;
    }
  }

  /**
   * 安全序列化对象为JSON字符串
   */
  static safeStringify(obj: any, defaultValue: string = '{}'): string {
    try {
      return JSON.stringify(obj);
    } catch (error) {
      console.warn('JSON序列化失败:', error);
      return defaultValue;
    }
  }

  /**
   * 清理AsyncStorage中损坏的数据
   */
  static async cleanupAsyncStorage(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const corruptedKeys: string[] = [];

      for (const key of keys) {
        try {
          const value = await AsyncStorage.getItem(key);
          if (value) {
            JSON.parse(value);
          }
        } catch (error) {
          console.warn(`发现损坏的AsyncStorage数据: ${key}`);
          corruptedKeys.push(key);
        }
      }

      if (corruptedKeys.length > 0) {
        await AsyncStorage.multiRemove(corruptedKeys);
        console.log(`已清理 ${corruptedKeys.length} 个损坏的AsyncStorage条目`);
      }
    } catch (error) {
      console.error('清理AsyncStorage时出错:', error);
    }
  }

  /**
   * 安全获取AsyncStorage数据
   */
  static async safeGetItem<T = any>(key: string, defaultValue: T | null = null): Promise<T | null> {
    try {
      const value = await AsyncStorage.getItem(key);
      return this.safeParse<T>(value, defaultValue);
    } catch (error) {
      console.warn(`获取AsyncStorage数据失败 (${key}):`, error);
      return defaultValue;
    }
  }

  /**
   * 安全设置AsyncStorage数据
   */
  static async safeSetItem(key: string, value: any): Promise<boolean> {
    try {
      const jsonString = this.safeStringify(value);
      await AsyncStorage.setItem(key, jsonString);
      return true;
    } catch (error) {
      console.warn(`设置AsyncStorage数据失败 (${key}):`, error);
      return false;
    }
  }
}