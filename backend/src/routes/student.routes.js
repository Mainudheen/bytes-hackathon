const express = require("express");
const multer = require("multer");
const router = express.Router();
const controller = require("../controllers/student.controller");
const upload = multer({ dest: "uploads/" });

router.post("/add", controller.addStudent);
router.post("/upload", upload.single("file"), controller.uploadStudents);
router.delete("/delete/:rollno", controller.deleteStudent);
router.delete("/delete-by-year/:year", controller.deleteByYear);
router.delete("/delete-by-class/:className", controller.deleteByClass);
router.get("/get/:rollno", controller.getStudent);
router.get("/:className/:year", controller.getClassStudents);
router.post("/login", controller.studentLogin);

module.exports = router;
