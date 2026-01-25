require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const studentRoutes = require("./routes/student.routes");
const roomRoutes = require("./routes/room.routes");
const allocationRoutes = require("./routes/allocation.routes");
const labRoutes = require("./routes/lab.routes");
const staffDutyRoutes = require("./routes/staffDuty.routes");

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request Logging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

const studentController = require("./controllers/student.controller");
const allocationController = require("./controllers/allocation.controller");
const labController = require("./controllers/lab.controller");
const staffDutyController = require("./controllers/staffDuty.controller");

// Legacy/Flat API Aliases (Move UP to ensure they are caught)
app.post("/api/student-login", studentController.studentLogin);
app.post("/api/save-allocations", allocationController.saveAllocations);
app.get("/api/allocation/:rollno", allocationController.getStudentAllocation);
app.post("/api/save-lab-allocations", labController.saveLabAllocations);
app.get("/api/lab-allocations", labController.getLabAllocations);
app.get("/api/allocations", allocationController.getAllocations);
app.put("/api/allocation/:id", allocationController.updateAllocation);
app.put("/api/allocations/:id/update-invigilators", allocationController.updateInvigilators);
app.delete("/api/allocations/:id", allocationController.deleteAllocation);
app.delete("/api/lab-allocations/:id", labController.deleteLabAllocation);

// Modular Routes
app.use("/api/students", studentRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/allocations", allocationRoutes);
app.use("/api/labs", labRoutes);
app.use("/api/staff-duties", staffDutyRoutes);

app.get("/", (req, res) => {
  res.send("🚀 Room Allocation API is running");
});

app.listen(PORT, () => {
  console.log(`🔵 Server running at http://localhost:${PORT}`);
});
