import { Component, OnInit } from '@angular/core';
import { Item } from '../../Item';
import { AuthService } from '../../AuthService';
import { ItemService } from '../../services/item.service';
import { DatamuseService } from '../../services/datamuse.service';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-add-item',
  templateUrl: './add-item.component.html',
  styleUrls: ['./add-item.component.css'],
})
export class AddItemComponent implements OnInit {
  constructor(
    private itemService: ItemService,
    private authService: AuthService,
    private datamuseService: DatamuseService,
    private route: ActivatedRoute,
  ) {}

  processing: boolean = false;

  searchWord: string = '';
  relatedWords: any[] = [];
  recommendedTags: string[] = [];
  error: string = '';
  itemExists: boolean = false;
  item_name: string = '';
  price: string = '';
  description: string = '';
  hashtag: string = '';
  hashtags: string[] = [];
  selectedFile: File | null = null;
  imageFileId: string = '';
  itemTypes: string[] = [
    'Electronics',
    'Furniture',
    'Clothing',
    'Books',
    'Toys',
  ];
  selectedItemType: string = this.itemTypes[0];
  currentUser: string = '';
  hashtagRecommendations: Map<string, string[]> = new Map();
  sourceMessage: string | null = null;
  isEdit: boolean = false;
  newitem: Item = {
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

  ngOnInit(): void {
    //cheaks if this component is for edit an item or add it
    this.route.queryParams.subscribe((params) => {
      this.sourceMessage = params['source'] || 'No source';
      if (this.sourceMessage === 'edit-item') {
        this.isEdit = true;

        //gets the item we are editing
        //and set his atribuits in the right filds
        this.newitem = history.state.item;

        this.item_name = this.newitem.item_name;
        this.price = this.newitem.price.toString();
        this.description = this.newitem.description;
        this.hashtags = this.newitem.hashtags;
        this.selectedItemType = this.newitem.type;
        this.currentUser = this.newitem.admin_name;
        this.imageFileId = this.newitem.imageFileId;
      }
    });

    // fetch the current user
    this.authService.fetchMe().subscribe({
      next: (user) => {
        this.currentUser = user.username;
      },
      error: (err) => {
        console.error('Error fetching current user:', err);
      },
    });
  }

  //select file to as the the photo
  onFileSelected(event: any): void {
    const file: File = event.target.files[0];
    if (file) {
      this.selectedFile = file;
    }
  }

  //fetch related words from datamuse api
  // to get seggested tags
  fetchRelatedWords(): void {
    const query = this.searchWord.trim();

    if (query) {
      this.datamuseService.getRelatedConcepts(query).subscribe(
        (response) => {
          //get only 3 related words for eatch tag
          const relatedWords = response
            .slice(0, 3)
            .map((word: any) => word.word);
          this.relatedWords = relatedWords;
          //add the new realted words to the one we alrady have
          this.recommendedTags = [...this.recommendedTags, ...relatedWords];

          if (this.searchWord) {
            //set them both togeter so we can delete realted words base on thire searthword!
            this.hashtagRecommendations.set(this.searchWord, relatedWords);
          }

          console.log('Related words:', relatedWords);
        },
        (error) => {
          console.error('Error fetching related words:', error);
        },
      );
    }
  }

  addHashtag(): void {
    const trimmedHashtag = this.hashtag.trim();
    if (!trimmedHashtag) {
      return;
    }

    if (this.hashtags.length >= 5) {
      this.error = 'You can only add up to 5 hashtags.';
      return;
    }

    this.hashtags.push(trimmedHashtag);
    this.hashtag = '';

    this.searchWord = trimmedHashtag;
    //after eatch tag aded in seggest more tags related to it
    this.fetchRelatedWords();
  }

  removeHashtag(index: number): void {
    const removedHashtag = this.hashtags[index];
    this.hashtags.splice(index, 1);

    // get the recomended tags, that was added for the tag we are deleting!
    const removedRecommendations =
      this.hashtagRecommendations.get(removedHashtag) || [];

    //remove the recommended tags, that come for the tag we just deleted
    if (removedRecommendations.length > 0) {
      this.recommendedTags = this.recommendedTags.filter(
        (tag) => !removedRecommendations.includes(tag),
      );
    }
    // remove the recommendations mapping for the deleted hashtag
    this.hashtagRecommendations.delete(removedHashtag);
  }

  async add_item(): Promise<void> {
    //cheak if prossing
    //so if the user clicks the button multipul times it wont cause probloms
    if (this.processing) {
      return;
    }

    this.processing = true;

    try {
      await this.checkItemExistence(this.item_name);
      if (!this.itemExists) {
        //set the new item filds
        this.newitem.item_name = this.item_name;
        this.newitem.price = parseFloat(this.price);
        this.newitem.description = this.description;
        this.newitem.hashtags = this.hashtags;
        this.newitem.type = this.selectedItemType;
        this.newitem.admin_name = this.currentUser;

        if (!this.selectedFile) {
          this.error = 'Please select an image file';
          this.processing = false;
          return;
        }

        //add the item and its image to the server
        await new Promise<void>((resolve, reject) => {
          this.itemService
            .addItemWithImage(this.newitem, this.selectedFile!)
            .subscribe({
              next: (response) => {
                console.log('Item added:', response);
                this.error = 'Item created successfully';
                resolve();
              },
              error: (err) => {
                console.error('Error adding item:', err);
                this.error = 'Error adding item';
                reject(err);
              },
            });
        });
      } else {
        this.error = 'An item with this name already exists';
      }
    } catch (error) {
      console.error('Error during item creation:', error);
      this.error = 'An error occurred while adding the item';
    } finally {
      this.processing = false;
    }
  }

  async edit_item(): Promise<void> {
    //cheak if prossing
    //so if the user clicks the button multipul times it wont cause probloms
    if (this.processing) {
      return;
    }

    this.processing = true;

    try {
      //set the item filds
      this.newitem.item_name = this.item_name;
      this.newitem.price = parseFloat(this.price);
      this.newitem.description = this.description;
      this.newitem.hashtags = this.hashtags;
      this.newitem.type = this.selectedItemType;
      this.newitem.admin_name = this.currentUser;

      if (this.selectedFile) {
        await new Promise<void>((resolve, reject) => {
          //update the item filds in the server
          // if the user uplwed a new picture
          this.itemService
            .updateItemWithImage(this.newitem, this.selectedFile!)
            .subscribe({
              next: (response) => {
                console.log('Item added:', response);
                this.error = 'Item chnaged successfully';
                resolve();
              },
              error: (err) => {
                console.error('Error chnaging item:', err);
                this.error = 'Error chnaging item';
                reject(err);
              },
            });
        });
      } else {
        await new Promise<void>((resolve, reject) => {
          this.itemService.updateItem(this.newitem).subscribe({
            next: (response) => {
              console.log('Item added:', response);
              this.error = 'Item chnaged successfully';
              resolve();
            },
            error: (err) => {
              console.error('Error chnaging item:', err);
              this.error = 'Error chnaging item';
              reject(err);
            },
          });
        });
      }
    } catch (error) {
      console.error('Error during item creation:', error);
      this.error = 'An error occurred while chnaging the item';
    } finally {
      this.processing = false;
    }
  }

  checkItemExistence(itemName: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.itemService.isItemExist(itemName).subscribe((exists: boolean) => {
        this.itemExists = exists;
        resolve();
      }, reject);
    });
  }

  addRecommendedTag(tag: string): void {
    if (this.hashtags.length >= 5) {
      this.error = 'You can only add up to 5 hashtags.';
      return;
    }

    if (!this.hashtags.includes(tag)) {
      this.hashtags.push(tag);
    }
  }
}
