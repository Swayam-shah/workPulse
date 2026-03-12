const Company = require("../models/Company");
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const generateCompanyCode = (name) => {
  const random = Math.floor(1000 + Math.random() * 9000);
  return name.toUpperCase() + random;
};

exports.register = async (req, res) => {

  try {

    const { name, email, password, companyName, companyCode } = req.body;

    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    let company;

    // JOIN COMPANY
    if (companyCode) {

      company = await Company.findOne({ code: companyCode });

      if (!company) {
        return res.status(400).json({ message: "Invalid company code" });
      }

    }
    // CREATE COMPANY
    else {

      const code = generateCompanyCode(companyName);

      company = await Company.create({
        name: companyName,
        code
      });

    }

    const role = companyCode ? "member" : "admin";

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      companyId: company._id,
      role
    });

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      token,
      companyCode: company.code,
      user
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }

};


exports.login = async (req, res) => {

  try {

    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }

};