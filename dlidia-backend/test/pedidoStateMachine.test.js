import test from 'node:test';
import assert from 'node:assert/strict';
import {
    ESTADOS_PEDIDO as E,
    puedeCambiarEstado,
    validarCambioEstado
} from '../src/utils/pedidoStateMachine.js';

test('permite avanzar un delivery por las etapas definidas', () => {
    const etapas = [
        [E.PENDIENTE, E.EN_PREPARACION],
        [E.EN_PREPARACION, E.LISTO],
        [E.LISTO, E.ASIGNADO],
        [E.ASIGNADO, E.RECOGIDO],
        [E.RECOGIDO, E.EN_CAMINO],
        [E.EN_CAMINO, E.ENTREGADO]
    ];

    for (const [estadoActual, nuevoEstado] of etapas) {
        assert.equal(
            puedeCambiarEstado({
                estadoActual,
                nuevoEstado,
                tipoEntrega: 'Delivery'
            }),
            true,
            `${estadoActual} → ${nuevoEstado} debería permitirse`
        );
    }
});

test('permite entregar un pedido no delivery después de Listo', () => {
    assert.equal(
        puedeCambiarEstado({
            estadoActual: E.LISTO,
            nuevoEstado: E.ENTREGADO,
            tipoEntrega: 'Mesa'
        }),
        true
    );
});

test('rechaza saltos de estado y cambios después de terminar', () => {
    assert.equal(
        puedeCambiarEstado({
            estadoActual: E.PENDIENTE,
            nuevoEstado: E.ENTREGADO,
            tipoEntrega: 'Delivery'
        }),
        false
    );

    assert.equal(
        puedeCambiarEstado({
            estadoActual: E.ENTREGADO,
            nuevoEstado: E.CANCELADO,
            tipoEntrega: 'Delivery'
        }),
        false
    );

    assert.throws(
        () => validarCambioEstado({
            estadoActual: E.PENDIENTE,
            nuevoEstado: E.ENTREGADO,
            tipoEntrega: 'Delivery'
        }),
        (error) => error.status === 409
    );
});