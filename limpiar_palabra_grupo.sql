-- =====================================================
-- SQL para eliminar la palabra "Grupo" de los campos
-- y dejar solo el número (1, 2, 3, 4, 5)
-- =====================================================

-- IMPORTANTE: Hacer backup antes de ejecutar estos comandos
-- Fecha: 2026-01-22

-- =====================================================
-- Actualizar tabla histInformacionB (histórico)
-- =====================================================

-- Ver registros actuales que contienen "Grupo"
SELECT nit, razonSocial, grupo, anoReporte 
FROM histInformacionB 
WHERE grupo LIKE '%Grupo%';

-- Actualizar eliminando "Grupo " del inicio
UPDATE histInformacionB
SET grupo = TRIM(REPLACE(grupo, 'Grupo ', ''))
WHERE grupo LIKE 'Grupo %';

-- Actualizar eliminando "grupo " del inicio (minúscula)
UPDATE histInformacionB
SET grupo = TRIM(REPLACE(grupo, 'grupo ', ''))
WHERE grupo LIKE 'grupo %';

-- Verificar cambios
SELECT nit, razonSocial, grupo, anoReporte 
FROM histInformacionB 
WHERE grupo IN ('1', '2', '3', '4', '5')
ORDER BY anoReporte DESC, nit;


-- =====================================================
-- Verificación final
-- =====================================================

-- Contar registros por grupo en histInformacionB
SELECT grupo, COUNT(*) as cantidad, anoReporte
FROM histInformacionB
GROUP BY grupo, anoReporte
ORDER BY anoReporte DESC, grupo;


-- =====================================================
-- ALTERNATIVA: Si los grupos tienen formato variado
-- =====================================================

-- Si hay registros con diferentes variaciones como "Grupo 1", "GRUPO 1", "Grupo  1" (doble espacio), etc.
-- Usar estas consultas más robustas:

/*
UPDATE histInformacionB
SET grupo = TRIM(REGEXP_REPLACE(grupo, '^[Gg][Rr][Uu][Pp][Oo]\\s+', ''))
WHERE grupo REGEXP '^[Gg][Rr][Uu][Pp][Oo]\\s+';
*/


-- =====================================================
-- ROLLBACK (en caso de necesitar revertir)
-- =====================================================

-- Si necesitas revertir los cambios, ejecuta:
/*
UPDATE histInformacionB
SET grupo = CONCAT('Grupo ', grupo)
WHERE grupo IN ('1', '2', '3', '4', '5');
*/
