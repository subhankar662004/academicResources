import dotenv from 'dotenv';
dotenv.config();

import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "./config/cloudinary.js";
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import resourceRoutes from './routes/resources.js';
import folderRoutes from './routes/folders.js';
import messageRoutes from './routes/messages.js';
import http from "http";
import { Server } from "socket.io";
import questionRoutes from './routes/questionRoutes.js';
import adminTestRoutes from './routes/adminTestRoutes.js';
import testSubmissionRoutes from './routes/testSubmission.js';
import aiTestRoutes from "./routes/aiTestRoutes.js";
// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:5173",
      "https://shubhankar66.netlify.app"
    ],
    methods: ["GET","POST"]
  }
});

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
const ext = file.originalname.split('.').pop();
const name = file.originalname
  .replace(/\.[^/.]+$/, "")
  .replace(/\s+/g, "-");

return {
  folder: "academic-resources",
  resource_type: isImage ? "image" : "raw",
  public_id: `${Date.now()}-${name}.${ext}`,
  flags: isImage ? [] : ["attachment"],
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

app.use('/api/questions', questionRoutes);  
app.use('/api/admin/tests', adminTestRoutes);    
app.use('/api/testSubmission', testSubmissionRoutes);  
app.use("/api/ai-tests", aiTestRoutes);

io.on("connection", (socket) => {

  console.log("User connected:", socket.id);

  socket.on("join", (userId) => {
    socket.join(userId);
    console.log("User joined room:", userId);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected");
  });

});

export const sendNotification = (userId, message) => {

  console.log("Sending notification to:", userId);

  io.to(userId).emit("newNotification", {
    message: message
  });

};

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
    server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    // Start server anyway for demo purposes
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT} (without MongoDB)`);
    });
  });

export default app;