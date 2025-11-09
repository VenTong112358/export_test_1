export interface User {
  id: string;
  username: string;
  phoneNumber: string;
  createdAt: string;
  lastLoginAt: string;
  password: string;
}

export interface UserCredentials {
  username: string;
  password: string;
}

export interface UserRegistrationData extends UserCredentials {
  phoneNumber: string;
  confirmPassword: string;
}

export interface AuthResponse {
  message: string;
  access_token?: string;  // 改为可选，因为后端可能不返回
  refresh_token?: string; // 改为可选
  user_id?: string;       // 改为可选
  user?: User;           // 保持可选
  token?: string;        // 保持可选
  // 添加后端实际返回的字段
  id?: string | number;  // 后端返回的用户ID
  username?: string;     // 后端返回的用户名
}