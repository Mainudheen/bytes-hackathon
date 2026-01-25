const mongoose = require("mongoose");
const XLSX = require("xlsx");
require("dotenv").config();

const Student = require("../models/Student");

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB Connected");
    importExcel();
  });

function importExcel() {

  const workbook = XLSX.readFile("ml-students.xlsx");
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(sheet);

  const formatted = data.map(row => {

    let password = row.DOB;

    if (typeof password === "number") {
      const date = new Date((password - 25569) * 86400 * 1000);
      const d = String(date.getDate()).padStart(2, "0");
      const m = String(date.getMonth() + 1).padStart(2, "0");
      const y = date.getFullYear();
      password = `${d}-${m}-${y}`;
    }

    return {
      name: row.Name,
      rollno: row.RollNo.toUpperCase(),
      year: row.Year,
      className: row.ClassName,
      password
    };
  });

  Student.insertMany(formatted)
    .then(() => {
      console.log("✅ Students imported");
      mongoose.disconnect();
    })
    .catch(err => {
      console.error(err);
      mongoose.disconnect();
    });
}
