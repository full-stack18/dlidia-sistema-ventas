BEGIN;

ALTER TABLE pedidos
ADD COLUMN IF NOT EXISTS motorizado_id INTEGER
REFERENCES usuarios(id)
ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_pedidos_motorizado_estado
ON pedidos (motorizado_id, estado);

CREATE TABLE IF NOT EXISTS historial_estados_pedido (
    id BIGSERIAL PRIMARY KEY,
    pedido_id INTEGER NOT NULL
        REFERENCES pedidos(id)
        ON DELETE CASCADE,
    estado_anterior VARCHAR(40),
    estado_nuevo VARCHAR(40) NOT NULL,
    usuario_id INTEGER
        REFERENCES usuarios(id)
        ON DELETE SET NULL,
    fecha_cambio TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_historial_estados_pedido_fecha
ON historial_estados_pedido (pedido_id, fecha_cambio DESC);

COMMIT;