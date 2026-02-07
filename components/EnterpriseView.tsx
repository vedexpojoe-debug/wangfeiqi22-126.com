
import React, { useState, useRef } from 'react';
import { EnterpriseProfile, Order, OrderStatus, OrderType, MediaType, GovernmentNotice, WasteType, RecycledProductType, EnterpriseProject, LaborServiceType, CollectionMethod } from '../types';
import { Building2, CreditCard, FileText, Plus, PieChart, Calendar, ChevronRight, Camera, Video, Wallet, CheckCircle, Clock, MapPin, Download, Search, Truck, FileCheck, Layers, Users, Hammer, Receipt, ShoppingBag, Box, UserCog, Calculator, ShieldCheck, X, Globe, FileSignature, HardHat, Armchair, Leaf } from 'lucide-react';

interface EnterpriseViewProps {
  profile: EnterpriseProfile;
  orders: Order[];
  addOrder: (order: Order) => void;
  govNotices: GovernmentNotice[];
  onUpdateProfile: (profile: EnterpriseProfile) => void;
}

const PRODUCT_TYPE_NAMES: Record<string, string> = {
    [RecycledProductType.STONE_POWDER]: '石粉',
    [RecycledProductType.GRAVEL]: '再生石子',
    [RecycledProductType.LIGHT_MATERIAL]: '轻物质',
    [RecycledProductType.SCRAP_IRON]: '废铁',
    [RecycledProductType.WOOD]: '废木材',
    [RecycledProductType.PLASTIC]: '废塑料',
    [RecycledProductType.OTHER]: '其他'
  };

// Mock Contracted Fleets for Enterprise
const MOCK_CONTRACTED_FLEETS = [
   { id: 'fleet-1', name: '城投环境物流车队', contact: '赵经理', phone: '13900001111', rating: 4.9, availableTrucks: 12 },
   { id: 'fleet-2', name: '绿通渣土专运', contact: '王调度', phone: '13800002222', rating: 4.8, availableTrucks: 8 },
   { id: 'fleet-3', name: '东部建设运输队', contact: '陈队长', phone: '13600003333', rating: 4.7, availableTrucks: 5 }
];

export const EnterpriseView: React.FC<EnterpriseViewProps> = ({ profile, orders, addOrder, govNotices, onUpdateProfile }) => {
  const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'PROJECTS' | 'FINANCE'>('DASHBOARD');
  
  // Create Order State
  const [isCreating, setIsCreating] = useState(false);
  const [createMode, setCreateMode] = useState<'REMOVAL' | 'PROCUREMENT'>('REMOVAL'); 
  
  const [selectedProjectId, setSelectedProjectId] = useState(profile.activeProjects[0]?.id || '');
  const [mediaData, setMediaData] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<MediaType>('IMAGE');
  const [truckCount, setTruckCount] = useState<number>(1); 
  
  // New: Waste Type Selection
  const [selectedWasteType, setSelectedWasteType] = useState<WasteType>(WasteType.CONSTRUCTION);

  // New: Advanced Options
  const [collectionMethod, setCollectionMethod] = useState<CollectionMethod>(CollectionMethod.IMMEDIATE);
  const [dispatchMode, setDispatchMode] = useState<'BROADCAST' | 'ASSIGN'>('BROADCAST');
  const [selectedFleetId, setSelectedFleetId] = useState(MOCK_CONTRACTED_FLEETS[0].id);
  const [targetVehicle, setTargetVehicle] = useState<string>('Dump Truck');

  const [services, setServices] = useState({
      tax: true,
      labor: false,
      loading: true
  });

  // Procurement State
  const [procurementDetails, setProcurementDetails] = useState({
      productType: RecycledProductType.GRAVEL,
      quantity: '1000 吨',
      targetPrice: '25000'
  });

  // Add Project State
  const [isAddProjectModalOpen, setIsAddProjectModalOpen] = useState(false);
  const [newProjectData, setNewProjectData] = useState({ 
      name: '', 
      address: '', 
      lat: null as number | null, 
      lng: null as number | null,
      hasConstructionPermit: false,
      hasDischargePermit: false
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filter orders for this enterprise
  const myOrders = orders.filter(o => o.userId === `ent-${profile.id}`);
  
  // Calculations
  const availableCredit = profile.creditLimit - profile.usedCredit;
  const creditUsagePercent = (profile.usedCredit / profile.creditLimit) * 100;
  
  const pendingOrders = myOrders.filter(o => o.status !== OrderStatus.COMPLETED);
  const thisMonthOrders = myOrders.filter(o => o.createdAt > Date.now() - 30 * 24 * 60 * 60 * 1000);

  // Price Calculation Logic
  const basePrice = profile.contractPricePerTruck || 500;
  const containerFee = collectionMethod === CollectionMethod.CONTAINER ? 300 : 0;
  const laborFee = services.labor ? 150 : 0;
  const loadingFee = services.loading ? 100 : 0;
  
  const subTotalPerTruck = basePrice + containerFee + laborFee + loadingFee;
  const taxRate = services.tax ? 1.06 : 1.0;
  const finalPricePerTruck = Math.round(subTotalPerTruck * taxRate);
  const totalEstimate = finalPricePerTruck * truckCount;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const isVideo = file.type.startsWith('video/');
      setMediaType(isVideo ? 'VIDEO' : 'IMAGE');

      const reader = new FileReader();
      reader.onloadend = () => {
        setMediaData(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleService = (key: keyof typeof services) => {
      setServices(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleGetLocation = () => {
      if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
              (position) => {
                  setNewProjectData({
                      ...newProjectData,
                      lat: position.coords.latitude,
                      lng: position.coords.longitude,
                      address: newProjectData.address || '上海市浦东新区 (定位自动填入)' // Simulating reverse geocode
                  });
              },
              (error) => {
                  alert('无法获取定位，请手动输入');
                  console.error(error);
              }
          );
      }
  };

  const handleAddProject = () => {
      if (!newProjectData.name.trim() || !newProjectData.address.trim()) return;
      
      // FIX: Added permitImageUrl to match EnterpriseProject (via FleetProject) interface
      const newProject: EnterpriseProject = {
          id: `proj-${Date.now()}`,
          name: newProjectData.name.trim(),
          address: newProjectData.address.trim(),
          permitImageUrl: '', 
          location: { 
              lat: newProjectData.lat || 31.22, 
              lng: newProjectData.lng || 121.48,
              address: newProjectData.address.trim()
          },
          createdAt: Date.now(),
          status: 'PENDING',
          externalSync: {
              platformName: '穗联管',
              externalId: `E-${Math.floor(Math.random() * 10000)}`,
              syncStatus: 'PENDING',
              lastSyncTime: Date.now()
          },
          hasConstructionPermit: newProjectData.hasConstructionPermit,
          hasDischargePermit: newProjectData.hasDischargePermit
      };

      const updatedProfile = {
          ...profile,
          activeProjects: [...profile.activeProjects, newProject]
      };
      
      onUpdateProfile(updatedProfile);
      setNewProjectData({ name: '', address: '', lat: null, lng: null, hasConstructionPermit: false, hasDischargePermit: false });
      setIsAddProjectModalOpen(false);
      alert("新项目已添加！正在等待平台及监管部门审核。");
  };

  const handleSubmitOrder = () => {
    if (createMode === 'REMOVAL' && !mediaData) {
       alert("请上传现场照片/视频");
       return;
    }

    // Default to first project if selected is empty/removed
    const targetProject = profile.activeProjects.find(p => p.id === selectedProjectId) || profile.activeProjects[0];
    
    if (!targetProject && profile.activeProjects.length === 0) {
        alert("请先添加项目");
        return;
    }

    // Fallback info if no project found (shouldn't happen with checks)
    const projectInfo = targetProject || { name: '未分类项目', address: '企业默认地址', location: { lat: 31.2, lng: 121.5 } };

    if (createMode === 'PROCUREMENT') {
        // Create a Buy Order
        const newOrder: Order = {
            id: `ent-buy-${Date.now()}`,
            userId: `ent-${profile.id}`,
            createdAt: Date.now(),
            status: OrderStatus.PENDING_PICKUP, // Procurement starts as pending acceptance
            orderType: OrderType.RECYCLE_TRADE,
            tradeDirection: 'BUY',
            location: projectInfo.location,
            pickupDetails: {
                city: '上海市',
                district: '浦东新区',
                street: projectInfo.address,
                community: projectInfo.name,
                projectName: projectInfo.name,
                isCollected: true,
                locationType: 'GROUND_FLOOR'
            },
            mediaType: 'IMAGE',
            mediaData: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&q=80&w=400', // Default image for buy request
            paymentStatus: 'CREDIT',
            buyRequirements: {
                productType: procurementDetails.productType,
                quantity: procurementDetails.quantity,
                targetPrice: parseFloat(procurementDetails.targetPrice)
            }
        };
        addOrder(newOrder);
        alert("采购需求已发布！\n已同步至【资源集市】与【处置中心】供货端。");
    } else {
        // Create Waste Removal Order (Bulk)
        const selectedFleet = MOCK_CONTRACTED_FLEETS.find(f => f.id === selectedFleetId);

        for (let i = 0; i < truckCount; i++) {
            const orderId = `ent-ord-${Date.now()}-${i}`;
            const newOrder: Order = {
                id: orderId,
                userId: `ent-${profile.id}`,
                createdAt: Date.now() + i,
                status: OrderStatus.PENDING_PICKUP, 
                orderType: OrderType.WASTE_REMOVAL,
                location: projectInfo.location,
                pickupDetails: {
                    city: '上海市',
                    district: '浦东新区',
                    street: projectInfo.address,
                    community: projectInfo.name,
                    projectName: projectInfo.name,
                    isCollected: true,
                    locationType: 'GROUND_FLOOR'
                },
                mediaType: mediaType,
                mediaData: mediaData!,
                paymentStatus: 'CREDIT',
                assignedDriver: dispatchMode === 'ASSIGN' ? {
                    name: '车队调度中',
                    phone: selectedFleet?.phone || '',
                    plate: '待指派车辆',
                    fleetName: selectedFleet?.name
                } : undefined,
                analysis: {
                    wasteType: selectedWasteType,
                    estimatedWeightKg: 0, 
                    estimatedVolume: '1 车',
                    estimatedPrice: finalPricePerTruck, // Updated dynamic price
                    description: `企业批量清运订单 (${i + 1}/${truckCount}) - ${projectInfo.name}`,
                    recommendedVehicle: targetVehicle,
                    isBagged: false,
                    isCollected: true,
                    // Fixed: Use enum values instead of strings
                    laborServiceRecommendation: services.labor ? LaborServiceType.CARRY_AND_LOAD : LaborServiceType.NONE,
                    recommendedCollectionMethod: collectionMethod
                }
            };
            addOrder(newOrder);
        }
        alert(`已成功创建 ${truckCount} 个清运订单！\n类别: ${selectedWasteType}\n${dispatchMode === 'ASSIGN' ? `已指派给【${selectedFleet?.name}】` : '已发布至公海池'}\n车型: ${targetVehicle}\n每车单价 ¥${finalPricePerTruck} (含所选服务)。`);
    }
    
    setIsCreating(false);
    setMediaData(null);
    setTruckCount(1);
    setMediaType('IMAGE');
    setCreateMode('REMOVAL'); // Reset
    setDispatchMode('BROADCAST');
    setTargetVehicle('Dump Truck');
    setSelectedWasteType(WasteType.CONSTRUCTION);
  };

  return (
    <div className="pb-24 bg-slate-50 min-h-screen relative">
      
      {/* Add Project Modal */}
      {isAddProjectModalOpen && (
          <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
             <div className="bg-white w-full max-w-sm rounded-xl overflow-hidden shadow-2xl animate-fade-in-up">
                 <div className="bg-slate-700 p-4 text-white flex justify-between items-center">
                    <h3 className="font-bold flex items-center">
                        <Plus className="w-5 h-5 mr-2" /> 新增施工项目
                    </h3>
                    <button onClick={() => setIsAddProjectModalOpen(false)}><X className="w-5 h-5" /></button>
                 </div>
                 <div className="p-5 space-y-4">
                     <div>
                         <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">项目名称</label>
                         <input 
                            className="w-full p-3 border border-gray-200 rounded-lg text-sm"
                            placeholder="例如: 陆家嘴中心绿地改造工程"
                            value={newProjectData.name}
                            onChange={(e) => setNewProjectData({...newProjectData, name: e.target.value})}
                         />
                     </div>
                     <div>
                         <label className="text-xs font-bold text-gray-500 uppercase mb-1 flex justify-between">
                             <span>具体地址</span>
                             <button 
                                onClick={handleGetLocation} 
                                className="text-blue-600 flex items-center hover:underline"
                             >
                                <MapPin className="w-3 h-3 mr-1" /> 获取定位
                             </button>
                         </label>
                         <input 
                            className="w-full p-3 border border-gray-200 rounded-lg text-sm"
                            placeholder="例如: 浦东新区XX路XX号 (支持定位)"
                            value={newProjectData.address}
                            onChange={(e) => setNewProjectData({...newProjectData, address: e.target.value})}
                         />
                     </div>
                     
                     <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                         <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">前置手续核验 (合规性自查)</label>
                         <div className="space-y-2">
                             <label className="flex items-center space-x-2 cursor-pointer">
                                 <input 
                                     type="checkbox" 
                                     className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                     checked={newProjectData.hasConstructionPermit}
                                     onChange={(e) => setNewProjectData({...newProjectData, hasConstructionPermit: e.target.checked})}
                                 />
                                 <span className="text-sm text-gray-700">已办理施工许可证/开工证明</span>
                             </label>
                             <label className="flex items-center space-x-2 cursor-pointer">
                                 <input 
                                     type="checkbox" 
                                     className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                     checked={newProjectData.hasDischargePermit}
                                     onChange={(e) => setNewProjectData({...newProjectData, hasDischargePermit: e.target.checked})}
                                 />
                                 <span className="text-sm text-gray-700">已办理建筑垃圾处置(排放)证</span>
                             </label>
                         </div>
                     </div>

                     <button 
                         onClick={handleAddProject}
                         disabled={!newProjectData.name.trim() || !newProjectData.address.trim()}
                         className={`w-full py-3 text-white font-bold rounded-xl shadow-lg ${!newProjectData.name.trim() || !newProjectData.address.trim() ? 'bg-gray-300' : 'bg-blue-600 hover:bg-blue-700'}`}
                     >
                         确认添加
                     </button>
                 </div>
             </div>
          </div>
      )}

      {/* Create Order Modal */}
      {isCreating && (
         <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-md rounded-xl overflow-hidden shadow-2xl animate-fade-in-up flex flex-col max-h-[90vh]">
               <div className="bg-slate-800 p-4 flex justify-between items-center text-white shrink-0">
                  <h2 className="font-bold text-lg flex items-center">
                     <Building2 className="w-5 h-5 mr-2" /> 企业控制台 - 新建任务
                  </h2>
                  <button onClick={() => setIsCreating(false)}><ChevronRight className="w-6 h-6 rotate-90" /></button>
               </div>
               
               <div className="p-5 space-y-4 overflow-y-auto">
                  
                  {/* Mode Switcher */}
                  <div className="flex bg-slate-100 p-1 rounded-lg shrink-0">
                     <button 
                        onClick={() => setCreateMode('REMOVAL')}
                        className={`flex-1 py-2 rounded-md text-sm font-bold transition-all ${createMode === 'REMOVAL' ? 'bg-white shadow text-slate-800' : 'text-slate-500'}`}
                     >
                        批量清运 (出)
                     </button>
                     <button 
                        onClick={() => setCreateMode('PROCUREMENT')}
                        className={`flex-1 py-2 rounded-md text-sm font-bold transition-all ${createMode === 'PROCUREMENT' ? 'bg-blue-600 shadow text-white' : 'text-slate-500'}`}
                     >
                        物资采购 (进)
                     </button>
                  </div>

                  <div>
                     <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">归属项目 (Project)</label>
                     <select 
                        value={selectedProjectId}
                        onChange={(e) => setSelectedProjectId(e.target.value)}
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 outline-none"
                     >
                        {profile.activeProjects.length > 0 ? (
                            profile.activeProjects.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))
                        ) : (
                            <option value="">暂无项目，请先添加</option>
                        )}
                     </select>
                     {profile.activeProjects.length === 0 && (
                         <button 
                            onClick={() => { setIsCreating(false); setActiveTab('PROJECTS'); setIsAddProjectModalOpen(true); }}
                            className="text-xs text-blue-600 font-bold mt-2"
                         >
                             + 去添加项目
                         </button>
                     )}
                     {/* Show selected project address */}
                     {profile.activeProjects.find(p => p.id === selectedProjectId) && (
                         <div className="mt-2 flex items-start text-xs text-slate-500">
                             <MapPin className="w-3 h-3 mr-1 mt-0.5 text-blue-500" />
                             {profile.activeProjects.find(p => p.id === selectedProjectId)?.address}
                         </div>
                     )}
                  </div>
                  
                  {/* REMOVAL MODE CONTENT */}
                  {createMode === 'REMOVAL' && (
                  <div className="space-y-4">
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase mb-1 flex justify-between">
                            <span>所需车辆/车次 (Trucks)</span>
                            <span className="text-blue-600">1车 = 1张独立联单</span>
                        </label>
                        <div className="flex items-center gap-3">
                            <button 
                            onClick={() => setTruckCount(Math.max(1, truckCount - 1))}
                            className="w-10 h-10 rounded-lg bg-gray-100 font-bold flex items-center justify-center text-lg text-gray-600 hover:bg-gray-200"
                            >
                            -
                            </button>
                            <div className="flex-1 bg-slate-50 border border-slate-200 rounded-xl h-10 flex items-center justify-center font-bold text-slate-800">
                            {truckCount} 车
                            </div>
                            <button 
                            onClick={() => setTruckCount(truckCount + 1)}
                            className="w-10 h-10 rounded-lg bg-gray-100 font-bold flex items-center justify-center text-lg text-gray-600 hover:bg-gray-200"
                            >
                            +
                            </button>
                        </div>
                    </div>

                    {/* Waste Type Selector */}
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">垃圾类别</label>
                        <div className="grid grid-cols-3 gap-2">
                            <button 
                                onClick={() => setSelectedWasteType(WasteType.CONSTRUCTION)}
                                className={`p-2 rounded-lg text-xs font-bold border flex flex-col items-center justify-center ${selectedWasteType === WasteType.CONSTRUCTION ? 'bg-slate-700 text-white border-slate-700' : 'bg-white border-gray-200 text-slate-500'}`}
                            >
                                <HardHat className="w-4 h-4 mb-1" /> 建筑装修
                            </button>
                            <button 
                                onClick={() => setSelectedWasteType(WasteType.BULKY)}
                                className={`p-2 rounded-lg text-xs font-bold border flex flex-col items-center justify-center ${selectedWasteType === WasteType.BULKY ? 'bg-slate-700 text-white border-slate-700' : 'bg-white border-gray-200 text-slate-500'}`}
                            >
                                <Armchair className="w-4 h-4 mb-1" /> 大件家具
                            </button>
                            <button 
                                onClick={() => setSelectedWasteType(WasteType.GARDEN)}
                                className={`p-2 rounded-lg text-xs font-bold border flex flex-col items-center justify-center ${selectedWasteType === WasteType.GARDEN ? 'bg-slate-700 text-white border-slate-700' : 'bg-white border-gray-200 text-slate-500'}`}
                            >
                                <Leaf className="w-4 h-4 mb-1" /> 园林绿化
                            </button>
                        </div>
                    </div>

                    {/* Fleet Assignment Section */}
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">指派模式</label>
                        <div className="grid grid-cols-2 gap-3 mb-3">
                            <button 
                                onClick={() => setDispatchMode('BROADCAST')}
                                className={`p-3 rounded-xl border text-sm font-bold flex flex-col items-center justify-center transition-all ${
                                    dispatchMode === 'BROADCAST' 
                                    ? 'bg-blue-50 border-blue-500 text-blue-700' 
                                    : 'bg-white border-slate-200 text-slate-500'
                                }`}
                            >
                                <Users className="w-5 h-5 mb-1" />
                                平台公海
                                <span className="text-[9px] font-normal mt-0.5">附近司机抢单</span>
                            </button>
                            <button 
                                onClick={() => setDispatchMode('ASSIGN')}
                                className={`p-3 rounded-xl border text-sm font-bold flex flex-col items-center justify-center transition-all ${
                                    dispatchMode === 'ASSIGN' 
                                    ? 'bg-blue-50 border-blue-500 text-blue-700' 
                                    : 'bg-white border-slate-200 text-slate-500'
                                }`}
                            >
                                <Truck className="w-5 h-5 mb-1" />
                                指定签约车队
                                <span className="text-[9px] font-normal mt-0.5">协议月结服务</span>
                            </button>
                        </div>
                        
                        {dispatchMode === 'ASSIGN' && (
                           <div className="space-y-2 mt-2 animate-fade-in">
                              <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">选择签约车队</label>
                              <div className="space-y-2 max-h-32 overflow-y-auto pr-1">
                                {MOCK_CONTRACTED_FLEETS.map(f => (
                                    <button
                                        key={f.id}
                                        onClick={() => setSelectedFleetId(f.id)}
                                        className={`w-full p-3 rounded-xl border flex justify-between items-center transition-all ${selectedFleetId === f.id ? 'bg-blue-50 border-blue-500 shadow-sm ring-1 ring-blue-500' : 'bg-white border-slate-200 hover:border-blue-300'}`}
                                    >
                                        <div className="text-left flex-1">
                                            <div className={`text-sm font-bold flex items-center ${selectedFleetId === f.id ? 'text-blue-900' : 'text-gray-800'}`}>
                                                {f.name}
                                                <span className="ml-2 text-[10px] bg-slate-100 text-slate-600 px-1 rounded">
                                                    空闲: {f.availableTrucks}车
                                                </span>
                                            </div>
                                            <div className="text-xs text-gray-500 mt-0.5 flex items-center">
                                                <span className="mr-2">联系: {f.contact}</span>
                                                <span className="flex items-center text-yellow-500"><ShieldCheck className="w-3 h-3 mr-0.5" /> {f.rating}</span>
                                            </div>
                                        </div>
                                        {selectedFleetId === f.id && <CheckCircle className="w-5 h-5 text-blue-600" />}
                                    </button>
                                ))}
                              </div>
                           </div>
                        )}
                    </div>

                    {/* Vehicle Type Selection (New) */}
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">车型需求 (Vehicle Type)</label>
                        <div className="grid grid-cols-3 gap-2">
                           {['Dump Truck', 'Flatbed Truck', 'Van'].map(v => (
                              <button
                                 key={v}
                                 onClick={() => setTargetVehicle(v)}
                                 className={`p-2.5 rounded-lg text-xs font-bold border flex flex-col items-center justify-center transition-all ${targetVehicle === v ? 'bg-blue-100 border-blue-500 text-blue-700' : 'bg-white border-slate-200 text-slate-500'}`}
                              >
                                 <Truck className="w-4 h-4 mb-1" />
                                 {v === 'Dump Truck' ? '自卸车 (渣土)' : (v === 'Flatbed Truck' ? '平板车 (建材)' : '厢式车 (袋装)')}
                              </button>
                           ))}
                        </div>
                    </div>

                    {/* Collection Method Selector */}
                    <div>
                        <label className="text-xs font-black text-gray-500 uppercase mb-2 block">清运模式</label>
                        <div className="grid grid-cols-2 gap-3">
                            <button 
                                onClick={() => setCollectionMethod(CollectionMethod.IMMEDIATE)}
                                className={`p-3 rounded-xl border text-sm font-bold flex flex-col items-center justify-center transition-all ${
                                    collectionMethod === CollectionMethod.IMMEDIATE 
                                    ? 'bg-blue-50 border-blue-500 text-blue-700' 
                                    : 'bg-white border-slate-200 text-slate-500'
                                }`}
                            >
                                <Truck className="w-5 h-5 mb-1" />
                                即运即走
                                <span className="text-[9px] font-normal mt-0.5">车辆到达后直接装车</span>
                            </button>
                            <button 
                                onClick={() => setCollectionMethod(CollectionMethod.CONTAINER)}
                                className={`p-3 rounded-xl border text-sm font-bold flex flex-col items-center justify-center transition-all ${
                                    collectionMethod === CollectionMethod.CONTAINER 
                                    ? 'bg-blue-50 border-blue-500 text-blue-700' 
                                    : 'bg-white border-slate-200 text-slate-500'
                                }`}
                            >
                                <Box className="w-5 h-5 mb-1" />
                                放置收集箱
                                <span className="text-[9px] font-normal mt-0.5">留箱置换 (+¥300/箱)</span>
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">现场影像 (存证)</label>
                        <div 
                            onClick={() => fileInputRef.current?.click()}
                            className="border-2 border-dashed border-slate-300 rounded-xl h-24 bg-slate-50 flex flex-col items-center justify-center cursor-pointer relative overflow-hidden hover:bg-slate-100 transition-colors"
                        >
                            {mediaData ? (
                            mediaType === 'VIDEO' ? (
                                <video src={mediaData} className="w-full h-full object-cover" />
                            ) : (
                                <img src={mediaData} className="w-full h-full object-cover" />
                            )
                            ) : (
                            <>
                                <Camera className="w-6 h-6 text-slate-400 mb-1" />
                                <p className="text-xs text-slate-500 font-bold">点击拍摄现场</p>
                            </>
                            )}
                            <input ref={fileInputRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleFileChange} />
                        </div>
                    </div>
                    
                    {/* Pricing Info & Selectable Services */}
                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 space-y-3">
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <Calculator className="w-4 h-4 text-blue-600" />
                                <span className="text-sm font-bold text-blue-800">增值服务与计价</span>
                            </div>
                        </div>

                        {/* Selectable Services */}
                        <div className="grid grid-cols-3 gap-2">
                            <button 
                                onClick={() => toggleService('tax')}
                                className={`p-2 rounded-lg text-center border flex flex-col items-center justify-center transition-all ${
                                    services.tax 
                                    ? 'bg-white border-blue-400 shadow-sm' 
                                    : 'bg-blue-100/30 border-transparent opacity-70'
                                }`}
                            >
                                <Receipt className={`w-4 h-4 mb-1 ${services.tax ? 'text-blue-600' : 'text-slate-400'}`} />
                                <div className={`text-[10px] font-bold ${services.tax ? 'text-blue-800' : 'text-slate-500'}`}>含税专票</div>
                                <div className="text-[9px] text-slate-400">+6%</div>
                            </button>
                            <button 
                                onClick={() => toggleService('labor')}
                                className={`p-2 rounded-lg text-center border flex flex-col items-center justify-center transition-all ${
                                    services.labor 
                                    ? 'bg-white border-blue-400 shadow-sm' 
                                    : 'bg-blue-100/30 border-transparent opacity-70'
                                }`}
                            >
                                <UserCog className={`w-4 h-4 mb-1 ${services.labor ? 'text-blue-600' : 'text-slate-400'}`} />
                                <div className={`text-[10px] font-bold ${services.labor ? 'text-blue-800' : 'text-slate-500'}`}>人工搬运</div>
                                <div className="text-[9px] text-slate-400">+¥150/车</div>
                            </button>
                            <button 
                                onClick={() => toggleService('loading')}
                                className={`p-2 rounded-lg text-center border flex flex-col items-center justify-center transition-all ${
                                    services.loading 
                                    ? 'bg-white border-blue-400 shadow-sm' 
                                    : 'bg-blue-100/30 border-transparent opacity-70'
                                }`}
                            >
                                <Hammer className={`w-4 h-4 mb-1 ${services.loading ? 'text-blue-600' : 'text-slate-400'}`} />
                                <div className={`text-[10px] font-bold ${services.loading ? 'text-blue-800' : 'text-slate-500'}`}>机械装车</div>
                                <div className="text-[9px] text-slate-400">+¥100/车</div>
                            </button>
                        </div>

                        <div className="border-t border-blue-200 pt-2 flex justify-between items-center">
                            <div>
                                <div className="text-xs text-blue-600 font-bold">单车价格: ¥{finalPricePerTruck}</div>
                                <div className="text-[10px] text-blue-400">基础价 ¥{basePrice} {collectionMethod === CollectionMethod.CONTAINER && '+ 箱费¥300'}</div>
                            </div>
                            <div className="text-right">
                                <div className="text-[10px] text-blue-600 mb-0.5">总预估 ({truckCount}车)</div>
                                <span className="text-xl font-bold text-blue-800">¥{totalEstimate.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                  </div>
                  )}

                  {/* PROCUREMENT MODE CONTENT */}
                  {createMode === 'PROCUREMENT' && (
                     <div className="space-y-4 animate-fade-in">
                        <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
                           <div className="flex items-start gap-3">
                              <ShoppingBag className="text-purple-600 w-5 h-5 mt-1" />
                              <div>
                                 <h4 className="font-bold text-purple-800 text-sm">发布采购需求 (Demand)</h4>
                                 <p className="text-xs text-purple-600 mt-1">
                                    您的需求将同步至资源集市。附近处置场/供应商接单后，将安排配送。
                                 </p>
                              </div>
                           </div>
                        </div>

                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">物资类型</label>
                            <select 
                                value={procurementDetails.productType}
                                onChange={(e) => setProcurementDetails({...procurementDetails, productType: e.target.value as any})}
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 outline-none"
                            >
                                {Object.keys(PRODUCT_TYPE_NAMES).map(key => (
                                    <option key={key} value={key}>{PRODUCT_TYPE_NAMES[key]}</option>
                                ))}
                            </select>
                        </div>
                        
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">需求数量</label>
                            <input 
                                type="text"
                                value={procurementDetails.quantity}
                                onChange={(e) => setProcurementDetails({...procurementDetails, quantity: e.target.value})}
                                placeholder="例如: 500 吨"
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold"
                            />
                        </div>

                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase mb-1 flex justify-between">
                                <span>目标出价 (Target Price)</span>
                                <span className="text-green-600">将在集市公开</span>
                            </label>
                            <div className="relative">
                                <span className="absolute left-3 top-3 text-gray-500 font-bold">¥</span>
                                <input 
                                    type="number"
                                    value={procurementDetails.targetPrice}
                                    onChange={(e) => setProcurementDetails({...procurementDetails, targetPrice: e.target.value})}
                                    placeholder="总预算/单价"
                                    className="w-full pl-8 p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold"
                                />
                            </div>
                        </div>

                        {profile.activeProjects.length > 0 && selectedProjectId && (
                        <div className="flex items-center justify-between text-xs text-slate-500 bg-slate-50 p-3 rounded-lg">
                           <span>配送地址</span>
                           <span className="font-bold">
                               {profile.activeProjects.find(p => p.id === selectedProjectId)?.name} 
                           </span>
                        </div>
                        )}
                     </div>
                  )}
               </div>

               <div className="p-4 bg-white border-t border-gray-100 shrink-0">
                  <button 
                     onClick={handleSubmitOrder}
                     disabled={profile.activeProjects.length === 0 || (createMode === 'REMOVAL' && !mediaData)}
                     className={`w-full py-4 rounded-xl font-bold text-white shadow-lg flex items-center justify-center ${
                           profile.activeProjects.length === 0 ? 'bg-gray-300 cursor-not-allowed' :
                           (createMode === 'PROCUREMENT' 
                              ? 'bg-purple-600 hover:bg-purple-700'
                              : (mediaData ? 'bg-slate-800 hover:bg-slate-900' : 'bg-gray-300 cursor-not-allowed'))
                     }`}
                  >
                     {createMode === 'PROCUREMENT' ? (
                        <><ShoppingBag className="w-5 h-5 mr-2" /> 发布采购需求</>
                     ) : (
                        // Fixed: Use enum values instead of strings
                        <><CheckCircle className="w-5 h-5 mr-2" /> 确认下单 (¥{totalEstimate.toLocaleString()})</>
                     )}
                  </button>
               </div>
            </div>
         </div>
      )}

      {/* Header */}
      <div className="bg-slate-900 text-white p-6 rounded-b-[2rem] shadow-xl mb-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-600/10 rounded-full blur-3xl transform translate-x-10 -translate-y-10"></div>
        <div className="relative z-10">
           <div className="flex justify-between items-start mb-6">
              <div>
                 <h1 className="text-2xl font-bold flex items-center text-yellow-50">
                    <Building2 className="w-6 h-6 mr-2 text-yellow-400" /> 企业控制台
                 </h1>
                 <p className="text-slate-400 text-sm mt-1">{profile.companyName}</p>
                 {profile.contactPhone && <p className="text-slate-500 text-xs mt-0.5">管理员: {profile.contactPhone}</p>}
              </div>
              <div className="text-right">
                 <div className="text-xs text-slate-400 uppercase">账单周期</div>
                 <div className="text-sm font-bold text-yellow-400">{profile.billingCycle}</div>
              </div>
           </div>

           {/* Credit Card Visual */}
           <div className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-xl p-4 border border-slate-600 shadow-lg relative overflow-hidden">
              <div className="flex justify-between items-center mb-4">
                 <span className="text-slate-400 text-xs">信用额度使用情况 (Credit Line)</span>
                 <CreditCard className="w-4 h-4 text-yellow-500" />
              </div>
              <div className="flex justify-between items-end mb-2">
                 <div>
                    <span className="text-2xl font-bold text-white">¥{profile.usedCredit.toLocaleString()}</span>
                    <span className="text-xs text-slate-400 ml-2">已用额度</span>
                 </div>
                 <div className="text-right">
                    <span className="text-sm font-bold text-slate-300">¥{profile.creditLimit.toLocaleString()}</span>
                    <div className="text-[10px] text-slate-500">总授信额度</div>
                 </div>
              </div>
              {/* Progress Bar */}
              <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden">
                 <div 
                   className={`h-full rounded-full transition-all duration-1000 ${creditUsagePercent > 80 ? 'bg-red-500' : 'bg-yellow-500'}`} 
                   style={{ width: `${creditUsagePercent}%` }}
                 ></div>
              </div>
              <div className="text-[10px] text-slate-400 mt-2 flex justify-between">
                 <span>剩余可用: ¥{availableCredit.toLocaleString()}</span>
                 {creditUsagePercent > 80 && <span className="text-red-400 font-bold">额度预警</span>}
              </div>
           </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 mb-4">
         <div className="bg-white p-1 rounded-xl shadow-sm border border-slate-200 flex">
            <button 
               onClick={() => setActiveTab('DASHBOARD')}
               className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${activeTab === 'DASHBOARD' ? 'bg-slate-100 text-slate-800' : 'text-gray-400'}`}
            >
               概览
            </button>
            <button 
               onClick={() => setActiveTab('PROJECTS')}
               className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${activeTab === 'PROJECTS' ? 'bg-slate-100 text-slate-800' : 'text-gray-400'}`}
            >
               项目管理
            </button>
            <button 
               onClick={() => setActiveTab('FINANCE')}
               className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${activeTab === 'FINANCE' ? 'bg-slate-100 text-slate-800' : 'text-gray-400'}`}
            >
               账单/发票
            </button>
         </div>
      </div>

      <div className="px-4 space-y-6">
         {/* DASHBOARD */}
         {activeTab === 'DASHBOARD' && (
            <div className="animate-fade-in space-y-4">
               
               {/* Quick Action */}
               <button 
                  onClick={() => setIsCreating(true)}
                  className="w-full bg-yellow-500 text-slate-900 p-4 rounded-xl shadow-lg shadow-yellow-500/20 active:scale-95 transition-transform flex items-center justify-between"
               >
                  <div className="flex items-center">
                     <div className="bg-white/20 p-2 rounded-full mr-3"><Layers className="w-6 h-6 text-white" /></div>
                     <div className="text-left">
                        <div className="font-bold text-lg">发布任务 / 采购</div>
                        <div className="text-xs text-slate-800/70">批量清运(出) or 建材采购(进)</div>
                     </div>
                  </div>
                  <ChevronRight className="w-5 h-5 opacity-50" />
               </button>

               {/* Stats Grid */}
               <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                     <div className="flex items-center text-slate-500 text-xs mb-2">
                        <Truck className="w-3 h-3 mr-1" /> 调度中车辆
                     </div>
                     <div className="text-2xl font-bold text-slate-800">{pendingOrders.length}</div>
                  </div>
                  <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                     <div className="flex items-center text-slate-500 text-xs mb-2">
                        <FileCheck className="w-3 h-3 mr-1" /> 本月电子联单
                     </div>
                     <div className="text-2xl font-bold text-slate-800">{thisMonthOrders.length}</div>
                  </div>
               </div>

               {/* Recent Orders List */}
               <section>
                  <h3 className="font-bold text-slate-700 mb-3 flex items-center text-sm uppercase">
                     <FileText className="w-4 h-4 mr-2" /> 最近记录
                  </h3>
                  <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                     {myOrders.length === 0 ? (
                        <div className="p-8 text-center text-gray-400 text-sm">暂无订单记录</div>
                     ) : (
                        <div className="divide-y divide-slate-50">
                           {myOrders.slice(0, 5).map(order => {
                              const isProcurement = order.orderType === OrderType.RECYCLE_TRADE && order.tradeDirection === 'BUY';
                              return (
                              <div key={order.id} className="p-4 hover:bg-slate-50">
                                 <div className="flex justify-between items-start mb-1">
                                    <div className="flex items-center gap-2">
                                        {isProcurement && <span className="bg-purple-100 text-purple-700 text-[10px] font-bold px-1.5 py-0.5 rounded">采购</span>}
                                        <div className="font-bold text-slate-800 text-sm">{order.pickupDetails?.projectName || '未分类项目'}</div>
                                    </div>
                                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                                       order.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                    }`}>
                                       {order.status === OrderStatus.PENDING_PICKUP ? (isProcurement ? '需求发布中' : '已派单(待接)') : order.status}
                                    </span>
                                 </div>
                                 <div className="text-xs text-slate-500 flex justify-between items-center mt-2">
                                    <span className="flex items-center gap-1">
                                        <FileCheck className="w-3 h-3" />
                                        {isProcurement ? `需 ${order.buyRequirements?.quantity} ${order.buyRequirements?.productType}` : `单号: ${order.id.slice(-6)}`}
                                    </span>
                                    <span className="font-mono font-bold text-slate-700">
                                       {isProcurement 
                                          ? `目标价 ¥${order.buyRequirements?.targetPrice}` 
                                          : (order.analysis?.estimatedPrice ? `协议价 ¥${order.analysis.estimatedPrice}` : '计价中...')}
                                    </span>
                                 </div>
                              </div>
                           )})}
                        </div>
                     )}
                  </div>
               </section>
            </div>
         )}
         
         {/* PROJECTS */}
         {activeTab === 'PROJECTS' && (
            <div className="animate-fade-in space-y-4">
               <div className="bg-white p-5 rounded-xl border border-slate-100 text-center shadow-sm">
                   <h3 className="font-bold text-slate-800 mb-2">项目点管理</h3>
                   <p className="text-xs text-slate-500 mb-4">添加新的施工现场或堆场，以便准确派单。</p>
                   <button 
                      onClick={() => setIsAddProjectModalOpen(true)}
                      className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-bold shadow hover:bg-blue-700"
                   >
                       + 新增项目点
                   </button>
               </div>

               {profile.activeProjects.length === 0 ? (
                   <div className="text-center py-10 text-gray-400 text-sm">暂无活跃项目</div>
               ) : (
                   profile.activeProjects.map(project => {
                      const projectOrders = myOrders.filter(o => o.pickupDetails?.projectName === project.name);
                      const projectCost = projectOrders.reduce((sum, o) => sum + (o.analysis?.estimatedPrice || 0), 0);
                      
                      return (
                         <div key={project.id} className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                            <div className="p-4 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
                               <div className="font-bold text-slate-800 flex items-center">
                                  <MapPin className="w-4 h-4 mr-2 text-slate-400" /> {project.name}
                               </div>
                               <button className="text-xs bg-slate-200 text-slate-600 px-2 py-1 rounded hover:bg-slate-300">
                                  详情
                               </button>
                            </div>
                            <div className="p-3 text-xs text-slate-500 border-b border-slate-50 flex items-center bg-white">
                                <span className="bg-slate-100 px-1.5 py-0.5 rounded mr-2">地址</span>
                                {project.address}
                            </div>
                            
                            {/* Project Approval & Sync Status */}
                            <div className={`px-3 py-2 text-xs flex flex-col gap-1 ${
                                project.status === 'APPROVED' ? 'bg-green-50 text-green-700' : (project.status === 'REJECTED' ? 'bg-red-50 text-red-700' : 'bg-yellow-50 text-yellow-700')
                            }`}>
                                <div className="flex justify-between items-center">
                                    <span className="font-bold flex items-center">
                                        <ShieldCheck className="w-3 h-3 mr-1" />
                                        {project.status === 'APPROVED' ? '已核发许可' : (project.status === 'REJECTED' ? '许可驳回' : '许可审核中')}
                                    </span>
                                    {project.externalSync && (
                                        <span className="flex items-center text-slate-500">
                                            <Globe className="w-3 h-3 mr-1" />
                                            {project.externalSync.syncStatus === 'SYNCED' ? '已同步监管' : '同步中'}
                                        </span>
                                    )}
                                </div>
                                <div className="flex gap-2 mt-1">
                                    {project.hasConstructionPermit ? (
                                        <span className="flex items-center text-[10px] bg-white/50 px-1 rounded"><CheckCircle className="w-2.5 h-2.5 mr-0.5" /> 施工手续</span>
                                    ) : (
                                        <span className="flex items-center text-[10px] opacity-60"><X className="w-2.5 h-2.5 mr-0.5" /> 无施工手续</span>
                                    )}
                                    {project.hasDischargePermit ? (
                                        <span className="flex items-center text-[10px] bg-white/50 px-1 rounded"><CheckCircle className="w-2.5 h-2.5 mr-0.5" /> 排放证</span>
                                    ) : (
                                        <span className="flex items-center text-[10px] opacity-60"><X className="w-2.5 h-2.5 mr-0.5" /> 无排放证</span>
                                    )}
                                </div>
                            </div>

                            <div className="p-4 grid grid-cols-3 gap-4 text-center">
                               <div>
                                  <div className="text-xs text-slate-400 mb-1">总车次/联单</div>
                                  <div className="font-bold text-slate-700">{projectOrders.length}</div>
                               </div>
                               <div>
                                  <div className="text-xs text-slate-400 mb-1">本月费用</div>
                                  <div className="font-bold text-slate-700">¥{projectCost}</div>
                               </div>
                               <div>
                                  <div className="text-xs text-slate-400 mb-1">项目状态</div>
                                  <div className="font-bold text-green-600 text-xs bg-green-50 py-1 rounded">施工中</div>
                               </div>
                            </div>
                         </div>
                      );
                   })
               )}
            </div>
         )}

         {/* FINANCE */}
         {activeTab === 'FINANCE' && (
            <div className="animate-fade-in space-y-4">
               <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
                  <div>
                     <h3 className="font-bold text-slate-800">本期账单 (未结)</h3>
                     <p className="text-xs text-slate-400 mt-1">账单日: 每月5号</p>
                  </div>
                  <div className="text-right">
                     <div className="text-2xl font-bold text-slate-800">¥{profile.usedCredit.toLocaleString()}</div>
                     <button className="text-xs text-blue-600 font-bold mt-1">查看明细 &gt;</button>
                  </div>
               </div>

               <h3 className="font-bold text-slate-700 text-sm uppercase flex items-center mt-6 mb-2">
                  <PieChart className="w-4 h-4 mr-2" /> 历史账单
               </h3>
               <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                     <div key={i} className="bg-white p-4 rounded-xl border border-slate-100 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                           <div className="bg-green-50 p-2 rounded-full text-green-600">
                              <FileText className="w-5 h-5" />
                           </div>
                           <div>
                              <div className="font-bold text-slate-800 text-sm">2024年{5-i}月账单</div>
                              <div className="text-xs text-slate-400">已自动扣款</div>
                           </div>
                        </div>
                        <div className="text-right">
                           <div className="font-bold text-slate-700">¥{(Math.random() * 50000 + 10000).toFixed(0)}</div>
                           <button className="text-[10px] flex items-center text-slate-400 mt-1 ml-auto hover:text-slate-600">
                              <Download className="w-3 h-3 mr-1" /> 下载发票
                           </button>
                        </div>
                     </div>
                  ))}
               </div>
            </div>
         )}
      </div>
    </div>
  );
};
