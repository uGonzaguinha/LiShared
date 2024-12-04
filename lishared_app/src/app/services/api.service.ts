import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  get headers() {
    return new HttpHeaders({
      'Content-Type': 'application/json'
    });
  }

  get<T>(endpoint: string) {
    return this.http.get<T>(`${this.apiUrl}${endpoint}`, { headers: this.headers });
  }

  post<T>(endpoint: string, data: any) {
    return this.http.post<T>(`${this.apiUrl}${endpoint}`, data, { headers: this.headers });
  }

  put<T>(endpoint: string, data: any) {
    return this.http.put<T>(`${this.apiUrl}${endpoint}`, data, { headers: this.headers });
  }

  delete<T>(endpoint: string) {
    return this.http.delete<T>(`${this.apiUrl}${endpoint}`, { headers: this.headers });
  }

  // Métodos para comunicação com o backend
  checkAuth() {
    return this.http.get(`${this.apiUrl}/check-auth/`);
  }
}