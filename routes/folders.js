import express from 'express';
import jwt from 'jsonwebtoken';
import Folder from '../models/Folder.js';
import mongoose from 'mongoose';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'academic-hub-secret-key';

// Middleware to verify token
const verifyToken = async (req, res, next) => {
  try {
    let token = req.headers.authorization?.split(' ')[1];
    if (!token || token === 'null' || token === 'undefined') {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.id;
    req.userRole = decoded.role;
    next();
  } catch (error) {
    console.error('verifyToken error:', error.message);
    res.status(401).json({ message: 'Invalid token' });
  }
};

// Get all public folders
router.get('/public', async (req, res) => {
  try {
    const folders = await Folder.find({ isPublic: true })
      .populate('createdBy', 'name')
      .sort({ resourceCount: -1, createdAt: -1 });

    res.json(folders);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get root folders (only outer folders)
router.get('/root', async (req, res) => {
  try {
    const folders = await Folder.aggregate([
      { $match: { parentFolder: null } },
      {
        $lookup: {
          from: "folders",
          localField: "_id",
          foreignField: "parentFolder",
          as: "subfolders"
        }
      },
      {
        $addFields: {
          subfolderCount: { $size: "$subfolders" }
        }
      }
    ]);

    res.json(folders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all folders
router.get('/', verifyToken, async (req, res) => {
  try {
    const folders = await Folder.find()
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });

    res.json(folders);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get user's own folders
router.get('/my-folders', verifyToken, async (req, res) => {
  try {
    const folders = await Folder.find({ createdBy: req.userId })
      .sort({ createdAt: -1 });

    res.json(folders);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create new folder
router.post('/', verifyToken, async (req, res) => {
  try {
    const { name, description, isPublic, parentFolder } = req.body;
    console.log('folder creation request by', req.userId, 'body', req.body);

    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Folder name is required' });
    }

    const folder = new Folder({
  name: name.trim(),
  description: description || '',
  createdBy: req.userId,
  isPublic: isPublic !== undefined ? isPublic : true,
  parentFolder: parentFolder || null
});

    await folder.save();
    res.status(201).json(folder);
  } catch (error) {
    console.error('folder create error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update folder
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const { name, description, isPublic } = req.body;

    const folder = await Folder.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.userId },
      { name, description, isPublic },
      { new: true }
    );

    if (!folder) {
      return res.status(404).json({ message: 'Folder not found or unauthorized' });
    }

    res.json(folder);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete folder (admin only)
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    if (req.userRole !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const folder = await Folder.findByIdAndDelete(req.params.id);
    if (!folder) {
      return res.status(404).json({ message: 'Folder not found' });
    }

    res.json({ message: 'Folder deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get subfolders of a folder
router.get('/parent/:id', async (req, res) => {
  try {

    const folders = await Folder.aggregate([
      { $match: { parentFolder: new mongoose.Types.ObjectId(req.params.id) } },
      {
        $lookup: {
          from: "folders",
          localField: "_id",
          foreignField: "parentFolder",
          as: "subfolders"
        }
      },
      {
        $addFields: {
          subfolderCount: { $size: "$subfolders" }
        }
      }
    ]);

    res.json(folders);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
