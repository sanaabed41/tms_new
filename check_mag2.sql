-- UUID de mag2 et ses filieres
SELECT u.id as user_id, u.email, uf."filieresId", f.code
FROM users u
LEFT JOIN user_filieres uf ON uf."usersId" = u.id
LEFT JOIN filieres f ON f.id = uf."filieresId"
WHERE u.email = 'mag2@roseblanche.tn';

-- Vérification directe du filtre quais pour mag2
SELECT q.nom, q."filiereId", f.code
FROM quais q
LEFT JOIN filieres f ON f.id = q."filiereId"
WHERE q."filiereId" IN (
  SELECT uf."filieresId" FROM user_filieres uf
  JOIN users u ON u.id = uf."usersId"
  WHERE u.email = 'mag2@roseblanche.tn'
);
