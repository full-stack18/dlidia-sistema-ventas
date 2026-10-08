export const validarEsquema = (schema) => {
    return (req, res, next) => {
        const resultado = schema.safeParse(req.body);

        if (!resultado.success) {
            return res.status(400).json({
                error: 'Los datos enviados no son válidos',
                detalles: resultado.error.issues.map((problema) => ({
                    campo: problema.path.join('.'),
                    mensaje: problema.message
                }))
            });
        }

        req.body = resultado.data;
        next();
    };
};