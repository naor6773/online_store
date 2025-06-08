import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { Item } from '../../Item';
import { UsersService } from '../../services/users.service';
import { AuthService } from '../../AuthService';

@Component({
  selector: 'app-wish-list-unit',
  templateUrl: './wish-list-unit.component.html',
  styleUrls: ['./wish-list-unit.component.css'],
})
export class WishListUnitComponent implements OnInit {
  constructor(
    private usersService: UsersService,
    private authService: AuthService,
  ) {}

  @Input() item: Item = {
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
  };

  @Output() itemRemoved: EventEmitter<number> = new EventEmitter<number>();
  @Output() itemAddedToCart: EventEmitter<number> = new EventEmitter<number>();

  username: string = '';
  showPopup = false;

  ngOnInit(): void {
    // fetch the current user
    this.authService.fetchMe().subscribe({
      next: (user) => {
        this.username = user.username;
      },
      error: (err) => {
        console.error('Error fetching current user:', err);
      },
    });
  }

  // remove the item from the wish list and do the event
  remove_from_wish_list(item: Item): void {
    this.usersService
      .deleteItemFromWishList(this.username!, item._id!)
      .subscribe({
        next: () => {
          this.itemRemoved.emit(item._id!);
          this.showPopup = true;
          setTimeout(() => {
            this.showPopup = false;
          }, 1500);
        },
        error: (err) => {
          console.error('Error removing item from wish list:', err);
        },
      });
  }

  // add the item to the cart and do the event
  addThisToCart(item: Item): void {
    this.usersService
      .addItemToCart(this.username, item, 1, item.price)
      .subscribe({
        next: () => {
          this.itemAddedToCart.emit(item._id!);
          this.showPopup = true;
          setTimeout(() => {
            this.showPopup = false;
          }, 1500);
        },
        error: (err) => {
          console.error('Error adding item to cart:', err);
        },
      });
  }

  // check if the discount is active
  isDiscountActive(): boolean {
    if (!this.item.discount) return false;

    if (!this.item.discount?.startDate || !this.item.discount?.endDate)
      return false;

    const now = new Date();
    const start = new Date(this.item.discount.startDate);
    const end = new Date(this.item.discount.endDate);

    return now >= start && now <= end;
  }
}
