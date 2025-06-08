import mongoose from 'mongoose';
import uniqueValidator from 'mongoose-unique-validator';

const cartItemSchema = mongoose.Schema({
  item: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ItemModel',
    required: true,
  }, // Reference to Item model
  num_of_appearances: { type: Number, required: true },
});

export default mongoose.model('CartItemModel', cartItemSchema);
