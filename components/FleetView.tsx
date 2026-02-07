
import React, { useState, useRef, useMemo } from 'react';
import { 
  FleetProfile, Order, OrderStatus, DriverProfile, FleetNotificationType, 
  GovernmentNotice, GovernmentTask, DisposalProfile, OrderType, 
  FleetProject, ProjectStatus, WasteType, FacilityOperationalStatus, 
  LaborServiceType, CollectionMethod 
} from '../types';
import { 
  Briefcase, Users, Truck, AlertTriangle, FileText, Send, X, 
  CheckCircle, BarChart3, Car, DollarSign, 
  FileCheck, ShieldCheck, Bell, Package, MapPin, 
  ArrowRight, Clock, FolderPlus, Upload, FileBadge, UserPlus, Edit, 
  Search, LayoutGrid, ClipboardList, PlusCircle, Activity, Loader2, Lock, 
  Camera, Zap, FileDown, History, Filter, CheckCircle2, Receipt, ShieldAlert,
  Gavel, Wallet, BadgeCheck, FileStack, Eye
} from 'lucide-react';
import { ElectronicManifest } from './ElectronicManifest';
import { analyzeWasteMedia } from '../services/geminiService';

interface FleetViewProps {
  profile: FleetProfile;
  orders: Order[]; 
  govNotices: GovernmentNotice[];
  supervisionTasks: GovernmentTask[];
  facilities: DisposalProfile[];
  onAcceptOrder?: (orderId: string) => void;
  onAssignDriver?: (orderId: string, driver: DriverProfile) => void;
  addOrder?: (order: Order) => void; 
  onUpdateProfile?: (profile: FleetProfile) => void; 
  updateStatus: (orderId: string, status: OrderStatus, data?: any) => void;
}

const INITIAL_DRIVERS: DriverProfile[] = [
    { id: 'd1', name: '李师傅', phone: '13812345678', vehiclePlate: '沪A-88888', status: 'VERIFIED', joinedAt: Date.now(), vehicleType: 'Dump Truck', licenseNumber: '310...', licenseImageUrl: '', isIndependent: false },
    { id: 'd2', name: '王师傅', phone: '13987654321', vehiclePlate: '沪C-12345', status: 'VERIFIED', joinedAt: Date.now(), vehicleType: 'Small Truck', licenseNumber: '310...', licenseImageUrl: '', isIndependent: false },
    { id: 'd3', name: '张师傅', phone: '13711112222', vehiclePlate: '沪B-56789', status: 'VERIFIED', joinedAt: Date.now(), vehicleType: 'Van', licenseNumber: '310...', licenseImageUrl: '', isIndependent: false },
];

export const FleetView: React.FC<FleetViewProps> = ({ 
  profile, orders, govNotices, supervisionTasks, facilities, 
  onAcceptOrder, onAssignDriver, addOrder, onUpdateProfile, updateStatus
}) => {
  const [activeTab, setActiveTab] = useState<'LEDGER' | 'POOL' | 'DISPATCH' | 'PROJECTS' | 'DRIVERS'>('LEDGER');
  const [localDrivers, setLocalDrivers] = useState<DriverProfile[]>(INITIAL_DRIVERS);
  const [showManifest, setShowManifest] = useState<Order | null>(null);
  
  const [ledgerSearch, setLedgerSearch] = useState('');
  const [ledgerFilter, setLedgerFilter] = useState<'ALL' | 'UNSETTLED' | 'SETTLED'>('ALL');
  
  const [showDispatchModal, setShowDispatchModal] = useState<Order | null>(null);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showAddDriverModal, setShowAddDriverModal] = useState(false);

  const [projectForm, setProjectForm] = useState({ name: '', address: '', owner: '', volume: '', permit: null as string | null });
  const [driverForm, setDriverForm] = useState({ name: '', phone: '', plate: '', type: 'Dump Truck' });

  if (profile.status === 'PENDING') {
      return (
        <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-white text-center">
            <div className="w-20 h-20 bg-cyan-500/20 rounded-[2rem] flex items-center justify-center mb-6 animate-pulse">
                <Lock size={32} className="text-cyan-400" />
            </div>
            <h2 className="text-2xl font-black mb-2">车队控制台未授权</h2>
            <p className="text-slate-400 text-sm px-6 leading-relaxed mb-8">正在核验车队资质，通过后将解锁全量业务台账与抢单权限。</p>
            <button onClick={() => onUpdateProfile?.({ ...profile, status: 'VERIFIED' })} className="w-full max-w-xs py-4 bg-cyan-600 text-white font-black rounded-2xl shadow-xl">模拟通过审核</button>
        </div>
      );
  }

  const poolOrders = orders.filter(o => o.status === OrderStatus.PENDING_PICKUP && !o.assignedDriver?.fleetName);

  const dispatchOrders = orders.filter(o => 
    o.assignedDriver?.fleetName === profile.name && 
    (!o.assignedDriver?.plate || o.assignedDriver.plate === '待指派' || o.assignedDriver.plate === '待指派车辆')
  );

  const ledgerOrders = useMemo(() => {
    return orders.filter(o => o.assignedDriver?.fleetName === profile.name)
      .filter(o => {
          const matchesSearch = o.assignedDriver?.name?.includes(ledgerSearch) || 
                                o.assignedDriver?.plate?.includes(ledgerSearch) ||
                                o.pickupDetails?.community?.includes(ledgerSearch);
          const matchesFilter = ledgerFilter === 'ALL' || 
                               (ledgerFilter === 'UNSETTLED' && o.status !== OrderStatus.COMPLETED) ||
                               (ledgerFilter === 'SETTLED' && o.status === OrderStatus.COMPLETED);
          return matchesSearch && matchesFilter;
      }).sort((a, b) => b.createdAt - a.createdAt);
  }, [orders, profile.name, ledgerSearch, ledgerFilter]);

  const financialStats = useMemo(() => {
     const total = ledgerOrders.reduce((sum, o) => sum + (o.analysis?.estimatedPrice || 0), 0);
     const completed = ledgerOrders.filter(o => o.status === OrderStatus.COMPLETED).reduce((sum, o) => sum + (o.analysis?.estimatedPrice || 0), 0);
     return { total, completed, pending: total - completed };
  }, [ledgerOrders]);

  const handleGrabOrder = (orderId: string) => {
    if (onAcceptOrder) {
        onAcceptOrder(orderId);
        setActiveTab('DISPATCH');
        alert("抢单成功！订单已移入内部调度台，请指派具体司机。");
    }
  };

  const handleInternalDispatch = (orderId: string, driver: DriverProfile) => {
    if (onAssignDriver) {
      onAssignDriver(orderId, driver);
      setShowDispatchModal(null);
      alert(`派单成功！任务已下发至司机 ${driver.name} (${driver.vehiclePlate})。`);
    }
  };

  const handleAddProject = () => {
    if (!projectForm.name || !projectForm.address) return;
    const newProject: FleetProject = {
        id: `proj-${Date.now()}`,
        name: projectForm.name,
        address: projectForm.address,
        permitImageUrl: projectForm.permit || '',
        status: 'PENDING',
        createdAt: Date.now()
    };
    onUpdateProfile?.({ ...profile, projects: [...profile.projects, newProject] });
    setShowProjectModal(false);
    setProjectForm({ name: '', address: '', owner: '', volume: '', permit: null });
    alert("备案项目已提交，监管核准后即可开始清运。");
  };

  const handleAddDriver = () => {
      if (!driverForm.name || !driverForm.phone || !driverForm.plate) {
          alert("请完善司机和车辆基本信息");
          return;
      }
      const newDriver: DriverProfile = {
          id: `d-${Date.now()}`,
          name: driverForm.name,
          phone: driverForm.phone,
          vehiclePlate: driverForm.plate.toUpperCase(),
          vehicleType: driverForm.type,
          status: 'VERIFIED',
          joinedAt: Date.now(),
          licenseNumber: '',
          licenseImageUrl: '',
          isIndependent: false
      };
      setLocalDrivers([newDriver, ...localDrivers]);
      setShowAddDriverModal(false);
      setDriverForm({ name: '', phone: '', plate: '', type: 'Dump Truck' });
      alert(`司机 ${newDriver.name} 已成功录入车队系统。`);
  };

  return (
    <div className="pb-24 bg-slate-50 min-h-screen font-sans">
      {showManifest && <ElectronicManifest order={showManifest} onClose={() => setShowManifest(null)} />}

      <div className="bg-slate-900 text-white pt-12 pb-10 px-6 rounded-b-[3rem] shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl"></div>
        <div className="flex justify-between items-start relative z-10 mb-8">
          <div>
            <h1 className="text-2xl font-black flex items-center gap-2">
              <Briefcase className="text-cyan-400" /> {profile.name}
            </h1>
            <p className="text-slate-400 text-xs mt-1 flex items-center gap-2">
               <ShieldCheck size={12} className="text-emerald-500" /> 认证清运商 · 内部对账模式
            </p>
          </div>
          <div className="relative">
             <Bell className="w-5 h-5 text-slate-400" />
             <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 relative z-10">
           <div className="bg-white/5 p-4 rounded-3xl border border-white/10 backdrop-blur-sm">
              <div className="text-[9px] text-slate-400 font-bold uppercase mb-1">待结流水</div>
              <div className="text-lg font-black text-cyan-400">¥{financialStats.pending.toLocaleString()}</div>
           </div>
           <div className="bg-white/5 p-4 rounded-3xl border border-white/10 backdrop-blur-sm text-center">
              <div className="text-[9px] text-slate-400 font-bold uppercase mb-1">本月趟次</div>
              <div className="text-lg font-black">{ledgerOrders.length}</div>
           </div>
           <div className="bg-white/5 p-4 rounded-3xl border border-white/10 backdrop-blur-sm text-right">
              <div className="text-[9px] text-slate-400 font-bold uppercase mb-1">安全分</div>
              <div className="text-lg font-black text-emerald-400">{profile.safetyScore}</div>
           </div>
        </div>
      </div>

      <div className="px-4 -mt-6 relative z-20">
         <div className="bg-white p-1.5 rounded-3xl shadow-xl border border-slate-100 flex gap-1 overflow-x-auto no-scrollbar">
            {[
              { id: 'LEDGER', label: '业务台账', icon: <Receipt size={18} /> },
              { id: 'POOL', label: '抢单大厅', icon: <Gavel size={18} /> },
              { id: 'DISPATCH', label: '内部调度', icon: <Truck size={18} /> },
              { id: 'PROJECTS', label: '项目备案', icon: <FileBadge size={18} /> },
              { id: 'DRIVERS', label: '成员管理', icon: <Users size={18} /> },
            ].map(tab => (
               <button 
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex-1 min-w-[80px] py-4 flex flex-col items-center gap-1 transition-all rounded-2xl ${activeTab === tab.id ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
               >
                  {tab.icon}
                  <span className="text-[10px] font-black">{tab.label}</span>
               </button>
            ))}
         </div>
      </div>

      <div className="p-4 space-y-6 mt-2">
        {activeTab === 'LEDGER' && (
            <div className="space-y-4 animate-fade-in">
                <div className="flex bg-white p-3 rounded-2xl border border-slate-100 items-center gap-3 shadow-sm">
                    <Search size={18} className="text-slate-400" />
                    <input 
                        type="text" 
                        placeholder="搜司机姓名、车牌、工地..." 
                        className="bg-transparent flex-1 text-sm font-bold outline-none" 
                        value={ledgerSearch}
                        onChange={e => setLedgerSearch(e.target.value)}
                    />
                    <Filter size={18} className="text-slate-300" />
                </div>

                <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
                    <div className="p-4 bg-slate-50 border-b flex justify-between items-center">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">内部清运明细清单</span>
                        <button className="text-[10px] font-black text-blue-600 flex items-center gap-1"><FileDown size={14}/> 导出对账单</button>
                    </div>
                    <div className="divide-y divide-slate-50">
                        {ledgerOrders.length === 0 ? (
                            <div className="py-20 text-center text-slate-300 italic text-sm font-bold">暂无清运记录</div>
                        ) : (
                            ledgerOrders.map(order => (
                                <div key={order.id} className="p-5 hover:bg-slate-50 transition-colors">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={`text-[8px] font-black px-1.5 py-0.5 rounded ${order.status === OrderStatus.COMPLETED ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>
                                                    {order.status === OrderStatus.COMPLETED ? '已完结' : '运输中'}
                                                </span>
                                                <span className="text-[8px] font-black text-slate-300">#{order.id.slice(-6)}</span>
                                            </div>
                                            <h4 className="text-sm font-black text-slate-800 truncate">{order.pickupDetails?.community || '自办清运点'}</h4>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-sm font-black text-slate-900">¥{order.analysis?.estimatedPrice || 0}</div>
                                            <div className="text-[9px] text-slate-400 font-bold">{new Date(order.createdAt).toLocaleDateString().slice(5)}</div>
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center mt-3">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 font-bold text-[10px]">
                                                {order.assignedDriver?.name ? order.assignedDriver.name[0] : '？'}
                                            </div>
                                            <div className="text-[10px] font-bold text-slate-500">
                                                {order.assignedDriver?.name || '未指派'} · <span className="font-mono">{order.assignedDriver?.plate}</span>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => setShowManifest(order)} className="p-2 bg-slate-100 rounded-xl text-slate-400 hover:text-blue-600"><Eye size={14} /></button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        )}

        {activeTab === 'POOL' && (
           <div className="space-y-4 animate-fade-in">
              <div className="bg-emerald-600 p-6 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                 <h3 className="text-lg font-black flex items-center gap-2"><Gavel size={20}/> 平台公海池</h3>
                 <p className="text-[10px] opacity-80 mt-1">车队可统一抢单后分派，享受批量计价政策。</p>
              </div>
              
              {poolOrders.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-[2.5rem] border-2 border-dashed text-slate-300 italic text-sm">当前大厅无可用订单</div>
              ) : (
                poolOrders.map(order => (
                  <div key={order.id} className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 group transition-all hover:shadow-md">
                     <div className="flex justify-between items-start mb-4">
                        <div>
                           <h4 className="text-base font-black text-slate-900">{order.pickupDetails?.community || '待估项目'}</h4>
                           <p className="text-[10px] text-slate-400 font-bold mt-1 flex items-center gap-1"><MapPin size={10} className="text-cyan-500"/>{order.pickupDetails?.street}</p>
                        </div>
                        <div className="text-lg font-black text-emerald-600">¥{order.analysis?.estimatedPrice}</div>
                     </div>
                     <button 
                        onClick={() => handleGrabOrder(order.id)}
                        className="w-full py-4 bg-slate-900 text-white font-black rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-transform shadow-lg shadow-slate-200"
                     >
                        立即为车队抢单
                     </button>
                  </div>
                ))
              )}
           </div>
        )}

        {activeTab === 'DISPATCH' && (
           <div className="space-y-4 animate-fade-in">
              <div className="flex justify-between items-center px-1">
                 <h3 className="font-black text-slate-800 flex items-center gap-2"><ClipboardList className="text-cyan-600" /> 车队待指派队列 ({dispatchOrders.length})</h3>
              </div>
              
              {dispatchOrders.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-[2.5rem] border-2 border-dashed text-slate-300 italic text-sm">暂无待调度任务</div>
              ) : (
                dispatchOrders.map(order => (
                  <div key={order.id} className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100">
                     <div className="flex justify-between items-center mb-6">
                        <div>
                           <h4 className="text-base font-black text-slate-900">{order.pickupDetails?.community}</h4>
                           <div className="text-[10px] text-slate-400 font-bold flex items-center gap-1 mt-1"><Clock size={10}/> 订单下达: {new Date(order.createdAt).toLocaleTimeString().slice(0,5)}</div>
                        </div>
                        <div className="bg-orange-50 text-orange-600 p-2 rounded-xl"><Truck size={20} /></div>
                     </div>
                     <button onClick={() => setShowDispatchModal(order)} className="w-full py-4 bg-cyan-600 text-white font-black rounded-2xl shadow-lg active:scale-95 transition-all">指派所属司机</button>
                  </div>
                ))
              )}
           </div>
        )}

        {activeTab === 'PROJECTS' && (
            <div className="space-y-4 animate-fade-in">
               <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 flex items-center justify-between">
                  <div>
                      <h3 className="font-black text-slate-800 text-lg">长期项目库</h3>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">备案成功后可开启合规清运</p>
                  </div>
                  <button onClick={() => setShowProjectModal(true)} className="bg-slate-900 text-white p-4 rounded-2xl shadow-xl active:scale-95 transition-transform">
                      <FolderPlus size={24} />
                  </button>
               </div>
               
               <div className="space-y-4">
                  {profile.projects.length === 0 ? (
                     <div className="text-center py-20 bg-white rounded-[2.5rem] border-2 border-dashed border-slate-200">
                        <FileStack className="w-12 h-12 mx-auto text-slate-200 mb-3" />
                        <p className="text-slate-300 font-black text-sm">暂无备案记录，点击 "+" 发起备案</p>
                     </div>
                  ) : (
                    profile.projects.map(proj => (
                       <div key={proj.id} className="bg-white p-5 rounded-[2.5rem] shadow-sm border border-slate-50 flex items-center justify-between group">
                          <div className="flex-1 pr-4">
                             <div className="flex items-center gap-2 mb-1">
                                <h4 className="text-sm font-black text-slate-800">{proj.name}</h4>
                                {proj.status === 'APPROVED' && <BadgeCheck size={14} className="text-emerald-500" />}
                             </div>
                             <div className="flex items-center text-[10px] text-slate-400 font-bold"><MapPin size={10} className="mr-1"/>{proj.address}</div>
                          </div>
                          <div className="text-right">
                             <span className={`text-[9px] font-black px-2 py-1 rounded-lg ${proj.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700' : 'bg-orange-50 text-orange-700'}`}>
                                {proj.status === 'APPROVED' ? '已核准' : '审核中'}
                             </span>
                          </div>
                       </div>
                    ))
                  )}
               </div>
            </div>
        )}

        {activeTab === 'DRIVERS' && (
           <div className="space-y-4 animate-fade-in">
              <div className="flex justify-between items-center px-1">
                 <h3 className="font-black text-slate-800">车队成员 ({localDrivers.length}人)</h3>
                 <button 
                    onClick={() => setShowAddDriverModal(true)}
                    className="text-[10px] font-black text-cyan-600 flex items-center gap-1 hover:bg-cyan-50 px-3 py-2 rounded-xl transition-colors border border-cyan-100"
                 >
                    <UserPlus size={14}/> 录入新司机
                 </button>
              </div>
              <div className="space-y-3">
                 {localDrivers.map(driver => (
                    <div key={driver.id} className="bg-white p-5 rounded-[2.5rem] shadow-sm border border-slate-50 flex items-center justify-between">
                       <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 border border-slate-100">
                             <Car size={24} />
                          </div>
                          <div>
                             <div className="text-sm font-black text-slate-800">{driver.name}</div>
                             <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tight font-mono">{driver.vehiclePlate}</div>
                          </div>
                       </div>
                       <div className="flex gap-2">
                           <button className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:text-slate-600 transition-colors"><Edit size={16} /></button>
                           <button className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:text-slate-600 transition-colors"><History size={16} /></button>
                       </div>
                    </div>
                 ))}
              </div>
           </div>
        )}
      </div>

      {showAddDriverModal && (
        <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-md z-[100] flex items-center justify-center p-4">
           <div className="bg-white w-full max-w-sm rounded-[3rem] overflow-hidden shadow-2xl animate-fade-in-up">
              <div className="bg-slate-900 p-8 text-white flex justify-between items-center">
                 <div>
                    <h3 className="font-black text-lg flex items-center gap-2"><UserPlus size={20}/> 录入新成员/车辆</h3>
                    <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase">New Fleet Member</p>
                 </div>
                 <button onClick={() => setShowAddDriverModal(false)} className="bg-white/10 p-2 rounded-full"><X size={20}/></button>
              </div>
              <div className="p-8 space-y-5">
                 <div className="grid grid-cols-2 gap-3">
                    <input className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold focus:border-cyan-500 outline-none text-sm" placeholder="姓名" value={driverForm.name} onChange={e => setDriverForm({...driverForm, name: e.target.value})} />
                    <input className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold focus:border-cyan-500 outline-none text-sm" placeholder="手机号" value={driverForm.phone} onChange={e => setDriverForm({...driverForm, phone: e.target.value})} />
                 </div>
                 <input className="w-full p-5 bg-slate-50 border-2 border-cyan-100 rounded-2xl font-black text-center text-xl placeholder:text-slate-300 focus:border-cyan-500 outline-none uppercase" placeholder="车牌号 (如: 沪A88888)" value={driverForm.plate} onChange={e => setDriverForm({...driverForm, plate: e.target.value})} />
                 
                 <select className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-slate-800 outline-none text-sm appearance-none" value={driverForm.type} onChange={e => setDriverForm({...driverForm, type: e.target.value})}>
                    <option value="Dump Truck">重型自卸车</option>
                    <option value="Small Truck">轻型平板车</option>
                    <option value="Van">厢式垃圾车</option>
                 </select>

                 <div className="bg-cyan-50 p-4 rounded-2xl border border-cyan-100 flex items-start gap-3">
                    <ShieldAlert size={18} className="text-cyan-600 mt-0.5 shrink-0" />
                    <p className="text-[10px] text-cyan-700 font-medium leading-relaxed">
                        录入后系统将自动对接车辆 GPS 协议，清运过程中 AI 视觉监控将通过司机手机端实时回传。
                    </p>
                 </div>

                 <button onClick={handleAddDriver} className="w-full py-5 bg-slate-900 text-white font-black rounded-2xl shadow-xl active:scale-95 transition-all">确认录入车队</button>
              </div>
           </div>
        </div>
      )}

      {showProjectModal && (
        <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-md z-[100] flex items-center justify-center p-4">
           <div className="bg-white w-full max-w-sm rounded-[3rem] overflow-hidden shadow-2xl animate-fade-in-up">
              <div className="bg-slate-900 p-8 text-white flex justify-between items-center">
                 <div>
                    <h3 className="font-black text-lg flex items-center gap-2"><FileBadge size={20}/> 施工项目备案申报</h3>
                    <p className="text-[10px] text-slate-400 font-bold mt-1">新合规项目申报书</p>
                 </div>
                 <button onClick={() => setShowProjectModal(false)} className="bg-white/10 p-2 rounded-full"><X size={20}/></button>
              </div>
              <div className="p-8 space-y-5">
                 <input className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold focus:border-cyan-500 outline-none text-sm" placeholder="项目全称" value={projectForm.name} onChange={e => setProjectForm({...projectForm, name: e.target.value})} />
                 <input className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold focus:border-cyan-500 outline-none text-sm" placeholder="清运起运点 (GIS)" value={projectForm.address} onChange={e => setProjectForm({...projectForm, address: e.target.value})} />
                 <input className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold focus:border-cyan-500 outline-none text-sm" placeholder="发包方/业主名称" value={projectForm.owner} onChange={e => setProjectForm({...projectForm, owner: e.target.value})} />
                 
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">资质证照扫描件</label>
                    <div className="h-32 bg-slate-50 border-4 border-dashed border-slate-100 rounded-2xl flex flex-col items-center justify-center text-slate-300">
                        <Upload size={32} />
                        <span className="text-[10px] font-black mt-2">上传施工许可证/合同</span>
                    </div>
                 </div>

                 <button onClick={handleAddProject} className="w-full py-5 bg-cyan-600 text-white font-black rounded-2xl shadow-xl shadow-cyan-900/20 active:scale-95 transition-all">提交官方审核</button>
              </div>
           </div>
        </div>
      )}

      {showDispatchModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[100] flex items-end justify-center p-4">
           <div className="bg-white w-full max-w-sm rounded-[3rem] overflow-hidden shadow-2xl animate-slide-in-up">
              <div className="bg-slate-900 p-8 text-white flex justify-between items-center">
                 <h3 className="font-black text-lg flex items-center gap-2"><Truck size={20}/> 内部调度指派</h3>
                 <button onClick={() => setShowDispatchModal(null)}><X size={20}/></button>
              </div>
              <div className="p-6 space-y-3 max-h-[50vh] overflow-y-auto no-scrollbar">
                {localDrivers.map(d => (
                    <button key={d.id} onClick={() => handleInternalDispatch(showDispatchModal.id, d)} className="w-full p-5 bg-slate-50 rounded-2xl flex items-center justify-between hover:bg-cyan-50 transition-all border border-transparent hover:border-cyan-200 group">
                        <div className="flex items-center gap-4 text-left">
                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 group-hover:text-cyan-600 transition-colors shadow-sm font-black text-xs">{d.name[0]}</div>
                            <div><div className="text-sm font-black text-slate-800">{d.name}</div><div className="text-[10px] text-slate-400 font-bold uppercase font-mono">{d.vehiclePlate}</div></div>
                        </div>
                        <ArrowRight size={18} className="text-slate-200 group-hover:text-cyan-500" />
                    </button>
                ))}
              </div>
           </div>
        </div>
      )}
    </div>
  );
};
