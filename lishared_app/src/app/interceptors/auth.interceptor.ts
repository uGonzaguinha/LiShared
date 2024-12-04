import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = localStorage.getItem('token');
    const csrfToken = this.getCsrfToken();
    
    if (token) {
      req = req.clone({
        setHeaders: {
          Authorization: `Token ${token}`
        }
      });
    }

    if (csrfToken) {
      req = req.clone({
        setHeaders: {
          'X-CSRFToken': csrfToken
        },
        withCredentials: true
      });
    }
    
    return next.handle(req);
  }

  private getCsrfToken(): string {
    return document.cookie
      .split('; ')
      .find(row => row.startsWith('csrftoken='))
      ?.split('=')[1] || '';
  }
}