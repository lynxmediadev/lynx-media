-- Unificar licencia/alcance y eliminar columnas duplicadas

-- 1) Copiar exclusivity -> licenseType si falta
UPDATE "Track"
SET "licenseType" = "exclusivity"::text
WHERE "licenseType" IS NULL
  AND "exclusivity" IS NOT NULL;

-- 1.1) Normalizar licenseType a valores canonicos si hay texto libre
UPDATE "Track"
SET "licenseType" = CASE
  WHEN "licenseType" ILIKE '%non%' OR "licenseType" ILIKE '%no exclusiva%' THEN 'NON_EXCLUSIVE'
  WHEN "licenseType" ILIKE '%limit%' THEN 'LIMITED_EXCLUSIVE'
  WHEN "licenseType" ILIKE '%buyout%' THEN 'BUYOUT'
  WHEN "licenseType" ILIKE '%exclusive%' OR "licenseType" ILIKE '%exclusiva%' THEN 'EXCLUSIVE'
  ELSE "licenseType"
END
WHERE "licenseType" IS NOT NULL;

-- 2) Migrar territorios libres a array estructurado si esta vacio
UPDATE "Track"
SET "exclusiveTerritories" = regexp_split_to_array(upper("territories"), '\\s*,\\s*|\\s*\\n\\s*')
WHERE COALESCE(array_length("exclusiveTerritories", 1), 0) = 0
  AND "territories" IS NOT NULL
  AND btrim("territories") <> '';

-- 3) Migrar term libre a meses (si hay digitos) cuando no exista valor
UPDATE "Track"
SET "exclusiveTermMonths" = COALESCE(
  "exclusiveTermMonths",
  NULLIF(regexp_replace("term", '[^0-9]', '', 'g'), '')::int
)
WHERE "term" IS NOT NULL;

-- 4) Eliminar columnas duplicadas
ALTER TABLE "Track" DROP COLUMN IF EXISTS "exclusivity";
ALTER TABLE "Track" DROP COLUMN IF EXISTS "territories";
ALTER TABLE "Track" DROP COLUMN IF EXISTS "term";

-- 5) Eliminar enum si ya no se usa
DROP TYPE IF EXISTS "ExclusivityType";
