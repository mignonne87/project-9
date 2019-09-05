//  Handles all routes for /api

const express = require("express");
const router = express.Router();

// setup a friendly greeting for the root route
router.get("/", (req, res) => {
    res.json({
      message: "Carla REST API project!"
    });
  });
// exports router
module.exports = router;