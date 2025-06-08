import ItemModel from './item-model.js';

/**
 * calculate the average price for each category.
 */
export async function getCategoryAveragePrices() {
  const averages = await ItemModel.aggregate([
    {
      $group: {
        _id: '$type',
        averagePrice: { $avg: '$price' },
      },
    },
  ]);
  return averages; // Array of { _id: category, averagePrice: Number }
}

/**
 * get top 10% products by sales in each category.
 */
export async function getTop10PercentProducts() {
  const categories = await ItemModel.distinct('type');
  const topProducts = {};

  for (const category of categories) {
    const products = await ItemModel.find({ type: category }).lean().exec();

    // calculate total sales for each product
    products.forEach((product) => {
      product.totalSales = product.salesHistory.reduce(
        (acc, record) => acc + record.quantity,
        0,
      );
    });

    // sort products by totalSales descending
    products.sort((a, b) => b.totalSales - a.totalSales);

    const topCount = Math.ceil(products.length * 0.1);
    topProducts[category] = products.slice(0, topCount);
  }

  return topProducts; // object with category keys and arrays of top products
}

/**
 * get popular tags from top 10% products in each category.
 */
export async function getPopularTags() {
  const topProducts = await getTop10PercentProducts();
  const popularTags = {};

  for (const [category, products] of Object.entries(topProducts)) {
    const tagCount = {};

    products.forEach((product) => {
      product.hashtags.forEach((tag) => {
        tagCount[tag] = (tagCount[tag] || 0) + 1;
      });
    });

    // sort tags by frequency descending
    const sortedTags = Object.entries(tagCount).sort((a, b) => b[1] - a[1]);

    popularTags[category] = sortedTags.map(([tag, count]) => ({ tag, count }));
  }

  return popularTags; // object with category keys and arrays of { tag, count }
}
