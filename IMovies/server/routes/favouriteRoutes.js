const router = require('express').Router();
const c = require('../controllers/favouriteController');
const { protect, userOnly } = require('../middleware/authMiddleware');
const validateId = require('../middleware/validateObjectId');

router.use(protect, userOnly);

router.get('/', c.getFavourites);
router.post('/', c.addFavourite);
router.delete('/:movieId', validateId('movieId'), c.removeFavourite);

module.exports = router;
