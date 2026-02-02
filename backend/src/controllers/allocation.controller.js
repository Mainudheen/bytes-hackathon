const Allocation = require("../models/Allocation");
const LabAllocation = require("../models/LabAllocation");
const { validateAllocationsYears, validateRoomYears } = require("../utils/allocationValidators");
const staffDutyController = require("./staffDuty.controller");

// Save allocations
exports.saveAllocations = async (req, res) => {
  try {
    let allocations = [];
    if (!req.body.allocations) {
      allocations = [req.body];
    } else {
      allocations = req.body.allocations;
    }

    const allocationsWithExpiry = allocations.map((allocation) => {
      let rollNumbers = allocation.rollNumbers || "";
      let rollStart = allocation.rollStart || null;
      let rollEnd = allocation.rollEnd || null;
      let students = [];

      // Case A: frontend sends studentPositions
      if (Array.isArray(allocation.studentPositions) && allocation.studentPositions.length > 0) {
        students = allocation.studentPositions.map((s, idx) => ({
          name: s.name || "",
          rollno: s.roll || "",
          row: s.row || null,
          col: s.col || null,
          benchNo: s.benchNo || idx + 1,
          class: s.class || null,
          department: s.department || null,
          originalSheetName: s.originalSheetName || null,
        }));
        rollNumbers = students.map((s) => s.rollno).join(",");
        rollStart = students[0]?.rollno || null;
        rollEnd = students[students.length - 1]?.rollno || null;
      }
      // Case B: assignedStudents
      else if (Array.isArray(allocation.assignedStudents) && allocation.assignedStudents.length > 0) {
        const assignedStudents = allocation.assignedStudents;
        const assignedStudentNames = Array.isArray(allocation.assignedStudentsName)
          ? allocation.assignedStudentsName
          : [];

        let rollIndex = 0;
        const totalRows = allocation.rows || 5;
        const totalCols = allocation.columns || 5;

        for (let c = 1; c <= totalCols; c++) {
          for (let r = 1; r <= totalRows; r++) {
            if (rollIndex >= assignedStudents.length) break;
            students.push({
              name: assignedStudentNames[rollIndex] || "",
              rollno: assignedStudents[rollIndex],
              row: r,
              col: c,
              benchNo: rollIndex + 1,
            });
            rollIndex++;
          }
        }
        rollNumbers = assignedStudents.join(",");
        rollStart = assignedStudents[0];
        rollEnd = assignedStudents[assignedStudents.length - 1];
      }

      return {
        ...allocation,
        examName: allocation.subjectWithCode || allocation.examName,
        rollNumbers,
        rollStart,
        rollEnd,
        totalStudents: students.length || allocation.totalStudents || 0,
        students,
        expiryDate: new Date(new Date(allocation.examDate).getTime() + 3 * 24 * 60 * 60 * 1000),
      };
    });

    try {
      await validateRoomYears(allocationsWithExpiry, { model: Allocation, keyField: "room" });
      await validateAllocationsYears(allocationsWithExpiry);
    } catch (validationErr) {
      console.error("Allocation validation error:", validationErr);
      return res.status(400).json({ message: validationErr.message });
    }

    const savedAllocations = await Allocation.insertMany(allocationsWithExpiry);

    // Sync Staff Duties
    for (const saved of savedAllocations) {
      await staffDutyController.syncAllocationDuties(saved);
    }

    res.status(200).json({
      message: "Allocations saved with seating info",
      allocations: allocationsWithExpiry,
    });
  } catch (err) {
    console.error("Saving allocations error:", err);
    res.status(500).json({ message: "Failed to save allocations", error: err.message });
  }
};

// Get current allocations
exports.getAllocations = async (req, res) => {
  try {
    const now = new Date();
    const allocations = await Allocation.find({ expiryDate: { $gte: now } });
    res.status(200).json(allocations);
  } catch (err) {
    console.error("Fetch all allocations error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Get allocation for a student
exports.getStudentAllocation = async (req, res) => {
  const roll = req.params.rollno.trim().toUpperCase();
  try {
    const allocations = await Allocation.find({});
    const labAllocations = await LabAllocation.find({});

    function findStudentInAllocation(allocation, roll) {
      if (allocation.students && allocation.students.length > 0) {
        return allocation.students.find((s) => (s.rollno || s.roll || "").toUpperCase() === roll) || null;
      }
      return null;
    }

    const matched = allocations
      .map((a) => {
        const student = findStudentInAllocation(a, roll);
        if (student) {
          return {
            ...a._doc,
            studentInfo: {
              roll: student.rollno || student.roll,
              name: student.name,
              row: student.row,
              col: student.col,
              benchNo: student.benchNo,
            },
          };
        }
        return null;
      })
      .filter((a) => a !== null);

    const matchedLab = labAllocations
      .map((a) => {
        const student = findStudentInAllocation(a, roll);
        if (student) {
          return {
            ...a._doc,
            studentInfo: {
              roll: student.rollno || student.roll,
              name: student.name,
              row: student.row,
              col: student.col,
              benchNo: student.benchNo,
            },
          };
        }
        return null;
      })
      .filter((a) => a !== null);

    const combined = [...matched, ...matchedLab];
    if (combined.length > 0) {
      res.status(200).json(combined);
    } else {
      res.status(404).json({ message: "No allocation found" });
    }
  } catch (err) {
    console.error("Fetch error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Update allocation
exports.updateAllocation = async (req, res) => {
  try {
    const updated = await Allocation.findByIdAndUpdate(req.params.id, { ...req.body }, { new: true });
    
    // Sync Staff Duties on Update
    if (updated) {
      await staffDutyController.syncAllocationDuties(updated);
    }

    res.status(200).json(updated);
  } catch (err) {
    console.error("Update error:", err);
    res.status(500).json({ message: "Failed to update allocation" });
  }
};

// Update invigilators
exports.updateInvigilators = async (req, res) => {
  try {
    const { id } = req.params;
    const { invigilators } = req.body;
    const updated = await Allocation.findByIdAndUpdate(id, { invigilators }, { new: true });

    // Sync Staff Duties on Invigilator Update
    if (updated) {
      await staffDutyController.syncAllocationDuties(updated);
    }

    res.status(200).json(updated);
  } catch (err) {
    console.error("Error updating invigilators:", err);
    res.status(500).json({ message: "Failed to update invigilators" });
  }
};

// Delete allocation
exports.deleteAllocation = async (req, res) => {
  try {
    const deleted = await Allocation.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Allocation not found" });

    // Remove Staff Duties on Delete
    await staffDutyController.removeAllocationDuties(req.params.id);

    res.status(200).json({ message: "Allocation deleted successfully" });
  } catch (err) {
    console.error("Delete allocation error:", err);
    res.status(500).json({ message: "Failed to delete allocation" });
  }
};
