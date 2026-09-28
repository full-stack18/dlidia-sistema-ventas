const crearErrorValidacion = (mensaje) => {
    const error = new Error(mensaje);
    error.status = 400;
    return error;
};

export const normalizarItemsPedido = (items) => {
    if (!Array.isArray(items) || items.length === 0) {
        throw crearErrorValidacion('El pedido debe contener al menos un plato');
    }

    if (items.length > 50) {
        throw crearErrorValidacion(
            'El pedido no puede contener más de 50 productos diferentes'
        );
    }

    const itemsAgrupados = new Map();

    for (const item of items) {
        if (!item || typeof item !== 'object' || Array.isArray(item)) {
            throw crearErrorValidacion(
                'El formato de los productos del pedido no es válido'
            );
        }

        const platoId = Number(item.platoId);
        const cantidad = Number(item.cantidad);

        if (
            !Number.isInteger(platoId) ||
            platoId <= 0 ||
            !Number.isInteger(cantidad) ||
            cantidad <= 0 ||
            cantidad > 99
        ) {
            throw crearErrorValidacion(
                'Cada plato debe tener un identificador válido y una cantidad entre 1 y 99'
            );
        }

        const observaciones = item.observaciones ?? null;

        if (
            observaciones !== null &&
            (typeof observaciones !== 'string' || observaciones.length > 500)
        ) {
            throw crearErrorValidacion(
                'Las observaciones deben ser texto de hasta 500 caracteres'
            );
        }

        const existente = itemsAgrupados.get(platoId);
        const cantidadTotal = (existente?.cantidad || 0) + cantidad;

        if (cantidadTotal > 99) {
            throw crearErrorValidacion(
                'La cantidad acumulada de un plato no puede superar 99 unidades'
            );
        }

        itemsAgrupados.set(platoId, {
            platoId,
            cantidad: cantidadTotal,
            observaciones: observaciones?.trim() || null
        });
    }

    return Array.from(itemsAgrupados.values());
};

export const calcularTotalCentimos = (detalles) => {
    return detalles.reduce(
        (total, detalle) =>
            total +
            Math.round(Number(detalle.precioUnitario) * 100) *
                detalle.cantidad,
        0
    );
};