const express = require('express');
const router = express.Router();
const {handleregister,handlelogin,getProfile,updateSkills} = require('../controllers/authController');
const {verifyJWT} = require("../middleware/verifyJWT")

router.post('/register' , handleregister);
router.post('/login' , handlelogin);
router.get("/profile", verifyJWT, getProfile);
router.patch("/skills", verifyJWT, updateSkills);

module.exports = router ;
