const express = require("express");
const router = express.Router();
const controller = require("../controllers/room.controller");

router.get("/", controller.getRooms);
router.get("/:roomNo", controller.getRoomByNo);
router.post("/", controller.addRoom);
router.put("/:id", controller.updateRoom);
router.delete("/:id", controller.deleteRoom);

module.exports = router;
