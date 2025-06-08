import { Item } from './Item';

export interface PaginatedItems {
  items: Item[];
  totalItems: number;
  currentPage: number;
  totalPages: number;
}
