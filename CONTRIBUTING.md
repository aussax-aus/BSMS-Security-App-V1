# Contributing to BSMS Security App

Thank you for your interest in contributing to the BSMS Security App! This document provides guidelines and instructions for contributing.

## Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Focus on what is best for the project
- Show empathy towards other contributors

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- MongoDB >= 5.0
- Git
- npm >= 9.0.0

### Development Setup

1. **Fork the repository**
   - Go to https://github.com/aussax-aus/BSMS-Security-App-V1
   - Click "Fork" button

2. **Clone your fork**
   ```bash
   git clone https://github.com/<your-username>/BSMS-Security-App-V1.git
   cd BSMS-Security-App-V1
   ```

3. **Add upstream remote**
   ```bash
   git remote add upstream https://github.com/aussax-aus/BSMS-Security-App-V1.git
   ```

4. **Install dependencies**
   ```bash
   npm install
   cd packages/backend
   npm install
   ```

5. **Setup environment**
   ```bash
   cd packages/backend
   cp .env.example .env
   # Edit .env with your local settings
   ```

6. **Start MongoDB**
   ```bash
   # Using Docker
   docker run -d -p 27017:27017 --name mongodb mongo:latest
   
   # Or use local MongoDB installation
   ```

7. **Start development server**
   ```bash
   npm run dev
   ```

## Development Workflow

### Branch Naming

Use descriptive branch names:
- `feature/add-notification-system`
- `bugfix/fix-shift-timezone`
- `hotfix/security-patch`
- `docs/update-api-docs`

### Making Changes

1. **Create a new branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Write clean, readable code
   - Follow existing code style
   - Add comments for complex logic
   - Update documentation if needed

3. **Test your changes**
   ```bash
   # Run linter
   npm run lint
   
   # Run tests
   npm test
   
   # Test manually
   npm run dev
   ```

4. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add notification system"
   ```
   
   Use conventional commit messages:
   - `feat:` - New feature
   - `fix:` - Bug fix
   - `docs:` - Documentation changes
   - `style:` - Code style changes (formatting, etc.)
   - `refactor:` - Code refactoring
   - `test:` - Adding or updating tests
   - `chore:` - Maintenance tasks

5. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Create a Pull Request**
   - Go to your fork on GitHub
   - Click "New Pull Request"
   - Provide a clear title and description
   - Reference any related issues

## Code Style Guidelines

### JavaScript/Node.js

- Use ES6+ features
- Use `const` for constants, `let` for variables
- Use arrow functions when appropriate
- Use async/await instead of callbacks
- No semicolons (follows existing style)
- 2 spaces for indentation
- Single quotes for strings
- Trailing commas in objects and arrays

Example:
```javascript
const getUserById = async (userId) => {
  try {
    const user = await User.findById(userId)
    if (!user) {
      throw new Error('User not found')
    }
    return user
  } catch (err) {
    throw err
  }
}
```

### API Routes

- RESTful design principles
- Consistent response format
- Proper HTTP status codes
- Comprehensive error handling
- Input validation

Example:
```javascript
router.get('/:id', protect, async (req, res, next) => {
  try {
    const resource = await Model.findById(req.params.id)
    
    if (!resource) {
      return res.status(404).json({ 
        error: { message: 'Resource not found' } 
      })
    }
    
    res.json({
      success: true,
      data: resource
    })
  } catch (err) {
    next(err)
  }
})
```

### Models

- Use Mongoose schemas
- Add indexes for frequently queried fields
- Include virtuals and methods when helpful
- Add pre/post hooks for business logic
- Document schema structure

Example:
```javascript
const schema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  }
}, {
  timestamps: true
})

schema.index({ email: 1 })

schema.methods.someMethod = function() {
  // Method logic
}
```

## Testing

### Writing Tests

- Write tests for new features
- Update tests when modifying existing code
- Use descriptive test names
- Test edge cases and error conditions

Example:
```javascript
describe('User API', () => {
  describe('GET /api/users/:id', () => {
    it('should return user when ID is valid', async () => {
      // Test implementation
    })
    
    it('should return 404 when user not found', async () => {
      // Test implementation
    })
    
    it('should return 401 when not authenticated', async () => {
      // Test implementation
    })
  })
})
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage

# Run specific test file
npm test -- auth.test.js
```

## Documentation

### Code Comments

- Explain "why", not "what"
- Document complex algorithms
- Add JSDoc for public functions

Example:
```javascript
/**
 * Calculate geofence distance between two points
 * Uses Haversine formula for accuracy over short distances
 * 
 * @param {Object} point1 - First coordinate {lat, lng}
 * @param {Object} point2 - Second coordinate {lat, lng}
 * @returns {Number} Distance in meters
 */
function calculateDistance(point1, point2) {
  // Implementation
}
```

### API Documentation

- Update API.md when adding/modifying endpoints
- Include request/response examples
- Document all query parameters
- Specify authentication requirements

### README Updates

- Keep installation instructions current
- Update feature list
- Add screenshots for UI changes
- Document new environment variables

## Pull Request Process

1. **Ensure tests pass**
   ```bash
   npm test
   npm run lint
   ```

2. **Update documentation**
   - Update README.md if needed
   - Update API.md for API changes
   - Add inline comments for complex code

3. **Rebase on latest main**
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

4. **Create pull request**
   - Use clear, descriptive title
   - Explain what changes were made and why
   - Reference related issues (e.g., "Fixes #123")
   - Add screenshots for UI changes
   - List breaking changes if any

5. **Address review feedback**
   - Respond to all comments
   - Make requested changes
   - Push updates to your branch

6. **Merge**
   - Maintainers will merge when approved
   - Delete your branch after merge

## Pull Request Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
Describe how you tested the changes

## Screenshots (if applicable)
Add screenshots here

## Checklist
- [ ] Tests pass locally
- [ ] Code follows style guidelines
- [ ] Documentation updated
- [ ] No new warnings
- [ ] Added tests for new features
```

## Issue Reporting

### Bug Reports

Include:
- Clear description of the bug
- Steps to reproduce
- Expected behavior
- Actual behavior
- Environment details (OS, Node version, etc.)
- Error messages and logs
- Screenshots if applicable

### Feature Requests

Include:
- Clear description of the feature
- Use case and benefits
- Possible implementation approach
- Alternative solutions considered

## Security Issues

**Do not report security vulnerabilities publicly.**

Email security issues to: security@example.com

Include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

## Project Structure

```
BSMS-Security-App-V1/
├── packages/
│   ├── backend/           # Node.js API
│   │   ├── src/
│   │   │   ├── config/    # Configuration
│   │   │   ├── models/    # Database models
│   │   │   ├── routes/    # API routes
│   │   │   ├── middleware/# Middleware
│   │   │   ├── services/  # Business logic
│   │   │   ├── utils/     # Utilities
│   │   │   └── index.js   # Entry point
│   │   ├── tests/         # Test files
│   │   └── package.json
│   ├── mobile/            # React Native app (TODO)
│   └── admin/             # React admin panel (TODO)
├── API.md                 # API documentation
├── DEPLOYMENT.md          # Deployment guide
├── CONTRIBUTING.md        # This file
└── README.md              # Main documentation
```

## Getting Help

- Read the documentation
- Check existing issues
- Ask in discussions
- Contact maintainers

## Recognition

Contributors will be:
- Listed in CONTRIBUTORS.md
- Credited in release notes
- Appreciated in commit messages

Thank you for contributing to BSMS Security App! 🎉
