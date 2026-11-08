import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes';
import roomRoutes from './routes/roomRoutes';
import bookingRoutes from './routes/bookingRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(
  cors({
    origin: '*', // Allow development origins
    credentials: true,
  })
);
app.use(express.json());

// Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'Bank Raya Meeting Room Booking API',
    timestamp: new Date().toISOString(),
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/bookings', bookingRoutes);

// Error Handling Middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled API Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

// Start Server
const serverInstance = app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🏦 Bank Raya Meeting Room Booking Server is Running!`);
  console.log(`📡 URL: http://localhost:${PORT}`);
  console.log(`⚙️ Mode: ${process.env.NODE_ENV || 'development'}`);
  console.log(`====================================================`);
});

serverInstance.on('error', (err: any) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n❌ Error: Port ${PORT} sedang digunakan oleh proses lain.`);
    console.error(`💡 Tips: Pastikan tidak ada server backend lain yang sedang berjalan.\n`);
  } else {
    console.error('Server error:', err);
  }
});

