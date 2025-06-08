import { admins } from './../admins';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import * as bcrypt from 'bcryptjs';

@Injectable({
  providedIn: 'root',
})
export class AdminsService {
  private apiurl = 'http://localhost:3000/admins';

  constructor(private http: HttpClient) {}

  isAdminCorrect(username: string, password: string): Observable<boolean> {
    return this.http
      .get<admins[]>(`${this.apiurl}?username=${username}`)
      .pipe(
        map(
          (users) =>
            users.length > 0 &&
            this.comparePassword(password, users[0].password),
        ),
      );
  }

  addAdmin(newUser: {
    username: string;
    password: string;
  }): Observable<admins> {
    return this.http.post<admins>(this.apiurl, newUser);
  }

  comparePassword(password: string, hash: string): boolean {
    return bcrypt.compareSync(password, hash);
  }
}
