import mongoose from 'mongoose';
import uniqueValidator from 'mongoose-unique-validator';

const hashtagSchema = mongoose.Schema({
  amount_of_purcheses: { type: Number, required: true },
  name: { type: String, required: true },
});

const CartItemSchema = mongoose.Schema(
  {
    item: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ItemModel',
      required: true,
    },
    num_of_appearances: { type: Number, required: true },
    price: { type: Number, required: true },
  },
  { _id: false },
);

const userSchema = mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  cart: { type: [CartItemSchema], required: true },
  past_buy: { type: [CartItemSchema], required: true },
  wish_list: [
    { type: mongoose.Schema.Types.ObjectId, ref: 'ItemModel', required: true },
  ],
  recent_hashtags: { type: [hashtagSchema], required: true },
});

userSchema.index({ username: 1 });

userSchema.plugin(uniqueValidator);
export default mongoose.model('UserModel', userSchema);
