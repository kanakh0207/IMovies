const router = require('express').Router();
const c = require('../controllers/movieController');
const { protect, adminOnly } = require('../middleware/authMiddleware');
const validateId = require('../middleware/validateObjectId');

router.get('/', c.getMovies);
router.get('/:id', validateId(), c.getMovie);
router.post('/', protect, adminOnly, c.createMovie);
router.put('/:id', protect, adminOnly, validateId(), c.updateMovie);
router.delete('/:id', protect, adminOnly, validateId(), c.deleteMovie);

module.exports = router;
