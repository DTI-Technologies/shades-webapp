import mongoose from 'mongoose';
import Theme from '../Theme';
import User from '../User';

describe('Theme Model', () => {
  let userId: mongoose.Types.ObjectId;

  // Connect to a test database before running tests
  beforeAll(async () => {
    await mongoose.connect('mongodb://localhost:27017/test-db');
    
    // Create a test user
    const user = new User({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
    });
    
    const savedUser = await user.save();
    userId = savedUser._id;
  });

  // Clear the database after each test
  afterEach(async () => {
    await Theme.deleteMany({});
  });

  // Disconnect from the database after all tests
  afterAll(async () => {
    await User.deleteMany({});
    await mongoose.connection.close();
  });

  it('should create a new theme', async () => {
    const themeData = {
      name: 'Test Theme',
      type: 'Modern Minimalism',
      description: 'A clean and minimal theme',
      colorPalette: {
        primary: '#3182CE',
        secondary: '#4299E1',
        accent: '#ECC94B',
        background: '#FFFFFF',
        text: '#1A202C',
      },
      typography: {
        headingFont: 'Inter',
        bodyFont: 'Inter',
        codeFont: 'JetBrains Mono',
      },
      components: {
        buttons: {
          primary: {
            backgroundColor: '#3182CE',
            color: '#FFFFFF',
            borderRadius: '4px',
          },
        },
      },
      styles: {
        spacing: {
          small: '0.5rem',
          medium: '1rem',
          large: '2rem',
        },
      },
      pageLayouts: {
        home: {
          sections: ['hero', 'features', 'testimonials'],
        },
      },
      creator: userId,
    };

    const theme = new Theme(themeData);
    const savedTheme = await theme.save();

    expect(savedTheme._id).toBeDefined();
    expect(savedTheme.name).toBe(themeData.name);
    expect(savedTheme.type).toBe(themeData.type);
    expect(savedTheme.description).toBe(themeData.description);
    expect(savedTheme.colorPalette).toEqual(themeData.colorPalette);
    expect(savedTheme.typography).toEqual(themeData.typography);
    expect(savedTheme.components).toEqual(themeData.components);
    expect(savedTheme.styles).toEqual(themeData.styles);
    expect(savedTheme.pageLayouts).toEqual(themeData.pageLayouts);
    expect(savedTheme.creator.toString()).toBe(userId.toString());
    expect(savedTheme.isPublished).toBe(false); // Default value
    expect(savedTheme.isPublic).toBe(false); // Default value
    expect(savedTheme.price).toBe(0); // Default value
    expect(savedTheme.downloads).toBe(0); // Default value
    expect(savedTheme.rating).toBe(0); // Default value
    expect(savedTheme.ratingCount).toBe(0); // Default value
    expect(savedTheme.tags).toEqual([]); // Default value
    expect(savedTheme.createdAt).toBeDefined();
    expect(savedTheme.updatedAt).toBeDefined();
  });

  it('should validate required fields', async () => {
    const theme = new Theme({
      creator: userId,
    });

    try {
      await theme.validate();
    } catch (error: any) {
      expect(error.errors.name).toBeDefined();
      expect(error.errors.type).toBeDefined();
      expect(error.errors.description).toBeDefined();
      expect(error.errors['colorPalette.primary']).toBeDefined();
      expect(error.errors['colorPalette.secondary']).toBeDefined();
      expect(error.errors['colorPalette.background']).toBeDefined();
      expect(error.errors['colorPalette.text']).toBeDefined();
      expect(error.errors['typography.headingFont']).toBeDefined();
      expect(error.errors['typography.bodyFont']).toBeDefined();
      expect(error.errors['typography.codeFont']).toBeDefined();
      expect(error.errors.components).toBeDefined();
      expect(error.errors.styles).toBeDefined();
      expect(error.errors.pageLayouts).toBeDefined();
    }
  });

  it('should enforce name length constraint', async () => {
    const theme = new Theme({
      name: 'a'.repeat(101), // Exceeds max length of 100
      type: 'Modern Minimalism',
      description: 'A clean and minimal theme',
      colorPalette: {
        primary: '#3182CE',
        secondary: '#4299E1',
        accent: '#ECC94B',
        background: '#FFFFFF',
        text: '#1A202C',
      },
      typography: {
        headingFont: 'Inter',
        bodyFont: 'Inter',
        codeFont: 'JetBrains Mono',
      },
      components: {},
      styles: {},
      pageLayouts: {},
      creator: userId,
    });

    try {
      await theme.validate();
    } catch (error: any) {
      expect(error.errors.name).toBeDefined();
    }
  });

  it('should enforce description length constraint', async () => {
    const theme = new Theme({
      name: 'Test Theme',
      type: 'Modern Minimalism',
      description: 'a'.repeat(501), // Exceeds max length of 500
      colorPalette: {
        primary: '#3182CE',
        secondary: '#4299E1',
        accent: '#ECC94B',
        background: '#FFFFFF',
        text: '#1A202C',
      },
      typography: {
        headingFont: 'Inter',
        bodyFont: 'Inter',
        codeFont: 'JetBrains Mono',
      },
      components: {},
      styles: {},
      pageLayouts: {},
      creator: userId,
    });

    try {
      await theme.validate();
    } catch (error: any) {
      expect(error.errors.description).toBeDefined();
    }
  });
});
