const express = require("express");
const router = express.Router();

const { getCompany } = require("../controllers/companyController");
const { verifyToken } = require("../middleware/authMiddleware");

router.get("/", verifyToken, getCompany);

module.exports = router;