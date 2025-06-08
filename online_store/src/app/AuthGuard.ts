import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from './AuthService';
import { Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(): Observable<boolean> {
    return this.authService.fetchMe().pipe(
      map((user) => {
        if (user && user.username) {
          return true;
        } else {
          this.router.navigate(['']);
          return false;
        }
      }),
      catchError((error) => {
        console.error('AuthGuard Error:', error);
        this.router.navigate(['']);
        return [false];
      }),
    );
  }
}
