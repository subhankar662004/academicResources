import mongoose from "mongoose";

const questionSchema = new mongoose.Schema({
  testId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Test"
  },
  title: String,
  options: [String],
  answer: String
});

const Question = mongoose.model("Question", questionSchema);

export default Question;