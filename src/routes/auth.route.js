const express = require('express');
const { register, login, getProfile, getAllProfilesActive, updateRoleUser, updateStatusUser, getAllProfiles } = require('../controllers/auth.controller');
const { authMiddleware, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/profile', authMiddleware, getProfile);
router.get('/get-users-active', authMiddleware, authorize('DIRETOR'), getAllProfilesActive);
router.get('/get-all-users', authMiddleware, authorize('DIRETOR'), getAllProfiles);
router.put('/update-role/:id', authMiddleware, authorize('DIRETOR'), updateRoleUser)
router.put('/update-status/:id', authMiddleware, authorize('DIRETOR'), updateStatusUser)

module.exports = router;