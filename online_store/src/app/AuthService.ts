import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AuthService {
  currentUser: { username: string; role: string } | null = null;

  constructor(private http: HttpClient) {}

  login(username: string, password: string) {
    return this.http.post<{ message: string }>(
      'http://localhost:3000/login',
      { username, password },
      { withCredentials: true },
    );
  }

  fetchMe() {
    return this.http.get<{ username: string; role: string }>(
      'http://localhost:3000/me',
      {
        withCredentials: true,
      },
    );
  }
}
