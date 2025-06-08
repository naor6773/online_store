import { Component, OnInit } from '@angular/core';
import { UsersService } from './../../services/users.service';
import { Item } from '../../Item';
import { AuthService } from '../../AuthService';

@Component({
  selector: 'app-wish-list',
  templateUrl: './wish-list.component.html',
  styleUrls: ['./wish-list.component.css'],
})
export class WishListComponent implements OnInit {
  constructor(
    private usersService: UsersService,
    private authService: AuthService,
  ) {}

  showDiscountsOnly: boolean = false;
  items: Item[] = [];
  no_items: string = '';
  showPopup = false;
  username: string = '';
  totalSum: number = 0;
  role: string = 'user';

  ngOnInit(): void {
    this.authService.fetchMe().subscribe({
      next: (user) => {
        this.username = user.username;
        this.role = user.role;

        if (this.role === 'admin') {
          this.no_items = "🚫 you can't have a wish list as an admin!";
        } else {
          this.get_wish_list_items();
        }
      },
      error: (err) => {
        console.error('Error fetching current user:', err);
      },
    });
  }

  // updated handler for itemRemoved event
  handleItemRemoved(itemId: number): void {
    this.items = this.items.filter((item) => item._id !== itemId);
    this.finalSum();
    this.showPopup = true;
    setTimeout(() => {
      this.showPopup = false;
    }, 1500);
  }

  // updated handler for itemAddedToCart event
  handleItemAddedToCart(itemId: number): void {
    this.items = this.items.filter((item) => item._id !== itemId);
    this.finalSum();
    this.showPopup = true;
    setTimeout(() => {
      this.showPopup = false;
    }, 1500);
  }

  // fetch the wishlist items
  get_wish_list_items(): void {
    if (!this.username) return;

    this.usersService.getItemFromWishList(this.username).subscribe({
      next: (allItems: Item[]) => {
        if (this.showDiscountsOnly) {
          this.items = allItems.filter((i) => this.isDiscountActive(i));
        } else {
          this.items = allItems;
        }

        this.finalSum();

        if (this.items.length === 0) {
          this.no_items = '🚫 no items found in your wish list';
        } else {
          this.no_items = '';
        }
      },
      error: (err) => {
        console.error('Error fetching wish list items:', err);
      },
    });
  }

  toggleDiscountView(): void {
    this.showDiscountsOnly = !this.showDiscountsOnly;
    this.get_wish_list_items();
  }

  // remove all items from the wishlist
  removeFromWishList(): void {
    this.usersService.deleteAllItemsFromWishList(this.username).subscribe({
      next: () => {
        this.get_wish_list_items();
        this.showPopup = true;
        setTimeout(() => {
          this.showPopup = false;
        }, 1500);
      },
      error: (err) => {
        console.error('Error removing items from wish list:', err);
      },
    });
  }

  // delete a specific item from the wishlist
  deleteSpecificItemFromWishList(itemId: number): void {
    this.usersService.deleteItemFromWishList(this.username, itemId).subscribe({
      next: () => {
        this.get_wish_list_items();
        this.showPopup = true;
        setTimeout(() => {
          this.showPopup = false;
        }, 1500);
      },
      error: (err) => {
        console.error('Error deleting specific item from wish list:', err);
      },
    });
  }

  // calculate the total sum of wishlist items
  finalSum(): void {
    this.totalSum = 0;
    for (const item of this.items) {
      this.totalSum += item.price;
    }
  }

  // add a specific item to the cart
  addToCart(item: Item): void {
    this.usersService
      .addItemToCart(this.username, item, 1, item.price)
      .subscribe({
        next: () => {
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

  // add all items to the cart
  addAllItemsToCart(): void {
    const bulkItems = this.items.map((it) => ({
      itemId: it._id,
      price: it.price,
      quantity: 1,
    }));

    this.usersService.addItemsToCartBulk(this.username, bulkItems).subscribe(
      (updatedUser) => {
        console.log('Cart updated:', updatedUser);
        this.showPopup = true;
        setTimeout(() => {
          this.showPopup = false;
        }, 1500);
      },
      (error) => {
        console.error('Error adding items to cart in bulk:', error);
      },
    );
  }

  private isDiscountActive(item: Item): boolean {
    if (!item.discount) return false;
    if (!item.discount.startDate || !item.discount.endDate) return false;

    const now = new Date();
    const start = new Date(item.discount.startDate);
    const end = new Date(item.discount.endDate);

    return now >= start && now <= end;
  }
}
