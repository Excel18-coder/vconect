# Custom Error Classes

## Overview
These error classes provide typed, consistent error handling across the application.

## Usage

### In Services
```javascript
const { NotFoundError, ValidationError, AuthorizationError } = require('../errors');

class ProductService {
  async getProduct(id) {
    const product = await productRepository.findById(id);
    
    if (!product) {
      throw new NotFoundError('Product', id);
    }
    
    return product;
  }
  
  async createProduct(userId, data) {
    if (!data.title || !data.price) {
      throw new ValidationError('Missing required fields', {
        title: !data.title ? 'Title is required' : undefined,
        price: !data.price ? 'Price is required' : undefined
      });
    }
    
    // ... create product
  }
  
  async deleteProduct(productId, userId) {
    const product = await productRepository.findById(productId);
    
    if (product.user_id !== userId) {
      throw new AuthorizationError('You can only delete your own products');
    }
    
    // ... delete product
  }
}
```

### In Error Handler Middleware
```javascript
app.use((err, req, res, next) => {
  if (err instanceof AppError) {
    // Our custom errors
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errors: err.errors,
      timestamp: err.timestamp
    });
  }
  
  // Unexpected errors
  logger.error('Unexpected error', err);
  return res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
});
```

## Error Classes

### AppError (Base Class)
All custom errors extend from this.
- **Status Code**: 500 (can be overridden)
- **Properties**: message, statusCode, isOperational, timestamp

### NotFoundError
Resource not found.
- **Status Code**: 404
- **Usage**: `throw new NotFoundError('Product', productId)`
- **Message**: "Product with identifier 'abc123' not found"

### ValidationError
Input validation failed.
- **Status Code**: 400
- **Usage**: `throw new ValidationError('Validation failed', { field: 'error message' })`
- **Properties**: errors object with field-level errors

### AuthenticationError
User authentication failed.
- **Status Code**: 401
- **Usage**: `throw new AuthenticationError('Invalid credentials')`
- **Common cases**: Invalid token, expired token, missing token

### AuthorizationError
User doesn't have permission.
- **Status Code**: 403
- **Usage**: `throw new AuthorizationError('Admin access required')`
- **Common cases**: Wrong role, not resource owner

### ConflictError
Resource already exists.
- **Status Code**: 409
- **Usage**: `throw new ConflictError('Email already registered')`
- **Common cases**: Duplicate entries, race conditions

## Benefits

1. **Type Safety**: `err instanceof NotFoundError`
2. **Consistent Responses**: Same error format across API
3. **Better Debugging**: Stack traces, timestamps
4. **Clear Intent**: Code is self-documenting
5. **Easy Testing**: Mock specific error types

## Example: Complete Error Flow

```javascript
// Service
class UserService {
  async register(email, password) {
    const existing = await userRepository.findByEmail(email);
    
    if (existing) {
      throw new ConflictError(`User with email '${email}' already exists`);
    }
    
    if (password.length < 8) {
      throw new ValidationError('Password too short', {
        password: 'Password must be at least 8 characters'
      });
    }
    
    return await userRepository.create({ email, password });
  }
}

// Controller
const register = asyncHandler(async (req, res) => {
  const user = await userService.register(req.body.email, req.body.password);
  return sendCreated(res, 'User registered', user);
});

// Error Handler catches and formats
// Returns: { success: false, message: 'Email already registered', statusCode: 409 }
```

## Creating New Error Types

```javascript
const AppError = require('./AppError');

class RateLimitError extends AppError {
  constructor(retryAfter = 60) {
    super('Too many requests', 429);
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
  }
}

module.exports = RateLimitError;
```

---

**Remember**: Always throw typed errors, never throw strings!

❌ Bad: `throw new Error('Not found')`  
✅ Good: `throw new NotFoundError('Product', id)`
