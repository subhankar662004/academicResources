import mongoose from "mongoose";

const resultSchema = new mongoose.Schema({
  userId: String,
  testId: String,
  score: Number,
  total: Number,
  answers: Object
});

const Result = mongoose.model("Result", resultSchema);

export default Result;