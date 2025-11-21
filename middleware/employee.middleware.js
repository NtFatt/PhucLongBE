function authorizeEmployee(allowedRoles = []) {
  return (req, res, next) => {
    if (!req.user)
      return res.status(401).json({ error: "Not authenticated" });

    const role = req.user.role?.toLowerCase();

    if (!allowedRoles.includes(role)) {
      return res.status(403).json({
        error: `Role '${role}' không có quyền truy cập`
      });
    }

    next();
  };
}

module.exports = { authorizeEmployee };
