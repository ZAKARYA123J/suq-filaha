import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import chatRoutes from './routes/chat.routes';
import productRoutes from './routes/product.routes';
import orderRoutes from './routes/order.routes';
import { errorHandler } from './middlewares/error.middleware';
const app = express();

app.use(cors({
  origin: ['http://localhost:4000', 'http://localhost:5173', 'http://localhost:8080'],
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);

// Health check
app.get('/health', (_req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'farm_marketplace_api',
    timestamp: new Date().toISOString() 
  });
});

// Error handling
app.use(errorHandler);

export default app;