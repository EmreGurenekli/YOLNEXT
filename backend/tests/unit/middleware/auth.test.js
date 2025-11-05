// Unit tests for authentication middleware
const { createAuthMiddleware } = require('../../../middleware/auth');
const jwt = require('jsonwebtoken');

// Jest is available in test environment

describe('Authentication Middleware', () => {
  const mockPool = {
    query: jest.fn(),
  };

  const JWT_SECRET = 'test-secret';
  const authenticateToken = createAuthMiddleware(mockPool, JWT_SECRET);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should reject request without token', async () => {
    const req = { headers: {} };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const next = jest.fn();

    await authenticateToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Access token required',
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('should accept valid demo token', async () => {
    const token = jwt.sign(
      { userId: 10001, email: 'demo@test.com', role: 'individual', isDemo: true },
      JWT_SECRET
    );

    const req = {
      headers: { authorization: `Bearer ${token}` },
    };
    const res = {};
    const next = jest.fn();

    await authenticateToken(req, res, next);

    expect(req.user).toBeDefined();
    expect(req.user.isDemo).toBe(true);
    expect(next).toHaveBeenCalled();
  });

  it('should accept valid real user token', async () => {
    const token = jwt.sign(
      { userId: 1, email: 'user@test.com', role: 'individual' },
      JWT_SECRET
    );

    mockPool.query.mockResolvedValueOnce({
      rows: [{ id: 1, email: 'user@test.com', role: 'individual', isActive: true }],
    });

    const req = {
      headers: { authorization: `Bearer ${token}` },
    };
    const res = {};
    const next = jest.fn();

    await authenticateToken(req, res, next);

    expect(mockPool.query).toHaveBeenCalled();
    expect(req.user).toBeDefined();
    expect(req.user.id).toBe(1);
    expect(next).toHaveBeenCalled();
  });

  it('should reject invalid token', async () => {
    const req = {
      headers: { authorization: 'Bearer invalid-token' },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const next = jest.fn();

    await authenticateToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });
});







