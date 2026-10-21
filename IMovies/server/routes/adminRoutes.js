const router = require('express').Router();
const c = require('../controllers/adminController');
const { protect, adminOnly } = require('../middleware/authMiddleware');
const validateId = require('../middleware/validateObjectId');

router.post('/login', c.adminLogin);

router.use(protect, adminOnly);

router.get('/dashboard', c.getDashboard);
router.get('/users', c.getUsers);
router.get('/users/:id', validateId(), c.getUser);
router.put('/users/:id', validateId(), c.updateUser);
router.delete('/users/:id', validateId(), c.deleteUser);
router.get('/bookings', c.getAllBookings);

module.exports = router;
