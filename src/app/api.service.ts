import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private BASE_URL = 'http://127.0.0.1:5000'; // Flask backend URL

  constructor(private http: HttpClient) { }

  getGestures(): Observable<any> {
    return this.http.get(`${this.BASE_URL}/gestures`);
  }

  uploadVideo(formData: FormData): Observable<any> {
    return this.http.post(`${this.BASE_URL}/upload`, formData);
  }

  healthCheck(): Observable<any> {
    return this.http.get(`${this.BASE_URL}/health`);
  }
}
