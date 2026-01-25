const LabAllocation = require("../models/LabAllocation");
const { validateAllocationsYears, validateRoomYears } = require("../utils/allocationValidators");
const staffDutyController = require("./staffDuty.controller");

// Save lab allocations
exports.saveLabAllocations = async (req, res) => {
  try {
    const allocations = req.body.allocations.map((a) => ({
      ...a,
      expiryDate: new Date(new Date(a.examDate).getTime() + 3 * 24 * 60 * 60 * 1000),
    }));

    try {
      await validateRoomYears(allocations, { model: LabAllocation, keyField: "lab" });
      await validateAllocationsYears(allocations);
    } catch (validationErr) {
      console.error("Lab allocation validation error:", validationErr);
      return res.status(400).json({ message: validationErr.message });
    }

    const savedLabs = await LabAllocation.insertMany(allocations);

    // Sync Staff Duties
    for (const saved of savedLabs) {
      await staffDutyController.syncAllocationDuties(saved);
    }

    res.status(200).json({ message: "Lab allocations saved" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to save lab allocations" });
  }
};

// Get active lab allocations
exports.getLabAllocations = async (req, res) => {
  try {
    const now = new Date();
    const labAllocations = await LabAllocation.find({ expiryDate: { $gte: now } });
    res.status(200).json(labAllocations);
  } catch (err) {
    console.error("Fetch all lab allocations error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Update lab allocation
exports.updateLabAllocation = async (req, res) => {
  try {
    const updated = await LabAllocation.findByIdAndUpdate(req.params.id, { ...req.body }, { new: true });
    
    // Sync Staff Duties on Update
    if (updated) {
      await staffDutyController.syncAllocationDuties(updated);
    }

    res.status(200).json(updated);
  } catch (err) {
    console.error("Lab allocation update error:", err);
    res.status(500).json({ message: "Failed to update lab allocation" });
  }
};

// Update invigilators in lab allocation
exports.updateLabInvigilators = async (req, res) => {
  try {
    const { id } = req.params;
    const { invigilators } = req.body;
    const updated = await LabAllocation.findByIdAndUpdate(id, { invigilators }, { new: true });

    // Sync Staff Duties on Invigilator Update
    if (updated) {
      await staffDutyController.syncAllocationDuties(updated);
    }

    res.status(200).json(updated);
  } catch (err) {
    console.error("Error updating lab invigilators:", err);
    res.status(500).json({ message: "Failed to update lab invigilators" });
  }
};

// Delete lab allocation
exports.deleteLabAllocation = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await LabAllocation.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: "Lab allocation not found" });

    // Remove Staff Duties on Delete
    await staffDutyController.removeAllocationDuties(id);

    res.status(200).json({ message: "Lab allocation deleted successfully" });
  } catch (err) {
    console.error("Delete lab allocation error:", err);
    res.status(500).json({ message: "Failed to delete lab allocation" });
  }
};
