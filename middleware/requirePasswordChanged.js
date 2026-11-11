function requirePasswordChanged(req, res, next) {
  if (req.user?.must_change_password) {
    return res.status(403).json({ error: 'Change your temporary password before continuing' });
  }

  next();
}

module.exports = requirePasswordChanged;
