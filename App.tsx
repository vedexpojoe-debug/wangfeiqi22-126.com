
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Order, OrderStatus, UserRole, DriverProfile, DisposalProfile, 
  RecycledProduct, RecycledProductType, OrderType, FacilityOperationalStatus, 
  PropertyProfile, GovernmentNotice, WasteType, FleetProfile, 
  GovernmentTask, PromotionType, EnterpriseProfile, 
  GeoLocation, WorkerProfile, ClientProfile, RenovationApplication, 
  FleetProject, FacilityType, SettlementMethod, LaborServiceType, CollectionMethod,
  GovernmentProfile 
} from './types';
import { RoleSwitcher } from './components/RoleSwitcher';
import { ClientView } from './components/ClientView';
import { DriverView } from './components/DriverView';
import { DisposalView } from './components/DisposalView';
import { MarketplaceView } from './components/MarketplaceView';
import { PropertyView } from './components/PropertyView';
import { GovernmentView } from './components/GovernmentView';
import { FleetView } from './components/FleetView';
import { EnterpriseView } from './components/EnterpriseView';
import { WorkerView } from './components/WorkerView';
import { BottomNav, TabType } from './components/BottomNav';
import { AICopilot } from './components/AICopilot';
import { UserCircle } from 'lucide-react';

const INITIAL_ORDERS: Order[] = [
  {
    id: 'mock-1',
    userId: 'ent-1',
    createdAt: Date.now() - 3600000 * 2,
    status: OrderStatus.ARRIVED_DISPOSAL,
    assignedDriver: {
        name: '李师傅',
        phone: '13812345678',
        plate: '沪A-88888',
        fleetName: '城投环境物流车队',
    },
    orderType: OrderType.WASTE_REMOVAL,
    location: { lat: 31.23, lng: 121.47, address: '上海市浦东新区阳光路88号' },
    pickupDetails: {
      city: '上海市', district: '浦东新区', street: '阳光路 888', community: '阳光花苑',
      isCollected: true, locationType: 'GROUND_FLOOR'
    },
    mediaType: 'IMAGE',
    mediaData: 'https://images.unsplash.com/photo-1595278069441-2cf29f8005a4?auto=format&fit=crop&w=800', 
    analysis: {
      wasteType: WasteType.CONSTRUCTION,
      estimatedWeightKg: 1000,
      estimatedVolume: '1 车',
      estimatedPrice: 1200,
      description: '建筑垃圾清运',
      recommendedVehicle: 'Dump Truck',
      isBagged: false,
      isCollected: true,
      laborServiceRecommendation: LaborServiceType.NONE,
      recommendedCollectionMethod: CollectionMethod.IMMEDIATE
    },
    loadingPhoto: 'https://images.unsplash.com/photo-1595278069441-2cf29f8005a4?auto=format&fit=crop&w=800',
  }
];

const INITIAL_FACILITIES: DisposalProfile[] = [
  {
    id: 'fac-1',
    name: '浦东第一再生资源场',
    address: '浦东新区川沙路 88 号',
    location: { lat: 31.2000, lng: 121.6500 },
    contactPhone: '13811112222',
    licenseImageUrl: '',
    status: 'VERIFIED',
    joinedAt: Date.now() - 9999999,
    operationalStatus: FacilityOperationalStatus.OPEN,
    facilityType: FacilityType.FIXED_DISPOSAL,
    specialty: '装修垃圾 / 砖渣',
    allowedWasteTypes: [WasteType.CONSTRUCTION, WasteType.BULKY],
    preferredSettlement: 'PLATFORM',
    feeConfigs: [
        { wasteType: WasteType.CONSTRUCTION, pricePerUnit: 450, unit: 'TRUCK' },
        { wasteType: WasteType.BULKY, pricePerUnit: 600, unit: 'TRUCK' }
    ]
  }
];

const App: React.FC = () => {
  const [role, setRole] = useState<UserRole>(UserRole.CLIENT);
  const [activeTab, setActiveTab] = useState<TabType>('DASHBOARD');
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);
  const [marketProducts, setMarketProducts] = useState<RecycledProduct[]>([]);
  const [renovationApps, setRenovationApps] = useState<RenovationApplication[]>([]);
  const [govNotices, setGovNotices] = useState<GovernmentNotice[]>([
      { id: 'n1', title: '严厉打击非法倾倒', content: '近期监管部门将加强夜间巡查，请所有车辆务必闭环电子联单。', time: Date.now(), type: 'ALERT', targetRoles: [UserRole.DRIVER, UserRole.FLEET] }
  ]);
  const [fleetProjects, setFleetProjects] = useState<FleetProject[]>([]);
  
  const [driverProfile, setDriverProfile] = useState<DriverProfile | null>(null);
  const [allFacilities, setAllFacilities] = useState<DisposalProfile[]>(INITIAL_FACILITIES);
  const [propertyProfile, setPropertyProfile] = useState<PropertyProfile | null>({
      id: 'p1', name: '万科物业管理部', contactPhone: '13800001111', managedCommunities: ['阳光花苑', '滨江一号'], status: 'VERIFIED'
  });
  const [enterpriseProfile, setEnterpriseProfile] = useState<EnterpriseProfile | null>({
      id: 'ent-1', companyName: '中建八局装饰工程部', contactPhone: '13911112222', creditLimit: 500000, usedCredit: 12400, billingCycle: '每月10号', activeProjects: [
          { id: 'proj-1', name: '陆家嘴金融城改造', address: '陆家嘴环路', permitImageUrl: '', status: 'APPROVED', createdAt: Date.now(), hasConstructionPermit: true, hasDischargePermit: true, location: { lat: 31.23, lng: 121.5, address: '陆家嘴环路' } }
      ], status: 'VERIFIED', contractPricePerTruck: 450
  });
  const [workerProfile, setWorkerProfile] = useState<WorkerProfile | null>({
      id: 'w1', name: '老张', phone: '13611112222', teamName: '老张拆旧队', skills: ['打拆', '装卸'], rating: 4.9, status: 'AVAILABLE', profileStatus: 'VERIFIED'
  });

  const [allFleets, setAllFleets] = useState<FleetProfile[]>([
      { id: 'f1', name: '城投环境物流车队', managerName: '赵经理', totalVehicles: 15, safetyScore: 98, isAuthorizedPrint: true, status: 'VERIFIED', projects: [] },
      { id: 'f2', name: '绿通渣土专运', managerName: '王调度', totalVehicles: 8, safetyScore: 95, isAuthorizedPrint: true, status: 'VERIFIED', projects: [] }
  ]);

  const [governmentProfile, setGovernmentProfile] = useState<GovernmentProfile | null>({
      id: 'gov-1', regionName: '浦东新区', department: '生态环境局', status: 'VERIFIED'
  });

  const handleAddOrder = (order: Order) => {
    setOrders(prev => [order, ...prev]);
  };

  const updateStatus = (id: string, status: OrderStatus, data?: any) => {
    setOrders(prev => prev.map(o => {
      if (o.id === id) {
        const assignedDriver = data?.assignedDriver 
          ? { ...(o.assignedDriver || {}), ...data.assignedDriver }
          : o.assignedDriver;
        
        return { 
          ...o, 
          ...data, 
          status, 
          assignedDriver 
        };
      }
      return o;
    }));
  };

  const handleUpdateFacility = (updatedFac: DisposalProfile) => {
      setAllFacilities(prev => prev.map(f => f.id === updatedFac.id ? updatedFac : f));
      if (updatedFac.operationalStatus === FacilityOperationalStatus.FULL) {
          const alertNotice: GovernmentNotice = {
              id: `alert-${Date.now()}`,
              title: `🚨 消纳场爆仓告警：${updatedFac.name}`,
              content: `【紧急】该消纳场库容已达极限，已停止接纳新运单。`,
              time: Date.now(),
              type: 'ALERT',
              targetRoles: [UserRole.DRIVER, UserRole.FLEET]
          };
          setGovNotices(prev => [alertNotice, ...prev]);
      }
  };

  const handlePublishNotice = (notice: GovernmentNotice) => {
      setGovNotices(prev => [notice, ...prev]);
  };

  const handleDriverOnboarding = (profile: DriverProfile, newFleet?: FleetProfile) => {
      setDriverProfile(profile);
      if (newFleet) {
          setAllFleets(prev => [...prev, newFleet]);
      }
  };

  const handleUpdateFleet = (fleet: FleetProfile) => {
      setAllFleets(prev => prev.map(f => f.id === fleet.id ? fleet : f));
  };

  const renderProfileTab = () => {
    return (
      <div className="p-6 space-y-8 animate-fade-in">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-20 h-20 rounded-3xl bg-slate-100 flex items-center justify-center text-slate-400">
             <UserCircle size={48} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900">系统设置</h2>
            <p className="text-slate-500 text-sm">切换视图以体验不同角色功能</p>
          </div>
        </div>

        <section>
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">切换当前角色</h3>
          <RoleSwitcher currentRole={role} onRoleChange={setRole} />
        </section>

        <section className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
           <h3 className="font-black text-slate-800 text-sm mb-4">关于 EcoClear</h3>
           <p className="text-xs text-slate-500 leading-relaxed">
             EcoClear 是一个基于人工智能和区块链技术的智慧建筑垃圾流向监管与再生资源交易平台。
           </p>
        </section>
      </div>
    );
  };

  const renderDashboard = () => {
    switch (role) {
      case UserRole.CLIENT:
        return <ClientView addOrder={handleAddOrder} updateOrder={o => setOrders(orders.map(old => old.id === o.id ? o : old))} userOrders={orders.filter(o => o.userId === 'user-1')} marketRecommendations={marketProducts.slice(0, 3)} govNotices={govNotices} renovationApps={renovationApps} onApplyRenovation={a => setRenovationApps([a, ...renovationApps])} />;
      case UserRole.DRIVER:
        return <DriverView 
            orders={orders} 
            updateStatus={updateStatus} 
            driverProfile={driverProfile} 
            onUpdateProfile={handleDriverOnboarding} 
            fleetProjects={fleetProjects} 
            onAddProject={p => setFleetProjects([...fleetProjects, p])} 
            govNotices={govNotices} 
            existingFleets={allFleets.map(f => f.name)} 
            allFacilities={allFacilities}
            addOrder={handleAddOrder} 
        />;
      case UserRole.DISPOSAL:
        const myFac = allFacilities.find(f => f.id === 'fac-1') || allFacilities[0];
        return <DisposalView 
            orders={orders} 
            updateStatus={updateStatus} 
            disposalProfile={myFac} 
            onUpdateProfile={handleUpdateFacility} 
            onPublishProduct={p => setMarketProducts([p, ...marketProducts])}
            onPublishNotice={handlePublishNotice}
        />;
      case UserRole.PROPERTY:
        return <PropertyView profile={propertyProfile!} orders={orders} addOrder={handleAddOrder} renovationApps={renovationApps} onUpdateRenovation={a => setRenovationApps(renovationApps.map(old => old.id === a.id ? a : old))} />;
      case UserRole.ENTERPRISE:
        return <EnterpriseView profile={enterpriseProfile!} orders={orders} addOrder={handleAddOrder} govNotices={govNotices} onUpdateProfile={setEnterpriseProfile} />;
      case UserRole.WORKER:
        return <WorkerView profile={workerProfile!} orders={orders} addOrder={handleAddOrder} updateStatus={updateStatus} />;
      case UserRole.FLEET:
        const fleetToShow = allFleets.find(f => f.name === (driverProfile?.fleetName || '城投环境物流车队')) || allFleets[0];
        return <FleetView 
            profile={fleetToShow} 
            orders={orders} 
            govNotices={govNotices} 
            supervisionTasks={[]} 
            facilities={allFacilities} 
            onAcceptOrder={id => updateStatus(id, OrderStatus.PENDING_PICKUP, { assignedDriver: { fleetName: fleetToShow.name, plate: '待指派' } })} 
            onAssignDriver={(id, d) => updateStatus(id, OrderStatus.IN_PROGRESS, { assignedDriver: { name: d.name, plate: d.vehiclePlate, phone: d.phone, fleetName: fleetToShow.name } })} 
            onUpdateProfile={handleUpdateFleet}
            addOrder={handleAddOrder} 
            updateStatus={updateStatus}
        />;
      case UserRole.GOVERNMENT:
        return <GovernmentView profile={governmentProfile!} orders={orders} notices={govNotices} tasks={[]} onPublishNotice={handlePublishNotice} onDispatchTask={() => {}} allFacilities={allFacilities} />;
      default:
        return <div className="p-10 text-center">加载中...</div>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center">
      <AICopilot 
        userRole={role} 
        contextSummary={`${orders.length} orders total.`} 
        onNavigate={t => setActiveTab(t as TabType)} 
      />
      <div className="max-w-md w-full bg-white min-h-screen shadow-2xl relative flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto no-scrollbar">
            {activeTab === 'DASHBOARD' && renderDashboard()}
            {activeTab === 'MARKET' && <MarketplaceView products={marketProducts} orders={orders} />}
            {activeTab === 'PROFILE' && renderProfileTab()}
        </main>
        <BottomNav currentTab={activeTab} onTabChange={setActiveTab} userRole={role} />
      </div>
    </div>
  );
};

export default App;
