import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';
import { AuthResponse, LoginCredentials, SignupCredentials } from '../interfaces/auth.interface';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.apiUrl;
  private currentUserSubject: BehaviorSubject<any>;
  public currentUser: Observable<any>;
  private router = inject(Router);
  private http = inject(HttpClient);

  constructor() {
    this.currentUserSubject = new BehaviorSubject<any>(
      JSON.parse(localStorage.getItem('currentUser') || 'null')
    );
    this.currentUser = this.currentUserSubject.asObservable();
    // Obter CSRF token ao inicializar
    this.getCsrfToken().subscribe();
  }

  // Método para obter CSRF token
  private getCsrfToken(): Observable<any> {
    return this.http.get(`${this.apiUrl}/csrf/`, { withCredentials: true });
  }

  login(credentials: LoginCredentials): Observable<AuthResponse> {
    const formData = new FormData();
    formData.append('username', credentials.username);
    formData.append('password', credentials.password);
    formData.append('csrfmiddlewaretoken', this.getStoredCsrfToken());

    const headers = new HttpHeaders({
      'X-CSRFToken': this.getStoredCsrfToken(),
      'X-Requested-With': 'XMLHttpRequest'
    });

    return this.http.post(`${this.apiUrl}/login/`, formData, {
      headers,
      withCredentials: true,
      responseType: 'text'
    }).pipe(
      map((response: string) => {
        console.log('Resposta do login:', response);
        
        try {
          const jsonResponse = JSON.parse(response) as AuthResponse;
          if (jsonResponse.success) {
            if (jsonResponse.user) {
              localStorage.setItem('currentUser', JSON.stringify(jsonResponse.user));
              this.currentUserSubject.next(jsonResponse.user);
            }
            this.router.navigate(['/home']);
            return jsonResponse;
          }
          throw new Error(jsonResponse.message || 'Erro ao fazer login');
        } catch (e) {
          if (response.includes('<!DOCTYPE html>')) {
            const successResponse: AuthResponse = {
              success: true,
              message: 'Login realizado com sucesso'
            };
            this.router.navigate(['/home']);
            return successResponse;
          }
          throw new Error('Erro ao fazer login');
        }
      }),
      catchError(error => {
        console.error('Erro de autenticação:', error);
        return throwError(() => new Error('Credenciais inválidas'));
      })
    );
  }

  private getStoredCsrfToken(): string {
    return document.cookie
      .split('; ')
      .find(row => row.startsWith('csrftoken='))
      ?.split('=')[1] || '';
  }

  logout(): void {
    // Limpar dados armazenados
    localStorage.removeItem('currentUser');
    localStorage.removeItem('token');
    this.currentUserSubject.next(null);

    // Fazer logout no backend
    this.http.post(`${this.apiUrl}/logout/`, {}, { withCredentials: true })
      .subscribe({
        next: () => this.router.navigate(['/welcome']),
        error: () => this.router.navigate(['/welcome'])
      });
  }

  signup(userData: SignupCredentials): Observable<AuthResponse> {
    const formData = new FormData();
    formData.append('username', userData.username);
    formData.append('email', userData.email);
    formData.append('password', userData.password);
    formData.append('confirmPassword', userData.confirmPassword);
    formData.append('csrfmiddlewaretoken', this.getStoredCsrfToken());

    return this.http.post<AuthResponse>(`${this.apiUrl}/cadastro/`, formData, {
      headers: new HttpHeaders({
        'X-Requested-With': 'XMLHttpRequest'
      }),
      withCredentials: true
    }).pipe(
      map(response => {
        if (response.success) {
          return response;
        }
        throw new Error(response.message);
      }),
      catchError(error => {
        console.error('Erro no cadastro:', error);
        return throwError(() => new Error(error.error?.message || 'Erro ao realizar cadastro'));
      })
    );
  }

  isAuthenticated(): boolean {
    return !!this.currentUserSubject.value;
  }
}