import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { Item } from '../../Item';
import { UsersService } from '../../services/users.service';
import { Cart_item } from '../../cart_item';
import { AuthService } from '../../AuthService';

@Component({
  selector: 'app-cart-unit',
  templateUrl: './cart-unit.component.html',
  styleUrls: ['./cart-unit.component.css'],
})
export class CartUnitComponent implements OnInit {
  constructor(
    private usersService: UsersService,
    private authService: AuthService,
  ) {}

  @Input() item: Cart_item = {
    item: {
      imageFileId: '/assets/images/camera.jpg',
      item_name: '',
      price: 0,
      description: '',
      admin_name: '',
      salesHistory: [],
      hashtags: [],
      type: '',
      comments: [],
      promotion_level: 'regular',
    },
    num_of_appearances: 1,
    price: 0,
  };

  @Output() itemRemoved: EventEmitter<number> = new EventEmitter<number>();

  username: string = '';
  showPopup = false;

  ngOnInit(): void {
    //fetch the username and role
    this.authService.fetchMe().subscribe({
      next: (user) => {
        this.username = user.username;
      },
      error: (err) => {
        console.error('Error fetching current user:', err);
      },
    });
  }

  // remove the item from the cart and do the event
  remove_from_cart(cartItem: Cart_item): void {
    this.usersService
      .deleteItemFromCart(this.username!, cartItem.item._id!, 1)
      .subscribe({
        next: () => {
          //send the event to the parent component
          //and show secsses popup
          this.itemRemoved.emit(cartItem.item._id!);

          //shoe secsses popup
          this.showPopup = true;
          setTimeout(() => {
            this.showPopup = false;
          }, 1500);
        },
        error: (err) => {
          console.error('Error removing item from cart:', err);
        },
      });
  }
}
