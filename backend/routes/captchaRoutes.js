
const express = require("express");
const router = express.Router();
const svgCaptcha = require("svg-captcha");

// GET CAPTCHA
router.get("/captcha", (req, res) => {
  const captcha = svgCaptcha.create({
    size: 4,
    noise: 3,
    color: true,
    background: "#f3f4f6"
  });

  req.session.captcha = captcha.text.toLowerCase();

  res.type("svg");
  res.status(200).send(captcha.data);
});

module.exports = router;