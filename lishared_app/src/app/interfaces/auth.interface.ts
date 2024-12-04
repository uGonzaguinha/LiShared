export interface User {
  id?: number; // Tornando id opcional
  username: string;
  email?: string; // Tornando email opcional
}

export interface AuthResponse {
  success: boolean;
  message: string;
  user?: User;
  redirect?: string;
  token?: string;
}

export interface SignupCredentials {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}