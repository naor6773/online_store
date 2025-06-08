import { AdminsService } from './../../services/admins.service';
import { Component, OnInit } from '@angular/core';
import { UsersService } from './../../services/users.service';
import { ReCaptchaV3Service } from 'ng-recaptcha';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../AuthService';

import { Router } from '@angular/router';
import * as bcrypt from 'bcryptjs';

@Component({
  selector: 'app-log-in',
  templateUrl: './log-in.component.html',
  styleUrls: ['./log-in.component.css'],
})
export class LogInComponent implements OnInit {
  constructor(
    private authService: AuthService,
    private usersService: UsersService,
    private router: Router,
    private adminsService: AdminsService,
    private recaptchaV3Service: ReCaptchaV3Service,
    private http: HttpClient,
  ) {}

  username: string = '';
  password: string = '';

  error: string = '';
  islogin: boolean = true;
  chnage_button: string = 'register';

  admin_button: string = 'admin';
  witch_state_admin: string = 'user entrance';

  witch_state: string = 'log in';

  aprovePassword: boolean = false;
  is_admin: boolean = false;

  captchaResponse: string | null = null;

  showPasswordHint: boolean = false;

  private captchaAction = 'submit';

  ngOnInit(): void {
    //no sesstion storge from one user get to anwter
    //i have other ways this is just to make sure
    sessionStorage.clear();
  }

  // chnage between login and regester
  login_or_regester(): void {
    this.islogin = !this.islogin;
    this.chnage_button = this.islogin ? 'register' : '  log in';
    this.witch_state = this.islogin ? 'log in' : 'register';
  }

  login() {
    this.authService.login(this.username, this.password).subscribe({
      next: () => {
        this.authService.fetchMe().subscribe((userData) => {
          this.authService.currentUser = userData;

          this.router.navigate(['/home']);
        });
      },
      error: (err) => {
        console.error('Login error', err);
        console.log('Login error', err);
        this.error = 'user name or password are incorrect';
      },
    });
  }

  async regester(isadmin: boolean): Promise<void> {
    //cheak if username alrady exsist in and andmin or user
    const isExist = await this.usersService
      .isUsernameExist(this.username)
      .toPromise();
    let aprovePassword = false;
    if (isExist) {
      this.error = 'A user with this username already exists';
    } else {
      //cheaks if the password is strong
      aprovePassword = this.is_password_strong(this.password);
    }

    if (aprovePassword) {
      //hush the password for protection
      const password = this.hashPassword(this.password);

      if (!isadmin) {
        //create new  user
        const newUser = {
          username: this.username,
          password: password,
          cart: [],
          past_buy: [],
        };
        this.usersService.addUser(newUser).subscribe({
          next: () => {
            this.login();
          },
          error: (error) => {
            console.error('Error adding admin:', error);
          },
          complete: () => {
            console.log('Admin creation process completed');
          },
        });
      } else {
        //create new admin
        const newUser = { username: this.username, password: password };

        this.adminsService.addAdmin(newUser).subscribe({
          next: () => {
            this.login();
          },
          error: (error) => {
            console.error('Error adding admin:', error);
          },
          complete: () => {
            console.log('Admin creation process completed');
          },
        });
      }
    }
  }

  userLoginOrRegester(): void {
    if (this.islogin) {
      this.login();
    } else {
      this.regester(false);
    }
  }

  //submit button func
  async submit(): Promise<void> {
    console.log('Starting reCAPTCHA verification...');

    //cheaks if human
    this.recaptchaV3Service
      .execute(this.captchaAction)
      .subscribe((token: string) => {
        console.log('reCAPTCHA token:', token);

        this.verifyRecaptcha(token).then((isHuman) => {
          if (isHuman) {
            console.log('reCAPTCHA verification passed!');
            //if user, go to normal login and user regetrtion
            if (!this.is_admin) {
              this.userLoginOrRegester();
            }
            //if admin, go to admin regetrtion
            else {
              this.regester(true);
            }
          } else {
            console.error('reCAPTCHA verification failed. Bot detected.');
            alert('reCAPTCHA verification failed. Please try again.');
          }
        });
      });
  }

  //cheak with the backend if the Recaptcha found the user as human
  private verifyRecaptcha(token: string): Promise<boolean> {
    return this.http
      .post<{ success?: boolean }>('http://localhost:3000/verify-captcha', {
        captchaResponse: token,
      })
      .toPromise()
      .then((response) => {
        return response?.success === true;
      })
      .catch((error) => {
        console.error('Error verifying reCAPTCHA:', error);
        return false;
      });
  }

  //hush the password
  hashPassword(password: string): string {
    //add salt to make it more dificlte
    const salt = bcrypt.genSaltSync(10);
    return bcrypt.hashSync(password, salt);
  }

  //chnage the apprence of the page, base on if the user is admin or not
  admin_or_user(): void {
    this.is_admin = !this.is_admin;
    this.admin_button = this.is_admin ? 'user' : 'admin';

    this.witch_state_admin = this.is_admin ? 'admin entrance' : 'user entrance';

    this.islogin = this.is_admin ? false : true;
    this.chnage_button = this.islogin ? 'register' : '  log in';
    this.witch_state = this.islogin ? 'log in' : 'register';
  }

  //cheak if passwoed strong enoth
  is_password_strong(password: string): boolean {
    if (password.length < 8) {
      this.error = 'paswword needs to be at least 8 characters';

      return false;
    }

    if (!/[A-Z]/.test(password)) {
      this.error = 'paswword needs to have at least 1 Uppercase letter';

      return false;
    }

    if (!/[a-z]/.test(password)) {
      this.error = 'paswword needs to have at least 1 Lowercase letter';

      return false;
    }

    if (!/\d/.test(password)) {
      this.error = 'paswword needs to have at least 1 number';

      return false;
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      this.error = 'paswword needs to have at least special characters';

      return false;
    }

    return true;
  }
}
