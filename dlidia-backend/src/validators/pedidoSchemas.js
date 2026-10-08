import { z } from 'zod';

export const actualizarEstadoPedidoSchema = z.object({
    estado: z.enum([
        'Pendiente',
        'En Preparación',
        'Listo',
        'Asignado',
        'Recogido',
        'En camino',
        'Entregado',
        'Cancelado'
    ])
});

const telefonoPeruano = /^(?:\+?51)?9\d{8}$/;

export const crearPedidoSchema = z.object({
    tipoEntrega: z.enum(['Mesa', 'Para Llevar', 'Delivery']),
    nombreCliente: z.string().trim().min(1, 'El nombre es obligatorio').max(100),
    telefonoCliente: z.string().trim().max(20).optional().nullable(),
    direccionEntrega: z.string().trim().max(500).optional().nullable(),
    items: z.array(
        z.object({
            platoId: z.coerce.number().int().positive(),
            cantidad: z.coerce.number().int().min(1).max(99),
            observaciones: z.string().trim().max(500).optional().nullable()
        })
    ).min(1, 'El pedido debe incluir al menos un producto')
     .max(50, 'El pedido no puede incluir más de 50 productos')
}).superRefine((pedido, contexto) => {
    if (pedido.tipoEntrega === 'Delivery') {
        const telefono = pedido.telefonoCliente
            ?.replace(/[\s()-]/g, '') ?? '';

        if (!telefonoPeruano.test(telefono)) {
            contexto.addIssue({
                code: 'custom',
                path: ['telefonoCliente'],
                message: 'Ingresa un celular peruano válido, por ejemplo 987654321 o +51 987654321'
            });
        }

        if (!pedido.direccionEntrega?.trim()) {
            contexto.addIssue({
                code: 'custom',
                path: ['direccionEntrega'],
                message: 'La dirección es obligatoria para delivery'
            });
        }
    }
});