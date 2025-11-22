const mongoose = require('mongoose');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

// this is an optional script to run one time so that the database is fed with the data from the json files in ../data
// in case you are using our atlas db you dont ave to run it
// if you are using a new URI you should run it once to populate the database with initial data
// make sure to put another MongoDB URI in your .env file if you are not using ours

// loading the models
const User = require('../src/models/User');
const Game = require('../src/models/Game');
const Review = require('../src/models/Review');
const UserGameList = require('../src/models/UserGameList');
const ActivityLog = require('../src/models/ActivityLog');

dotenv.config();

// initialize mongoose connection to the database
const connectDB = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('MongoDB Connected');
};

const seedData = async () => {
  try {
    await connectDB();

    // if anything exists delete it
    await User.deleteMany();
    await Game.deleteMany();
    await Review.deleteMany();
    await UserGameList.deleteMany();
    await ActivityLog.deleteMany();

    console.log('Data cleared');

    // Load and parse the json files
    let users = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/users.json'), 'utf-8'));
    let games = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/games.json'), 'utf-8'));
    let reviews = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/reviews.json'), 'utf-8'));
    let gameLists = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/userGameList.json'), 'utf-8'));
    let activities = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/activitiesLogs.json'), 'utf-8'));

    // Convert MongoDB Extended JSON format to plain strings for easier insertion
    users = users.map(user => ({
      ...user,
      _id: user._id.$oid,
      passwordHash: 'password123' // fast password for testing
    }));

    games = games.map(game => ({
      ...game,
      _id: game._id.$oid
    }));

    reviews = reviews.map(review => ({
      ...review,
      _id: review._id.$oid,
      userId: review.userId.$oid,
      gameId: review.gameId.$oid
    }));

    gameLists = gameLists.map(list => ({
      ...list,
      _id: list._id.$oid,
      userId: list.userId.$oid,
      wishlist: list.wishlist.map(w => ({
        gameId: w.gameId.$oid,
        addedAt: w.addedAt
      })),
      played: list.played.map(p => ({
        gameId: p.gameId.$oid,
        completedAt: p.completedAt
      }))
    }));

    activities = activities.map(activity => ({
      ...activity,
      _id: activity._id.$oid,
      userId: activity.userId.$oid,
      gameId: activity.gameId.$oid
    }));

    // insert the parsed data into the database, should take a few seconds then your database will be populated
    await User.insertMany(users);
    console.log('Users seeded');

    await Game.insertMany(games);
    console.log('Games seeded');

    await Review.insertMany(reviews);
    console.log('Reviews seeded');

    await UserGameList.insertMany(gameLists);
    console.log('Game lists seeded');

    await ActivityLog.insertMany(activities);
    console.log('Activities seeded');

    console.log('Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedData();
