
export enum OrderStatus {
  CREATED = 'CREATED',
  ANALYZING = 'ANALYZING',
  REVIEW_REQUIRED = 'REVIEW_REQUIRED',
  PENDING_PICKUP = 'PENDING_PICKUP',
  IN_PROGRESS = 'IN_PROGRESS',
  ARRIVED_PICKUP = 'ARRIVED_PICKUP',
  LOADING_COMPLETE = 'LOADING_COMPLETE',
  ARRIVED_DISPOSAL = 'ARRIVED_DISPOSAL',
  COMPLETED = 'COMPLETED',
}

export enum OrderType {
  WASTE_REMOVAL = 'WASTE_REMOVAL',
  RECYCLE_TRADE = 'RECYCLE_TRADE',
  DEMOLITION = 'DEMOLITION',
  LABOR = 'LABOR'
}

export enum WasteType {
  GENERAL = 'GENERAL',
  CONSTRUCTION = 'CONSTRUCTION',
  HAZARDOUS = 'HAZARDOUS',
  RECYCLABLE = 'RECYCLABLE',
  ORGANIC = 'ORGANIC',
  ELECTRONIC = 'ELECTRONIC',
  BULKY = 'BULKY',
  GARDEN = 'GARDEN',
  UNKNOWN = 'UNKNOWN'
}

export interface GeoLocation {
  lat: number;
  lng: number;
  address?: string;
}

export type MediaType = 'IMAGE' | 'VIDEO';

export enum RecycledProductType {
  STONE_POWDER = 'STONE_POWDER',
  GRAVEL = 'GRAVEL',
  LIGHT_MATERIAL = 'LIGHT_MATERIAL',
  SCRAP_IRON = 'SCRAP_IRON',
  WOOD = 'WOOD',
  PLASTIC = 'PLASTIC',
  GLASS = 'GLASS',
  OTHER = 'OTHER'
}

export type SettlementMethod = 'PLATFORM' | 'DIRECT';

export interface DisposalFeeConfig {
  wasteType: WasteType;
  pricePerUnit: number;
  unit: 'TRUCK' | 'TON' | 'CUBIC';
}

export interface DisposalProfile {
  id: string;
  name: string;
  address: string;
  location: GeoLocation;
  contactPhone: string;
  licenseImageUrl: string;
  status: 'PENDING' | 'VERIFIED' | 'REJECTED';
  joinedAt: number;
  operationalStatus: FacilityOperationalStatus;
  facilityType: FacilityType;
  specialty: string;
  allowedWasteTypes: WasteType[];
  feeConfigs: DisposalFeeConfig[];
  preferredSettlement: SettlementMethod;
  description?: string;
}

export enum FacilityOperationalStatus {
  OPEN = 'OPEN',
  BUSY = 'BUSY',
  FULL = 'FULL'
}

export enum FacilityType {
  FIXED_DISPOSAL = 'FIXED_DISPOSAL',
  TEMP_TRANSFER = 'TEMP_TRANSFER',
  MOBILE_DISPOSAL = 'MOBILE_DISPOSAL',
  DROP_OFF = 'DROP_OFF'
}

export interface RecycledProduct {
  id: string;
  type: RecycledProductType;
  quantity: string;
  estimatedValue: number;
  imageUrl: string;
  createdAt: number;
  facilityName: string;
  facilityLocation: string;
  contactPhone: string;
  promotionType: PromotionType;
  facilityStatus?: FacilityOperationalStatus;
  facilitySpecialty?: string;
}

export enum PromotionType {
  NONE = 'NONE',
  DISCOUNT = 'DISCOUNT',
  FREE = 'FREE'
}

export interface Order {
  id: string;
  userId: string;
  createdAt: number;
  status: OrderStatus;
  orderType: OrderType;
  location: GeoLocation;
  mediaType: MediaType;
  mediaData: string;
  analysis?: WasteAnalysisResult;
  assignedDriver?: {
    name: string;
    phone: string;
    plate: string;
    fleetName?: string;
    fleetId?: string;
  };
  pickupDetails?: PickupDetails;
  disposalFee?: number;
  disposalSettlementMethod?: SettlementMethod;
  disposalSettlementStatus?: 'UNPAID' | 'PAID' | 'PENDING_PLATFORM';
  disposalFacilityId?: string;
  disposalFacilityName?: string;
  loadingPhoto?: string;
  disposalEntryPhoto?: string;
  paymentStatus?: 'UNPAID' | 'PAID' | 'CREDIT' | 'MONTHLY_BILL';
  tradeDirection?: 'BUY' | 'SELL';
  assignedWorker?: any;
  demolitionDetails?: any;
  laborDetails?: any;
  buyRequirements?: any;
  manifestSerialNo?: string;
}

export enum UserRole {
  CLIENT = 'CLIENT',
  DRIVER = 'DRIVER',
  DISPOSAL = 'DISPOSAL',
  PROPERTY = 'PROPERTY',
  GOVERNMENT = 'GOVERNMENT',
  FLEET = 'FLEET',
  ENTERPRISE = 'ENTERPRISE',
  WORKER = 'WORKER'
}

export interface GovernmentNotice {
  id: string;
  title?: string;
  content: string;
  time: number;
  type: 'NOTICE' | 'ALERT' | 'MEETING' | 'ACTIVITY';
  targetRoles?: UserRole[];
}

export interface GovernmentTask {
  id: string;
  targetUnitId: string;
  targetUnitName: string;
  type: string;
  location: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
}

export enum LaborServiceType {
  NONE = 'NONE',
  LOADING_ONLY = 'LOADING_ONLY',
  CARRY_AND_LOAD = 'CARRY_AND_LOAD'
}

export enum CollectionMethod {
  IMMEDIATE = 'IMMEDIATE',
  CONTAINER = 'CONTAINER'
}

export interface WasteAnalysisResult {
  wasteType: WasteType;
  estimatedWeightKg: number;
  estimatedVolume: string;
  estimatedPrice: number;
  description: string;
  recommendedVehicle: string;
  hazardWarning?: string;
  isBagged: boolean;
  isCollected: boolean;
  laborServiceRecommendation: LaborServiceType;
  recommendedCollectionMethod: CollectionMethod;
}

export interface PickupDetails {
  city: string;
  district: string;
  street: string;
  community: string;
  isCollected: boolean;
  locationType: string;
  building?: string;
  unit?: string;
  roomNumber?: string;
  contractorName?: string;
  projectName?: string;
}

export type ProjectStatus = 'APPROVED' | 'PENDING' | 'REJECTED';

export interface FleetProject {
  id: string;
  name: string;
  address: string;
  permitImageUrl: string;
  status: ProjectStatus;
  createdAt: number;
  ownerId?: string;
}

export interface EnterpriseProject extends FleetProject {
  location: GeoLocation;
  externalSync?: {
    platformName: string;
    externalId: string;
    syncStatus: 'PENDING' | 'SYNCED' | 'FAILED';
    lastSyncTime: number;
  };
  hasConstructionPermit: boolean;
  hasDischargePermit: boolean;
}

export interface RenovationApplication {
  id: string;
  userId: string;
  applicantName: string;
  applicantPhone: string;
  applicantRole: 'OWNER' | 'TENANT' | 'CONTRACTOR';
  projectType: 'RESIDENTIAL' | 'COMMERCIAL';
  communityName: string;
  roomNumber: string;
  renovationCompany?: string;
  startDate: number;
  estimatedDurationDays: number;
  status: ProjectStatus;
  createdAt: number;
  permitId?: string;
}

export interface DropOffPoint {
  id: string;
  name: string;
  location: GeoLocation;
  allowedTypes: WasteType[];
  capacityStatus: 'EMPTY' | 'NORMAL' | 'FULL';
  managerName: string;
  managerPhone: string;
  openingHours: string;
  requirements: string;
  lastMaintenance: number;
}

export interface DriverProfile {
  id: string;
  name: string;
  phone: string;
  licenseNumber: string;
  vehiclePlate: string;
  vehicleType: string;
  status: 'PENDING' | 'VERIFIED' | 'REJECTED';
  joinedAt: number;
  licenseImageUrl: string;
  fleetName?: string;
  isIndependent: boolean; // 新增：是否为个人司机
}

export enum FleetNotificationType {
  SAFETY = 'SAFETY',
  DISPATCH = 'DISPATCH',
  MAINTENANCE = 'MAINTENANCE'
}

export interface PropertyProfile {
  id: string;
  name: string;
  contactPhone: string;
  managedCommunities: string[];
  status: 'PENDING' | 'VERIFIED' | 'REJECTED';
  suppliers?: PropertySupplier[];
}

export interface PropertySupplier {
  id: string;
  name: string;
  manager: string;
  phone: string;
  truckCount: number;
  rating: number;
  status: 'ACTIVE' | 'INACTIVE';
  contractUntil: number;
}

export interface GovernmentProfile {
  id: string;
  regionName: string;
  department: string;
  status: 'PENDING' | 'VERIFIED' | 'REJECTED';
}

export interface FleetProfile {
  id: string;
  name: string;
  managerName: string;
  totalVehicles: number;
  safetyScore: number;
  isAuthorizedPrint: boolean;
  status: 'PENDING' | 'VERIFIED' | 'REJECTED';
  projects: FleetProject[];
}

export interface EnterpriseProfile {
  id: string;
  companyName: string;
  contactPhone: string;
  creditLimit: number;
  usedCredit: number;
  billingCycle: string;
  activeProjects: EnterpriseProject[];
  status: 'PENDING' | 'VERIFIED' | 'REJECTED';
  contractPricePerTruck?: number;
}

export interface WorkerProfile {
  id: string;
  name: string;
  phone: string;
  teamName?: string;
  skills: string[];
  rating: number;
  status: 'AVAILABLE' | 'BUSY';
  profileStatus: 'PENDING' | 'VERIFIED' | 'REJECTED';
}

export interface ClientProfile {
  id: string;
  name: string;
  phone: string;
  defaultAddress?: string;
  status: 'PENDING' | 'VERIFIED' | 'REJECTED';
}

export interface ComplaintEvent {
  id: string;
  userId: string;
  type: 'ILLEGAL_DUMPING' | 'NOISE' | 'ODOR' | 'OTHER';
  location: GeoLocation;
  description: string;
  mediaData: string;
  status: 'PENDING' | 'RESOLVED';
  createdAt: number;
}

export interface PolicyGuide {
  id: string;
  title: string;
  category: string;
  publishDate: number;
}

export interface ChatMessage {
  id: string;
  text: string;
  sender: 'AI' | 'USER';
  timestamp: number;
  actionLink?: string;
}
