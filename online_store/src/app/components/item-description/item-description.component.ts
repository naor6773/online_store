import { Item } from './../../Item';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { UsersService } from '../../services/users.service';
import { trigger, transition, style, animate } from '@angular/animations';
import { Cart_item } from 'src/app/cart_item';
import { ItemService } from '../../services/item.service';
import { AuthService } from '../../AuthService';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-item-description',
  templateUrl: './item-description.component.html',
  styleUrls: ['./item-description.component.css'],
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
export class ItemDescriptionComponent implements OnInit, OnDestroy {
  hoverRating: number = 0;

  similarItems: Item[] = [];

  isInWishList: boolean = false;

  starRating: number = 0;

  private countdownInterval: any;

  ratingDistribution: number[] = [0, 0, 0, 0, 0];

  filteredComments: {
    username: string;
    content: string;
    isAdmin: boolean;
    starRating?: number;
  }[] = [];

  item: Item = {
    imageFileId: '',
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

  bogoItem: Item = {
    imageFileId: '',
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

  showPromotionPopup = false;

  showDiscountPopup = false;

  discountTimeLeft: string = '';

  discountFormData = {
    type: '',
    newPrice: 0,
    startDate: '',
    endDate: '',
    bogoId: '',
  };

  num_of_purchases: number = 0;

  getBogoDeal: boolean = false;

  showPopup = false;
  show_user_fields = true;
  private timeoutId: any = null;

  selectedYear: number | null = null;
  selectedMonth: string | null = null;
  salesInfo: any = null;
  years: number[] = [];
  months: string[] = [
    '01',
    '02',
    '03',
    '04',
    '05',
    '06',
    '07',
    '08',
    '09',
    '10',
    '11',
    '12',
  ];
  username: string = '';
  role: string = '';

  quantity: number = 1;

  newComment: string = '';
  sourceMessage: string | null = null;

  constructor(
    private usersService: UsersService,
    private itemService: ItemService,
    private authService: AuthService,
    private route: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    //if coming back from bogo item select
    //set the previus form fields and the new bogo item id
    this.route.queryParams.subscribe((params) => {
      this.sourceMessage = params['id'] || null;

      const savedData = JSON.parse(
        sessionStorage.getItem('discountFormData') || '{}',
      );
      this.discountFormData = {
        ...this.discountFormData,
        ...savedData,
      };

      console.log(this.discountFormData);

      if (this.sourceMessage != null) {
        this.discountFormData.bogoId = this.sourceMessage;
        this.openDiscountPopup();
      }
    });

    // fetch the username and role
    this.authService.fetchMe().subscribe({
      next: (user) => {
        this.username = user.username;
        this.role = user.role;

        this.item = history.state.item;

        if (this.role !== 'admin') {
          // cheak if the item is in the user wishlist
          this.usersService
            .getItemFromWishList(this.username)
            .subscribe((wishItems) => {
              const found = wishItems.some((i) => i._id === this.item._id);
              this.isInWishList = found;
            });
        }

        if (this.role == 'admin') {
          //dont show the user buttons(buy and more)
          this.show_user_fields = false;

          const currentYear = new Date().getFullYear();

          //push the last 5 years for statstics later on
          for (let i = 0; i < 5; i++) {
            this.years.push(currentYear - i);
          }
        } else {
          // ceack how many times the user boght the prodact
          this.num_Of_Purchases();
        }

        console.log(this.show_user_fields);
        //show bogo if exsist
        if (this.item.discount?.bogoId) {
          this.itemService
            .getItemById(this.item.discount.bogoId)
            .subscribe((item) => {
              this.bogoItem = item;
            });
        } else {
          console.error('bogoId is undefined');
        }

        // update the comments field
        this.updateRatingDistribution();
        this.filteredComments = [...this.item.comments];

        //live discount countdown
        this.startDiscountCountdown();
      },
      error: (err) => {
        console.error('Error fetching current user:', err);
      },
    });
  }

  ngOnDestroy(): void {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
  }

  startDiscountCountdown(): void {
    // check if there is an active discount
    if (this.isDiscountActive(this.item)) {
      this.updateDiscountTimeLeft();

      // start interval to update the time left every second
      this.countdownInterval = setInterval(() => {
        this.updateDiscountTimeLeft();
      }, 1000);
    }
  }

  updateDiscountTimeLeft(): void {
    const now = new Date();
    const endDate = new Date(this.item.discount?.endDate ?? '');

    // clculate remaining time
    const ms = endDate.getTime() - now.getTime();

    if (ms <= 0) {
      // clear the interval and reset discount time when discount ends
      clearInterval(this.countdownInterval);
      this.discountTimeLeft = 'Discount ended';
    } else {
      this.discountTimeLeft = this.getTimeLeftString(endDate);
    }
  }

  updateRatingDistribution(): void {
    this.ratingDistribution = [0, 0, 0, 0, 0];
    this.item.comments.forEach((comment) => {
      if (
        comment.starRating &&
        comment.starRating >= 1 &&
        comment.starRating <= 5
      ) {
        this.ratingDistribution[comment.starRating - 1]++;
      }
    });
  }

  getAverageRating(): number {
    const ratings = this.item.comments
      .map((c) => c.starRating)
      .filter((r) => typeof r === 'number') as number[];
    if (ratings.length === 0) return 0;
    const sum = ratings.reduce((acc, val) => acc + val, 0);
    return sum / ratings.length;
  }

  toggleWishList(event: MouseEvent): void {
    event.stopPropagation();
    if (!this.isInWishList) {
      // if item is not yet in wish list, add it
      this.usersService
        .addItemToWishList(this.username, this.item)
        .subscribe(() => {
          this.isInWishList = true;
        });
    } else {
      // remove it
      this.usersService
        .deleteItemFromWishList(this.username, this.item._id!)
        .subscribe(() => {
          this.isInWishList = false;
        });
    }
  }

  //ceack how many times the user boght the prodact
  num_Of_Purchases(): void {
    // get the item from the cart
    this.usersService
      .getSpesifcItemFromCart(this.username!, this.item._id!)
      .subscribe({
        next: (cartItem: Cart_item) => {
          // Check how many times the item has been bought
          this.num_of_purchases = cartItem?.num_of_appearances || 0;
        },
        error: () => {
          this.num_of_purchases = 0;
        },
      });
  }

  //delete a spesifc item from the cart
  delete_items(num_to_delete: number): void {
    // delte the item from the user cart x num of times
    this.usersService
      .deleteItemFromCart(this.username!, this.item._id!, num_to_delete)
      .subscribe(() => {
        //update the user boght
        this.num_Of_Purchases();

        //show popup message for success
        this.showPopup = true;

        setTimeout(() => {
          this.showPopup = false;
        }, 500);
      });
  }

  //set the year the user selected and fetch the stats
  onYearSelected(year: number): void {
    this.selectedYear = year;
    this.selectedMonth = null;
    this.salesInfo = null;

    //fetch the stats
    this.fetchSalesData(year);
  }

  //set the month the user selected and fetch the stats
  onMonthSelected(month: string): void {
    this.selectedMonth = month;

    //fetch the stats
    if (this.selectedYear) {
      this.fetchSalesData(this.selectedYear);
    }
  }

  //fetch the stats for a time frame
  fetchSalesData(year: number): void {
    if (this.selectedMonth) {
      // fetch the stats for a timeframe
      this.usersService
        .getSalesHistoryForSpesficItem((this.item._id ?? 0).toString())
        .subscribe((salesHistory) => {
          console.log('Sales by Year:', salesHistory.salesByYear[year]);
          console.log(
            'Sales by Month:',
            salesHistory.salesByMonth[`${year}-${this.selectedMonth}`],
          );

          //set the sales
          this.salesInfo = salesHistory;
        });
    }
  }

  //add itme to cart
  add_to_shopping_cart(howMutchToAdd: number): void {
    let price = 0;

    //if user bought the bongo deal
    if (this.getBogoDeal) {
      //add the item to the cart x num of times
      this.usersService
        .addTwoItemsToCart(
          this.username!,
          this.item,
          howMutchToAdd,
          this.item.price,
          this.bogoItem,
          howMutchToAdd,
          this.item.discount?.newPrice ?? this.bogoItem.price,
        )
        .subscribe(() => {
          //update the amount the user boght
          this.num_Of_Purchases();

          //show popup message for success
          this.showPopup = true;

          setTimeout(() => {
            this.showPopup = false;
          }, 500);
        });
    }

    //set new price if there is discount
    else if (
      this.item.discount?.type == 'discount' &&
      this.isDiscountActive(this.item)
    ) {
      price = this.item.discount.newPrice ?? this.item.price;
    } else {
      price = this.item.price;
    }
    // add the item to the cart x num of times
    this.usersService
      .addItemToCart(this.username!, this.item, howMutchToAdd, price)
      .subscribe(() => {
        //update the amount the user boght
        this.num_Of_Purchases();

        //show popup message for success
        this.showPopup = true;

        setTimeout(() => {
          this.showPopup = false;
        }, 500);
      });

    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
  }

  //increes the num of times you buy the prodact with 1 click
  increaseQuantity() {
    this.quantity++;
  }

  //decress how many times you buy the prodact with 1 click
  decreaseQuantity() {
    if (this.quantity > 1) {
      this.quantity--;
    }
  }

  addComment(): void {
    if (this.newComment.trim() !== '') {
      const isAdmin = this.role === 'admin';

      //add new comments to the item
      this.item.comments.push({
        username: this.username,
        content: this.newComment,
        isAdmin: isAdmin,
        starRating: this.starRating > 0 ? this.starRating : undefined,
      });

      //update the item with the new comment
      this.itemService.updateItem(this.item).subscribe({
        next: (updatedItem: Item) => {
          //set the item
          this.item = updatedItem;
          this.updateRatingDistribution();
          this.showAllComments();
          this.newComment = '';
          this.starRating = 0;

          //show popup message for success
          this.showPopup = true;

          setTimeout(() => {
            this.showPopup = false;
          }, 500);
        },
        error: (err) => {
          console.error('Error updating item with new comment:', err);
        },
      });
    }
  }

  bongoSelectButton(event: Event): void {
    //make sure the router dosnet chnage the link
    // without all disired action    event.preventDefault();
    sessionStorage.setItem(
      'discountFormData',
      JSON.stringify(this.discountFormData),
    );
  }

  admin_prodacts(event: Event): void {
    //make sure the router dosnet chnage the link
    // without all disired action
    event.preventDefault();
  }

  openPromotionPopup(): void {
    this.showPromotionPopup = true;
  }

  setPromotion(level: string): void {
    this.item.promotion_level = level;
    this.itemService.updateItem(this.item).subscribe({
      next: (updatedItem: Item) => {
        this.item = updatedItem;
        this.showPromotionPopup = false;
        //show popup message for success
        this.showPopup = true;

        setTimeout(() => {
          this.showPopup = false;
        }, 500);
      },
      error: (err) => {
        console.error('Error updating promotion level:', err);
      },
    });
  }

  closePromotion(): void {
    this.showPromotionPopup = false;
  }
  cancelPromotion(): void {
    this.item.promotion_level = 'regular';
    this.itemService.updateItem(this.item).subscribe({
      next: (updatedItem: Item) => {
        this.item = updatedItem;
        this.showPromotionPopup = false;
        //show popup message for success
        this.showPopup = true;

        setTimeout(() => {
          this.showPopup = false;
        }, 500);
      },
      error: (err) => {
        console.error('Error canceling promotion:', err);
      },
    });
  }

  openDiscountPopup(): void {
    this.showDiscountPopup = true;
  }

  closeDiscountPopup(): void {
    sessionStorage.clear();
    this.showDiscountPopup = false;
  }

  setDiscount(): void {
    //if coming back from bogo selection
    // keep the old form filds
    this.item.discount = {
      type: this.discountFormData.type,
      newPrice: this.discountFormData.newPrice,
      startDate: this.discountFormData.startDate,
      endDate: this.discountFormData.endDate,
      bogoId: this.discountFormData.bogoId,
    };

    this.itemService.updateItem(this.item).subscribe({
      next: (updatedItem: Item) => {
        this.item = updatedItem;
        this.closeDiscountPopup();
        console.log('Discount updated successfully!');
        //show popup message for success
        this.showPopup = true;

        setTimeout(() => {
          this.showPopup = false;
        }, 500);
      },
      error: (err) => {
        console.error('Error updating discount:', err);
      },
    });
  }

  isDiscountActive(item: Item): boolean {
    if (!item.discount) return false;

    const now = new Date();
    const start = new Date(item.discount?.startDate ?? '');
    const end = new Date(item.discount?.endDate ?? '');

    return now >= start && now <= end;
  }

  private getTimeLeftString(endDate: Date): string {
    const now = new Date();
    let ms = endDate.getTime() - now.getTime();

    let seconds = Math.floor(ms / 1000);
    let minutes = Math.floor(seconds / 60);
    let hours = Math.floor(minutes / 60);
    let days = Math.floor(hours / 24);

    hours = hours % 24;
    minutes = minutes % 60;
    seconds = seconds % 60;

    let result = '';
    if (days > 0) result += days + 'd ';
    if (hours > 0) result += hours + 'h ';
    if (minutes > 0) result += minutes + 'm ';
    if (seconds > 0) result += seconds + 's ';

    return result.trim();
  }

  filterCommentsByStars(stars: number): void {
    this.filteredComments = this.item.comments.filter(
      (c) => c.starRating === stars,
    );
  }

  showAllComments(): void {
    this.filteredComments = [...this.item.comments];
  }

  sortCommentsBestToWorst(): void {
    this.item.comments.sort(
      (a, b) => (b.starRating ?? 0) - (a.starRating ?? 0),
    );
    this.showAllComments();
  }

  sortCommentsWorstToBest(): void {
    this.item.comments.sort(
      (a, b) => (a.starRating ?? 0) - (b.starRating ?? 0),
    );
    this.showAllComments();
  }

  // how many comments have a star rating
  getTotalRatings(): number {
    return this.ratingDistribution.reduce((sum, count) => sum + count, 0);
  }

  // get distreptioen for the rating presentage grath
  getDistributionPercentage(count: number): number {
    const total = this.getTotalRatings();
    if (total === 0) return 0;
    return (count / total) * 100;
  }
}
