import { Component, OnInit, Input } from '@angular/core';
import { ItemService } from '../../services/item.service';

interface PriceDropRecommendation {
  itemId: string;
  itemName: string;
  currentPrice: number;
  recommendedPrice: string;
  category: string;
}

interface SwitchTagRecommendation {
  itemId: string;
  itemName: string;
  currentPrice: number;
  category: string;
}

interface PopularTag {
  tag: string;
  count: number;
}

@Component({
  selector: 'app-price-drop-recommendations',
  templateUrl: './price-drop-recommendations.component.html',
  styleUrls: ['./price-drop-recommendations.component.css'],
})
export class PriceDropRecommendationsComponent implements OnInit {
  priceDropRecommendations: PriceDropRecommendation[] = [];
  switchTagRecommendations: SwitchTagRecommendation[] = [];
  error: string = '';

  expandedRows: { [itemId: string]: boolean } = {};

  itemHashtags: { [itemId: string]: string[] } = {};

  recommendedTags: { [itemId: string]: string[] } = {};

  customHashtagInput: { [itemId: string]: string } = {};

  constructor(private itemService: ItemService) {}
  @Input() admin_name: string = '';

  ngOnInit(): void {
    console.log('username is:', this.admin_name);
    // load your two sets of recommendations from the server
    this.itemService.getPriceDropRecommendations(this.admin_name).subscribe({
      next: (data) => {
        this.priceDropRecommendations = data.priceDropRecommendations;
        this.switchTagRecommendations = data.switchTagRecommendations;
      },
      error: (err) => {
        console.error('Error fetching recommendations:', err);
        this.error = 'Failed to load recommendations.';
      },
    });
  }

  //toggle the expansion of a row to display "Manage Hashtags".
  //if expanding for the first time, load item details + recommended tags.
  toggleHashtags(rec: SwitchTagRecommendation) {
    // invert the expanded state
    this.expandedRows[rec.itemId] = !this.expandedRows[rec.itemId];

    // If its open and we haven’t loaded this item’s data yet, fetch it
    if (this.expandedRows[rec.itemId] && !this.itemHashtags[rec.itemId]) {
      // load the item from server to get its current hashtags
      this.itemService.getItemById(rec.itemId).subscribe({
        next: (item) => {
          this.itemHashtags[rec.itemId] = [...(item.hashtags || [])];
        },
        error: (err) => {
          console.error('Error fetching item:', err);
          this.error = 'Failed to load item data.';
        },
      });

      // load recommended tags for the category
      this.itemService.getPopularTagsByCategory(rec.category).subscribe({
        next: (tags) => {
          // tags is an array of {tag, count}
          this.recommendedTags[rec.itemId] = tags.map((t) => t.tag);
        },
        error: (err) => {
          console.error('Error fetching popular tags:', err);
          this.error = 'Failed to load popular tags.';
        },
      });
    }
  }

  // remove an existing hashtag from the items hashtags array
  removeHashtag(itemId: string, index: number) {
    this.itemHashtags[itemId].splice(index, 1);
  }

  //add a recommended hashtag (only if not already present)
  addRecommendedTag(itemId: string, tag: string) {
    if (!this.itemHashtags[itemId]) {
      this.itemHashtags[itemId] = [];
    }

    // make sure we don’t exceed 5 hashtags
    if (!this.itemHashtags[itemId].includes(tag)) {
      this.itemHashtags[itemId].push(tag);
    }
  }

  //add a custom hashtag
  addCustomHashtag(itemId: string) {
    const trimmed = (this.customHashtagInput[itemId] || '').trim();
    if (!trimmed) return;

    if (!this.itemHashtags[itemId]) {
      this.itemHashtags[itemId] = [];
    }

    if (!this.itemHashtags[itemId].includes(trimmed)) {
      this.itemHashtags[itemId].push(trimmed);
    }

    // clear the input
    this.customHashtagInput[itemId] = '';
  }

  // save the changed hashtags to the backend

  saveHashtags(rec: SwitchTagRecommendation) {
    this.itemService.getItemById(rec.itemId).subscribe({
      next: (item) => {
        // update the item’s hashtag array
        item.hashtags = [...this.itemHashtags[rec.itemId]];

        // send update request to server
        this.itemService.updateItem(item).subscribe({
          next: (updated) => {
            console.log('Hashtags updated for item:', updated);
            alert('Item hashtags updated successfully!');
          },
          error: (err) => {
            console.error('Error updating item:', err);
            alert('Failed to update item hashtags.');
          },
        });
      },
      error: (err) => {
        console.error('Error fetching item before update:', err);
        alert('Failed to fetch item for update.');
      },
    });
  }
}
