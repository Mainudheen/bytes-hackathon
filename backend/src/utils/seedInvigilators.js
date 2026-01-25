const mongoose = require("mongoose");
const Invigilator = require("../models/Invigilator");
require("dotenv").config({ path: ".env" });

const invigilatorList = [
  { name: "Dr.P.NATESAN", empId: "STF001" },
  { name: "Dr.R.S.LATHA", empId: "STF002" },
  { name: "Dr.R.RAJADEVI", empId: "STF003" },
  { name: "Dr.K.S.KALAIVANI", empId: "STF004" },
  { name: "Dr.S.KAYALVILI", empId: "STF005" },
  { name: "Dr.M.VIMALADEVI", empId: "STF006" },
  { name: "A.S.RENUGADEVI", empId: "STF007" },
  { name: "N.KANIMOZHI", empId: "STF008" },
  { name: "P.JAYASHARSHINI", empId: "STF009" },
  { name: "P.RAMYA", empId: "STF010" },
  { name: "J.CHARANYA", empId: "STF011" },
  { name: "S.KEERTHIKA", empId: "STF012" },
  { name: "S.PRIYANKA", empId: "STF013" },
  { name: "D.SATHYA", empId: "STF014" },
  { name: "R.THANGAMANI", empId: "STF015" },
  { name: "M.SRI KIRUTHIKA", empId: "STF016" },
  { name: "M.M.RAMYASRI", empId: "STF017" },
  { name: "N.KANNAN", empId: "STF018" },
  { name: "M.HARINI", empId: "STF019" },
  { name: "Dr.T.A.KARTHIKEYAN", empId: "STF020" },
  { name: "M.MOHANA ARASI", empId: "STF021" },
  { name: "N.VIGNESHWARAN", empId: "STF022" },
  { name: "S.GAYATHRI", empId: "STF023" },
  { name: "R.ARUNKUMAR", empId: "STF024" },
  { name: "Dr.M.MOHANASUNDARI", empId: "STF025" },
  { name: "Dr.R.R.RAJALAXMI", empId: "STF026" },
  { name: "Dr.C.NALINI", empId: "STF027" },
  { name: "Dr.K.LOGESWARAN", empId: "STF028" },
  { name: "Dr.K.SATHYA", empId: "STF029" },
  { name: "S.HAMSANANDHINI", empId: "STF030" },
  { name: "S.SANTHIYA", empId: "STF031" },
  { name: "S.BENIL JENNIFFER", empId: "STF032" },
  { name: "K.SENTHILVADIVU", empId: "STF033" },
  { name: "M.YOGA", empId: "STF034" },
  { name: "O.ABHILA ANJU", empId: "STF035" },
  { name: "M.NEELAMEGAN", empId: "STF036" },
  { name: "S.GOPINATH", empId: "STF037" },
  { name: "N.RENUKA", empId: "STF038" },
  { name: "R.SUBAPRIYA", empId: "STF039" },
  { name: "V.ARUN ANTONY", empId: "STF040" },
  { name: "A.VANMATHI", empId: "STF041" }
];

const seedHalls = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB for seeding...");

    for (const staff of invigilatorList) {
      await Invigilator.findOneAndUpdate(
        { empId: staff.empId },
        { ...staff, isActive: true },
        { upsert: true, new: true }
      );
    }

    console.log("✅ Staff directory seeded successfully!");
    process.exit();
  } catch (error) {
    console.error("❌ Seeding error:", error);
    process.exit(1);
  }
};

seedHalls();
