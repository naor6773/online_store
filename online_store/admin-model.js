import mongoose from 'mongoose';
import uniqueValidator from 'mongoose-unique-validator';

const adminSchema = mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

adminSchema.plugin(uniqueValidator);
export default mongoose.model('AdminModel', adminSchema);
