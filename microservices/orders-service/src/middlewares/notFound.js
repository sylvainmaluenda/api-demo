const notFound = (req, res, next) => {
  res.status(404).json({
    error: `Route ${req.method} ${req.originalUrl} not found`,
  });
};

export default notFound;
