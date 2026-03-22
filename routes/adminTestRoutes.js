import express from "express";
import Test from "../models/Test.js";
import Question from "../models/Question.js";

const router = express.Router();

// Create new test
router.post("/create", async (req, res) => {
  const test = new Test(req.body);
  await test.save();
  res.json(test);
});

// Get all tests (admin & user)
router.get("/", async (req, res) => {
  const tests = await Test.find();
  res.json(tests);
});

// Add question to a test
router.post("/:testId/question", async (req, res) => {
  const { testId } = req.params;
  const question = new Question({ ...req.body, testId });
  await question.save();
  res.json(question);
});

// Get all questions of a test (user)
router.get("/:testId/questions", async (req, res) => {
  const { testId } = req.params;
  const questions = await Question.find({ testId });
  res.json(questions);
});
// Delete test (admin only)
router.delete("/:id", async (req, res) => {
  try {

    await Test.findByIdAndDelete(req.params.id);

    // optional: delete all questions of this test
    await Question.deleteMany({ testId: req.params.id });

    res.json({ message: "Test deleted successfully" });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;