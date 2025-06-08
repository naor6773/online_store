import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, forkJoin, BehaviorSubject } from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators';
import { users } from '../users';
import { Hashtag } from '../hashtags';
import { Item } from '../Item';
import { Cart_item } from '../cart_item';
import * as bcrypt from 'bcryptjs';
import { admins } from './../admins';
import { ItemService } from '../services/item.service';
import axios from 'axios';

interface User {
  username: string;
  password: string;
}

@Injectable({
  providedIn: 'root',
})
export class UsersService {
  private apiurl = 'http://localhost:3000/users';
  private apiurl_admin = 'http://localhost:3000/admins';
  private apiurl_items = 'http://localhost:3000/items';

  private cartLengthSubject = new BehaviorSubject<number>(0);
  cartLength$ = this.cartLengthSubject.asObservable();

  private discountCountSubject = new BehaviorSubject<number>(0);
  discountCount$ = this.discountCountSubject.asObservable();

  private wishlistItemsSubject = new BehaviorSubject<Item[]>([]);
  wishlistItems$ = this.wishlistItemsSubject.asObservable();

  private cartItemsSubject = new BehaviorSubject<Cart_item[]>([]);
  cartItems$ = this.cartItemsSubject.asObservable();

  constructor(private http: HttpClient, private itemService: ItemService) {}

  isUsernameExist(username: string): Observable<boolean> {
    return forkJoin([
      this.http
        .get<User[]>(`${this.apiurl}?username=${username}`)
        .pipe(map((users) => users.length > 0)),
      this.http
        .get<admins[]>(`${this.apiurl_admin}?username=${username}`)
        .pipe(map((admins) => admins.length > 0)),
    ]).pipe(map(([isUserExist, isAdminExist]) => isUserExist || isAdminExist));
  }

  isUserCorrect(username: string, password: string): Observable<boolean> {
    return this.http
      .get<User[]>(`${this.apiurl}?username=${username}`)
      .pipe(
        map(
          (users) =>
            users.length > 0 &&
            this.comparePassword(password, users[0].password),
        ),
      );
  }

  addUser(newUser: { username: string; password: string }): Observable<User> {
    return this.http.post<User>(this.apiurl, newUser);
  }

  addItemToCart(
    username: string,
    item: Item,
    howMuchToAdd: number,
    price: number,
  ): Observable<users> {
    return this.http.get<users[]>(`${this.apiurl}?username=${username}`).pipe(
      switchMap((usersFound) => {
        if (usersFound.length > 0) {
          const user = usersFound[0];

          const existingCartItem = user.cart.find(
            (cartItem) => cartItem.item._id === item._id,
          );

          if (existingCartItem) {
            existingCartItem.num_of_appearances += howMuchToAdd;
          } else {
            user.cart.push({
              item: item._id,
              num_of_appearances: howMuchToAdd,
              price: price,
            });
          }

          if (item.hashtags) {
            this.updateRecentHashtags(user, item.hashtags, 20);
          }

          return this.http.put<users>(`${this.apiurl}/${user._id}`, user).pipe(
            tap((updatedUser) => {
              this.cartLengthSubject.next(
                this.calculateTotalItems(updatedUser.cart),
              );
            }),
          );
        } else {
          throw new Error('User not found');
        }
      }),
    );
  }

  addItemsToCartBulk(
    username: string,
    items: { itemId: string; price: number; quantity: number }[],
  ): Observable<users> {
    return this.http.get<users[]>(`${this.apiurl}?username=${username}`).pipe(
      switchMap((usersFound) => {
        if (usersFound.length === 0) {
          throw new Error('User not found');
        }
        const user = usersFound[0];

        const itemObservables = items.map(({ itemId }) =>
          this.itemService.getItemById(itemId),
        );

        return forkJoin(itemObservables).pipe(
          tap((fetchedItems) => {
            fetchedItems.forEach((item) => {
              if (item?.hashtags) {
                this.updateRecentHashtags(user, item.hashtags, 20);
              }
            });
          }),
          switchMap(() => {
            return this.http.post<users>(
              `${this.apiurl}/${user._id}/cart/bulkAdd`,
              { items },
            );
          }),
          tap((updatedUser) => {
            //  updated cart length
            this.cartLengthSubject.next(
              this.calculateTotalItems(updatedUser.cart),
            );
          }),
        );
      }),
    );
  }

  addTwoItemsToCart(
    username: string,
    item1: Item,
    howMuch1: number,
    price1: number,
    item2: Item,
    howMuch2: number,
    price2: number,
  ): Observable<users> {
    return this.http.get<users[]>(`${this.apiurl}?username=${username}`).pipe(
      switchMap((usersFound) => {
        if (usersFound.length === 0) {
          throw new Error('User not found');
        }

        const user = usersFound[0];

        const itemsToAdd = [
          { item: item1, quantity: howMuch1, price: price1 },
          { item: item2, quantity: howMuch2, price: price2 },
        ];

        itemsToAdd.forEach(({ item, quantity, price }) => {
          const existingCartItem = user.cart.find(
            (cartItem) => cartItem.item === item._id,
          );

          if (existingCartItem) {
            existingCartItem.num_of_appearances += quantity;
          } else {
            user.cart.push({
              item: item._id,
              num_of_appearances: quantity,
              price: price,
            });
          }

          if (item.hashtags) {
            this.updateRecentHashtags(user, item.hashtags, 20);
          }
        });

        return this.http.put<users>(`${this.apiurl}/${user._id}`, user).pipe(
          tap((updatedUser) => {
            //  updated cart length
            this.cartLengthSubject.next(
              this.calculateTotalItems(updatedUser.cart),
            );
          }),
        );
      }),
    );
  }

  deleteItemFromCart(
    username: string,
    itemId: number,
    howMuchToDelete: number,
  ): Observable<users> {
    return this.http.get<users[]>(`${this.apiurl}?username=${username}`).pipe(
      switchMap((usersFound) => {
        if (usersFound.length > 0) {
          const user = usersFound[0];
          const itemIndex = user.cart.findIndex(
            (cartItem) => cartItem.item._id === itemId,
          );

          if (itemIndex !== -1) {
            const cartItem = user.cart[itemIndex];

            if (cartItem.num_of_appearances > howMuchToDelete) {
              cartItem.num_of_appearances -= howMuchToDelete;
            } else {
              user.cart.splice(itemIndex, 1);
            }

            return this.http
              .put<users>(`${this.apiurl}/${user._id}`, user)
              .pipe(
                tap((updatedUser) => {
                  this.cartLengthSubject.next(
                    this.calculateTotalItems(updatedUser.cart),
                  );
                }),
              );
          } else {
            throw new Error('Item not found in cart');
          }
        } else {
          throw new Error('User not found');
        }
      }),
    );
  }

  deleteAllItemFromCart(username: string): Observable<users> {
    return this.http.get<users[]>(`${this.apiurl}?username=${username}`).pipe(
      switchMap((usersFound) => {
        if (usersFound.length > 0) {
          const user = usersFound[0];

          user.cart.length = 0;

          return this.http.put<users>(`${this.apiurl}/${user._id}`, user).pipe(
            tap((updatedUser) => {
              //  updated cart length (which should be 0)
              this.cartLengthSubject.next(
                this.calculateTotalItems(updatedUser.cart),
              );
            }),
          );
        } else {
          throw new Error('User not found');
        }
      }),
    );
  }

  getSpesifcItemFromCart(
    username: string,
    itemId: number,
  ): Observable<Cart_item> {
    return this.http.get<users[]>(`${this.apiurl}?username=${username}`).pipe(
      switchMap((usersFound) => {
        if (usersFound.length > 0) {
          const user = usersFound[0];
          const itemIndex = user.cart.findIndex(
            (cartItem) => cartItem.item._id === itemId,
          );

          if (itemIndex !== -1) {
            const cartItem = user.cart[itemIndex];
            return of(cartItem);
          } else {
            throw new Error('Item not found in cart');
          }
        } else {
          throw new Error('User not found');
        }
      }),
    );
  }

  getItemFromCart(username: string): Observable<Cart_item[]> {
    return this.http.get<users[]>(`${this.apiurl}?username=${username}`).pipe(
      switchMap((usersFound) => {
        if (usersFound.length > 0) {
          const user = usersFound[0];
          const cartItems = Array.from(user.cart.values());
          return of(cartItems);
        } else {
          throw new Error('User not found');
        }
      }),
    );
  }

  // remove the items from the cart when purtches, and move them to recent purches log
  moveFromCartToPastBuy(username: string): Observable<users> {
    return this.http.get<users[]>(`${this.apiurl}?username=${username}`).pipe(
      switchMap((usersFound) => {
        if (usersFound.length > 0) {
          const user = usersFound[0];

          user.cart.forEach((cartItem) => {
            const item = cartItem.item as Item;
            if (item?.hashtags) {
              this.updateRecentHashtags(user, item.hashtags, 20);
            }

            // Keep only the 5 most recent past purchases
            if (user.past_buy.length >= 5) {
              user.past_buy.shift();
            }
            user.past_buy.push(cartItem);

            // Track the sale for admin logs
            this.trackSale(cartItem.item, cartItem.num_of_appearances);
          });

          user.cart.length = 0;

          return this.http.put<users>(`${this.apiurl}/${user._id}`, user).pipe(
            tap((updatedUser) => {
              //  updated cart length (which should be 0)
              this.cartLengthSubject.next(
                this.calculateTotalItems(updatedUser.cart),
              );
            }),
          );
        } else {
          throw new Error('User not found');
        }
      }),
    );
  }

  // track the sales of the item in eatch item object
  private trackSale(item: Item, num_of_appearances: number): void {
    const today = new Date().toISOString().split('T')[0];

    // add purches date
    const existingRecord = item.salesHistory.find(
      (record) => record.date === today,
    );

    if (existingRecord) {
      // add num of purches
      existingRecord.quantity += num_of_appearances;
    } else {
      item.salesHistory.push({ date: today, quantity: num_of_appearances });
    }

    this.http.put(`${this.apiurl_items}/${item._id}`, item).subscribe();
  }

  // get sales for a spsifc item, for a time frame
  getSalesHistoryForSpesficItem(itemId: string): Observable<any> {
    return this.http.get<Item>(`${this.apiurl_items}/${itemId}`).pipe(
      map((item) => {
        const today = new Date();
        const fiveYearsAgo = new Date(
          today.getFullYear() - 5,
          today.getMonth(),
          today.getDate(),
        );

        // keep only the sales up to 5 years ago
        const filteredSales = item.salesHistory.filter((sale) => {
          const saleDate = new Date(sale.date);
          return saleDate >= fiveYearsAgo;
        });

        const salesByYear: { [year: number]: number } = {};
        const salesByMonth: { [month: string]: number } = {};

        // for each item push the sales for eatch month and year
        filteredSales.forEach((sale) => {
          const saleDate = new Date(sale.date);
          const year = saleDate.getFullYear();
          const month = saleDate.toISOString().split('T')[0].slice(0, 7);

          salesByYear[year] = (salesByYear[year] || 0) + sale.quantity;
          salesByMonth[month] = (salesByMonth[month] || 0) + sale.quantity;
        });

        return {
          salesByYear,
          salesByMonth,
        };
      }),
    );
  }

  // get sales for all items(for a spsifc admin), for a time frame
  getSalesHistory(adminName: string): Observable<any> {
    return this.http
      .get<Item[]>(`${this.apiurl_items}?admin_name=${adminName}`)
      .pipe(
        map((items) => {
          const today = new Date();
          const fiveYearsAgo = new Date(
            today.getFullYear() - 5,
            today.getMonth(),
            today.getDate(),
          );

          const salesHistoryByYear: { [year: number]: number } = {};
          const salesHistoryByMonth: { [month: string]: number } = {};

          items.forEach((item) => {
            // keep only the sales up to 5 years ago
            const filteredSales = item.salesHistory.filter((sale) => {
              const saleDate = new Date(sale.date);
              return saleDate >= fiveYearsAgo;
            });

            // for each item push the sales for eatch month and year
            filteredSales.forEach((sale) => {
              const saleDate = new Date(sale.date);
              const year = saleDate.getFullYear();
              const month = saleDate.toISOString().split('T')[0].slice(0, 7);

              salesHistoryByYear[year] =
                (salesHistoryByYear[year] || 0) + sale.quantity;
              salesHistoryByMonth[month] =
                (salesHistoryByMonth[month] || 0) + sale.quantity;
            });
          });

          return {
            salesHistoryByYear,
            salesHistoryByMonth,
          };
        }),
      );
  }

  // get sales for 4 items that was best and worst in that month(2 best 2 worst)
  getSalesHistoryForTopAndWorstItems(adminName: string): Observable<any> {
    return this.http
      .get<Item[]>(`${this.apiurl_items}?admin_name=${adminName}`)
      .pipe(
        map((items) => {
          const currentMonth = new Date().toISOString().slice(0, 7);

          // sort items by sales this month and return this month sales quantity
          const sortedItems = items
            .map((item) => {
              const currentMonthSales = item.salesHistory.filter(
                (sale) => sale.date.slice(0, 7) === currentMonth,
              );
              const totalQuantityForMonth = currentMonthSales.reduce(
                (sum, sale) => sum + sale.quantity,
                0,
              );
              return { ...item, totalQuantityForMonth, currentMonthSales };
            })
            .sort((a, b) => b.totalQuantityForMonth - a.totalQuantityForMonth);

          let finalItems;

          if (sortedItems.length < 4) {
            // keep all items as there are less then 4
            finalItems = [...sortedItems.slice(0, sortedItems.length)];
          } else {
            // Keep only the best two and the worst two items
            finalItems = [
              ...sortedItems.slice(0, 2), // Best two
              ...sortedItems.slice(-2), // Worst two
            ];
          }

          return {
            finalItems: finalItems.map((item) => ({
              name: item.item_name,
              totalQuantityForMonth: item.totalQuantityForMonth,
              currentMonthSales: item.currentMonthSales,
            })),
            itemCount: finalItems.length,
          };
        }),
      );
  }

  getItemFromPastBuy(username: string): Observable<Cart_item[]> {
    return this.http.get<users[]>(`${this.apiurl}?username=${username}`).pipe(
      switchMap((usersFound) => {
        if (usersFound.length > 0) {
          const user = usersFound[0];
          const pastBuyItems = Array.from(user.past_buy.values());
          return of(pastBuyItems);
        } else {
          throw new Error('User not found');
        }
      }),
    );
  }

  comparePassword(password: string, hash: string): boolean {
    return bcrypt.compareSync(password, hash);
  }

  getTotalItemsInCart(username: string): Observable<number> {
    return this.getItemFromCart(username).pipe(
      map((cartItems) => {
        const total = cartItems.reduce(
          (total, cartItem) => total + cartItem.num_of_appearances,
          0,
        );
        this.cartLengthSubject.next(total);
        return total;
      }),
    );
  }

  getUserRecentHashtags(username: string): Observable<Hashtag[]> {
    return this.http.get<users[]>(`${this.apiurl}?username=${username}`).pipe(
      map((fetchedUsers: users[]) => {
        // if the server returns a list of users, we take the first that matches
        if (fetchedUsers && fetchedUsers.length > 0) {
          return fetchedUsers[0].recent_hashtags || [];
        }
        // If no user found, return empty array
        return [];
      }),
    );
  }

  // add item to the wishlist
  addItemToWishList(username: string, item: Item): Observable<users> {
    return this.http.get<users[]>(`${this.apiurl}?username=${username}`).pipe(
      switchMap((usersFound) => {
        if (usersFound.length > 0) {
          const user = usersFound[0];

          const existingWishItem = user.wish_list.find(
            (wishItem) => wishItem._id === item._id,
          );
          if (!existingWishItem) {
            user.wish_list.push(item._id);
          }

          if (item.hashtags) {
            this.updateRecentHashtags(user, item.hashtags, 20);
          }

          return this.http.put<users>(`${this.apiurl}/${user._id}`, user).pipe(
            tap((updatedUser) => {
              this.discountCountSubject.next(
                this.calculateDiscounts(updatedUser.wish_list),
              );
            }),
          );
        } else {
          throw new Error('User not found');
        }
      }),
    );
  }

  private updateRecentHashtags(
    user: users,
    newTags: string[],
    maxHashtags = 20,
  ): void {
    if (!user.recent_hashtags) {
      user.recent_hashtags = [];
    }

    newTags.forEach((tag) => {
      if (!tag) {
        return;
      }

      // if the hashtag already exists remove it
      const existingIndex = user.recent_hashtags.findIndex(
        (h) => h.name === tag,
      );
      if (existingIndex !== -1) {
        user.recent_hashtags.splice(existingIndex, 1);
      }

      // if full, remove the oldest
      if (user.recent_hashtags.length >= maxHashtags) {
        user.recent_hashtags.shift();
      }

      // add the new hashtag to the end
      user.recent_hashtags.push({ name: tag, amount_of_purcheses: 1 });
    });
  }

  // remove a spesfic item from the wishlist
  deleteItemFromWishList(username: string, itemId: number): Observable<users> {
    return this.http.get<users[]>(`${this.apiurl}?username=${username}`).pipe(
      switchMap((usersFound) => {
        if (usersFound.length > 0) {
          const user = usersFound[0];
          const wishIndex = user.wish_list.findIndex(
            (item) => item._id === itemId,
          );

          if (wishIndex !== -1) {
            user.wish_list.splice(wishIndex, 1);
            return this.http
              .put<users>(`${this.apiurl}/${user._id}`, user)
              .pipe(
                tap((updatedUser) => {
                  this.discountCountSubject.next(
                    this.calculateDiscounts(updatedUser.wish_list),
                  );
                }),
              );
          } else {
            throw new Error('Item not found in wish list');
          }
        } else {
          throw new Error('User not found');
        }
      }),
    );
  }

  // Helper methods to calculate totals
  private calculateTotalItems(cart: Cart_item[]): number {
    return cart.reduce((total, item) => total + item.num_of_appearances, 0);
  }

  private calculateDiscounts(wishList: Item[]): number {
    return wishList.filter((item) => this.isDiscountActive(item)).length;
  }

  isDiscountActive(item: Item): boolean {
    if (!item.discount) return false;

    const now = new Date();
    const start = new Date(item.discount?.startDate ?? '');
    const end = new Date(item.discount?.endDate ?? '');

    return now >= start && now <= end;
  }

  //remove all items from the wishlist
  deleteAllItemsFromWishList(username: string): Observable<users> {
    return this.http.get<users[]>(`${this.apiurl}?username=${username}`).pipe(
      switchMap((usersFound) => {
        if (usersFound.length > 0) {
          const user = usersFound[0];
          user.wish_list.length = 0;

          return this.http.put<users>(`${this.apiurl}/${user._id}`, user).pipe(
            tap((updatedUser) => {
              // updated discount count (which should be 0)
              this.discountCountSubject.next(
                this.calculateDiscounts(updatedUser.wish_list),
              );
            }),
          );
        } else {
          throw new Error('User not found');
        }
      }),
    );
  }

  // get a spesfic item from the wishlist
  getSpecificItemFromWishList(
    username: string,
    itemId: number,
  ): Observable<Item> {
    return this.http.get<users[]>(`${this.apiurl}?username=${username}`).pipe(
      switchMap((usersFound) => {
        if (usersFound.length > 0) {
          const user = usersFound[0];
          const itemIndex = user.wish_list.findIndex(
            (item) => item._id === itemId,
          );

          if (itemIndex !== -1) {
            return of(user.wish_list[itemIndex]);
          } else {
            throw new Error('Item not found in wish list');
          }
        } else {
          throw new Error('User not found');
        }
      }),
    );
  }

  // get all items from the wishlist
  getItemFromWishList(username: string): Observable<Item[]> {
    return this.http.get<users[]>(`${this.apiurl}?username=${username}`).pipe(
      switchMap((usersFound) => {
        if (usersFound.length > 0) {
          const user = usersFound[0];
          const wishItems = Array.from(user.wish_list.values());
          const discountCount = this.calculateDiscounts(wishItems);
          this.discountCountSubject.next(discountCount);
          return of(wishItems);
        } else {
          throw new Error('User not found');
        }
      }),
    );
  }
}
