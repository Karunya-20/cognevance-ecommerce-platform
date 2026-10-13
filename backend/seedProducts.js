require('dotenv').config();
const mongoose = require('mongoose');

const Product = mongoose.model(
  'Product',
  new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    price: { type: Number, required: true, min: 0 },
    imageUrl: { type: String, default: '' },
    category: { type: String, default: 'General' },
    stock: { type: Number, default: 0, min: 0 },
    active: { type: Boolean, default: true }
  }, { timestamps: true })
);

const products = [
  {
    name: 'Classic White Sneakers',
    description: 'Minimal everyday sneakers with a clean, modern look.',
    price: 2499,
    imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=700',
    category: 'Footwear',
    stock: 20,
    active: true
  },
  {
    name: 'Premium Everyday Backpack',
    description: 'A versatile backpack for work, college, and travel.',
    price: 1899,
    imageUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=700',
    category: 'Accessories',
    stock: 15,
    active: true
  },
  {
    name: 'Wireless Headphones',
    description: 'Comfortable over-ear headphones for music and calls.',
    price: 3299,
    imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=700',
    category: 'Electronics',
    stock: 12,
    active: true
  },
  {
    name: 'Minimal Wrist Watch',
    description: 'A timeless watch design for everyday wear.',
    price: 2799,
    imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=700',
    category: 'Accessories',
    stock: 10,
    active: true
  },
  {
    name: 'Everyday Sunglasses',
    description: 'Classic sunglasses to complete your everyday style.',
    price: 999,
    imageUrl: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=700',
    category: 'Accessories',
    stock: 25,
    active: true
  },
  {
    name: 'Modern Running Shoes',
    description: 'Lightweight shoes designed for active days.',
    price: 2999,
    imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=700',
    category: 'Footwear',
    stock: 18,
    active: true
  }
];

async function seed() {
  try {
    await mongoose.connect(
      process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/cognevance_shop'
    );

    const existing = await Product.countDocuments();

    if (existing > 0) {
      console.log(`Database already contains ${existing} products. No changes made.`);
      return;
    }

    await Product.insertMany(products);
    console.log(`Successfully added ${products.length} sample products.`);
  } catch (error) {
    console.error('Seeding failed:', error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

seed();