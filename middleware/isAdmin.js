const isAdmin = (req, res, next) => {
  if (req.user && req.user.isAdmin) {
    next(); // ✅ Allow access if admin
  } else {
    res.status(403).json({ message: "Access denied: Admins only" });
  }
};

module.exports = isAdmin;
