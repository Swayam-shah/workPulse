const Company = require("../models/Company");
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const generateCompanyCode = (name) => {
  const random = Math.floor(1000 + Math.random() * 9000);
  return name.toUpperCase().replace(/\s+/g, "") + random;
};

exports.register = async (req, res) => {
  try {
    const { name, email, password, companyName, companyCode } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "An account with this email already exists." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    let company;
    let role;
    let status;

    // ── JOIN COMPANY (new employee with code) ──────────────────────────────
    if (companyCode) {
      company = await Company.findOne({ code: companyCode });
      if (!company) {
        return res.status(400).json({ message: "Invalid company code. Please check with your admin." });
      }
      role   = "member";
      status = "pending"; // must wait for admin approval
    }
    // ── CREATE COMPANY (becomes admin immediately) ─────────────────────────
    else {
      if (!companyName || !companyName.trim()) {
        return res.status(400).json({ message: "Company name is required." });
      }
      const code = generateCompanyCode(companyName);
      company = await Company.create({ name: companyName, code });
      role   = "admin";
      status = "active";
    }

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      companyId: company._id,
      role,
      status,
    });

    // ── Pending employees do NOT get a token yet ───────────────────────────
    if (status === "pending") {
      return res.status(201).json({
        pending: true,
        message: "Registration successful! Your account is awaiting admin approval before you can log in.",
        companyName: company.name,
      });
    }

    // ── Admin / active user — issue token and log in ───────────────────────
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

    res.status(201).json({
      token,
      companyCode: company.code,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
      },
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
      return res.status(400).json({ message: "Invalid email or password." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password." });
    }

    // ── Status gate ────────────────────────────────────────────────────────
    if (user.status === "pending") {
      return res.status(403).json({
        pending: true,
        message: "Your account is awaiting admin approval. You will be notified once access is granted.",
      });
    }

    if (user.status === "rejected") {
      return res.status(403).json({
        rejected: true,
        message: "Your registration request was declined by the admin. Please contact your company administrator.",
      });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
      },
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};