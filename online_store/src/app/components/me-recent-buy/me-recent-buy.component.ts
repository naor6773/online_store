import { Component, Input } from '@angular/core';
import { Cart_item } from './../../cart_item';

@Component({
  selector: 'app-me-recent-buy',
  templateUrl: './me-recent-buy.component.html',
  styleUrls: ['./me-recent-buy.component.css'],
})
export class MeRecentBuyComponent {
  //item it get from "me" component
  @Input() item: Cart_item = {
    item: {
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
    },

    num_of_appearances: 1,
    price: 0,
  };
}
