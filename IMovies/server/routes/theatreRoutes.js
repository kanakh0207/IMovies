const router = require('express').Router();
const c = require('../controllers/theatreController');
const { protect, adminOnly } = require('../middleware/authMiddleware');
const validateId = require('../middleware/validateObjectId');

router.get('/', c.getTheatres);
router.get('/:id', validateId(), c.getTheatre);

router.post('/', protect, adminOnly, c.createTheatre);
router.put('/:id', protect, adminOnly, validateId(), c.updateTheatre);
router.delete('/:id', protect, adminOnly, validateId(), c.deleteTheatre);

// screens
router.post('/:id/screens', protect, adminOnly, validateId(), c.addScreen);
router.put('/:id/screens/:screenId', protect, adminOnly, validateId(), validateId('screenId'), c.updateScreen);
router.delete('/:id/screens/:screenId', protect, adminOnly, validateId(), validateId('screenId'), c.deleteScreen);

module.exports = router;
