export const ESTADOS_PEDIDO = Object.freeze({
    PENDIENTE: 'Pendiente',
    EN_PREPARACION: 'En Preparación',
    LISTO: 'Listo',
    ASIGNADO: 'Asignado',
    RECOGIDO: 'Recogido',
    EN_CAMINO: 'En camino',
    ENTREGADO: 'Entregado',
    CANCELADO: 'Cancelado'
});

const transicionesPorTipo = {
    Delivery: {
        [ESTADOS_PEDIDO.PENDIENTE]: [ESTADOS_PEDIDO.EN_PREPARACION],
        [ESTADOS_PEDIDO.EN_PREPARACION]: [ESTADOS_PEDIDO.LISTO],
        [ESTADOS_PEDIDO.LISTO]: [ESTADOS_PEDIDO.ASIGNADO],
        [ESTADOS_PEDIDO.ASIGNADO]: [ESTADOS_PEDIDO.RECOGIDO],
        [ESTADOS_PEDIDO.RECOGIDO]: [ESTADOS_PEDIDO.EN_CAMINO],
        [ESTADOS_PEDIDO.EN_CAMINO]: [ESTADOS_PEDIDO.ENTREGADO]
    },
    Otros: {
        [ESTADOS_PEDIDO.PENDIENTE]: [ESTADOS_PEDIDO.EN_PREPARACION],
        [ESTADOS_PEDIDO.EN_PREPARACION]: [ESTADOS_PEDIDO.LISTO],
        [ESTADOS_PEDIDO.LISTO]: [ESTADOS_PEDIDO.ENTREGADO]
    }
};

export const puedeCambiarEstado = ({
    estadoActual,
    nuevoEstado,
    tipoEntrega
}) => {
    if (
        !Object.values(ESTADOS_PEDIDO).includes(estadoActual) ||
        !Object.values(ESTADOS_PEDIDO).includes(nuevoEstado)
    ) {
        return false;
    }

    if (estadoActual === ESTADOS_PEDIDO.ENTREGADO ||
        estadoActual === ESTADOS_PEDIDO.CANCELADO) {
        return false;
    }

    // Cancelar se permitirá desde cualquier estado activo.
    if (nuevoEstado === ESTADOS_PEDIDO.CANCELADO) {
        return true;
    }

    const flujo = tipoEntrega === 'Delivery'
        ? transicionesPorTipo.Delivery
        : transicionesPorTipo.Otros;

    return flujo[estadoActual]?.includes(nuevoEstado) ?? false;
};

export const validarCambioEstado = (datos) => {
    if (puedeCambiarEstado(datos)) {
        return;
    }

    const error = new Error(
        `No se permite cambiar el pedido de "${datos.estadoActual}" a "${datos.nuevoEstado}"`
    );
    error.status = 409;
    throw error;
};