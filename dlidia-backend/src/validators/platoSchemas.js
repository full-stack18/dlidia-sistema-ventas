import { z } from 'zod';

export const crearPlatoSchema = z.object({
    nombre: z.string().trim().min(1, 'El nombre es obligatorio').max(120),
    descripcion: z.string().trim().max(500).optional().default(''),
    precio: z.coerce.number().finite().positive('El precio debe ser mayor que cero'),
    categoria: z.string().trim().min(1, 'La categoría es obligatoria').max(60),
    imagen_url: z.string().trim().max(500).optional()
});

export const actualizarPlatoSchema = crearPlatoSchema;