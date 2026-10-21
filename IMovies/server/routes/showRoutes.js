const router = require('express').Router();
const c = require('../controllers/showController');
const { protect, adminOnly } = require('../middleware/authMiddleware');
const validateId = require('../middleware/validateObjectId');

router.get('/', c.getShows);
router.get('/:id', validateId(), c.getShow);
router.post('/', protect, adminOnly, c.createShow);
router.put('/:id', protect, adminOnly, validateId(), c.updateShow);
router.delete('/:id', protect, adminOnly, validateId(), c.deleteShow);

module.exports = router;
