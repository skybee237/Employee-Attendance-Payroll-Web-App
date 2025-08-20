const express = require("express");
const router = express.Router();
const { getSubordinateLeaves, getSubordinateJustifications } = require("../controllers/superiorController");

router.get("/leaves/:superiorId", getSubordinateLeaves);
router.get("/justifications/:superiorId", getSubordinateJustifications);

module.exports = router;
