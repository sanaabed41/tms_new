SELECT u.email, u.role, u."isActive", f.code
FROM users u
LEFT JOIN user_filieres uf ON uf."usersId" = u.id
LEFT JOIN filieres f ON f.id = uf."filieresId"
WHERE u.email LIKE '%roseblanche%'
ORDER BY u.email, f.code;

SELECT lp.reference, lp."dateLivraison", lp."isValidated", lp."loadingStatus", lp."entryStatus", lp.quai
FROM loading_plans lp
WHERE lp.reference LIKE 'PQ-%'
ORDER BY lp.reference;

SELECT COUNT(*) as nb_bls_with_plan FROM bons_livraison WHERE "loadingPlanId" IS NOT NULL AND "numeroBl" LIKE 'BL-Q-%';

SELECT q.nom, q."isActive", f.code as filiere
FROM quais q
LEFT JOIN filieres f ON f.id = q."filiereId"
ORDER BY q.nom;
