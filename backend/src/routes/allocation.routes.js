const express = require("express");
const router = express.Router();
const controller = require("../controllers/allocation.controller");

router.post("/save", controller.saveAllocations);
router.get("/", controller.getAllocations);
router.get("/:rollno", controller.getStudentAllocation);
router.put("/:id", controller.updateAllocation);
router.put("/:id/update-invigilators", controller.updateInvigilators);
router.delete("/:id", controller.deleteAllocation);

module.exports = router;
