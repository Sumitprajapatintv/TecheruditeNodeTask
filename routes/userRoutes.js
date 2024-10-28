import express from 'express';
import { registerCustomer,registerAdmin,verifyEmail,adminLogin } from '../controllers/userController.js';

const router = express.Router();

router.post('/register/customer', registerCustomer);
router.post('/register/admin', registerAdmin);
router.get('/verify/:token', verifyEmail);
router.post('/login/admin', adminLogin);


export default router;