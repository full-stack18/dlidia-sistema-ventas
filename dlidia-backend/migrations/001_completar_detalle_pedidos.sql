BEGIN;

ALTER TABLE detalle_pedidos
    ADD COLUMN IF NOT EXISTS nombre_plato VARCHAR(150),
    ADD COLUMN IF NOT EXISTS observaciones TEXT;

UPDATE detalle_pedidos AS detalle
SET nombre_plato = plato.nombre
FROM platos AS plato
WHERE detalle.plato_id = plato.id
  AND detalle.nombre_plato IS NULL;

ALTER TABLE detalle_pedidos
    ALTER COLUMN pedido_id SET NOT NULL,
    ALTER COLUMN plato_id SET NOT NULL,
    ALTER COLUMN nombre_plato SET NOT NULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'detalle_pedidos_cantidad_positiva'
    ) THEN
        ALTER TABLE detalle_pedidos
            ADD CONSTRAINT detalle_pedidos_cantidad_positiva CHECK (cantidad > 0);
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'detalle_pedidos_precio_no_negativo'
    ) THEN
        ALTER TABLE detalle_pedidos
            ADD CONSTRAINT detalle_pedidos_precio_no_negativo CHECK (precio_unitario >= 0);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_detalle_pedidos_pedido_id
    ON detalle_pedidos (pedido_id);

CREATE INDEX IF NOT EXISTS idx_detalle_pedidos_plato_id
    ON detalle_pedidos (plato_id);

COMMIT;
