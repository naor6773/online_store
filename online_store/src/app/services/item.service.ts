import { Injectable } from '@angular/core';
import { Item } from '../Item';
import { Observable } from 'rxjs';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { PaginatedItems } from '../paginated-items';

interface PriceDropRecommendation {
  itemId: string;
  itemName: string;
  currentPrice: number;
  recommendedPrice: string;
  category: string;
}

interface PopularTag {
  tag: string;
  count: number;
}

interface SwitchTagRecommendation {
  itemId: string;
  itemName: string;
  currentPrice: number;
  category: string;
}

interface RecommendationsResponse {
  priceDropRecommendations: PriceDropRecommendation[];
  switchTagRecommendations: SwitchTagRecommendation[];
}
@Injectable({
  providedIn: 'root',
})
export class ItemService {
  private apiurl = 'http://localhost:3000/items';
  private apiurl_items_stats = 'http://localhost:3000/items/loadbetter';
  private apiUrl = 'http://localhost:3000';

  constructor(private http: HttpClient) {}

  getItems(
    page: number,
    limit: number,
    type?: string,
    search?: string,
  ): Observable<PaginatedItems> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    if (type) {
      params = params.set('type', type);
    }

    if (search) {
      params = params.set('search', search);
    }

    return this.http
      .get<PaginatedItems>(this.apiurl_items_stats, { params })
      .pipe(map((response) => response));
  }

  getAdminItems(
    admin_name: string,
    page: number,
    limit: number,
    type?: string,
    search?: string,
  ): Observable<PaginatedItems> {
    let params = new HttpParams()
      .set('admin_name', admin_name)
      .set('page', page.toString())
      .set('limit', limit.toString());

    if (type) {
      params = params.set('type', type);
    }

    if (search) {
      params = params.set('search', search);
    }

    return this.http
      .get<PaginatedItems>(this.apiurl_items_stats, { params })
      .pipe(map((response) => response));
  }

  addItem(item: Item): Observable<Item> {
    return this.http.post<Item>(this.apiurl, item);
  }

  deleteItem(itemId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiurl}/${itemId}`);
  }

  isItemExist(item_name: string): Observable<boolean> {
    return this.http
      .get<Item[]>(`${this.apiurl}?item_name=${item_name}`)
      .pipe(map((items) => items.length > 0));
  }

  updateItem(item: Item): Observable<Item> {
    return this.http.put<Item>(`${this.apiurl}/${item._id}`, item);
  }

  getItemById(id: string): Observable<Item> {
    return this.http.get<Item>(`${this.apiurl}/${id}`);
  }

  addItemWithImage(item: Item, imageFile: File): Observable<Item> {
    const formData = new FormData();

    formData.append('image', imageFile);

    formData.append('item_name', item.item_name);
    formData.append('price', String(item.price));
    formData.append('description', item.description);
    formData.append('admin_name', item.admin_name);
    formData.append('type', item.type);
    formData.append('promotion_level', item.promotion_level);

    item.hashtags.forEach((ht) => formData.append('hashtags', ht));

    return this.http.post<Item>(`${this.apiurl}/upload`, formData);
  }

  updateItemWithImage(item: Item, imageFile?: File): Observable<Item> {
    const formData = new FormData();

    if (imageFile) {
      formData.append('image', imageFile);
    }

    formData.append('item_name', item.item_name);
    formData.append('price', String(item.price));
    formData.append('description', item.description);
    formData.append('admin_name', item.admin_name);
    formData.append('type', item.type);
    formData.append('promotion_level', item.promotion_level);

    item.hashtags.forEach((ht) => formData.append('hashtags', ht));

    return this.http.put<Item>(`${this.apiurl}/${item._id}/upload`, formData);
  }

  getRelatedWords(words: string[]): Observable<{ [key: string]: string[] }> {
    return this.http.post<{ [key: string]: string[] }>(
      'http://localhost:3000/related-concepts',
      {
        words,
      },
    );
  }

  getPriceDropRecommendations(
    adminName: string,
  ): Observable<RecommendationsResponse> {
    const params = new HttpParams().set('adminName', adminName);
    return this.http.get<RecommendationsResponse>(
      `${this.apiUrl}/recommendations/price-drops`,
      {
        params,
      },
    );
  }

  getPopularTags(): Observable<{
    popularTags: { [category: string]: PopularTag[] };
  }> {
    return this.http.get<{ popularTags: { [category: string]: PopularTag[] } }>(
      `${this.apiUrl}/recommendations/popular-tags`,
    );
  }

  getPopularTagsCategories(): Observable<string[]> {
    return this.http.get<string[]>(
      `${this.apiUrl}/recommendations/popular-tags-categories`,
    );
  }

  getPopularTagsByCategory(category: string): Observable<PopularTag[]> {
    return this.http.get<PopularTag[]>(
      `${this.apiUrl}/recommendations/popular-tags/${category}`,
    );
  }

  getMostSellingItems(): Observable<{ [category: string]: Item }> {
    return this.http.get<{ [category: string]: Item }>(
      `${this.apiurl}/most-selling`,
    );
  }

  getAutocompleteSuggestions(query: string): Observable<string[]> {
    const params = new HttpParams().set('q', query);
    return this.http.get<string[]>(`${this.apiurl}/autocomplete`, { params });
  }
}
