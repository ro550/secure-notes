
// Validates req[source] and stores the parsed result on req.validated[source]
function validate(schema, source = 'body') {
  return (req, res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: result.error.issues.map((i) => ({
          field: i.path.join('.'),
          message: i.message,
        })),
      });
    }
    req.validated = { ...req.validated, [source]: result.data };
    next();
  };
}

module.exports = validate;