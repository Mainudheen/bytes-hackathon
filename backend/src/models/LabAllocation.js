const mongoose = require("mongoose");

const LabAllocationSchema = new mongoose.Schema({
  lab: { type: String, required: true },
  examName: { type: String, required: true },
  examDate: { type: Date, required: true },
  session: { type: String, enum: ["FN", "AN"], required: true },
  time: { type: String, required: true },
  year: { type: String, enum: ["II", "III", "IV"], required: true },
  totalStudents: { type: Number, default: 0 },

  rollStart: { type: String, required: true },
  rollEnd: { type: String, required: true },

  classNames: { type: String, default: "" },

  invigilators: {
    type: [String],
    validate: arr => arr.length === 2,
    required: true
  },

  expiryDate: {
    type: Date,
    required: true,
    index: { expires: 0 }
  }

}, { timestamps: true });

module.exports = mongoose.model("LabAllocation", LabAllocationSchema);
