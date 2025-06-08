import { Cart_item } from './cart_item';
import { Hashtag } from './hashtags';
import { Item } from './Item';

export interface users {
  _id?: string;
  username: string;
  password: string;
  cart: Cart_item[];
  past_buy: Cart_item[];
  wish_list: Item[];
  recent_hashtags: Hashtag[];
}
