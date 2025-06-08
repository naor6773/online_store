import { Component, OnDestroy } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { UsersService } from './services/users.service';
import { AuthService } from './AuthService';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnDestroy {
  title = 'omers-store-final';

  currentRoute: string = '';
  cart_length: number = 0;
  discount_count: number = 0;
  cart_show: boolean = true;
  username: string = '';
  role: string = '';

  // To manage subscriptions and prevent memory leaks
  private subscriptions = new Subscription();

  constructor(
    private router: Router,
    private usersService: UsersService,
    private authService: AuthService,
  ) {}

  ngOnInit() {
    const userSub = this.authService.fetchMe().subscribe({
      next: (user) => {
        this.username = user.username;
        this.role = user.role;

        if (this.role !== 'admin') {
          // Fetch initial wishlist and cart data
          this.usersService.getItemFromWishList(this.username).subscribe({
            error: (err) => console.error('Error fetching wishlist:', err),
          });

          this.usersService.getTotalItemsInCart(this.username).subscribe({
            error: (err) => console.error('Error fetching cart items:', err),
          });

          // Subscribe to cart and wishlist observables for real-time updates
          const cartLengthSub = this.usersService.cartLength$.subscribe({
            next: (length) => {
              this.cart_length = length;
            },
            error: (err) => console.error('Error updating cart length:', err),
          });

          const discountCountSub = this.usersService.discountCount$.subscribe({
            next: (count) => {
              this.discount_count = count;
            },
            error: (err) =>
              console.error('Error updating discount count:', err),
          });

          this.subscriptions.add(cartLengthSub);
          this.subscriptions.add(discountCountSub);
        }
      },
      error: (err) => {
        console.error('Error fetching current user:', err);
      },
    });

    this.subscriptions.add(userSub);

    // Subscribe to router events to update currentRoute and cart_show
    const routerSub = this.router.events
      .pipe(
        filter(
          (event): event is NavigationEnd => event instanceof NavigationEnd,
        ),
      )
      .subscribe((event: NavigationEnd) => {
        this.currentRoute = event.url;
        this.cart_show = this.currentRoute === '/' || this.role !== 'admin';
      });

    this.subscriptions.add(routerSub);
  }

  ngOnDestroy() {
    // Unsubscribe from all subscriptions to prevent memory leaks
    this.subscriptions.unsubscribe();
  }
}
