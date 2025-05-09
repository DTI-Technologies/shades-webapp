import mongoose from 'mongoose';
import User from '../User';
import bcrypt from 'bcryptjs';

// Mock bcrypt
jest.mock('bcryptjs', () => ({
  genSalt: jest.fn().mockResolvedValue('salt'),
  hash: jest.fn().mockResolvedValue('hashedPassword'),
  compare: jest.fn().mockResolvedValue(true),
}));

describe('User Model', () => {
  // Connect to a test database before running tests
  beforeAll(async () => {
    await mongoose.connect('mongodb://localhost:27017/test-db');
  });

  // Clear the database after each test
  afterEach(async () => {
    await User.deleteMany({});
  });

  // Disconnect from the database after all tests
  afterAll(async () => {
    await mongoose.connection.close();
  });

  it('should create a new user', async () => {
    const userData = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
    };

    const user = new User(userData);
    const savedUser = await user.save();

    expect(savedUser._id).toBeDefined();
    expect(savedUser.name).toBe(userData.name);
    expect(savedUser.email).toBe(userData.email);
    expect(savedUser.role).toBe('user'); // Default role
    expect(savedUser.createdAt).toBeDefined();
    expect(savedUser.updatedAt).toBeDefined();
  });

  it('should hash the password before saving', async () => {
    const userData = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
    };

    const user = new User(userData);
    await user.save();

    expect(bcrypt.genSalt).toHaveBeenCalledWith(10);
    expect(bcrypt.hash).toHaveBeenCalledWith(userData.password, 'salt');
  });

  it('should not hash the password if it is not modified', async () => {
    const userData = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
    };

    const user = new User(userData);
    await user.save();

    // Reset the mock calls
    (bcrypt.genSalt as jest.Mock).mockClear();
    (bcrypt.hash as jest.Mock).mockClear();

    user.name = 'Updated Name';
    await user.save();

    expect(bcrypt.genSalt).not.toHaveBeenCalled();
    expect(bcrypt.hash).not.toHaveBeenCalled();
  });

  it('should compare passwords correctly', async () => {
    const userData = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
    };

    const user = new User(userData);
    await user.save();

    const isMatch = await user.comparePassword('password123');
    expect(isMatch).toBe(true);
    expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashedPassword');
  });

  it('should validate required fields', async () => {
    const user = new User({});

    try {
      await user.validate();
    } catch (error: any) {
      expect(error.errors.name).toBeDefined();
      expect(error.errors.email).toBeDefined();
    }
  });

  it('should validate email format', async () => {
    const user = new User({
      name: 'Test User',
      email: 'invalid-email',
      password: 'password123',
    });

    try {
      await user.validate();
    } catch (error: any) {
      expect(error.errors.email).toBeDefined();
    }
  });

  it('should enforce unique email constraint', async () => {
    const userData = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
    };

    const user1 = new User(userData);
    await user1.save();

    const user2 = new User(userData);
    
    try {
      await user2.save();
    } catch (error: any) {
      expect(error.code).toBe(11000); // Duplicate key error
    }
  });
});
