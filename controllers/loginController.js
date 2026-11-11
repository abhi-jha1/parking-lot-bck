const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

const PASSWORD_ROUNDS = 12;
const MAX_PASSWORD_BYTES = 72;
const TOKEN_LIFETIME_MS = 60 * 60 * 1000;
const AUTH_COOKIE = 'token';

function authCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: TOKEN_LIFETIME_MS,
    path: '/'
  };
}

function normalizeCarNumber(value) {
  return typeof value === 'string' ? value.trim().toUpperCase() : '';
}

function validPassword(value) {
  return typeof value === 'string'
    && value.length > 0
    && Buffer.byteLength(value, 'utf8') <= MAX_PASSWORD_BYTES;
}

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not configured');
  }
  return secret;
}

function createToken(user, secret, mustChangePassword = false) {
  return jwt.sign({
    sub: String(user.id),
    role: user.role || 'customer',
    must_change_password: mustChangePassword
  }, secret, { expiresIn: '1h' });
}

exports.loginUser = async (req, res) => {
  try {
    const secret = getJwtSecret();
    const car_number = normalizeCarNumber(req.body?.car_number);
    const { password } = req.body ?? {};

    if (!car_number) {
      return res.status(400).json({ error: 'car_number is required' });
    }

    if (!validPassword(password)) {
      return res.status(400).json({ error: 'A valid password is required' });
    }

    const user = await User.findByCarNumber(car_number);
    const isPasswordValid = user?.password_hash
      ? await bcrypt.compare(password, user.password_hash)
      : false;

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid car number or password' });
    }

    const mustChangePassword = Boolean(user.must_change_password);
    const token = createToken(user, secret, mustChangePassword);
    res.cookie(AUTH_COOKIE, token, authCookieOptions());
    return res.status(200).json({
      message: 'Login successful',
      car_number,
      password_change_required: mustChangePassword
    });
  } catch (error) {
    console.error('Login failed:', error);
    return res.status(500).json({ error: 'Could not log in' });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const secret = getJwtSecret();
    const { current_password, new_password } = req.body ?? {};

    if (!validPassword(current_password) || !validPassword(new_password)
      || new_password.length < 8) {
      return res.status(400).json({
        error: 'Current password is required; new password must be at least 8 characters and no more than 72 UTF-8 bytes'
      });
    }

    const user = await User.findById(req.user.sub);
    if (!user?.password_hash || !(await bcrypt.compare(current_password, user.password_hash))) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    const passwordHash = await bcrypt.hash(new_password, PASSWORD_ROUNDS);
    await User.updatePassword(user.id, passwordHash);
    const token = createToken(user, secret, false);

    res.cookie(AUTH_COOKIE, token, authCookieOptions());
    return res.status(200).json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Password change failed:', error);
    return res.status(500).json({ error: 'Could not change password' });
  }
};

exports.logoutUser = (req, res) => {
  const { maxAge, ...cookieOptions } = authCookieOptions();
  res.clearCookie(AUTH_COOKIE, cookieOptions);
  return res.status(200).json({ message: 'Logout successful' });
};