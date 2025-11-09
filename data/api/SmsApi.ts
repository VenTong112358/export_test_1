import { HttpClient } from './HttpClient';
import { API_ENDPOINTS } from './ApiConfig';

// 发送验证码请求接口
export interface SendCodeRequest {
  phone_number: string; // 修改：从 phone 改为 phone_number，与服务器保持一致
  purpose: 'register' | 'change_phone' | 'login' | 'change_password'; // 验证码用途 - 添加 change_password
}

// 发送验证码响应接口
export interface SendCodeResponse {
  success: boolean;
  message: string;
  code_id?: string; // 验证码ID，用于后续验证
}

// 短信注册请求接口
export interface SmsRegisterRequest {
  username: string; // 修改：移除可选标记，设为必需字段
  password: string;
  phone_number: string;
  code: string;
}

// Refactor ChangePhoneRequest: only phone_number and code are required for JWT
export interface ChangePhoneRequest {
  phone_number: string;
  code: string;
}

// 短信注册响应接口
export interface SmsRegisterResponse {
  success: boolean;
  message: string;
  user_id?: number;
  access_token?: string;
  refresh_token?: string;
}

// 删除重复的 ChangePhoneRequest 接口定义
// 修改手机号响应接口
export interface ChangePhoneResponse {
  success: boolean;
  message: string;
}

// 短信登录请求接口 - 新增
export interface SmsLoginRequest {
  phone_number: string;
  code: string;
}

// 短信登录响应接口 - 新增
export interface SmsLoginResponse {
  success: boolean;
  message: string;
  user_id?: number;
  access_token?: string;
  refresh_token?: string;
  user?: {
    id: number;
    username: string;
    phoneNumber: string;
    createdAt: string;
    lastLoginAt: string;
  };
}

/**
 * 短信验证API类
 * 使用HttpClient进行HTTP请求，自动处理JWT认证和token刷新
 */
export class SmsApi {
  private static instance: SmsApi;
  private httpClient: HttpClient;

  private constructor() {
    this.httpClient = HttpClient.getInstance();
  }

  public static getInstance(): SmsApi {
    if (!SmsApi.instance) {
      SmsApi.instance = new SmsApi();
    }
    return SmsApi.instance;
  }

  /**
   * 发送验证码
   * @param request 发送验证码请求
   * @returns 发送验证码响应
   */
  public async sendVerificationCode(request: SendCodeRequest): Promise<SendCodeResponse> {
    const maxRetries = 3;
    let lastError: any;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // 验证输入参数
        if (!request.phone_number || request.phone_number.trim() === '') {
          throw new Error('手机号不能为空');
        }
        
        const serverRequest = {
          phone: request.phone_number.trim(), // 正确映射到服务器期望的 phone 字段
          purpose: request.purpose
        };
        
        console.log(`[SmsApi] Request payload (attempt ${attempt}):`, JSON.stringify(serverRequest));
        
        // 添加额外的验证确保phone字段不为空
        if (!serverRequest.phone) {
          throw new Error('处理后的手机号为空');
        }
        
        const response = await this.httpClient.post<SendCodeResponse>(
          API_ENDPOINTS.AUTH.SEND_CODE,
          serverRequest
        );
        
        console.log('[SmsApi] Verification code sent successfully');
        return response;
      } catch (error: any) {
        lastError = error;
        console.error(`[SmsApi] Send verification code failed (attempt ${attempt}):`, error);
        
        // 对于某些错误，不需要重试
        if (error.message.includes('手机号') || error.message.includes('参数')) {
          throw error;
        }
        
        // 如果不是最后一次尝试，等待后重试
        if (attempt < maxRetries) {
          const delay = attempt * 1000; // 递增延迟：1秒、2秒、3秒
          console.log(`[SmsApi] Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
      }
    }
    
    // 所有重试都失败了，抛出最后的错误
    console.error('[SmsApi] All retry attempts failed');
    
    // 提供更详细的错误信息
    if (lastError.message === 'Request timeout') {
      throw new Error('发送验证码超时，请检查网络连接后重试');
    } else if (lastError.message.includes('signal is aborted')) {
      throw new Error('网络连接被中断，请检查网络状态后重试');
    } else if (lastError.message.includes('HTTP error')) {
      throw new Error(`服务器错误：${lastError.message}`);
    } else {
      throw new Error('发送验证码失败，请稍后重试');
    }
  }

  /**
   * 短信注册
   * @param request 短信注册请求
   * @returns 短信注册响应
   */
  public async smsRegister(request: SmsRegisterRequest): Promise<SmsRegisterResponse> {
    try {
      console.log('[SmsApi] SMS register for phone:', request.phone_number);
      
      // 确保所有必需字段都存在
      const registerData = {
        username: request.username,// 如果没有用户名，使用手机号后4位生成
        password: request.password,
        phone_number: request.phone_number,
        code: request.code
      };
      
      console.log('[SmsApi] Register data:', registerData);
      
      const response = await this.httpClient.post<any>(
        API_ENDPOINTS.AUTH.SMS_REGISTER,
        registerData
      );
      
      // 根据HTTP状态码判断成功与否，而不是依赖response.success字段
      const isSuccess = response && (response.status === 200 || response.status === 201 || !response.error);
      
      const result: SmsRegisterResponse = {
        success: isSuccess,
        message: response.message || (isSuccess ? '注册成功' : '注册失败'),
        user_id: response.user_id,
        access_token: response.access_token,
        refresh_token: response.refresh_token
      };
      
      // 如果注册成功且返回了token，保存到HttpClient
      if (result.success && result.access_token && result.refresh_token) {
        await this.httpClient.setTokens(result.access_token, result.refresh_token);
        console.log('[SmsApi] SMS register for phone:', request.phone_number);
        console.log('[SmsApi] SMS register successful, tokens saved');
      }
      
      return result;
    } catch (error: any) {
      console.error('[SmsApi] SMS register failed:', error);
      // 返回失败响应而不是抛出异常
      return {
        success: false,
        message: error.message || '注册失败'
      };
    }
  }

  /**
   * Change phone number (JWT version, no user_id required)
   */
  public async changePhoneNumber(request: ChangePhoneRequest): Promise<ChangePhoneResponse> {
    try {
      console.log('[SmsApi] Changing phone number for phone_number:', request.phone_number);
      const response = await this.httpClient.post<ChangePhoneResponse>(
        API_ENDPOINTS.AUTH.CHANGE_PHONE,
        request
      );
      console.log('[SmsApi] Phone number changed successfully');
      return response;
    } catch (error: any) {
      console.error('[SmsApi] Change phone number failed:', error);
      throw error;
    }
  }

  /**
   * 验证手机号格式
   * @param phoneNumber 手机号
   * @returns 是否为有效的手机号格式
   */
  public validatePhoneNumber(phoneNumber: string): boolean {
    // 简单的手机号验证正则表达式（支持中国大陆手机号）
    const phoneRegex = /^1[3-9]\d{9}$/;
    return phoneRegex.test(phoneNumber);
  }

  /**
   * 验证验证码格式
   * @param code 验证码
   * @returns 是否为有效的验证码格式
   */
  public validateVerificationCode(code: string): boolean {
    // 验证码通常为4-6位数字
    const codeRegex = /^\d{4,6}$/;
    return codeRegex.test(code);
  }

  /**
   * 短信登录
   * @param request 短信登录请求
   * @returns 短信登录响应
   */
  public async smsLogin(request: SmsLoginRequest): Promise<SmsLoginResponse> {
    try {
      console.log('[SmsApi] SMS login for phone:', request.phone_number);
      
      // 将短信登录请求转换为服务器期望的格式
      const loginData = {
        username: request.phone_number, // 使用手机号作为用户名
        password: request.code // 使用验证码作为密码
      };
      
      const response = await this.httpClient.post<any>(
        API_ENDPOINTS.AUTH.LOGIN, // 使用现有的LOGIN端点
        loginData
      );
      
      // 根据HTTP状态码判断成功与否
      const isSuccess = response && (response.status === 200 || response.status === 201 || !response.error);
      
      const result: SmsLoginResponse = {
        success: isSuccess,
        message: response.message || (isSuccess ? '登录成功' : '登录失败'),
        user_id: response.user_id,
        access_token: response.access_token,
        refresh_token: response.refresh_token,
        user: response.user
      };
      
      // 如果登录成功且返回了token，保存到HttpClient
      if (result.success && result.access_token && result.refresh_token) {
        await this.httpClient.setTokens(result.access_token, result.refresh_token);
        console.log('[SmsApi] SMS login for phone:', request.phone_number);
        console.log('[SmsApi] SMS login successful, tokens saved');
      }
      
      return result;
    } catch (error: any) {
      console.error('[SmsApi] SMS login failed:', error);
      // 返回失败响应而不是抛出异常
      return {
        success: false,
        message: error.message || '登录失败'
      };
    }
  }
}