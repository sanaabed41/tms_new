export enum Role {
  SUPER_ADMIN      = 'SUPER_ADMIN',
  LOGISTIC_ADMIN   = 'LOGISTIC_ADMIN',
  EXPEDITEUR_ADMIN = 'EXPEDITEUR_ADMIN',
  FILIERE_ADMIN    = 'FILIERE_ADMIN',
  MAGASINIER       = 'MAGASINIER',
  SECURITE         = 'SECURITE',
  TRANSPORT_ADMIN  = 'TRANSPORT_ADMIN',
}

export enum CompanyType {
  LOGISTIQUE = 'LOGISTIQUE',
  EXPEDITEUR = 'EXPEDITEUR',
  TRANSPORT  = 'TRANSPORT',
}

export enum EntryStatus {
  IDLE    = 'IDLE',
  CALLED  = 'CALLED',
  ENTERED = 'ENTERED',
  EXITED  = 'EXITED',
}

export enum LoadingStatus {
  WAITING = 'WAITING',
  IN_PROGRESS = 'IN_PROGRESS',
  PAUSED = 'PAUSED',
  DONE = 'DONE',
}

export enum BlStatus {
  DRAFT = 'DRAFT',
  VALIDATED = 'VALIDATED',
  LOADED = 'LOADED',
  DELIVERED = 'DELIVERED',
}

export enum TypeChargement {
  VRAC = 'VRAC',
  PALETTE = 'PALETTE',
  FRIGO = 'FRIGO',
  CITERNE = 'CITERNE',
}

export interface Company {
  id: string;
  nom: string;
  type: CompanyType;
  adresse?: string;
  telephone?: string;
  couleur?: string;
  code?: string;
  isActive: boolean;
  createdAt: string;
  logistiqueCompany?: Company | null;
  expediteurClients?: Company[];
}

export interface ExpediteursPortalDashboard {
  societe: { id: string; nom: string; couleur: string; code: string };
  filieres: number;
  quais: number;
  users: number;
  totalBls: number;
  blsAujourdhui: number;
}

export interface Quai {
  id: string;
  nom: string;
  isActive: boolean;
  societeExpeditrice?: SocieteExpeditrice | null;
  filiere?: Filiere | null;
}

export interface QuaiStatus {
  id?: string;
  nom: string;
  occupe: boolean;
  entryStatus: string | null;
  matricule: string | null;
}

export interface QuaisLibresFiliereGroup {
  id: string | null;
  nom: string | null;
  code: string | null;
  quais: QuaiStatus[];
}

export interface QuaisLibresSocieteGroup {
  id: string;
  nom: string;
  couleur: string;
  filieres: QuaisLibresFiliereGroup[];
}

export interface QuaisLibresResponse {
  societes: QuaisLibresSocieteGroup[];
  generiques: QuaiStatus[];
}

export interface User {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  role: Role;
  company: Company;
  isActive: boolean;
  filieres?: Filiere[];
  deliveryCompany?: DeliveryCompany | null;
}

export interface Filiere {
  id: string;
  nom: string;
  code: string;
}

export interface SocieteExpeditrice {
  id: string;
  nom: string;
  code: string;
  couleur: string;
  adresse: string;
  telephone: string;
  filieres: Filiere[];
}

export interface DeliveryCompany {
  id: string;
  nom: string;
  adresse: string;
  telephone: string;
  camions: Truck[];
}

export interface Chauffeur {
  id: string;
  nom: string;
  prenom: string;
  telephone: string;
  cin: string;
  permis: string;
  isActive: boolean;
  deliveryCompany: DeliveryCompany;
  createdAt: string;
}

export interface Truck {
  id: string;
  matricule: string;
  capaciteTonnage: number;
  capacitePalettes: number;
  type: string;
  isActive: boolean;
  deliveryCompany: DeliveryCompany;
}

export interface Article {
  id: string;
  code: string;
  libelle: string;
  poidsUnitaire: number;
  unite: string;
}

export interface BlArticle {
  id: string;
  article: Article;
  quantite: number;
  poidsTotal: number;
}

export interface BonLivraison {
  id: string;
  numeroBl: string;
  clientNom: string;
  clientTelephone?: string;
  clientAdresse: string;
  origine: string;
  destination: string;
  typeChargement: TypeChargement;
  tonnageTotal: number;
  nombrePalettes: number;
  statut: BlStatus;
  datelivraison: string;
  erpReference: string;
  notes: string;
  societeExpeditrice?: SocieteExpeditrice;
  filiere?: Filiere;
  ordreChargement?: number | null;
  blArticles: BlArticle[];
  loadingPlan?: LoadingPlan;
  createdAt: string;
}

export interface Invitation {
  id: string;
  email: string;
  role: Role;
  isUsed: boolean;
  expiresAt: string;
  createdAt: string;
  filiereIds?: string[] | null;
  deliveryCompanyNom?: string | null;
  company: Company;
}

export interface TruckAvailability {
  id: string;
  date: string;
  truck: Truck;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  action: string;
  actorId: string;
  actorEmail: string;
  actorRole: string;
  targetId: string;
  targetEmail: string;
  companyId: string;
  companyNom: string;
  ip: string;
  metadata: Record<string, any>;
  createdAt: string;
}

export interface AdminStats {
  companies: { total: number; active: number; inactive: number };
  users: { total: number; active: number; inactive: number };
  bls: { total: number };
  logins: { today: number; week: number };
  recentLogs: AuditLog[];
}

export interface LoadingPlan {
  id: string;
  reference: string;
  dateLivraison: string;
  tonnageCharge: number;
  palettesChargees: number;
  isValidated: boolean;
  signature?: string;
  heureArrivee?: string;
  loadingStatus: LoadingStatus;
  loadingStartedAt?: string;
  loadingElapsedSeconds: number;
  calledAt?: string;
  enteredAt?: string;
  entryStatus: EntryStatus;
  quai?: string;
  stationsSequence?: string[];
  currentStationIdx?: number;
  currentStation?: string;
  truck: Truck;
  bonsLivraison: BonLivraison[];
  validatedBy?: User;
  createdAt: string;
}
