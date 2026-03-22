import express from "express";
import Result from "../models/Result.js";
import Question from "../models/Question.js";

const router = express.Router();

router.post("/submit/:testId", async (req, res) => {
  const { testId } = req.params;
  const { answers, userId } = req.body;

  const questions = await Question.find({ testId });
  let score = 0;

  questions.forEach(q => {
    if (answers[q._id] === q.answer) score++;
  });

  const result = new Result({
    userId,
    testId,
    score,
    total: questions.length,
    answers,
  });

  await result.save();
  res.json({ score, total: questions.length });
});

export default router;