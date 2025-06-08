import mongoose from 'mongoose';
import uniqueValidator from 'mongoose-unique-validator';

const itemSchema = mongoose.Schema({
  imageFileId: { type: String, required: true },
  item_name: { type: String, required: true },
  price: { type: Number, required: true },
  description: { type: String, required: true },
  admin_name: { type: String, required: true },
  hashtags: {
    type: [String],
    required: true,
  },
  type: { type: String, required: true },
  salesHistory: [
    {
      date: { type: String, required: true },
      quantity: { type: Number, required: true },
    },
  ],
  comments: [
    {
      username: { type: String, required: true },
      content: { type: String, required: true },
      isAdmin: { type: Boolean, required: true },
      starRating: { type: Number, min: 1, max: 5, required: false },
    },
  ],
  promotion_level: { type: String, required: true },
  discount: {
    type: {
      type: String,
    },
    newPrice: Number,
    startDate: Date,
    endDate: Date,
    bogoId: String,
  },
});

itemSchema.index({ item_name: 1 });

itemSchema.plugin(uniqueValidator);

export default mongoose.model('ItemModel', itemSchema);
