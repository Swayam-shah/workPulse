const express = require("express");
const router = express.Router();

const { getCompany } = require("../controllers/companyController");
const authMiddleware = require("../middleware/authMiddleware");

router.get("/", authMiddleware, getCompany);

module.exports = router;