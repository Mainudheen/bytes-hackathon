const mongoose = require("mongoose");

const invigilatorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  empId: { type: String, unique: true, required: true },
  department: { type: String, default: "AI" },
  designation: { type: String, default: "Assistant Professor" },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports =
  mongoose.models.Invigilator ||
  mongoose.model("Invigilator", invigilatorSchema);
