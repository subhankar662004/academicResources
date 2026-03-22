import mongoose from "mongoose";

const testSchema = new mongoose.Schema({
  title: String,
  description: String,

  duration: Number, // minutes

  startTime: Date,
  endTime: Date,

  createdBy: String
});

const Test = mongoose.model("Test", testSchema);

export default Test;