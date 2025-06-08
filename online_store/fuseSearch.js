// fuseSearch.js
import Fuse from 'fuse.js';
import ItemModel from './item-model.js';

let fuse;

//  initialize Fuse.js
export async function initializeFuse() {
  try {
    const items = await ItemModel.find().lean().exec();

    const options = {
      keys: ['item_name', 'description', 'hashtags'],
      threshold: 0.4, // based on desired fuzziness (0.0 exact match, 1.0 match anything)
      includeScore: true,
      useExtendedSearch: true,
    };

    fuse = new Fuse(items, options);
    console.log('Fuse.js initialized with items.');
  } catch (error) {
    console.error('Error initializing Fuse.js:', error);
  }
}

//  update Fuse.js index when items change
export async function updateFuseIndex() {
  try {
    const items = await ItemModel.find().lean().exec();
    fuse.setCollection(items);
    console.log('Fuse.js index updated.');
  } catch (error) {
    console.error('Error updating Fuse.js index:', error);
  }
}

//   perform fuzzy search
export function searchItems(query) {
  if (!fuse) {
    throw new Error('Fuse.js is not initialized.');
  }
  return fuse.search(query).map((result) => result.item);
}
