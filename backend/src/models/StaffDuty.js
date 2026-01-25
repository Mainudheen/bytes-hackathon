const mongoose = require("mongoose");

const StaffDutySchema = new mongoose.Schema(
  {
    staffId: { type: String, required: true }, // Employee ID
    staffName: { type: String, required: true },
    allocationId: { type: mongoose.Schema.Types.ObjectId, ref: "Allocation", required: true },
    
    examName: String,
    catNumber: String,
    subjectCode: String,
    subjectName: String,
    examDate: { type: Date, required: true },
    session: { type: String, enum: ["FN", "AN"], required: true },
    hallNumber: String,
    year: String,
    semester: String,
    
    dutyStartTime: String, // e.g., "09:30"
    dutyEndTime: String,   // e.g., "12:30"
    dutyHours: { type: Number, default: 0 },
    
    allocationCreatedDate: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Index for quick lookups
StaffDutySchema.index({ staffId: 1 });
StaffDutySchema.index({ staffName: 1 });
StaffDutySchema.index({ allocationId: 1 });

module.exports = mongoose.model("StaffDuty", StaffDutySchema);
