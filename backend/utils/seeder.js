const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const User = require('../models/User');
const Flat = require('../models/Flat');
const Payment = require('../models/Payment');

const connectDB = require('../config/db');

const seedDatabase = async () => {
  await connectDB();
  console.log('🌱 Seeding database...');

  // Clear existing data
  await User.deleteMany({});
  await Flat.deleteMany({});
  await Payment.deleteMany({});

  // Create Super Admin
  await User.create({
    username: 'superadmin',
    password: 'Admin@123',
    name: 'Super Administrator',
    role: 'super_admin',
    wing: null
  });
  console.log('✅ Super Admin created: superadmin / Admin@123');

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
    console.log(`✅ Wing Admin created: wing${wing.toLowerCase()} / Wing${wing}@123`);
  }

  // Create Flats (6 wings × 12 floors × 4 flats = 288 flats)
  // Owner names are LEFT EMPTY — admin will fill them in manually via the dashboard
  const flats = [];
  for (const wing of wings) {
    for (let floor = 1; floor <= 12; floor++) {
      for (let unit = 1; unit <= 4; unit++) {
        const flatNumber = `${floor}0${unit}`;
        flats.push({
          wing,
          floor,
          flatNumber: `${wing}${flatNumber}`,
          ownerName: '',        // ← intentionally empty; set manually via dashboard
          contactNumber: '',
          monthlyAmount: 2000
        });
      }
    }
  }

  const createdFlats = await Flat.insertMany(flats);
  console.log(`✅ Created ${createdFlats.length} flats (owner names are empty — add via dashboard)`);

  console.log('\n🎉 Database seeded successfully!');
  console.log('\n📋 LOGIN CREDENTIALS:');
  console.log('Super Admin: superadmin / Admin@123');
  wings.forEach(w => console.log(`Wing ${w} Admin: wing${w.toLowerCase()} / Wing${w}@123`));

  process.exit(0);
};

seedDatabase().catch(err => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
