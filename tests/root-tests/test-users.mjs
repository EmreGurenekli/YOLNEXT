import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Test users data
const testUsers = [
  {
    firstName: 'Ahmet',
    lastName: 'Yılmaz',
    email: 'ahmet.yilmaz@test.com',
    password: 'password123',
    userType: 'individual',
    phone: '5551234567'
  },
  {
    firstName: 'Mehmet',
    lastName: 'Kaya',
    email: 'mehmet.kaya@test.com',
    password: 'password123',
    userType: 'corporate',
    phone: '5559876543',
    companyName: 'Kaya Lojistik A.Ş.'
  },
  {
    firstName: 'Ayşe',
    lastName: 'Demir',
    email: 'ayse.demir@test.com',
    password: 'password123',
    userType: 'nakliyeci',
    phone: '5554567890',
    companyName: 'Demir Nakliyat'
  },
  {
    firstName: 'Fatma',
    lastName: 'Şahin',
    email: 'fatma.sahin@test.com',
    password: 'password123',
    userType: 'tasiyici',
    phone: '5553210987'
  }
];

// Function to hash password
async function hashPassword(password) {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
}

// Function to generate JWT token
function generateToken(user) {
  return jwt.sign(
    { 
      userId: user.id, 
      email: user.email, 
      userType: user.userType 
    },
    process.env.JWT_SECRET || 'test_secret',
    { expiresIn: '7d' }
  );
}

// Generate test users with hashed passwords
async function generateTestUsers() {
  console.log('Generating test users...');
  
  const usersWithHashedPasswords = [];
  
  for (const user of testUsers) {
    const hashedPassword = await hashPassword(user.password);
    const userWithHash = {
      ...user,
      password: hashedPassword,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    usersWithHashedPasswords.push(userWithHash);
  }
  
  // Save to file
  const outputPath = path.join(process.cwd(), 'test-users.json');
  fs.writeFileSync(outputPath, JSON.stringify(usersWithHashedPasswords, null, 2));
  
  console.log(`Test users generated and saved to ${outputPath}`);
  
  // Generate tokens for each user
  const usersWithTokens = usersWithHashedPasswords.map(user => ({
    ...user,
    token: generateToken(user)
  }));
  
  const tokensPath = path.join(process.cwd(), 'test-tokens.json');
  fs.writeFileSync(tokensPath, JSON.stringify(usersWithTokens, null, 2));
  
  console.log(`Test tokens generated and saved to ${tokensPath}`);
  
  // Print user information
  console.log('\nTest Users Information:');
  usersWithTokens.forEach(user => {
    console.log(`\n${user.userType.toUpperCase()}:`);
    console.log(`  Name: ${user.firstName} ${user.lastName}`);
    console.log(`  Email: ${user.email}`);
    console.log(`  Phone: ${user.phone}`);
    console.log(`  Company: ${user.companyName || 'N/A'}`);
    console.log(`  Token: ${user.token.substring(0, 20)}...`);
  });
}

// Run the script
generateTestUsers().catch(console.error);