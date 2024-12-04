export interface User {
  id?: number;
  username: string;
  email: string;
  password?: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  user?: User;
  token?: string;
}