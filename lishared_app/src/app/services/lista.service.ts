import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { Lista } from '../interfaces/lista.interface';

@Injectable({
  providedIn: 'root'
})
export class ListaService {
  private apiUrl = 'http://localhost:8000'; // URL base do Django

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const csrfToken = this.getStoredCsrfToken();
    return new HttpHeaders({
      'Content-Type': 'application/x-www-form-urlencoded',
      'X-CSRFToken': csrfToken
    });
  }

  private getStoredCsrfToken(): string {
    return document.cookie
      .split('; ')
      .find(row => row.startsWith('csrftoken='))
      ?.split('=')[1] || '';
  }

  getListas(): Observable<Lista[]> {
    const headers = this.getHeaders();
    return this.http.get(`${this.apiUrl}/minhas_listas/`, { headers })
      .pipe(
        map((response: any) => response.listas || [])
      );
  }

  getListaById(id: number): Observable<Lista> {
    const headers = this.getHeaders();
    const body = `id=${id}`;
    return this.http.get(`${this.apiUrl}/get_shopping_list/${id}/`, { headers })
      .pipe(
        map((response: any) => response.lista)
      );
  }

  createLista(name: string): Observable<Lista> {
    const headers = this.getHeaders();
    const body = `name=${encodeURIComponent(name)}`;
    return this.http.post(`${this.apiUrl}/create_shopping_list/`, body, { headers })
      .pipe(
        map((response: any) => response.lista)
      );
  }

  getRecentActivities(): Observable<any[]> {
    const headers = this.getHeaders();
    return this.http.get(`${this.apiUrl}/get_recent_activities/`, { headers })
      .pipe(
        map((response: any) => response.activities || [])
      );
  }

  compartilharLista(id: number): Observable<any> {
    const headers = this.getHeaders();
    const body = `lista_id=${id}`;
    return this.http.post(`${this.apiUrl}/share_list/${id}/`, body, { headers })
      .pipe(
        map((response: any) => response)
      );
  }
}