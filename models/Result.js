import mongoose from "mongoose";

const resultSchema = new mongoose.Schema({
  userId: String,
  testId: String,
  score: Number,
  total: Number
});

const Result = mongoose.model("Result", resultSchema);

export default Result;