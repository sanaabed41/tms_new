-- Colonnes de bons_livraison
SELECT column_name FROM information_schema.columns WHERE table_name = 'bons_livraison' AND column_name LIKE '%Plan%' OR column_name LIKE '%plan%' OR column_name LIKE '%filiere%' OR column_name LIKE '%Filiere%';

-- Les BLs liés aux plans PQ-*
SELECT bl."numeroBl", bl."loadingPlanId", f.code as filiere_code
FROM bons_livraison bl
LEFT JOIN filieres f ON f.id = bl."filiereId"
WHERE bl."numeroBl" LIKE 'BL-Q-%'
ORDER BY bl."numeroBl"
LIMIT 10;
