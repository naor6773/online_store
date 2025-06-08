import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import FormData from 'form-data';
import mongoose from 'mongoose';
import UserModel from './user-model.js';
import AdminModel from './admin-model.js';
import ItemModel from './item-model.js';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import { GridFsStorage } from 'multer-gridfs-storage';
import Grid from 'gridfs-stream';
import WordPOS from 'wordpos';
import axios from 'axios';
import cron from 'node-cron';
import MostSellingItem from './mostSellingItem-model.js';
import Fuse from 'fuse.js';
import natural from 'natural';
import { updateFuseIndex, searchItems } from './fuseSearch.js';
// At the top of your server file

import {
  getCategoryAveragePrices,
  getPopularTags,
  getTop10PercentProducts,
} from './recomendtionHelper.js';

let gfs, gridfsBucket;

let fuse;
const initializeFuse = async () => {
  const items = await ItemModel.find({}).lean().exec();
  fuse = new Fuse(items, {
    keys: ['item_name', 'description', 'hashtags'],
    threshold: 0.4, // adjust based on desired fuzziness (0.0 exact match, 1.0 match anything)
    includeScore: true,
    useExtendedSearch: true,
  });
};
mongoose
  .connect(
    'place_holder_for_mongodb://',
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    },
  )
  .then(async () => {
    console.log('Connected to MongoDB');

    /*/ drop a lot of stuff from other vertions of my database so the current oine will work(it isent needed right now but just in case)
    try {
      await UserModel.collection.dropIndex("id_1");
      console.log('Dropped id_1 index');
    } catch (error) {
      console.log('No id_1 index found or could not drop it:', error.message);
    }

    try {
      await AdminModel.collection.dropIndex("id_1");
      console.log('Dropped id_1 index');
    } catch (error) {
      console.log('No id_1 index found or could not drop it:', error.message);
    }

    try {
      await AdminModel.collection.dropIndex("admin_name_1");
      console.log('Dropped admin_name_1 index');
    } catch (error) {
      console.log('No admin_name_1 index found or could not drop it:', error.message);
    }

    try {
      await UserModel.collection.dropIndex("user_name_1");
      console.log('Dropped user_name_1 index');
    } catch (error) {
      console.log('No user_name_1 index found or could not drop it:', error.message);
    }
/*/
    gridfsBucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
      bucketName: 'uploads',
    });
    Grid.mongo = mongoose.mongo;
    gfs = Grid(mongoose.connection.db);
    gfs.collection('uploads');
    await initializeFuse();
  })
  .catch((err) => console.error('MongoDB connection error:', err));

const app = express();
const PORT = 3000;
app.use(express.json());
app.use(
  cors({
    origin: 'http://localhost:4200',
    credentials: true,
  }),
);
app.use(cookieParser());

const RECAPTCHA_SECRET_KEY = '6LeBPZ4qAAAAAO-t80p4mUrS2GekYZGy5xfUM_5Z';

async function verifyCaptcha(captchaResponse) {
  try {
    const formData = new FormData();
    formData.append('secret', RECAPTCHA_SECRET_KEY);
    formData.append('response', captchaResponse);

    const response = await fetch(
      'https://www.google.com/recaptcha/api/siteverify',
      {
        method: 'POST',
        body: formData,
      },
    );

    const data = await response.json();
    console.log('reCAPTCHA verification response:', data);

    return data.success && data.score >= 0.5;
  } catch (error) {
    console.error('Error verifying reCAPTCHA:', error);
    return false;
  }
}

app.post('/verify-captcha', async (req, res) => {
  const { captchaResponse } = req.body;
  if (!captchaResponse) {
    return res.status(400).json({
      success: false,
      message: 'No reCAPTCHA token provided',
    });
  }

  const isHuman = await verifyCaptcha(captchaResponse);
  if (isHuman) {
    return res.json({
      success: true,
      message: 'reCAPTCHA verification successful',
    });
  } else {
    return res.status(401).json({
      success: false,
      message: 'Failed reCAPTCHA verification',
    });
  }
});
app.post('/related-concepts', async (req, res) => {
  const { words } = req.body;
});

const storage = new GridFsStorage({
  // we connect to mongodb
  url: 'mongodb+srv://omern852:kumRhEIxRBLDblHK@onlinestore.zop6w.mongodb.net/',
  file: (req, file) => {
    // generate a unique filename for the photo
    //  by adding the current time with the original file name
    return {
      bucketName: 'uploads',
      filename: Date.now() + '-' + file.originalname,
    };
  },
});

//create multer instanse
const upload = multer({ storage });

app.post('/items/upload', upload.single('image'), async (req, res) => {
  try {
    // if there is no file return error
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // destructuring item-related fields from the request body
    const {
      item_name,
      price,
      description,
      admin_name,
      hashtags,
      type,
      promotion_level,
    } = req.body;

    // constructing the new item with the uploaded image file reference
    const newItem = new ItemModel({
      imageFileId: req.file.filename,
      item_name,
      price,
      description,
      admin_name,
      hashtags: Array.isArray(hashtags) ? hashtags : [],
      type,
      promotion_level: promotion_level || 'regular',
      salesHistory: [],
      comments: [],
    });

    await newItem.save();

    // sending back the newly created item as the response
    return res.status(201).json(newItem);
  } catch (err) {
    console.error('Error uploading file or creating item:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/items/most-selling', async (req, res) => {
  try {
    // Fetch all most selling items and populate the item details
    const mostSelling = await MostSellingItem.find().populate('item').exec();

    // Structure the response as a key-value pair of category and item
    const result = {};
    mostSelling.forEach((entry) => {
      result[entry.category] = entry.item;
    });

    res.json(result);
  } catch (error) {
    console.error('Error fetching most selling items:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// get the image by filename
app.get('/items/image/:filename', async (req, res) => {
  try {
    const file = await gfs.files.findOne({ filename: req.params.filename });
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    //set chsh so the pics, will load faster!
    // set caching headers (1 year, immutable(the image does not chnage overtime))
    res.set({
      'Cache-Control': 'public, max-age=31536000, immutable',
      //type of file png, jpeg and more
      'Content-Type': file.contentType,
      // unick token to validate the cash
      'ETag': file.md5 || JSON.stringify(file._id),
      // Last-Modified header for cache validation
      'Last-Modified': new Date(file.uploadDate).toUTCString(),
    });

    //read the photo from the storge!
    const readStream = gridfsBucket.openDownloadStream(file._id);
    readStream.pipe(res);
  } catch (err) {
    console.error('Error fetching image:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.patch('/items/:id/add-sale', async (req, res) => {
  try {
    const { date, quantity } = req.body;
    if (!date || !quantity) {
      return res.status(400).json({ error: 'Missing date or quantity' });
    }

    // validate date is parseable
    const saleDate = new Date(date);
    if (isNaN(saleDate.getTime())) {
      return res.status(400).json({ error: 'Invalid date format' });
    }

    // find item by ID
    const item = await ItemModel.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    // push new sale record
    item.salesHistory.push({ date, quantity });
    await item.save();

    // return the updated item
    return res.json(item);
  } catch (err) {
    console.error('Error adding sale record:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// add this new route for autocomplete
app.get('/items/autocomplete', async (req, res) => {
  const q = req.query.q;

  if (!q) {
    return res.status(400).json({ error: 'Missing query parameter q' });
  }

  try {
    const fuseResults = fuse.search(q).slice(0, 10); // get top 10 matches
    const suggestions = fuseResults.map((result) => result.item.item_name);
    res.json(suggestions);
  } catch (error) {
    console.error('Error in autocomplete with Fuse.js:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/items/loadbetter', async (req, res) => {
  try {
    const { admin_name, search, type, page = 1, limit = 6 } = req.query;

    let query = {};

    if (admin_name) {
      query.admin_name = admin_name;
    }

    if (type && type !== 'All') {
      query.type = type;
    }

    let items = [];
    let totalItems = 0;

    if (search) {
      // Fetch filtered items from MongoDB first
      const filteredItems = await ItemModel.find(query).lean().exec();

      // Perform fuzzy search using Fuse.js on the filtered items
      const fuse = new Fuse(filteredItems, {
        keys: ['item_name', 'description', 'hashtags'],
        threshold: 0.4,
        includeScore: true,
        useExtendedSearch: true,
      });

      const fuseResults = fuse.search(search).map((result) => result.item);

      totalItems = fuseResults.length;

      // Implement pagination
      const startIndex = (page - 1) * limit;
      const endIndex = page * limit;
      items = fuseResults.slice(startIndex, endIndex);
    } else {
      // Regular query without search
      items = await ItemModel.find(query)
        .sort({ item_name: 1 }) // default sorting
        .skip((page - 1) * limit)
        .limit(parseInt(limit))
        .exec();

      totalItems = await ItemModel.countDocuments(query).exec();
    }

    res.json({
      items,
      totalItems,
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalItems / limit),
    });
  } catch (err) {
    console.error('Error fetching items:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/items', async (req, res) => {
  try {
    // parms we filter by
    const { admin_name, item_name } = req.query;
    const query = {};

    //intlizing with the parm
    if (admin_name) {
      query.admin_name = admin_name;
    }
    if (item_name) {
      query.item_name = item_name;
    }

    //commiting the searth
    const items = await ItemModel.find(query).exec();

    //sending the responce
    res.json(items);
  } catch (err) {
    console.error('Error fetching items:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/items/:id', async (req, res) => {
  try {
    //find spsifc item by id
    const item = await ItemModel.findById(req.params.id).exec();
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    //sending the responce
    res.json(item);
  } catch (err) {
    console.error('Error fetching item:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/items', async (req, res) => {
  try {
    //to make sure we didnt send the id as a parm to the db
    if (req.body && typeof req.body === 'object') {
      console.log('Before sanitization:', req.body);
      delete req.body.id;
      delete req.body._id;
      console.log('After sanitization:', req.body);
    }

    //intlizing new item object
    const newItem = new ItemModel(req.body);
    await newItem.save();

    // Update Fuse.js index
    await updateFuseIndex();

    res.status(201).json(newItem);
  } catch (err) {
    console.error('Error adding item:', err);
    res.status(400).json({ error: err.message });
  }
});

app.delete('/items/:id', async (req, res) => {
  try {
    const itemId = req.params.id;

    // find the item by id to access imageFileId
    const item = await ItemModel.findById(itemId);
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    // delete the associated image from GridFS if it exists
    const imageFileId = item.imageFileId;
    if (imageFileId) {
      // find the file in GridFS by filename
      const file = await gfs.files.findOne({ filename: imageFileId });

      if (file) {
        // delete the file using its ObjectId
        await gridfsBucket.delete(file._id);
        console.log(`Deleted image file: ${imageFileId}`);
      } else {
        console.warn(
          `Image file with filename "${imageFileId}" not found in GridFS.`,
        );
      }
    }

    // delete the item document from MongoDB
    await ItemModel.findByIdAndDelete(itemId);

    // Update Fuse.js index
    await updateFuseIndex();

    res
      .status(200)
      .json({ message: 'Item and associated image deleted successfully' });
  } catch (error) {
    console.error('Error deleting item and image:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/items/:id', async (req, res) => {
  try {
    // remove _id to avoid probloms
    if (req.body._id) {
      delete req.body._id;
    }

    //find spsfic item by id and update its fileds
    const updatedItem = await ItemModel.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      },
    );

    if (!updatedItem) {
      return res.status(404).json({ error: 'Item not found' });
    }

    // Update Fuse.js index
    await updateFuseIndex();

    res.json(updatedItem);
  } catch (err) {
    console.error('Error updating item:', err);
    res.status(400).json({ error: err.message });
  }
});

app.put('/items/:id/upload', upload.single('image'), async (req, res) => {
  try {
    const itemId = req.params.id;
    const {
      item_name,
      price,
      description,
      admin_name,
      hashtags,
      type,
      promotion_level,
    } = req.body;

    // find the existing item
    const existingItem = await ItemModel.findById(itemId);
    if (!existingItem) {
      return res.status(404).json({ error: 'Item not found' });
    }

    // if a new image is uploaded, handle image update
    if (req.file) {
      if (existingItem.imageFileId) {
        //delte old file
        const oldFile = await gfs.files.findOne({
          filename: existingItem.imageFileId,
        });
        if (oldFile) {
          await gridfsBucket.delete(oldFile._id);
        }
      }

      // update the imageFileId with the new filename
      existingItem.imageFileId = req.file.filename;
    }

    // update other fields
    existingItem.item_name = item_name || existingItem.item_name;
    existingItem.price = price || existingItem.price;
    existingItem.description = description || existingItem.description;
    existingItem.admin_name = admin_name || existingItem.admin_name;
    existingItem.type = type || existingItem.type;
    existingItem.promotion_level =
      promotion_level || existingItem.promotion_level;

    // update hashtags
    if (hashtags) {
      if (Array.isArray(hashtags)) {
        existingItem.hashtags = hashtags;
      } else {
        // if hashtags come as a single string, split them
        existingItem.hashtags = hashtags.split(',').map((ht) => ht.trim());
      }
    }

    // save the updated item
    await existingItem.save();

    return res.json(existingItem);
  } catch (err) {
    console.error('Error updating item with image:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/users', async (req, res) => {
  try {
    // parms we filter by
    const { username } = req.query;
    const query = {};

    // intlizing with params
    if (username) {
      query.username = username;
    }

    // filter by parsm
    const users = await UserModel.find(query)
      // includ user fildes that use diff models
      .populate({
        path: 'cart.item',
        model: 'ItemModel',
      })
      .populate({
        path: 'past_buy.item',
        model: 'ItemModel',
      })
      .populate('wish_list')
      .exec();

    // filter out null items in populated fields
    const sanitizedUsers = users.map((user) => {
      return {
        ...user.toObject(),
        cart: user.cart.filter((cartItem) => cartItem.item != null),
        past_buy: user.past_buy.filter((pastItem) => pastItem.item != null),
      };
    });
    //sending the responce
    res.json(sanitizedUsers);
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/users', async (req, res) => {
  try {
    //to make sure we didnt send the id as a parm to the db
    if (req.body && typeof req.body === 'object') {
      console.log('Before sanitization:', req.body);
      delete req.body.id;
      delete req.body._id;
      console.log('After sanitization:', req.body);
    }

    //create new user object
    const newUser = new UserModel(req.body);

    //save new user objectin db
    await newUser.save();
    res.status(201).json(newUser);
  } catch (err) {
    console.error('Error creating user:', err);
    res.status(400).json({ error: err.message });
  }
});

app.put('/users/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    const updatedFields = req.body;

    console.log('updatedFields:', updatedFields);

    //find user by id
    const user = await UserModel.findById(userId).exec();
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    //update user with new values if exsist
    user.username = updatedFields.username || user.username;
    user.password = updatedFields.password || user.password;

    if (Array.isArray(updatedFields.cart)) {
      user.cart = [];
      for (const cartObj of updatedFields.cart) {
        //add the new cart to the user
        user.cart.push({
          item: cartObj.item,
          num_of_appearances: cartObj.num_of_appearances,
          price: cartObj.price,
        });
      }
    }

    if (Array.isArray(updatedFields.past_buy)) {
      user.past_buy = [];
      for (const pastBuyObj of updatedFields.past_buy) {
        user.past_buy.push({
          item: pastBuyObj.item,
          num_of_appearances: pastBuyObj.num_of_appearances,
          price: pastBuyObj.price,
        });
      }
    }

    if (Array.isArray(updatedFields.recent_hashtags)) {
      user.recent_hashtags = updatedFields.recent_hashtags;
    }

    if (Array.isArray(updatedFields.wish_list)) {
      user.wish_list = updatedFields.wish_list;
    }

    //save the user in db
    await user.save();

    const updatedUser = await UserModel.findById(userId)
      .populate('cart.item')
      .populate('past_buy.item')
      .exec();

    //sending the responce
    res.json(updatedUser);
  } catch (err) {
    console.error('Error updating user:', err);
    res.status(400).json({ error: err.message });
  }
});

app.post('/users/:id/cart/bulkAdd', async (req, res) => {
  try {
    const { items } = req.body;
    const userId = req.params.id;

    if (!items || !Array.isArray(items)) {
      return res
        .status(400)
        .json({ error: 'Invalid or missing `items` array in request body' });
    }

    // find the user
    const user = await UserModel.findById(userId).exec();
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // for each item, either add it if it doesn't exist or increase the existing quantity
    items.forEach(({ itemId, price, quantity }) => {
      const existingCartItem = user.cart.find(
        (cartEntry) => cartEntry.item.toString() === itemId,
      );
      if (existingCartItem) {
        existingCartItem.num_of_appearances += quantity;
      } else {
        user.cart.push({
          item: itemId,
          num_of_appearances: quantity,
          price: price,
        });
      }
    });

    // save the user
    await user.save();

    // return the updated user
    const updatedUser = await UserModel.findById(userId)
      .populate('cart.item')
      .exec();

    return res.status(200).json(updatedUser);
  } catch (error) {
    console.error('Error in bulkAdd route:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/admins', async (req, res) => {
  try {
    // seartch params
    const { username } = req.query;
    const query = {};

    //intlize seartch params
    if (username) {
      query.username = username;
    }

    //find admin using the parms and retunr it
    const admins = await AdminModel.find(query).exec();
    res.json(admins);
  } catch (err) {
    console.error('Error fetching admins:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/admins', async (req, res) => {
  try {
    // makeing sure we didnt send id to the db
    if (req.body && typeof req.body === 'object') {
      console.log('Before sanitization (admins):', req.body);
      delete req.body.id;
      delete req.body._id;
      console.log('After sanitization (admins):', req.body);
    }

    // inltilizeng admin object
    const newAdmin = new AdminModel(req.body);

    //saving admin objevct to db
    await newAdmin.save();

    return res.status(201).json(newAdmin);
  } catch (err) {
    console.error('Error creating admin:', err);
    return res.status(400).json({ error: err.message });
  }
});

const JWT_SECRET = 'replace_me_with_long_random_string';

app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // cheak if username exsist
    let userRecord = await UserModel.findOne({ username });
    let isAdmin = false;

    if (userRecord) {
      // check if password is correct
      const passwordMatches = await bcrypt.compare(
        password,
        userRecord.password,
      );
      if (!passwordMatches) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
    } else {
      // cheak if admin exsist, if user dosent
      userRecord = await AdminModel.findOne({ username });
      if (!userRecord) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Check admin password
      const passwordMatches = await bcrypt.compare(
        password,
        userRecord.password,
      );
      if (!passwordMatches) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      isAdmin = true;
    }

    // intlize token
    const tokenPayload = {
      sub: userRecord._id,
      username: userRecord.username,
      role: isAdmin ? 'admin' : 'user',
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, {
      expiresIn: '1d', //token exspires after 1 day
    });

    //create token cookie so we could access the user info
    res
      .cookie('token', token, {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000, // 1 day
      })
      .json({ message: 'Logged in successfully' });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/me', authMiddleware, (req, res) => {
  try {
    //return the user info if atunticated
    const userData = {
      username: req.user.username,
      role: req.user.role,
    };

    res.json(userData); // return user data
  } catch (error) {
    console.error('Error fetching user data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// price drop recommendations
app.get('/recommendations/price-drops', async (req, res) => {
  try {
    const adminName = req.query.adminName;

    const topProducts = await getTop10PercentProducts();

    // separate arrays for different types of recommendations
    const priceDropRecommendations = [];
    const switchTagRecommendations = [];

    for (const [category, products] of Object.entries(topProducts)) {
      if (!products.length) continue;

      const sumPrices = products.reduce((sum, prod) => sum + prod.price, 0);
      const topAvgPrice = sumPrices / products.length;

      // grab all items in this category for this admin
      const query = { type: category };
      if (adminName) {
        // only filter by admin if adminName was given
        query.admin_name = adminName;
      }

      const itemsInCategory = await ItemModel.find(query).lean();

      for (const item of itemsInCategory) {
        const currentMonth = new Date().getMonth() + 1;
        const currentYear = new Date().getFullYear();
        const key = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;
        const monthlySales =
          item.salesHistory.find((r) => r.date === key)?.quantity || 0;

        // check if it's low-selling
        if (monthlySales < 10) {
          // if item is overpriced ( > topAvgPrice * 1.2 ), recommend a price drop
          if (item.price > topAvgPrice * 1.2) {
            priceDropRecommendations.push({
              itemId: item._id,
              itemName: item.item_name,
              currentPrice: item.price,
              recommendedPrice: (topAvgPrice * 1.2).toFixed(2),
              category: category,
            });
          }
          // otherwise, suggest the user switch tags
          else {
            switchTagRecommendations.push({
              itemId: item._id,
              itemName: item.item_name,
              currentPrice: item.price,
              category: category,
            });
          }
        }
      }
    }

    // return both arrays
    res.json({
      priceDropRecommendations,
      switchTagRecommendations,
    });
  } catch (error) {
    console.error('Error fetching price drop recommendations:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// return a list of all distinct categories
app.get('/recommendations/popular-tags-categories', async (req, res) => {
  try {
    const categories = await ItemModel.distinct('type');
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// return popular tags for a single category
app.get('/recommendations/popular-tags/:category', async (req, res) => {
  try {
    const category = req.params.category;
    // filter to one category.
    const products = await ItemModel.find({ type: category }).lean().exec();

    // calculate total sales for each product
    products.forEach((product) => {
      product.totalSales = product.salesHistory.reduce(
        (acc, record) => acc + record.quantity,
        0,
      );
    });

    // sort by total sales
    products.sort((a, b) => b.totalSales - a.totalSales);

    // take top 10%
    const topCount = Math.ceil(products.length * 0.1);
    const topProducts = products.slice(0, topCount);

    // build tag frequency
    const tagCount = {};
    topProducts.forEach((product) => {
      product.hashtags.forEach((tag) => {
        tagCount[tag] = (tagCount[tag] || 0) + 1;
      });
    });

    // sort by frequency
    const sortedTags = Object.entries(tagCount)
      .sort(([, countA], [, countB]) => countB - countA)
      .map(([tag, count]) => ({ tag, count }));

    res.json(sortedTags);
  } catch (error) {
    console.error('Error fetching popular tags for category:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// schedule the cron job to run daily at 10:15 AM Asia/Jerusalem time
cron.schedule(
  '36 10 * * *',
  async () => {
    console.log(
      'Running daily most selling items calculation at 10:15 AM Israel time',
    );

    try {
      // fetch all distinct categories from the database
      const categories = await ItemModel.distinct('type');

      for (const category of categories) {
        // fetch all items in the current category
        const itemsInCategory = await ItemModel.find({ type: category }).lean();

        if (!itemsInCategory.length) {
          console.log(`No items found for category ${category}`);
          continue;
        }

        const now = new Date();
        const currentMonth = now.getMonth(); // 0-indexed (0 = January)
        const currentYear = now.getFullYear();

        // calculate total sales for each item in the current month
        const salesData = itemsInCategory.map((item) => {
          const monthlySales = item.salesHistory.reduce((acc, sale) => {
            const saleDate = new Date(sale.date);
            if (
              saleDate.getMonth() === currentMonth &&
              saleDate.getFullYear() === currentYear
            ) {
              return acc + sale.quantity;
            }
            return acc;
          }, 0);
          return { itemId: item._id, sales: monthlySales };
        });

        // determine the maximum sales number
        const maxSales = Math.max(...salesData.map((s) => s.sales));

        if (maxSales === 0) {
          console.log(`No sales this month for category ${category}`);
          // select one item randomly if there's a tie
          const selectedItemId =
            salesData[Math.floor(Math.random() * salesData.length)].itemId;

          // find the most selling item for the current category
          await MostSellingItem.findOneAndUpdate(
            { category },
            { item: selectedItemId, lastCalculated: new Date() },
            { upsert: true, new: true },
          );
          continue;
        }

        // identify all items that have the maximum sales
        const topSellingItems = salesData.filter((s) => s.sales === maxSales);

        // select one item randomly if there's a tie
        const selectedItemId =
          topSellingItems[Math.floor(Math.random() * topSellingItems.length)]
            .itemId;

        // find the most selling item for the current category
        await MostSellingItem.findOneAndUpdate(
          { category },
          { item: selectedItemId, lastCalculated: new Date() },
          { upsert: true, new: true },
        );

        console.log(
          `Most selling item for category ${category}: ${selectedItemId}`,
        );
      }
    } catch (error) {
      console.error('Error in daily most selling items calculation:', error);
    }
  },
  {
    timezone: 'Asia/Jerusalem', // specify the timezone
  },
);

function authMiddleware(req, res, next) {
  //accses the token via the cookie
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ error: 'No token found' });
  }

  try {
    //verify the token
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
