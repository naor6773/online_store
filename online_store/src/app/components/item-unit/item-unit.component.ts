import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Item } from '../../Item';
import { ItemService } from '../../services/item.service';

@Component({
  selector: 'app-item-unit',
  templateUrl: './item-unit.component.html',
  styleUrls: ['./item-unit.component.css'],
})
export class ItemUnitComponent {
  //get the item from items
  @Input() item: Item = {
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

  @Input() isFromBogoSelection: boolean = false;

  @Input() isEditMode: boolean = false;

  @Output() delete: EventEmitter<string> = new EventEmitter<string>();

  constructor(private itemService: ItemService) {}

  //check if the item discount is currently active
  isDiscountActive(): boolean {
    if (!this.item.discount) return false;

    if (!this.item.discount?.startDate || !this.item.discount?.endDate)
      return false;

    const now = new Date();
    const start = new Date(this.item.discount.startDate);
    const end = new Date(this.item.discount.endDate);

    if (now >= start && now <= end) return true;

    return false;
  }

  // method to handle deletion
  onDelete(event: Event) {
    event.stopPropagation();
    if (confirm('Are you sure you want to delete this item?')) {
      //delete the item
      this.itemService.deleteItem(this.item._id).subscribe({
        next: () => {
          //send it to parent
          // so it can refetch the items after deletion
          this.delete.emit(this.item._id);
        },
        error: (err) => {
          console.error('Error deleting item:', err);
        },
      });
    }
  }

  // prevent going to editpage,
  // without doing all the necessary thing first
  onEdit(event: Event) {
    event.stopPropagation();
  }
}
