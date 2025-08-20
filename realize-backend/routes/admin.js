const express = require("express");
const router = express.Router();
const { createEmployee, listEmployees } = require("../controllers/adminController");
const { getAllLeaves, getAllJustifications } = require("../controllers/adminController");

router.post("/create", createEmployee);           // Create employee
router.get("/employees", listEmployees);          // List all employees
router.get("/leaves", getAllLeaves);              // Admin sees all leaves
router.get("/justifications", getAllJustifications); // Admin sees all justifications

module.exports = router;
