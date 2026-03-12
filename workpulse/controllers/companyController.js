const Company = require("../models/Company");

exports.getCompany = async (req, res) => {
  try {

    const company = await Company.findById(req.user.companyId);

    res.json(company);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};