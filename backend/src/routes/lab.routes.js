const express = require("express");
const router = express.Router();
const controller = require("../controllers/lab.controller");

router.post("/save", controller.saveLabAllocations);
router.get("/", controller.getLabAllocations);
router.put("/:id", controller.updateLabAllocation);
router.put("/:id/update-invigilators", controller.updateLabInvigilators);
router.delete("/:id", controller.deleteLabAllocation);

module.exports = router;
