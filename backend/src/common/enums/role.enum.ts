export enum Role {
  SUPER_ADMIN      = 'SUPER_ADMIN',
  LOGISTIC_ADMIN   = 'LOGISTIC_ADMIN',    // Resp. Logistique (anciennement COMPANY_ADMIN)
  EXPEDITEUR_ADMIN = 'EXPEDITEUR_ADMIN',  // Admin société expéditrice
  FILIERE_ADMIN    = 'FILIERE_ADMIN',     // Admin de filière
  MAGASINIER       = 'MAGASINIER',        // Gestion quais / chargement
  SECURITE         = 'SECURITE',          // Contrôle des entrées (lecture seule)
  TRANSPORT_ADMIN  = 'TRANSPORT_ADMIN',   // Admin société de transport (gère disponibilités camions)
}
