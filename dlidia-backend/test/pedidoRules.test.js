import test from 'node:test';
import assert from 'node:assert/strict';
import {
    normalizarItemsPedido,
    calcularTotalCentimos
} from '../src/utils/pedidoRules.js';

test('agrupa productos repetidos y conserva la observación', () => {
    const resultado = normalizarItemsPedido([
        { platoId: 3, cantidad: 1, observaciones: 'Sin cebolla' },
        { platoId: 3, cantidad: 2, observaciones: 'Sin cebolla' }
    ]);

    assert.deepEqual(resultado, [
        {
            platoId: 3,
            cantidad: 3,
            observaciones: 'Sin cebolla'
        }
    ]);
});

test('rechaza cantidades cero, decimales y mayores a 99', () => {
    for (const cantidad of [0, 1.5, 100]) {
        assert.throws(
            () =>
                normalizarItemsPedido([
                    { platoId: 3, cantidad, observaciones: '' }
                ]),
            (error) => error.status === 400
        );
    }
});

test('rechaza observaciones mayores a 500 caracteres', () => {
    assert.throws(
        () =>
            normalizarItemsPedido([
                {
                    platoId: 3,
                    cantidad: 1,
                    observaciones: 'x'.repeat(501)
                }
            ]),
        (error) => error.status === 400
    );
});

test('calcula el total usando precio y cantidad en céntimos', () => {
    const totalCentimos = calcularTotalCentimos([
        { precioUnitario: 25, cantidad: 2 },
        { precioUnitario: 12.5, cantidad: 1 }
    ]);

    assert.equal(totalCentimos, 6250);
});