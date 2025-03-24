import express, { Express } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import mongoose from 'mongoose';
import path from 'path';
import { existsSync, mkdirSync } from 'fs';
import { connectDB } from './config/db';
import routes from './routes';

// Load environment variables
dotenv.config();

// Initialize Express app
const app: Express = express();
const PORT = process.env.PORT || 5001;

// Ensure uploads directories exist
const uploadsDirectories = [
  path.join(process.cwd(), 'uploads/bollards'),
  path.join(process.cwd(), 'uploads/licenseplates'),
  path.join(process.cwd(), 'uploads/roadsigns')
];

uploadsDirectories.forEach(dir => {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
    console.log(`Created uploads directory: ${dir}`);
  }
});

// Configure CORS
const corsOptions = {
  origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002', 'https://makiukazujekozycizimchlapum.fun'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to MongoDB
connectDB();

// Routes
app.use('/api', routes);

// Serve uploaded files - Make sure this comes BEFORE the React app serving code
app.use('/uploads', (req, res, next) => {
  // Log the request for debugging
  console.log(`Upload request for: ${req.url}`);
  
  // Set the correct content type based on file extension
  if (req.url.endsWith('.png')) {
    res.setHeader('Content-Type', 'image/png');
  } else if (req.url.endsWith('.jpg') || req.url.endsWith('.jpeg')) {
    res.setHeader('Content-Type', 'image/jpeg');
  }
  
  // Serve the file from the uploads directory
  express.static(path.join(process.cwd(), 'uploads'))(req, res, next);
});

// Serve static files from the React app in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../../client/build')));

  // The "catchall" handler: for any request that doesn't
  // match one above, send back React's index.html file.
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../../client/build/index.html'));
  });
}

// Health check route
app.get('/', (req, res) => {
  res.send('GeoPrep API is running');
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.log(`Error: ${err}`);
  // Close server & exit process
  process.exit(1);
});
