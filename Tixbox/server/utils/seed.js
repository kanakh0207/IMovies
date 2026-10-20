// npm run seed  -> creates the admin account + sample movie, theatre and shows
require('dotenv').config();
const mongoose = require('mongoose');
const Admin = require('../models/adminModel');
const Movie = require('../models/movieModel');
const Theatre = require('../models/theatreModel');
const Show = require('../models/showModel');

(async () => {
  await mongoose.connect(process.env.MONGO_URI);

  if (!(await Admin.findOne({ email: process.env.ADMIN_EMAIL.toLowerCase() }))) {
    await Admin.create({ name: process.env.ADMIN_NAME, email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD });
    console.log(`Admin created: ${process.env.ADMIN_EMAIL} / ${process.env.ADMIN_PASSWORD}`);
  } else console.log('Admin already exists');

  if (!(await Movie.countDocuments())) {
    const day = 24 * 3600 * 1000;
    const movies = await Movie.insertMany([
      { title: 'Space Voyagers', description: 'A crew races to save humanity.', genre: ['Sci-Fi', 'Adventure'], language: 'English', duration: 140, director: 'A. Rao', cast: [{ name: 'Ravi Kumar', role: 'Captain' }, { name: 'Mina Shah', role: 'Pilot' }], releaseDate: new Date(Date.now() - 7 * day) },
      { title: 'Monsoon Melody', description: 'A musical love story.', genre: ['Romance', 'Drama'], language: 'Hindi', duration: 125, director: 'S. Mehta', cast: [{ name: 'Anaya Singh', role: 'Meera' }], releaseDate: new Date(Date.now() - 2 * day) },
      { title: 'Future Strike', description: 'Coming soon!', genre: ['Action'], language: 'Hindi', duration: 150, releaseDate: new Date(Date.now() + 30 * day) },
    ]);

    const theatre = await Theatre.create({
      name: 'iMovies Cinemas', city: 'Indore', address: 'MG Road',
      screens: [{ name: 'Screen 1', layout: [
        { row: 'A', seats: 10, type: 'Regular' }, { row: 'B', seats: 10, type: 'Regular' },
        { row: 'C', seats: 10, type: 'Premium' }, { row: 'D', seats: 8, type: 'Recliner' },
      ] }],
    });
    const screen = theatre.screens[0];

    let hour = 24;
    for (const m of movies.slice(0, 2)) {
      const start = new Date(Date.now() + hour * 3600 * 1000);
      await Show.create({ movie: m._id, theatre: theatre._id, screenId: screen._id, screenName: screen.name, startTime: start, endTime: new Date(start.getTime() + (m.duration + 15) * 60000) });
      hour += 5;
    }
    console.log('Sample movies, theatre and shows created');
  } else console.log('Data already present, skipping samples');

  await mongoose.disconnect();
})().catch((e) => { console.error(e); process.exit(1); });
