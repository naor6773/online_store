import { Component, OnInit } from '@angular/core';
import { UsersService } from './../../services/users.service';
import { Cart_item } from '../../cart_item';
import { AuthService } from '../../AuthService';
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
  selector: 'app-cart',
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.css'],
  animations: [
    trigger('popupAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-20px)' }),
        animate(
          '500ms ease-out',
          style({ opacity: 1, transform: 'translateY(0)' }),
        ),
      ]),
      transition(':leave', [
        style({ opacity: 1, transform: 'translateY(0)' }),
        animate(
          '500ms ease-in',
          style({ opacity: 0, transform: 'translateY(20px)' }),
        ),
      ]),
    ]),
  ],
})
export class CartComponent implements OnInit {
  constructor(
    private usersService: UsersService,
    private authService: AuthService,
  ) {}

  items: Cart_item[] = [];
  no_items: string = '';
  showPopup = false;
  username: string = '';
  totalSum: number = 0;
  role: string = 'user';

  ngOnInit(): void {
    //fetch the user name and role
    this.authService.fetchMe().subscribe({
      next: (user) => {
        this.username = user.username;
        this.role = user.role;

        if (this.role === 'admin') {
          this.no_items = "🚫 you can't have a cart as an admin!";
        } else {
          this.get_cart_items();
        }
      },
      error: (err) => {
        console.error('Error fetching current user:', err);
      },
    });
  }

  // fetch the cart items
  get_cart_items(): void {
    if (this.username) {
      this.usersService.getItemFromCart(this.username).subscribe({
        next: (items: Cart_item[]) => {
          //set the item and calculate the total price
          this.items = items;
          this.finalSum();

          //disply meesage to the user if no item found
          if (this.items.length === 0) {
            this.no_items = '🚫 no items found in your cart';
          } else {
            this.no_items = '';
          }
        },
        error: (err) => {
          console.error('Error fetching cart items:', err);
        },
      });
    }
  }

  // buy the items in the cart
  buy(): void {
    this.usersService.moveFromCartToPastBuy(this.username!).subscribe({
      next: () => {
        // disply no item found message
        // and show secsses pop up
        this.no_items = '🚫 no items found in your cart';
        this.showPopup = true;
        setTimeout(() => {
          this.showPopup = false;
        }, 1500);
      },
      error: (err) => {
        console.error('Error during purchase:', err);
      },
    });
  }

  // remove all items from cart
  removeFromCart(): void {
    this.usersService.deleteAllItemFromCart(this.username).subscribe({
      next: () => {
        // disply no item found message
        // and show secsses pop up
        this.no_items = '🚫 no items found in your cart';
        this.showPopup = true;
        setTimeout(() => {
          this.showPopup = false;
        }, 1500);
      },
      error: (err) => {
        console.error('Error removing items from cart:', err);
      },
    });
  }

  // calculate the total sum of cart items
  finalSum(): void {
    this.totalSum = 0;
    for (const cartItem of this.items) {
      this.totalSum += cartItem.price * cartItem.num_of_appearances;
    }
  }
}
