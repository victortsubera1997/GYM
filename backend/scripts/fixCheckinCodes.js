import mongoose from 'mongoose';
import dotenv from 'dotenv';
import crypto from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../models/User.model.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Завантажуємо змінні з .env
dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function fixCheckinCodes() {
  try {
    // Підключення до MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected');

    // Знаходимо всіх користувачів без checkinCode
    const usersWithoutCode = await User.find({
      $or: [{ checkinCode: null }, { checkinCode: '' }]
    });

    console.log(`🔍 Знайдено користувачів без QR: ${usersWithoutCode.length}`);

    // Генеруємо код кожному
    for (const user of usersWithoutCode) {
      user.checkinCode = crypto.randomBytes(8).toString('hex'); // 16 символів
      await user.save();
      console.log(`✅ Оновлено: ${user.name} (${user._id})`);
    }

    console.log('🎯 Усі відсутні checkinCodes згенеровано.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Помилка:', error);
    process.exit(1);
  }
}

fixCheckinCodes();
