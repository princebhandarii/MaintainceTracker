const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const User = require('../models/User');
const Flat = require('../models/Flat');
const Payment = require('../models/Payment');

const connectDB = require('../config/db');

const seedDatabase = async () => {
  try {
    await connectDB();

    console.log('🌱 Seeding database...');

    // Prevent duplicate seeding
    const existingAdmin = await User.findOne({
      username: 'superadmin'
    });

    if (existingAdmin) {
      console.log('✅ Database already seeded');
      process.exit(0);
    }

    // Create Super Admin
    await User.create({
      username: 'superadmin',
      password: 'Admin@123',
      name: 'Super Administrator',
      role: 'super_admin',
      wing: null
    });

    console.log('✅ Super Admin created');

    // Create Wing Admins
    const wings = ['A', 'B', 'C', 'D', 'E', 'F'];

    for (const wing of wings) {
      await User.create({
        username: `wing${wing.toLowerCase()}`,
        password: `Wing${wing}@123`,
        name: `${wing} Wing Admin`,
        role: 'wing_admin',
        wing
      });

      console.log(`✅ Wing ${wing} Admin created`);
    }

    // Create Flats
    const flats = [];

    for (const wing of wings) {
      for (let floor = 1; floor <= 12; floor++) {
        for (let unit = 1; unit <= 4; unit++) {

          const flatNumber = `${floor}0${unit}`;

          flats.push({
            wing,
            floor,
            flatNumber: `${wing}${flatNumber}`,
            ownerName: '',
            contactNumber: '',
            monthlyAmount: 2000
          });
        }
      }
    }

    await Flat.insertMany(flats);

    console.log('✅ Flats created');

    console.log('🎉 Database seeded successfully');

    process.exit(0);

  } catch (err) {

    console.error('❌ Seeding failed:', err);

    process.exit(1);
  }
};

seedDatabase();
