-- Filiere IDs for mag1
SELECT u.email, f.id, f.code FROM users u
JOIN user_filieres uf ON uf."usersId" = u.id
JOIN filieres f ON f.id = uf."filieresId"
WHERE u.email = 'mag1@roseblanche.tn';

-- Plans returned for mag1 (simulate getValidatedPlansForFiliere)
SELECT lp.reference, lp."dateLivraison", lp."isValidated", lp."loadingStatus"
FROM loading_plans lp
WHERE lp."isValidated" = true
  AND lp."dateLivraison" = '2026-06-12'
  AND EXISTS (
    SELECT 1 FROM bons_livraison bl2
    WHERE bl2."loadingPlanId" = lp.id
      AND bl2."filiereId" IN (
        SELECT uf."filieresId" FROM user_filieres uf
        JOIN users u ON u.id = uf."usersId"
        WHERE u.email = 'mag1@roseblanche.tn'
      )
  )
ORDER BY lp.reference;

-- Quais returned for mag1
SELECT q.nom, q."isActive", f.code FROM quais q
JOIN filieres f ON f.id = q."filiereId"
WHERE q."filiereId" IN (
  SELECT uf."filieresId" FROM user_filieres uf
  JOIN users u ON u.id = uf."usersId"
  WHERE u.email = 'mag1@roseblanche.tn'
)
ORDER BY q.nom;
