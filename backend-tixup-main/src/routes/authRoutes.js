const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");


router.post("/cadastro", authController.cadastro);

router.post("/login", authController.login);

router.post("/login-firebase", authController.loginFirebase);

module.exports = router;
