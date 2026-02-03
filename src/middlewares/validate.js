/**
 * Validation middleware factory using Zod
 * @param {import('zod').ZodSchema} schema - Zod schema to validate against
 * @returns Express middleware function
 */
const validate = (schema) => {
    return (req, res, next) => {
        try {
            const result = schema.safeParse(req.body);

            if (!result.success) {
                const errors = result.error.errors.map(err => ({
                    field: err.path.join('.'),
                    message: err.message,
                }));

                return res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors,
                });
            }

            // Replace body with parsed/transformed data
            req.body = result.data;
            next();
        } catch (error) {
            return res.status(400).json({
                success: false,
                message: 'Invalid request data',
            });
        }
    };
};

module.exports = validate;
