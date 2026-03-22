import express from "express";
const router = express.Router();

// Example test routes
router.get("/", (req, res) => {
  res.json({ message: "Test route works!" });
});

// Add more test routes here

export default router;