import { Component, OnInit, OnDestroy } from '@angular/core';
import { Item, SaleRecord } from '../../Item';
import { ItemService } from '../../services/item.service';
import { UsersService } from '../../services/users.service';
import { Hashtag } from '../../hashtags';
import Fuse from 'fuse.js';
import { AuthService } from '../../AuthService';
import { ActivatedRoute, Router, NavigationEnd } from '@angular/router';
import { Options } from '@angular-slider/ngx-slider';
import { DatamuseService } from '../../services/datamuse.service';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged, filter } from 'rxjs/operators';
import { PaginatedItems } from '../../paginated-items';
import { Observable } from 'rxjs';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

interface CategoryCache {
  items: Item[];
  filteredItems: Item[];
  currentPage: number;
  totalPages: number;
  allItemsLoaded: boolean;
}

@Component({
  selector: 'app-items',
  templateUrl: './items.component.html',
  styleUrls: ['./items.component.css'],
})
export class ItemsComponent implements OnInit, OnDestroy {
  private clickOutsideHandler!: (event: Event) => void;
  mostSellingByCategory: { [type: string]: Item | null } = {};
  private categoryCache: Map<string, CategoryCache> = new Map();
  suggestions: string[] = [];
  private suggestionsSubject: Subject<string> = new Subject<string>();
  private suggestionsSubscription: Subscription = new Subscription();
  items: Item[] = [];
  filteredItems: Item[] = [];
  textValue: string = '';
  show_add_button: boolean = true;
  userHashtags: Hashtag[] = [];
  should_refresh = true;
  itemTypes: string[] = [
    'Electronics',
    'Furniture',
    'Clothing',
    'Books',
    'Toys',
  ];
  selectedType: string = 'All';
  sortOption: string = 'Price Descending';
  username = '';
  role = '';
  sourceMessage: string | null = null;
  admin_name: string | null = null;
  isFromBogoSelection: boolean = false;
  isShowingAdminsItems: boolean = false;
  hasRealdedItems: boolean = false;
  receivedItem: Item = {
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
  filtersVisible: boolean = false;
  priceRange: { min: number; max: number } = { min: 0, max: 1000 };
  minPrice: number = 0;
  maxPrice: number = 1000;
  priceStep: number = 1;
  isEditMode: boolean = false;
  priceFilter: { lower: number; upper: number } = { lower: 0, upper: 1000 };

  sliderOptions: Options = {
    floor: 0,
    ceil: 1000,
    step: 1,
    noSwitching: true,
  };

  showCategoryBlocks: boolean = true;

  result: { [key: string]: string[] } | null = null;
  objectKeys = Object.keys;

  searchWord: string = 'computer';
  relatedWords: any[] = [];

  isFromBogoForReload: string = '';

  currentPage: number = 1;
  limit: number = 6;
  totalPages: number = 1;
  isLoading: boolean = false;
  allItemsLoaded: boolean = false;

  private routerSubscription: Subscription = new Subscription();
  private searchSubject: Subject<string> = new Subject<string>();
  private searchSubscription: Subscription = new Subscription();

  constructor(
    private itemService: ItemService,
    private usersService: UsersService,
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router,
    private datamuseService: DatamuseService,
    private sanitizer: DomSanitizer,
  ) {}

  ngOnInit(): void {
    this.itemService.getMostSellingItems().subscribe({
      next: (data) => {
        this.mostSellingByCategory = data;
        console.log('Most Selling Items:', this.mostSellingByCategory);
      },
      error: (err) => {
        console.error('Error fetching most selling items:', err);
      },
    });

    //cheak if the component is already beiing reloaded
    // (it needs to be only the first time we enter it in the session
    // to make the admin/user spsifc things visable)
    const hasReloaded = sessionStorage.getItem('itemsComponentReloaded');

    //cheak if this component is in its bogo selection state
    // or it admin items state
    // or its defult items list state
    this.route.queryParams.subscribe((params) => {
      this.sourceMessage = params['source'] || 'No source';
      if (this.sourceMessage == 'bogo-selection') {
        this.isFromBogoSelection = true;

        sessionStorage.setItem('BogoForReload', 'true');
      } else {
        this.isFromBogoSelection = false;
        this.isFromBogoForReload =
          sessionStorage.getItem('BogoForReload') ?? 'false';
      }
      this.admin_name = params['admin_name'] || 'No source';
      if (this.admin_name != 'No source') {
        this.isShowingAdminsItems = true;
      } else {
        this.isShowingAdminsItems = false;
      }
    });
    //for the bogo selection
    //we use it to return to the same item discription
    //after selecting the bogoitem
    this.receivedItem = history.state.item;

    //fetch username, role and recent hashtags
    this.authService.fetchMe().subscribe({
      next: (user) => {
        this.username = user.username;
        this.role = user.role;

        if (!hasReloaded) {
          sessionStorage.setItem('itemsComponentReloaded', 'true');
          window.location.reload();
        }

        this.usersService
          .getUserRecentHashtags(this.username!)
          .subscribe((hashtags) => {
            this.userHashtags = hashtags;
            this.sortByUserHashtags();
          });
      },
      error: (err) => {
        console.error('Error fetching current user:', err);
      },
    });

    //seartch debounce
    this.suggestionsSubscription = this.suggestionsSubject
      .pipe(
        debounceTime(300), // wait for 300ms
        distinctUntilChanged(), // ignore if next search term is same as previous
      )
      .subscribe((query) => {
        if (!query) {
          this.suggestions = [];
          return;
        }

        this.fetchSuggestions(query);
      });

    this.clickOutsideHandler = this.handleClickOutside.bind(this);
    document.addEventListener('click', this.clickOutsideHandler);
  }

  handleClickOutside(event: Event): void {
    const target = event.target as HTMLElement;
    const searchContainer = document.querySelector('.search-container');

    if (searchContainer && !searchContainer.contains(target)) {
      this.suggestions = [];
    }
  }

  onEnter(): void {
    this.performSearch(this.textValue);
    this.suggestions = [];
  }

  selectSuggestion(suggestion: string): void {
    this.textValue = suggestion;
    this.suggestions = [];
    this.performSearch(suggestion);
  }

  getSalesThisMonth(salesHistory: SaleRecord[]): number {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    return salesHistory.reduce((acc, sale) => {
      const saleDate = new Date(sale.date);
      if (
        saleDate.getMonth() === currentMonth &&
        saleDate.getFullYear() === currentYear
      ) {
        return acc + sale.quantity;
      }
      return acc;
    }, 0);
  }

  getMostSellingItemImage(type: string): string {
    const item = this.mostSellingByCategory[type];
    if (item && item.imageFileId) {
      return `http://localhost:3000/items/image/${item.imageFileId}`;
    } else {
      return 'assets/images/x.jpg';
    }
  }

  didModify(): void {
    const trimmed = this.textValue.trim();
    this.searchSubject.next(trimmed);
    this.suggestionsSubject.next(trimmed);
  }

  fetchSuggestions(query: string): void {
    // if empty, clear suggestions and return
    if (!query) {
      this.suggestions = [];
      return;
    }

    this.itemService.getAutocompleteSuggestions(query).subscribe({
      next: (suggestions) => {
        // only update if the user’s textValue hasn’t changed
        if (this.textValue.trim() === query.trim()) {
          this.suggestions = suggestions;
        }
      },
      error: (err) => {
        console.error('Error fetching suggestions:', err);
        this.suggestions = [];
      },
    });
  }
  // load items for regular users with pagination
  loadItems(type: string, seartch?: string): void {
    if (this.isLoading || this.allItemsLoaded) return;

    this.isLoading = true;
    this.itemService
      .getItems(this.currentPage, this.limit, type, seartch)
      .subscribe({
        next: (data: PaginatedItems) => {
          this.items = [...this.items, ...data.items];
          this.filteredItems = [...this.filteredItems, ...data.items];

          this.totalPages = data.totalPages;
          this.currentPage++;
          this.isLoading = false;

          console.log('filteredItems', this.filteredItems);
          console.log('type', type);

          // update price range based on newly loaded items
          const prices = this.items.map((item) => item.price);

          if (prices.length > 0) {
            this.priceRange.min = Math.min(...prices);
            this.priceRange.max = Math.max(...prices);
          } else {
            this.priceRange.min = 0;
            this.priceRange.max = 1000;
          }

          this.minPrice = Number.isFinite(this.priceRange.min)
            ? this.priceRange.min
            : 0;
          this.maxPrice = Number.isFinite(this.priceRange.max)
            ? this.priceRange.max
            : 1000;

          this.sliderOptions = {
            ...this.sliderOptions,
            floor: this.priceRange.min,
            ceil: this.priceRange.max,
          };

          this.filterByType();

          if (this.currentPage > this.totalPages) {
            this.allItemsLoaded = true;
          }
        },
        error: (err) => {
          console.error('Error loading items:', err);
          this.isLoading = false;
        },
      });
  }

  // toggle edit mode
  toggleEditMode() {
    this.isEditMode = !this.isEditMode;
  }

  //handle item deletion
  onItemDeleted(itemId: string) {
    this.items = this.items.filter((item) => item._id !== itemId);
    this.filteredItems = this.filteredItems.filter(
      (item) => item._id !== itemId,
    );

    // update the cache for the current category
    if (this.categoryCache.has(this.selectedType)) {
      const cachedData = this.categoryCache.get(this.selectedType)!;
      cachedData.items = cachedData.items.filter((item) => item._id !== itemId);
      cachedData.filteredItems = cachedData.filteredItems.filter(
        (item) => item._id !== itemId,
      );
      this.categoryCache.set(this.selectedType, cachedData);
    }
  }

  // load admin items with pagination
  loadAdminItems(adminName: string, type: string, seartch?: string): void {
    if (this.isLoading || this.allItemsLoaded) return;

    this.isLoading = true;
    this.itemService
      .getAdminItems(adminName, this.currentPage, this.limit, type, seartch)
      .subscribe({
        next: (data: PaginatedItems) => {
          this.items = [...this.items, ...data.items];
          this.filteredItems = [...this.filteredItems, ...data.items];

          this.totalPages = data.totalPages;
          this.currentPage++;
          this.isLoading = false;

          console.log('filteredItems', this.filteredItems);
          console.log('type', type);

          // update price range based on newly loaded items
          const prices = this.items.map((item) => item.price);

          if (prices.length > 0) {
            this.priceRange.min = Math.min(...prices);
            this.priceRange.max = Math.max(...prices);
          } else {
            this.priceRange.min = 0;
            this.priceRange.max = 1000;
          }

          this.minPrice = Number.isFinite(this.priceRange.min)
            ? this.priceRange.min
            : 0;
          this.maxPrice = Number.isFinite(this.priceRange.max)
            ? this.priceRange.max
            : 1000;

          this.sliderOptions = {
            ...this.sliderOptions,
            floor: this.priceRange.min,
            ceil: this.priceRange.max,
          };

          this.filterByType();

          if (this.currentPage > this.totalPages) {
            this.allItemsLoaded = true;
          }
        },
        error: (err) => {
          console.error('Error loading admin items:', err);
          this.isLoading = false;
        },
      });
  }

  //handler for infinite scroll
  onScroll(): void {
    if (this.isShowingAdminsItems) {
      this.loadAdminItems(this.admin_name!, this.selectedType);
    } else if (this.role === 'admin') {
      this.loadAdminItems(this.username!, this.selectedType);
    } else {
      this.loadItems(this.selectedType);
    }
  }

  async onCategoryClick(type: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        if (this.selectedType !== type) {
          if (this.selectedType) {
            this.categoryCache.set(this.selectedType, {
              items: this.items,
              filteredItems: this.filteredItems,
              currentPage: this.currentPage,
              totalPages: this.totalPages,
              allItemsLoaded: this.allItemsLoaded,
            });
          }
          this.selectedType = type;

          // check if the selected category is already cached
          if (this.categoryCache.has(type)) {
            const cachedData = this.categoryCache.get(type)!;
            this.items = [...cachedData.items];
            this.filteredItems = [...cachedData.filteredItems];
            this.currentPage = cachedData.currentPage;
            this.totalPages = cachedData.totalPages;
            this.allItemsLoaded = cachedData.allItemsLoaded;

            // update price range based on cached items
            const prices = this.items.map((item) => item.price);

            if (prices.length > 0) {
              this.priceRange.min = Math.min(...prices);
              this.priceRange.max = Math.max(...prices);
            } else {
              this.priceRange.min = 0;
              this.priceRange.max = 1000;
            }

            this.minPrice = Number.isFinite(this.priceRange.min)
              ? this.priceRange.min
              : 0;
            this.maxPrice = Number.isFinite(this.priceRange.max)
              ? this.priceRange.max
              : 1000;

            this.sliderOptions = {
              ...this.sliderOptions,
              floor: this.priceRange.min,
              ceil: this.priceRange.max,
            };
          } else {
            // if not cached, reset and fetch new data
            this.items = [];
            this.filteredItems = [];
            this.currentPage = 1;
            this.totalPages = 1;
            this.allItemsLoaded = false;

            if (!this.isShowingAdminsItems) {
              if (this.role === 'user') {
                this.loadItems(this.selectedType);
              } else {
                this.show_add_button = true;
                this.loadAdminItems(this.username!, this.selectedType);
              }
            } else {
              this.loadAdminItems(this.admin_name!, this.selectedType);
            }
          }
        }

        this.showCategoryBlocks = false;
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }

  toggleFilters() {
    this.filtersVisible = !this.filtersVisible;
  }

  showAllCategories(): void {
    this.showCategoryBlocks = true;
  }

  performSearch(searchTerm: string): void {
    this.showCategoryBlocks = false;

    // reset items and pagination
    this.items = [];
    this.filteredItems = [];
    this.currentPage = 1;
    this.totalPages = 1;
    this.allItemsLoaded = false;

    if (!searchTerm) {
      this.showCategoryBlocks = true;

      // if search is empty, load items normally
      this.loadItemsBasedOnRole();
      return;
    }

    // fetch items from the backend with the search term
    this.fetchItems(searchTerm);

    // clear suggestions after performing the search
    this.suggestions = [];
  }
  private fetchItems(searchTerm: string): void {
    const type = this.selectedType !== 'All' ? this.selectedType : undefined;

    let fetchObservable: Observable<PaginatedItems>;

    if (this.isShowingAdminsItems) {
      fetchObservable = this.itemService.getAdminItems(
        this.admin_name!,
        this.currentPage,
        this.limit,
        type,
        searchTerm,
      );
    } else if (this.role === 'admin') {
      fetchObservable = this.itemService.getAdminItems(
        this.username!,
        this.currentPage,
        this.limit,
        type,
        searchTerm,
      );
    } else {
      fetchObservable = this.itemService.getItems(
        this.currentPage,
        this.limit,
        type,
        searchTerm,
      );
    }

    fetchObservable.subscribe({
      next: (data: PaginatedItems) => {
        this.items = [...this.items, ...data.items];
        this.filteredItems = [...this.filteredItems, ...data.items];

        this.totalPages = data.totalPages;
        this.currentPage++;
        this.isLoading = false;

        // update price range based on newly loaded items
        this.updatePriceRange();

        this.filterByType();

        if (this.currentPage > this.totalPages) {
          this.allItemsLoaded = true;
        }
      },
      error: () => {
        console.error('Error fetching items');
        this.isLoading = false;
      },
    });
  }

  private loadItemsBasedOnRole(): void {
    if (this.isShowingAdminsItems) {
      this.loadAdminItems(this.admin_name!, this.selectedType);
    } else if (this.role === 'admin') {
      this.loadAdminItems(this.username!, this.selectedType);
    } else {
      this.loadItems(this.selectedType);
    }
  }

  private updatePriceRange(): void {
    const prices = this.items.map((item) => item.price);

    if (prices.length > 0) {
      this.priceRange.min = Math.min(...prices);
      this.priceRange.max = Math.max(...prices);
    } else {
      this.priceRange.min = 0;
      this.priceRange.max = 1000;
    }

    this.minPrice = Number.isFinite(this.priceRange.min)
      ? this.priceRange.min
      : 0;
    this.maxPrice = Number.isFinite(this.priceRange.max)
      ? this.priceRange.max
      : 1000;

    this.sliderOptions = {
      ...this.sliderOptions,
      floor: this.priceRange.min,
      ceil: this.priceRange.max,
    };
  }

  ngOnDestroy(): void {
    if (this.searchSubscription) {
      this.searchSubscription.unsubscribe();
    }
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
    if (this.suggestionsSubscription) {
      this.suggestionsSubscription.unsubscribe();
    }

    document.removeEventListener('click', this.clickOutsideHandler);
  }
  //sort items by thire hashtag reevnce to the user, and thire promotien level!
  sortByUserHashtags() {
    this.filteredItems.sort((a, b) => {
      let aRecencyScore = this.getHashtagScore(a.hashtags);
      if (aRecencyScore > 0) {
        aRecencyScore += this.getPromotionLevelScore(a.promotion_level);
      }
      let bRecencyScore = this.getHashtagScore(b.hashtags);
      if (bRecencyScore > 0) {
        bRecencyScore += this.getPromotionLevelScore(b.promotion_level);
      }
      return bRecencyScore - aRecencyScore; // sort by higher score
    });
  }

  // calculate the recency score based on the user recent hashtags
  getHashtagScore(itemHashtags: string[]): number {
    let score = 0;
    itemHashtags.forEach((tag) => {
      const recentHashtagIndex = this.userHashtags.findIndex(
        (uh) => uh.name === tag,
      );
      if (recentHashtagIndex !== -1) {
        // assign higher scores to newer hashtags
        score += this.userHashtags.length - recentHashtagIndex;
      }
    });
    return score;
  }

  //promoten score level
  getPromotionLevelScore(level: string): number {
    switch (level) {
      case 'super':
        return 20;
      case 'excellent':
        return 15;
      case 'good':
        return 5;
      default:
        return 0;
    }
  }

  //filter items by eiuter types, or price!
  async filterByType(): Promise<void> {
    await this.onCategoryClick(this.selectedType);
    let filtered = this.items;
    filtered = filtered.filter(
      (item) => item.price >= this.minPrice && item.price <= this.maxPrice,
    );

    if (this.sortOption === 'Price Ascending') {
      this.filteredItems = filtered.sort((a, b) => a.price - b.price);
    } else if (this.sortOption === 'Price Descending') {
      this.filteredItems = filtered.sort((a, b) => b.price - a.price);
    } else {
      this.filteredItems = filtered.filter((item) =>
        this.getHashtagScore(item.hashtags),
      );
      this.sortByUserHashtags();
    }
  }

  getPromotionClass(promotionLevel: string): string {
    switch (promotionLevel) {
      case 'super':
        return 'promotion-super';
      case 'excellent':
        return 'promotion-excellent';
      case 'good':
        return 'promotion-good';
      default:
        return '';
    }
  }

  //price filter
  onMinPriceChange(event: any): void {
    this.minPrice = event.value;
    if (this.minPrice > this.maxPrice) {
      this.maxPrice = this.minPrice;
    }
    this.filterByType();
  }

  //price filter
  onMaxPriceChange(event: any): void {
    this.maxPrice = event.value;
    if (this.maxPrice < this.minPrice) {
      this.minPrice = this.maxPrice;
    }
    this.filterByType();
  }
}
