const StaffDuty = require("../models/StaffDuty");
const Invigilator = require("../models/Invigilator");

// Helper to calculate duty hours
const calculateHours = (session, start, end) => {
  if (start && end) {
    const startTime = new Date(`1970-01-01T${start}:00`);
    const endTime = new Date(`1970-01-01T${end}:00`);
    const diff = (endTime - startTime) / (1000 * 60 * 60);
    return diff > 0 ? diff : 0;
  }
  // Default values based on session
  if (session === "FN") return 3; // 9:30 - 12:30
  if (session === "AN") return 3; // 1:30 - 4:30
  return 0;
};

// GET all duties (Admin)
exports.getAllDuties = async (req, res) => {
  try {
    const duties = await StaffDuty.find().sort({ examDate: -1 });
    res.status(200).json(duties);
  } catch (err) {
    console.error("Fetch all duties error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// GET duties by staffId
exports.getDutiesByStaffId = async (req, res) => {
  try {
    const { staffId } = req.params;
    const duties = await StaffDuty.find({ staffId: staffId.toUpperCase() }).sort({ examDate: -1 });
    res.status(200).json(duties);
  } catch (err) {
    console.error("Fetch duties by staffId error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// GET duties by staffName
exports.getDutiesByStaffName = async (req, res) => {
  try {
    const { staffName } = req.params;
    const duties = await StaffDuty.find({ 
      staffName: { $regex: new RegExp(staffName, "i") } 
    }).sort({ examDate: -1 });
    res.status(200).json(duties);
  } catch (err) {
    console.error("Fetch duties by staffName error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// GET total duty hours per staff (Returns ALL registered staff + those with duties)
exports.getTotalHoursPerStaff = async (req, res) => {
  try {
    const allStaff = await Invigilator.find({ isActive: true });
    const now = new Date();

    const stats = await StaffDuty.aggregate([
      {
        $group: {
          _id: "$staffId",
          name: { $first: "$staffName" }, // Keep track of name for unregistered staff
          totalDuties: { $sum: 1 },
          totalHours: { $sum: "$dutyHours" },
          upcomingDuties: {
            $sum: {
              $cond: [{ $gte: ["$examDate", now] }, 1, 0]
            }
          }
        },
      }
    ]);

    const statsMap = stats.reduce((acc, curr) => {
      acc[curr._id] = curr;
      return acc;
    }, {});

    // Create a set of IDs already processed from official Invigilator list
    const processedIds = new Set();

    const result = allStaff.map(staff => {
      const id = staff.empId.toUpperCase();
      processedIds.add(id);
      
      const staffStats = statsMap[id] || {
        totalDuties: 0,
        totalHours: 0,
        upcomingDuties: 0
      };
      return {
        empId: staff.empId,
        staffName: staff.name,
        department: staff.department,
        designation: staff.designation,
        totalDuties: staffStats.totalDuties,
        totalHours: staffStats.totalHours,
        upcomingDuties: staffStats.upcomingDuties
      };
    });

    // Add staff who have duties but are not in the official Invigilator list
    stats.forEach(s => {
      if (s._id && s._id !== "N/A" && !processedIds.has(s._id.toUpperCase())) {
        result.push({
          empId: s._id,
          staffName: s.name,
          department: "External/Other",
          designation: "Invigilator",
          totalDuties: s.totalDuties,
          totalHours: s.totalHours,
          upcomingDuties: s.upcomingDuties
        });
      }
    });

    // Sort by name
    result.sort((a, b) => a.staffName.localeCompare(b.staffName));

    res.status(200).json(result);
  } catch (err) {
    console.error("Aggregation stats error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Internal helper for syncing duties (used by Allocation controller)
exports.syncAllocationDuties = async (allocation) => {
  try {
    // Delete existing duties for this allocation
    await StaffDuty.deleteMany({ allocationId: allocation._id });

    if (!allocation.invigilators || allocation.invigilators.length === 0) return;

    const dutyEntries = [];
    const startTime = allocation.session === "FN" ? "09:30" : "13:30";
    const endTime = allocation.session === "FN" ? "12:30" : "16:30";
    const hours = calculateHours(allocation.session, startTime, endTime);

    for (const invigilator of allocation.invigilators) {
      let staffId = "N/A";
      let staffName = invigilator;

      if (invigilator.includes("-")) {
        const parts = invigilator.split("-").map(p => p.trim());
        staffId = parts[0];
        staffName = parts[1];
      } else {
        // Try to lookup ID by name if not provided
        const found = await Invigilator.findOne({ name: { $regex: new RegExp(`^${invigilator}$`, "i") } });
        if (found) {
          staffId = found.empId;
          staffName = found.name;
        }
      }

      dutyEntries.push({
        staffId: staffId.toUpperCase(),
        staffName,
        allocationId: allocation._id,
        examName: allocation.examName,
        catNumber: allocation.cat,
        subjectCode: allocation.subjectWithCode?.split("-")[0]?.trim() || "",
        subjectName: allocation.subjectWithCode || "",
        examDate: new Date(allocation.examDate),
        session: allocation.session,
        hallNumber: allocation.room,
        year: allocation.year,
        semester: allocation.semester,
        dutyStartTime: startTime,
        dutyEndTime: endTime,
        dutyHours: hours,
        allocationCreatedDate: allocation.createdAt || new Date(),
      });
    }

    if (dutyEntries.length > 0) {
      await StaffDuty.insertMany(dutyEntries);
    }
  } catch (err) {
    console.error("Sync allocation duties error:", err);
  }
};

exports.removeAllocationDuties = async (allocationId) => {
  try {
    await StaffDuty.deleteMany({ allocationId });
  } catch (err) {
    console.error("Remove allocation duties error:", err);
  }
};
