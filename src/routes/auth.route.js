const express = require('express');
const { register, login, getProfile, getAllProfiles } = require('../controllers/auth.controller');
const { authMiddleware, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/profile', authMiddleware, getProfile);
router.get('/get-users', authorize('DIRETOR'), authMiddleware, getAllProfiles);

module.exports = router;