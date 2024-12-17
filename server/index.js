import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import morgan from 'morgan';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Import routes
import authRoutes from './routes/auth.js';
import subscriptionRoutes from './routes/subscriptions.js';
import reminderRoutes from './routes/reminders.js';
import userRoutes from './routes/users.js';

// Environment setup
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env') });
const app = express();
const PORT = process.env.PORT || 5000;

// Add production configuration
if (process.env.NODE_ENV === 'production') {
  // Update CORS for Azure
  app.use(cors({
    origin: 'https://yellow-moss-029856a00.4.azurestaticapps.net',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']
  }));
  
  // Serve static files
  app.use(express.static(join(__dirname, '../dist')));
  
  // API routes
  app.use('/api/auth', authRoutes);
  app.use('/api/subscriptions', subscriptionRoutes);
  app.use('/api/reminders', reminderRoutes);
  app.use('/api/users', userRoutes);
  
  // SPA fallback
  app.get('*', (req, res) => {
    res.sendFile(join(__dirname, '../dist', 'index.html'));
  });
}

// Middleware
app.use(express.json());
// app.use(cors());
app.use(helmet());
app.use(morgan('dev'));

app.use('/api/auth', authRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/reminders', reminderRoutes);
app.use('/api/users', userRoutes);

try {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB successfully');
} catch (error) {
  console.error('MongoDB connection error:', error);
  process.exit(1);
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});