const express = require("express");
const router = express.Router();
const controller = require("../controllers/staffDuty.controller");

router.get("/", controller.getAllDuties);
router.get("/staff/:staffId", controller.getDutiesByStaffId);
router.get("/name/:staffName", controller.getDutiesByStaffName);
router.get("/stats", controller.getTotalHoursPerStaff);

module.exports = router;
