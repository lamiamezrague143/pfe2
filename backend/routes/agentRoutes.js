
const { sequelize } = require('../config/db');
const express = require("express");
const router = express.Router();
const Agent = require("../models/Agent");

// GET ALL
router.get("/", async (req, res) => {
  const agents = await Agent.findAll();
  res.json(agents);
});

// POST
router.post("/", async (req, res) => {
  const agent = await Agent.create(req.body);
  res.json(agent);
});

module.exports = router;