const Student = require("../models/Student");
const XLSX = require("xlsx");
const fs = require("fs");
const { excelDateToDDMMYYYY, isRollInRange, isRollInStringRange } = require("../utils/studentUtils");
const Allocation = require("../models/Allocation");
const LabAllocation = require("../models/LabAllocation");

// Add single student
exports.addStudent = async (req, res) => {
  try {
    const { name, rollno, className, year, dob } = req.body;
    const newStudent = new Student({
      name,
      rollno: rollno.toUpperCase(),
      className: className.toUpperCase(),
      year,
      password: dob,
    });
    await newStudent.save();
    res.status(201).json({ message: "Student added successfully" });
  } catch (err) {
    console.error("Add student error:", err);
    res.status(500).json({ message: "Failed to add student" });
  }
};

// Bulk upload students via Excel
exports.uploadStudents = async (req, res) => {
  try {
    const workbook = XLSX.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const sheetData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

    const students = sheetData.map((row) => ({
      name: row.name,
      rollno: String(row.rollno).toUpperCase(),
      className: String(row.className).toUpperCase(),
      year: String(row.year),
      password: excelDateToDDMMYYYY(row.dob),
    }));

    await Student.insertMany(students);
    fs.unlinkSync(req.file.path);
    res.status(201).json({ message: "Students uploaded successfully" });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ message: "Failed to upload students" });
  }
};

// Delete student by roll number
exports.deleteStudent = async (req, res) => {
  try {
    const roll = req.params.rollno.toUpperCase();
    await Student.deleteOne({ rollno: roll });
    res.status(200).json({ message: `Student ${roll} deleted` });
  } catch (err) {
    console.error("Delete student error:", err);
    res.status(500).json({ message: "Failed to delete student" });
  }
};

// Delete students by year
exports.deleteByYear = async (req, res) => {
  try {
    const year = req.params.year.trim();
    const result = await Student.deleteMany({ year });
    res.status(200).json({ message: `${result.deletedCount} students deleted from year ${year}` });
  } catch (err) {
    console.error("Delete by year error:", err);
    res.status(500).json({ message: "Failed to delete students" });
  }
};

// Delete students by class
exports.deleteByClass = async (req, res) => {
  try {
    const cls = req.params.className.trim().toUpperCase();
    const result = await Student.deleteMany({ className: cls });
    res.status(200).json({ message: `${result.deletedCount} students deleted from class ${cls}` });
  } catch (err) {
    console.error("Delete by class error:", err);
    res.status(500).json({ message: "Failed to delete students" });
  }
};

// Get student by rollno
exports.getStudent = async (req, res) => {
  try {
    const student = await Student.findOne({ rollno: req.params.rollno.toUpperCase() });
    if (!student) return res.status(404).send(null);
    res.send(student);
  } catch (err) {
    res.status(500).send(err);
  }
};

// Get class students
exports.getClassStudents = async (req, res) => {
  const { className, year } = req.params;
  try {
    const students = await Student.find({
      className: className.trim().toUpperCase(),
      year: year.trim(),
    }).sort({ rollno: 1 });
    if (!students || students.length === 0) {
      return res.status(404).json({ message: "No students found" });
    }
    res.status(200).json(students);
  } catch (err) {
    console.error("Fetch class students error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Student Login
exports.studentLogin = async (req, res) => {
  const { name, rollno, className, year, password } = req.body;

  if (!rollno || !name || !className || !year || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const roll = rollno.trim().toUpperCase();
    const cls = className.trim().toUpperCase();
    const yr = year.trim();
    const pwd = password.trim();
    const nm = name.trim();

    const student = await Student.findOne({
      rollno: roll,
      className: cls,
      password: pwd,
      year: yr,
      name: { $regex: new RegExp(`^${nm}$`, "i") },
    });

    if (!student) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Fetch allocations
    const allocations = await Allocation.find({});
    const matched = allocations.filter(
      (a) =>
        (a.rollStart && a.rollEnd && isRollInRange(roll, a.rollStart, a.rollEnd)) ||
        (a.rollNumbers && isRollInStringRange(roll, a.rollNumbers))
    );

    const matchedWithBench = matched.map((a) => {
      const allocatedStudent = a.students.find(
        (s) => s.rollno && s.rollno.toUpperCase() === roll
      );
      return {
        ...a._doc,
        benchPosition: allocatedStudent
          ? {
              row: allocatedStudent.row,
              col: allocatedStudent.col,
              benchNo: allocatedStudent.benchNo,
            }
          : null,
      };
    });

    // Lab allocations
    const labAllocations = await LabAllocation.find({});
    const matchedLabAllocations = labAllocations.filter(
      (a) => a.rollStart && a.rollEnd && isRollInRange(roll, a.rollStart, a.rollEnd)
    );

    res.status(200).json({
      message: "Login successful",
      student,
      allocations: [...matchedWithBench, ...matchedLabAllocations],
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
