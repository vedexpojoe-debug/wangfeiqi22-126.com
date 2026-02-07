
import React, { useState, useMemo, useRef } from 'react';
import { 
  PropertyProfile, Order, OrderStatus, OrderType, 
  WasteType, RenovationApplication, PropertySupplier, 
  MediaType, LaborServiceType, CollectionMethod 
} from '../types';
import { 
  Building, Truck, CheckCircle, Clock, FileSignature, 
  Settings, ShieldCheck, BarChart3, Wallet, Users, 
  Search, Filter, Plus, Camera, X, Download, Receipt, Star, Phone, FileText
} from 'lucide-react';

interface PropertyViewProps {
  profile: PropertyProfile;
  orders: Order[];
  addOrder: (order: Order) => void;
  renovationApps: RenovationApplication[];
  onUpdateRenovation: (app: RenovationApplication) => void;
}

const DEFAULT_SUPPLIERS: PropertySupplier[] = [
  { id: 'f-1', name: '城投环境物流车队', manager: '赵经理', phone: '13912345678', truckCount: 12, rating: 4.9, status: 'ACTIVE', contractUntil: Date.now() + 86400000 * 180 },
  { id: 'f-2', name: '绿通渣土专运', manager: '王调度', phone: '13888889999', truckCount: 8, rating: 4.8, status: 'ACTIVE', contractUntil: Date.now() + 86400000 * 90 }
];

export const PropertyView: React.FC<PropertyViewProps> = ({ profile, orders, addOrder, renovationApps, onUpdateRenovation }) => {
  const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'PERMITS' | 'CLEARANCE' | 'SUPPLIERS' | 'FINANCE'>('DASHBOARD');
  
  // 录入状态
  const [isCreating, setIsCreating] = useState(false);
  const [selectedCommunity, setSelectedCommunity] = useState(profile.managedCommunities[0] || '');
  const [building, setBuilding] = useState('');
  const [unit, setUnit] = useState('');
  const [room, setRoom] = useState('');
  const [associatedAppId, setAssociatedAppId] = useState('');
  const [selectedFleetId, setSelectedFleetId] = useState(DEFAULT_SUPPLIERS[0].id);
  const [mediaData, setMediaData] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 数据统计
  const communityOrders = useMemo(() => orders.filter(o => 
    o.pickupDetails?.community && profile.managedCommunities.includes(o.pickupDetails.community)
  ), [orders, profile.managedCommunities]);

  const pendingApps = useMemo(() => renovationApps.filter(a => 
      a.projectType === 'RESIDENTIAL' && a.communityName && profile.managedCommunities.includes(a.communityName) && a.status === 'PENDING'
  ), [renovationApps, profile.managedCommunities]);

  const approvedApps = useMemo(() => renovationApps.filter(a => 
    a.projectType === 'RESIDENTIAL' && a.communityName && profile.managedCommunities.includes(a.communityName) && a.status === 'APPROVED'
  ), [renovationApps, profile.managedCommunities]);

  const unsettledAmount = useMemo(() => communityOrders
    .filter(o => o.paymentStatus === 'MONTHLY_BILL' && o.status !== OrderStatus.COMPLETED)
    .reduce((sum, o) => sum + (o.analysis?.estimatedPrice || 0), 0)
  , [communityOrders]);

  const suppliers = profile.suppliers || DEFAULT_SUPPLIERS;

  // 处理逻辑
  const handleApprove = (app: RenovationApplication) => {
    const permitId = `PMT-${new Date().getFullYear()}-${Math.floor(Math.random()*10000).toString().padStart(4,'0')}`;
    onUpdateRenovation({ ...app, status: 'APPROVED', permitId });
    alert(`施工许可已核发！\n证号: ${permitId}`);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setMediaData(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitOrder = () => {
    if (!building || !room) { alert("请完善楼栋房号"); return; }
    if (!mediaData) { alert("请上传现场照片"); return; }

    const selectedFleet = suppliers.find(s => s.id === selectedFleetId);
    const associatedApp = renovationApps.find(a => a.id === associatedAppId);

    const newOrder: Order = {
      id: `prop-clr-${Date.now()}`,
      userId: `prop-${profile.id}`,
      createdAt: Date.now(),
      status: OrderStatus.ANALYZING,
      orderType: OrderType.WASTE_REMOVAL,
      location: { lat: 31.22, lng: 121.48, address: `${selectedCommunity} ${building}-${unit}-${room}` },
      pickupDetails: {
        city: '上海市', district: '浦东新区', street: selectedCommunity,
        community: selectedCommunity,
        building, unit, roomNumber: room,
        contractorName: associatedApp?.renovationCompany || '自装/散工',
        isCollected: true, locationType: 'GROUND_FLOOR'
      },
      mediaType: 'IMAGE',
      mediaData,
      paymentStatus: 'MONTHLY_BILL',
      assignedDriver: {
        name: '车队调度中', phone: selectedFleet?.phone || '', plate: '待指派', fleetName: selectedFleet?.name, fleetId: selectedFleet?.id
      },
      analysis: {
        wasteType: WasteType.CONSTRUCTION, estimatedWeightKg: 0, estimatedVolume: '待估', estimatedPrice: 450,
        description: `物业代报: ${building}栋${room}`, recommendedVehicle: 'Truck', isBagged: false, isCollected: true,
        // Fixed: Use enum values instead of strings
        laborServiceRecommendation: LaborServiceType.NONE,
        recommendedCollectionMethod: CollectionMethod.IMMEDIATE
      }
    };

    addOrder(newOrder);
    setIsCreating(false);
    setMediaData(null);
    alert("清运任务已下达，已关联至房号并通知合作车队。");
  };

  // 子视图渲染
  const renderDashboard = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-indigo-50">
          <div className="flex items-center text-gray-500 text-xs mb-1">
            <BarChart3 className="w-3 h-3 mr-1 text-indigo-500" /> 辖区清运量
          </div>
          <div className="text-2xl font-bold text-gray-800">{communityOrders.length} <span className="text-xs font-normal text-gray-400">单</span></div>
          <div className="text-[10px] text-emerald-600 mt-1">较上月 +12%</div>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-indigo-50">
          <div className="flex items-center text-gray-500 text-xs mb-1">
            <Wallet className="w-3 h-3 mr-1 text-orange-500" /> 待结算金额
          </div>
          <div className="text-2xl font-bold text-gray-800">¥{unsettledAmount.toLocaleString()}</div>
          <div className="text-[10px] text-gray-400 mt-1">账单日: 每月5号</div>
        </div>
      </div>

      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
        <h3 className="font-bold text-gray-800 text-sm mb-4 flex items-center">
          <Clock className="w-4 h-4 mr-2 text-indigo-600" /> 楼栋清运动态
        </h3>
        <div className="space-y-3">
          {communityOrders.slice(0, 3).map(order => (
            <div key={order.id} className="flex justify-between items-center text-xs p-3 bg-gray-50 rounded-xl">
              <div>
                <div className="font-bold text-gray-700">{order.pickupDetails?.building}栋{order.pickupDetails?.roomNumber}室</div>
                <div className="text-gray-400 mt-0.5">{order.pickupDetails?.community} • {new Date(order.createdAt).toLocaleDateString()}</div>
              </div>
              <span className={`px-2 py-0.5 rounded font-bold ${order.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 'bg-indigo-50 text-indigo-600'}`}>{order.status}</span>
            </div>
          ))}
          {communityOrders.length === 0 && <p className="text-center text-gray-400 py-4 text-xs">暂无辖区清运记录</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <button onClick={() => setIsCreating(true)} className="bg-indigo-600 text-white p-4 rounded-2xl shadow-lg flex flex-col items-center justify-center gap-2 active:scale-95 transition-transform">
          <Truck size={24} />
          <span className="font-bold text-sm">发布清运派单</span>
        </button>
        <button onClick={() => setActiveTab('PERMITS')} className="bg-white text-indigo-600 border border-indigo-100 p-4 rounded-2xl shadow-sm flex flex-col items-center justify-center gap-2 relative active:scale-95 transition-transform">
          <FileSignature size={24} />
          <span className="font-bold text-sm">装修审批中心</span>
          {pendingApps.length > 0 && <span className="absolute top-2 right-2 bg-red-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full border-2 border-white">{pendingApps.length}</span>}
        </button>
      </div>
    </div>
  );

  return (
    <div className="pb-24 bg-gray-50 min-h-screen relative">
      
      {/* 派单 Modal */}
      {isCreating && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl overflow-hidden shadow-2xl animate-fade-in-up flex flex-col max-h-[90vh]">
            <div className="bg-indigo-600 p-4 flex justify-between items-center text-white">
              <h2 className="font-bold text-lg flex items-center"><Truck className="mr-2" size={20} /> 录入清运来源</h2>
              <button onClick={() => setIsCreating(false)}><X size={20}/></button>
            </div>
            
            <div className="p-5 space-y-4 overflow-y-auto">
              <div>
                <label className="text-xs font-bold text-gray-500 mb-1 block uppercase">清运来源信息</label>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <select value={selectedCommunity} onChange={(e) => setSelectedCommunity(e.target.value)} className="p-2.5 bg-gray-50 border rounded-xl text-sm font-bold">
                    {profile.managedCommunities.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <input placeholder="楼栋 (如: 12号楼)" className="p-2.5 bg-gray-50 border rounded-xl text-sm" value={building} onChange={e => setBuilding(e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input placeholder="单元 (如: 2单元)" className="p-2.5 bg-gray-50 border rounded-xl text-sm" value={unit} onChange={e => setUnit(e.target.value)} />
                  <input placeholder="房号 (如: 502室)" className="p-2.5 bg-gray-50 border rounded-xl text-sm font-bold" value={room} onChange={e => setRoom(e.target.value)} />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 mb-1 block uppercase">关联装修申报 (可选)</label>
                <select value={associatedAppId} onChange={(e) => setAssociatedAppId(e.target.value)} className="w-full p-2.5 bg-gray-50 border rounded-xl text-sm">
                  <option value="">-- 选择已审批房号自动填充施工单位 --</option>
                  {approvedApps.map(a => <option key={a.id} value={a.id}>{a.roomNumber} - {a.applicantName}</option>)}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 mb-1 block uppercase">指定合作车队</label>
                <select value={selectedFleetId} onChange={e => setSelectedFleetId(e.target.value)} className="w-full p-2.5 bg-white border rounded-xl text-sm font-bold text-indigo-700">
                  {suppliers.map(s => <option key={s.id} value={s.id}>{s.name} (星级:{s.rating})</option>)}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 mb-1 block uppercase">堆放点照片</label>
                <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-gray-200 rounded-xl h-24 bg-gray-50 flex flex-col items-center justify-center cursor-pointer overflow-hidden relative">
                  {mediaData ? <img src={mediaData} className="w-full h-full object-cover" /> : <Camera className="text-gray-300" size={24} />}
                  <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileChange} />
                </div>
              </div>

              <button onClick={handleSubmitOrder} className="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl shadow-lg">确认并派单</button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-indigo-700 text-white p-6 rounded-b-[2.5rem] shadow-lg mb-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl transform translate-x-10 -translate-y-10"></div>
        <div className="relative z-10 flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold flex items-center"><Building className="w-6 h-6 mr-2" /> 物业智管控制台</h1>
            <p className="text-indigo-200 text-xs mt-1">{profile.name}</p>
          </div>
          <button className="p-2 bg-white/10 rounded-full hover:bg-white/20"><Settings size={18} /></button>
        </div>
      </div>

      {/* 菜单页签 */}
      <div className="px-4 mb-4">
        <div className="bg-white p-1 rounded-2xl shadow-sm border border-gray-100 flex overflow-x-auto no-scrollbar">
          {(['DASHBOARD', 'PERMITS', 'CLEARANCE', 'SUPPLIERS', 'FINANCE'] as const).map(tab => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 min-w-[70px] py-2.5 text-[10px] font-bold rounded-xl transition-all whitespace-nowrap ${activeTab === tab ? 'bg-indigo-50 text-indigo-700 shadow-sm' : 'text-gray-400'}`}
            >
              {tab === 'DASHBOARD' ? '工作台' : tab === 'PERMITS' ? '装修审批' : tab === 'CLEARANCE' ? '清运明细' : tab === 'SUPPLIERS' ? '车队管理' : '财务结算'}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 space-y-6">
        {activeTab === 'DASHBOARD' && renderDashboard()}

        {/* 装修审批视图 */}
        {activeTab === 'PERMITS' && (
          <div className="space-y-4 animate-fade-in">
            <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 flex items-start">
              <ShieldCheck className="w-5 h-5 text-indigo-600 mr-3 mt-0.5" />
              <p className="text-xs text-indigo-800">对辖区内装修行为进行前置备案审批，审核通过后方可下达清运指令。</p>
            </div>
            {pendingApps.length === 0 ? (
              <div className="text-center py-20 text-gray-400 bg-white rounded-2xl border border-dashed">暂无待审装修申请</div>
            ) : (
              pendingApps.map(app => (
                <div key={app.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="font-bold text-gray-800 text-sm">{app.roomNumber} - {app.applicantName}</div>
                      <div className="text-[10px] text-gray-400 mt-0.5">申请时间: {new Date(app.createdAt).toLocaleDateString()}</div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-orange-50 text-orange-600 rounded">待审核</span>
                  </div>
                  <div className="text-xs text-gray-600 space-y-1 mb-4 bg-gray-50 p-3 rounded-lg">
                    <p>工期预估: {app.estimatedDurationDays} 天</p>
                    <p>施工单位: {app.renovationCompany || '自装'}</p>
                    <p>联系电话: {app.applicantPhone}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleApprove(app)} className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-md">通过审核</button>
                    <button className="flex-1 py-2.5 bg-gray-100 text-gray-500 rounded-xl text-sm font-bold">驳回修改</button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* 清运明细视图 */}
        {activeTab === 'CLEARANCE' && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex gap-2">
              <div className="flex-1 bg-white p-2.5 rounded-xl flex items-center gap-2 border border-gray-100">
                <Search size={14} className="text-gray-400" />
                <input placeholder="搜楼栋/施工方" className="text-xs outline-none w-full" />
              </div>
              <button className="p-2 bg-white border border-gray-100 rounded-xl text-gray-400"><Filter size={16} /></button>
            </div>
            {communityOrders.map(order => (
              <div key={order.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-start mb-2">
                  <div className="font-bold text-gray-800 text-sm">
                    {order.pickupDetails?.building}栋{order.pickupDetails?.roomNumber}室
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${order.status === OrderStatus.COMPLETED ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                    {order.status}
                  </span>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg text-[10px] text-gray-500 space-y-1">
                  <div className="flex justify-between"><span>施工单位: {order.pickupDetails?.contractorName}</span><span>承运: {order.assignedDriver?.fleetName}</span></div>
                  <div className="flex justify-between"><span>日期: {new Date(order.createdAt).toLocaleDateString()}</span><span className="font-bold text-gray-700">¥{order.analysis?.estimatedPrice}</span></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 供应商管理 */}
        {activeTab === 'SUPPLIERS' && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex justify-between items-center mb-2">
               <h3 className="font-bold text-gray-800 text-sm">协议合作车队</h3>
               <button className="text-indigo-600 text-xs font-bold flex items-center"><Plus size={14} className="mr-1" /> 新增协议</button>
            </div>
            {suppliers.map(fleet => (
              <div key={fleet.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600"><Truck size={20} /></div>
                    <div>
                      <div className="font-bold text-gray-800 text-sm">{fleet.name}</div>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Star size={10} className="fill-yellow-400 text-yellow-400" />
                        <span className="text-[10px] font-bold text-gray-600">{fleet.rating}</span>
                        <span className="text-[10px] text-gray-400 ml-2">车辆数: {fleet.truckCount}</span>
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-green-100 text-green-700 rounded">合作中</span>
                </div>
                <div className="grid grid-cols-2 gap-4 border-t border-gray-50 pt-3">
                  <button className="flex items-center justify-center gap-1 text-[10px] text-gray-600 font-bold"><Phone size={12}/> 联系负责人</button>
                  <button className="flex items-center justify-center gap-1 text-[10px] text-indigo-600 font-bold"><FileText size={12}/> 框架协议</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 结算管理 */}
        {activeTab === 'FINANCE' && (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-gradient-to-r from-indigo-900 to-indigo-700 p-5 rounded-2xl text-white shadow-lg">
              <div className="flex justify-between items-center mb-4">
                <span className="text-xs opacity-80 font-bold">本月待付账单 (协议月结)</span>
                <Receipt size={20} className="opacity-50" />
              </div>
              <div className="text-3xl font-bold mb-4">¥{unsettledAmount.toLocaleString()}</div>
              <div className="flex justify-between items-end">
                <div className="text-[10px] opacity-60">计费周期: 05/01 - 05/31</div>
                <button className="bg-white text-indigo-700 px-4 py-1.5 rounded-lg text-xs font-bold">导出清单</button>
              </div>
            </div>

            <div>
              <h3 className="font-bold text-gray-800 text-sm mb-4 flex items-center">
                <Clock className="w-4 h-4 mr-2 text-indigo-600" /> 历史结算记录
              </h3>
              {[1, 2].map(i => (
                <div key={i} className="bg-white p-4 rounded-xl border border-gray-100 flex justify-between items-center mb-3">
                  <div className="flex gap-3 items-center">
                    <div className="p-2 bg-green-50 text-green-600 rounded-lg"><CheckCircle size={16}/></div>
                    <div>
                      <div className="text-sm font-bold text-gray-800">2024年{5-i}月结算单</div>
                      <div className="text-[10px] text-gray-400">结算于 0{5-i}-05 14:00</div>
                    </div>
                  </div>
                  <button className="text-gray-400 hover:text-indigo-600 transition-colors"><Download size={18}/></button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
