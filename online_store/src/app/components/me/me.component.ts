import { Cart_item } from './../../cart_item';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { UsersService } from '../../services/users.service';
import { AuthService } from '../../AuthService';

@Component({
  selector: 'app-me',
  templateUrl: './me.component.html',
  styleUrls: ['./me.component.css'],
})
export class MeComponent implements OnInit {
  user_name: string = '';
  recent_items: Cart_item[] = [];
  constructor(
    private router: Router,
    private usersService: UsersService,
    private authService: AuthService,
  ) {}
  is_admin: boolean = false;
  role: string = '';
  ngOnInit(): void {
    // Fetch the current user
    this.authService.fetchMe().subscribe({
      next: (user) => {
        this.user_name = user.username;
        this.role = user.role;
        console.log(this.user_name);
        console.log(this.role);

        //if the user is admin
        if (this.role == 'admin') {
          //show the stats(the bool here controil the stats aperrnce in the html)
          this.is_admin = true;
        } else {
          this.get_Item_From_Past_Buy();

          //show the recent buys(the bool here controil the stats aperrnce in the html)
          this.is_admin = false;
        }
      },
      error: (err) => {
        console.error('Error fetching current user:', err);
      },
    });
  }

  // get the recent boght items for the user
  get_Item_From_Past_Buy(): void {
    //call the service to get the recent boght items for the service
    this.usersService.getItemFromPastBuy(this.user_name).subscribe((items) => {
      this.recent_items = items;
    });
  }

  //log out the user
  logout(): void {
    sessionStorage.clear();

    //delete window history so the user could not get back after he log out
    window.history.replaceState(null, '', '/');

    //navigte to the log in page
    this.router.navigate(['']);
  }
}
