const Theatre = require('../models/theatreModel');
const Show = require('../models/showModel');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

const findTheatre = async (id) => {
  const theatre = await Theatre.findOne({ _id: id, isActive: true });
  if (!theatre) throw new AppError('Theatre not found', 404);
  return theatre;
};

// GET /api/theatres?city=
exports.getTheatres = asyncHandler(async (req, res) => {
  const filter = { isActive: true };
  if (req.query.city) filter.city = { $regex: `^${req.query.city}$`, $options: 'i' };
  const theatres = await Theatre.find(filter).sort({ name: 1 });
  res.json({ success: true, count: theatres.length, theatres });
});

// GET /api/theatres/:id
exports.getTheatre = asyncHandler(async (req, res) => {
  res.json({ success: true, theatre: await findTheatre(req.params.id) });
});

// POST /api/theatres  (admin) - body may include screens: [{name, layout:[{row,seats,type}]}]
exports.createTheatre = asyncHandler(async (req, res) => {
  const theatre = await Theatre.create(req.body);
  res.status(201).json({ success: true, theatre });
});

// PUT /api/theatres/:id  (admin) - name / city / address only (screens have their own routes)
exports.updateTheatre = asyncHandler(async (req, res) => {
  const { name, city, address } = req.body;
  const theatre = await findTheatre(req.params.id);
  if (name) theatre.name = name;
  if (city) theatre.city = city;
  if (address !== undefined) theatre.address = address;
  await theatre.save();
  res.json({ success: true, theatre });
});

// DELETE /api/theatres/:id  (admin) - soft delete; blocked if future shows exist
exports.deleteTheatre = asyncHandler(async (req, res) => {
  const theatre = await findTheatre(req.params.id);
  const upcoming = await Show.countDocuments({ theatre: theatre._id, startTime: { $gt: new Date() }, isActive: true });
  if (upcoming) throw new AppError('Cannot delete a theatre that has upcoming shows. Delete those shows first.', 400);
  theatre.isActive = false;
  await theatre.save();
  res.json({ success: true, message: 'Theatre removed' });
});

// POST /api/theatres/:id/screens  (admin)
exports.addScreen = asyncHandler(async (req, res) => {
  const theatre = await findTheatre(req.params.id);
  theatre.screens.push(req.body);
  await theatre.save();
  res.status(201).json({ success: true, theatre });
});

// PUT /api/theatres/:id/screens/:screenId  (admin)
exports.updateScreen = asyncHandler(async (req, res) => {
  const theatre = await findTheatre(req.params.id);
  const screen = theatre.screens.id(req.params.screenId);
  if (!screen) throw new AppError('Screen not found', 404);

  if (req.body.layout) {
    const hasShows = await Show.exists({ screenId: screen._id, startTime: { $gt: new Date() }, isActive: true });
    if (hasShows) throw new AppError('Cannot change layout while the screen has upcoming shows', 400);
    screen.layout = req.body.layout;
  }
  if (req.body.name) screen.name = req.body.name;
  await theatre.save();
  res.json({ success: true, theatre });
});

// DELETE /api/theatres/:id/screens/:screenId  (admin)
exports.deleteScreen = asyncHandler(async (req, res) => {
  const theatre = await findTheatre(req.params.id);
  const screen = theatre.screens.id(req.params.screenId);
  if (!screen) throw new AppError('Screen not found', 404);
  const hasShows = await Show.exists({ screenId: screen._id, startTime: { $gt: new Date() }, isActive: true });
  if (hasShows) throw new AppError('Cannot delete a screen that has upcoming shows', 400);
  theatre.screens.pull(screen._id);
  await theatre.save();
  res.json({ success: true, theatre });
});
