import mongoose from 'mongoose';

const mostSellingItemSchema = new mongoose.Schema({
  category: { type: String, required: true, unique: true },
  item: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ItemModel',
    required: true,
  },
  lastCalculated: { type: Date, default: Date.now },
});

const MostSellingItem = mongoose.model(
  'MostSellingItem',
  mostSellingItemSchema,
);

export default MostSellingItem;
