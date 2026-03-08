import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "./config/cloudinary.js";
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import resourceRoutes from './routes/resources.js';
import folderRoutes from './routes/folders.js';
import messageRoutes from './routes/messages.js';

dotenv.config();

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Ensure uploads directory exists
// import fs from 'fs';
// const uploadsDir = path.join(__dirname, 'uploads');
// if (!fs.existsSync(uploadsDir)) {
//   fs.mkdirSync(uploadsDir, { recursive: true });
// }

// Configure multer for file uploads (disk storage)
// const storage = multer.diskStorage({
//  destination: (req, file, cb) => {
//   cb(null, uploadsDir);
// },
//   filename: (req, file, cb) => {
//     const timestamp = Date.now();
//     cb(null, `${timestamp}-${file.originalname}`);
//   }
// });

// const upload = multer({ 
//   storage,
//   limits: { fileSize: 100 * 1024 * 1024 } 
//  100MB limit
// });

// Cloudinary storage configuration
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    const isImage = file.mimetype.startsWith("image/");
    const isPdf = file.mimetype === "application/pdf";
    const isDoc = file.mimetype.includes("document") || 
                  file.mimetype.includes("msword") ||
                  file.mimetype.includes("officedocument");
    const isPpt = file.mimetype.includes("presentation") ||
                  file.mimetype.includes("ms-powerpoint");
    
    // Extract original filename without extension
    const originalNameWithoutExt = file.originalname
  .replace(/\.[^/.]+$/, "")
  .replace(/\s+/g, "-");
    const ext = file.originalname.split('.').pop().toLowerCase();

    // For non-image files, use "raw" resource_type to preserve original format
    // For images, use "auto" to let Cloudinary optimize
    const resourceType = isImage ? "auto" : "raw";

   return {
  folder: "academic-resources",
  resource_type: resourceType,
  public_id: `${Date.now()}-${originalNameWithoutExt}.${ext}`, // filename + extension
  flags: isImage ? [] : ["attachment"], // Force download
};
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB limit
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files statically
// app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// app.use('/api/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/resources', resourceRoutes(upload));
app.use('/api/folders', folderRoutes);
app.use('/api/messages', messageRoutes);

// Root Route (Health Check)
app.get("/", (req, res) => {
  res.send("Backend is Live 🚀");
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Academic Resources Hub API is running' });
});

// Connect to MongoDB and start server
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGO_URI;

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    // Start server anyway for demo purposes
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT} (without MongoDB)`);
    });
  });

export default app;
