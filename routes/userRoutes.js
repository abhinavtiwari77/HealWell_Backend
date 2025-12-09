const express = require("express");
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/:id',userController.getUserById);
router.get('/',userController.searchUsers);
router.get('/me',authMiddleware,userController.getMyProfile);
router.put('/me',authMiddleware,userController.updateMyProfile);
router.post('/:id/follow',authMiddleware,userController.toggleFollow);

module.exports = router;