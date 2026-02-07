
import React, { useState, useRef, useMemo } from 'react';
import { Order, OrderStatus, DriverProfile, WasteType, ProjectStatus, FleetProject, FleetNotificationType, GovernmentNotice, OrderType, GeoLocation, LaborServiceType, CollectionMethod, DisposalProfile, FacilityOperationalStatus } from '../types';
import { 
  MapPin, Navigation, Truck, Camera, CheckCircle, ArrowRight, PlusCircle, X, 
  Clock, User, DollarSign, Activity, FileCheck, Layers, ChevronRight, Loader2, 
  Bell, AlertTriangle, ShieldCheck, Printer, Download, BarChart3, Calendar, 
  FileText, Briefcase, Info, ClipboardList, PackagePlus, Upload, FileBadge, UserPlus, Edit, 
  Search, LayoutGrid, Activity as ActivityIcon, Fingerprint, Lock, Shield, Sparkles, Zap,
  FileSearch, AlertOctagon, PhoneCall
} from 'lucide-react';
import { ElectronicManifest } from './ElectronicManifest';
import { DriverOnboarding } from './DriverOnboarding';
import { analyzeWasteMedia } from '../services/geminiService';

interface DriverViewProps {
  orders: Order[];
  updateStatus: (orderId: string, status: OrderStatus, data?: any) => void;
  driverProfile: DriverProfile | null;
  onUpdateProfile: (profile: DriverProfile, newFleet?: any) => void;
  addOrder: (order: Order) => void;
  fleetProjects?: FleetProject[];
  onAddProject?: (project: FleetProject) => void;
  govNotices?: GovernmentNotice[];
  existingFleets: string[]; 
  allFacilities: DisposalProfile[];
}

type DriverTab = 'WORKBENCH' | 'POOL' | 'PROJECTS' | 'STATS';

export const DriverView: React.FC<DriverViewProps> = ({ 
  orders, 
  updateStatus, 
  driverProfile, 
  onUpdateProfile, 
  addOrder, 
  fleetProjects = [], 
  onAddProject,
  govNotices = [],
  existingFleets = [],
  allFacilities = []
}) => {
  const [activeTab, setActiveTab] = useState<DriverTab>('WORKBENCH');
  const [showManifestOrder, setShowManifestOrder] = useState<Order | null>(null);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showSelfOrderModal, setShowSelfOrderModal] = useState(false);
  
  // 自主下单状态
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selfOrderMedia, setSelfOrderMedia] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  
  const [loadingMedia, setLoadingMedia] = useState<string | null>(null);
  const [projectForm, setProjectForm] = useState({ name: '', address: '', doc: '' });
  
  const selfOrderPhotoRef = useRef<HTMLInputElement>(null);
  const loadingPhotoRef = useRef<HTMLInputElement>(null);

  if (!driverProfile || driverProfile.status !== 'VERIFIED') {
    return <DriverOnboarding onRegister={onUpdateProfile} currentProfile={driverProfile} existingFleets={existingFleets} />;
  }

  const isIndependent = driverProfile.isIndependent;
  const fullFacs = allFacilities.filter(f => f.operationalStatus === FacilityOperationalStatus.FULL);

  const availableTabs = isIndependent 
    ? [
        { id: 'WORKBENCH', label: '工作台', icon: <ClipboardList size={18} /> },
        { id: 'PROJECTS', label: '项目报备', icon: <Briefcase size={18} /> },
        { id: 'STATS', label: '合规账单', icon: <BarChart3 size={18} /> },
      ]
    : [
        { id: 'WORKBENCH', label: '工作台', icon: <ClipboardList size={18} /> },
        { id: 'POOL', label: '抢单大厅', icon: <PackagePlus size={18} /> },
        { id: 'PROJECTS', label: '公司项目', icon: <Briefcase size={18} /> },
        { id: 'STATS', label: '流水/结算', icon: <BarChart3 size={18} /> },
      ];

  const activeOrder = orders.find(o => 
    o.assignedDriver?.plate === driverProfile.vehiclePlate && 
    ![OrderStatus.COMPLETED, OrderStatus.REVIEW_REQUIRED].includes(o.status)
  );

  const availableOrders = orders.filter(o => o.status === OrderStatus.PENDING_PICKUP && !o.assignedDriver);
  const myCompletedOrders = orders.filter(o => o.assignedDriver?.plate === driverProfile.vehiclePlate && o.status === OrderStatus.COMPLETED);

  const handleAccept = (order: Order) => {
    updateStatus(order.id, OrderStatus.IN_PROGRESS, {
      assignedDriver: { 
        name: driverProfile.name, 
        phone: driverProfile.phone, 
        plate: driverProfile.vehiclePlate,
        fleetName: driverProfile.fleetName
      }
    });
    setActiveTab('WORKBENCH');
  };

  const handleCreateSelfOrder = async () => {
    if (!selfOrderMedia || !selectedProjectId) {
        alert("请选择项目点并拍摄现场图");
        return;
    }
    
    const project = fleetProjects.find(p => p.id === selectedProjectId);
    if (!project) return;

    setIsAnalyzing(true);
    try {
        const analysis = await analyzeWasteMedia(selfOrderMedia, 'IMAGE', 'image/jpeg');
        
        const newOrder: Order = {
            id: `self-${Date.now()}`,
            userId: driverProfile.id, 
            createdAt: Date.now(),
            status: OrderStatus.ARRIVED_PICKUP, 
            orderType: OrderType.WASTE_REMOVAL,
            location: { lat: 31.22, lng: 121.48, address: project.address },
            pickupDetails: {
                city: '上海市', district: '浦东新区', street: project.address, community: project.name, isCollected: true, locationType: 'CONSTRUCTION_SITE'
            },
            mediaType: 'IMAGE',
            mediaData: selfOrderMedia,
            assignedDriver: {
                name: driverProfile.name,
                phone: driverProfile.phone,
                plate: driverProfile.vehiclePlate,
                fleetName: driverProfile.fleetName
            },
            analysis: analysis,
            paymentStatus: 'UNPAID'
        };

        if (addOrder) {
            addOrder(newOrder);
            setShowSelfOrderModal(false);
            setSelfOrderMedia(null);
            alert("自主清运任务已开启！系统已启动全链路技术监控。");
            setActiveTab('WORKBENCH');
        } else {
            console.error("Critical: addOrder function is not available.");
            alert("系统数据链路异常，请联系管理员。");
        }
    } catch (e) {
        console.error("Order creation failed", e);
        alert("AI 分析或下单失败，请检查网络后再试");
    } finally {
        setIsAnalyzing(false);
    }
  };

  const handleAddProject = () => {
    if (!projectForm.name || !projectForm.address || !onAddProject) return;
    onAddProject({
      id: `p-${Date.now()}`,
      name: projectForm.name,
      address: projectForm.address,
      permitImageUrl: projectForm.doc || '',
      status: 'APPROVED',
      createdAt: Date.now(),
      ownerId: driverProfile.id
    });
    setShowProjectModal(false);
    setProjectForm({ name: '', address: '', doc: '' });
  };

  return (
    <div className="pb-28 bg-gray-50 min-h-screen">
      {showManifestOrder && <ElectronicManifest order={showManifestOrder} onClose={() => setShowManifestOrder(null)} isIndependent={isIndependent} />}
      
      <div className={`${isIndependent ? 'bg-indigo-900' : 'bg-emerald-900'} text-white pt-12 pb-10 px-6 rounded-b-[3rem] shadow-xl relative overflow-hidden transition-all duration-700`}>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl"></div>
        <div className="flex justify-between items-start relative z-10">
          <div className="flex items-center gap-4">
             <div className="w-16 h-16 bg-white/10 rounded-3xl flex items-center justify-center backdrop-blur-md border border-white/20">
                {isIndependent ? <Fingerprint size={32} className="text-indigo-400" /> : <Truck size={32} className="text-emerald-400" />}
             </div>
             <div>
                <h1 className="text-xl font-black">{driverProfile.name}</h1>
                <div className="flex items-center gap-2 mt-1">
                   <span className="text-[10px] font-mono bg-black/40 px-2 py-0.5 rounded text-white/70">{driverProfile.vehiclePlate}</span>
                   <span className={`text-[8px] px-1.5 py-0.5 rounded font-black uppercase ${isIndependent ? 'bg-indigo-50 shadow-lg shadow-indigo-500/20' : 'bg-emerald-50 shadow-lg shadow-emerald-500/20'}`}>
                      {isIndependent ? '技术合规通道' : '资质联单通道'}
                   </span>
                </div>
             </div>
          </div>
          <div className="bg-black/20 p-2 rounded-2xl">
             <Bell className={isIndependent ? 'text-indigo-400' : 'text-emerald-400'} />
          </div>
        </div>
        <div className="mt-8 grid grid-cols-3 gap-3 relative z-10">
           <div className="bg-white/5 p-3 rounded-2xl border border-white/10">
              <div className="text-[8px] text-white/40 font-bold uppercase mb-1">本月作业</div>
              <div className="text-xl font-black">{myCompletedOrders.length} <span className="text-[10px] opacity-50">车</span></div>
           </div>
           <div className="bg-white/5 p-3 rounded-2xl border border-white/10">
              <div className="text-[8px] text-white/40 font-bold uppercase mb-1">累计凭证</div>
              <div className="text-xl font-black text-cyan-400">{myCompletedOrders.length} <span className="text-[10px] opacity-50">份</span></div>
           </div>
           <div className="bg-white/5 p-3 rounded-2xl border border-white/10">
              <div className="text-[8px] text-white/40 font-bold uppercase mb-1">合规分</div>
              <div className="text-xl font-black text-blue-400">99</div>
           </div>
        </div>
      </div>

      <div className="px-4 -mt-6 relative z-20">
         <div className="bg-white p-1 rounded-2xl shadow-xl border border-gray-100 flex overflow-x-auto no-scrollbar">
            {availableTabs.map(tab => (
               <button 
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as DriverTab)}
                  className={`flex-1 min-w-[90px] py-4 flex flex-col items-center gap-1 transition-all rounded-xl ${activeTab === tab.id ? (isIndependent ? 'bg-indigo-50 text-indigo-700' : 'bg-emerald-50 text-emerald-700') : 'text-gray-400'}`}
               >
                  {tab.icon}
                  <span className="text-[10px] font-black">{tab.label}</span>
               </button>
            ))}
         </div>
      </div>

      <div className="p-4 space-y-6">
        {activeTab === 'WORKBENCH' && (
           <div className="space-y-6 animate-fade-in">
              {fullFacs.length > 0 && (
                <div className="bg-red-900/90 backdrop-blur-md p-3 rounded-2xl flex items-center gap-3 border border-red-500/30 shadow-lg animate-slide-in-up">
                   <AlertOctagon size={20} className="text-red-400 animate-pulse shrink-0" />
                   <div className="flex-1 overflow-hidden">
                      <div className="text-[10px] text-white font-black whitespace-nowrap animate-marquee">
                         紧急通知：{fullFacs.map(f => f.name).join('、')} 已爆仓停止入场，请联系车队变更路线。
                      </div>
                   </div>
                   <button className="bg-white/10 p-1.5 rounded-lg text-white" onClick={() => alert("联系中...")}><PhoneCall size={14} /></button>
                </div>
              )}

              {activeOrder ? (
                 <div className="bg-white rounded-[2.5rem] shadow-xl border border-gray-100 overflow-hidden relative">
                    {isIndependent && (
                        <div className="absolute top-4 right-4 animate-pulse flex items-center gap-1 text-indigo-500 font-black text-[8px] uppercase">
                            <ActivityIcon size={12} /> Live Tracking
                        </div>
                    )}
                    <div className={`${isIndependent ? 'bg-indigo-600' : 'bg-emerald-600'} px-6 py-4 flex justify-between items-center text-white`}>
                      <span className="font-black italic flex items-center gap-2 uppercase text-xs">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {activeOrder.status === OrderStatus.IN_PROGRESS ? "前往现场" : 
                         activeOrder.status === OrderStatus.ARRIVED_PICKUP ? "到达现场·装载中" : 
                         activeOrder.status === OrderStatus.LOADING_COMPLETE ? "前往消纳点" : "入场核销中"}
                      </span>
                    </div>
                    <div className="p-6 space-y-6">
                      <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-2xl ${isIndependent ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-700'}`}>
                           <MapPin size={24} />
                        </div>
                        <div>
                           <div className="text-xl font-black text-gray-900 leading-tight">
                               {activeOrder.status === OrderStatus.LOADING_COMPLETE ? "浦东第一再生资源场" : (activeOrder.pickupDetails?.community || '任务地址')}
                           </div>
                           <div className="text-xs text-gray-400 mt-1 font-bold">
                               {activeOrder.status === OrderStatus.LOADING_COMPLETE ? "浦东新区川沙路88号" : activeOrder.pickupDetails?.street}
                           </div>
                        </div>
                      </div>

                      {activeOrder.status === OrderStatus.IN_PROGRESS && (
                         <button onClick={() => updateStatus(activeOrder.id, OrderStatus.ARRIVED_PICKUP)} className={`w-full py-5 rounded-2xl font-black shadow-lg text-white ${isIndependent ? 'bg-indigo-600' : 'bg-emerald-600'}`}>
                             到达作业点
                         </button>
                      )}

                      {activeOrder.status === OrderStatus.ARRIVED_PICKUP && (
                        <div className="space-y-4">
                           <div 
                              onClick={() => loadingPhotoRef.current?.click()}
                              className="w-full h-44 border-2 border-dashed border-gray-200 bg-gray-50 rounded-3xl flex flex-col items-center justify-center overflow-hidden relative"
                           >
                              {loadingMedia ? (
                                  <img src={loadingMedia} className="w-full h-full object-cover" />
                              ) : (
                                  <>
                                      <Camera className="text-gray-300 mb-2" size={32} />
                                      <span className="text-xs font-bold text-gray-400">拍摄满载照片存证</span>
                                  </>
                              )}
                              <input ref={loadingPhotoRef} type="file" accept="image/*" className="hidden" onChange={(e) => {
                                 const f = e.target.files?.[0];
                                 if (f) {
                                     const r = new FileReader();
                                     r.onload = (ev) => setLoadingMedia(ev.target?.result as string);
                                     r.readAsDataURL(f);
                                 }
                              }} />
                           </div>
                           <button onClick={() => { updateStatus(activeOrder.id, OrderStatus.LOADING_COMPLETE, { loadingPhoto: loadingMedia }); setLoadingMedia(null); }} className={`w-full py-5 rounded-2xl font-black shadow-lg text-white ${isIndependent ? 'bg-indigo-600' : 'bg-emerald-600'}`}>
                               确认装载(启程前往消纳场)
                           </button>
                        </div>
                      )}

                      {activeOrder.status === OrderStatus.LOADING_COMPLETE && (
                         <button onClick={() => updateStatus(activeOrder.id, OrderStatus.ARRIVED_DISPOSAL)} className={`w-full py-5 rounded-2xl font-black shadow-lg text-white ${isIndependent ? 'bg-indigo-600' : 'bg-emerald-600'}`}>
                             到达处置点
                         </button>
                      )}

                      {activeOrder.status === OrderStatus.ARRIVED_DISPOSAL && (
                          <div className="bg-orange-50 p-6 rounded-3xl border border-orange-100 text-center space-y-3">
                              <Loader2 className="w-10 h-10 text-orange-600 animate-spin mx-auto" />
                              <h3 className="font-black text-orange-900 uppercase tracking-tight text-sm">Gate Verification</h3>
                              <button onClick={() => setShowManifestOrder(activeOrder)} className="w-full py-4 bg-white text-orange-700 font-black rounded-2xl border-2 border-orange-200">
                                  显示核销凭证
                              </button>
                          </div>
                      )}
                    </div>
                 </div>
              ) : (
                <div className="space-y-4">
                  {isIndependent && (
                    <button 
                      onClick={() => setShowSelfOrderModal(true)}
                      className="w-full bg-white p-8 rounded-[2.5rem] border-4 border-dashed border-indigo-100 flex flex-col items-center justify-center gap-3 group active:bg-indigo-50 transition-all shadow-sm"
                    >
                       <div className="w-16 h-16 bg-indigo-50 rounded-3xl flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
                          <Zap size={32} className="fill-indigo-600" />
                       </div>
                       <div className="text-center">
                          <span className="text-lg font-black text-indigo-900">发起自主备案清运</span>
                          <p className="text-[10px] text-indigo-400 font-bold mt-1 uppercase">Start a new self-run task</p>
                       </div>
                    </button>
                  )}
                  <div className="text-center py-16 bg-white rounded-[2.5rem] border-2 border-dashed border-gray-100">
                    <Truck className="text-gray-200 mx-auto mb-4" size={32} />
                    <p className="text-gray-400 font-bold text-sm">当前无活跃任务</p>
                  </div>
                </div>
              )}
           </div>
        )}

        {activeTab === 'POOL' && !isIndependent && (
            <div className="space-y-4 animate-fade-in">
                {availableOrders.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-[2.5rem] border border-dashed text-gray-300">
                        <PackagePlus className="mx-auto mb-2 opacity-20" size={48} />
                        <p className="font-bold">抢单池暂时清空</p>
                    </div>
                ) : (
                    availableOrders.map(order => (
                        <div key={order.id} className="bg-white p-6 rounded-3xl shadow-md border border-gray-100">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h4 className="text-lg font-black text-gray-800">{order.pickupDetails?.community}</h4>
                                    <div className="text-xs text-gray-400 font-bold mt-1 flex items-center gap-1"><MapPin size={10}/> {order.pickupDetails?.street}</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-xl font-black text-emerald-600">¥{order.analysis?.estimatedPrice}</div>
                                </div>
                            </div>
                            <button onClick={() => handleAccept(order)} className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-black shadow-lg">
                                立即承运
                            </button>
                        </div>
                    ))
                )}
            </div>
        )}

        {activeTab === 'PROJECTS' && (
           <div className="space-y-4 animate-fade-in">
              <div className={`p-6 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden ${isIndependent ? 'bg-indigo-600' : 'bg-emerald-600'}`}>
                 <h3 className="text-lg font-black flex items-center gap-2">
                     {isIndependent ? <Shield size={20}/> : <Briefcase size={20}/>}
                     {isIndependent ? '清运项目自主报备' : '公司项目库'}
                 </h3>
                 <p className="text-[10px] opacity-80 mt-1 font-bold leading-relaxed">针对零星散单，请先报备清运起始地。</p>
                 {isIndependent && (
                     <button onClick={() => setShowProjectModal(true)} className="mt-4 bg-white text-indigo-600 px-6 py-2.5 rounded-xl font-black text-xs shadow-lg">+ 录入新报备项目</button>
                 )}
              </div>
              <div className="space-y-4">
                 {fleetProjects.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-[2.5rem] border border-dashed text-gray-300"><p className="font-bold">暂无备案点位</p></div>
                 ) : (
                    fleetProjects.map(proj => (
                       <div key={proj.id} className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 flex items-center justify-between">
                          <div>
                             <div className="text-sm font-black text-gray-800">{proj.name}</div>
                             <div className="text-[10px] text-gray-400 font-bold mt-1 flex items-center gap-1"><MapPin size={10}/> {proj.address}</div>
                          </div>
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg ${proj.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 text-orange-600'}`}>
                             {proj.status === 'APPROVED' ? '已核准' : '审核中'}
                          </span>
                       </div>
                    ))
                 )}
              </div>
           </div>
        )}
      </div>

      {/* 自主清运弹窗 */}
      {showSelfOrderModal && (
          <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-[100] flex items-center justify-center p-4">
              <div className="bg-white w-full max-w-sm rounded-[2.5rem] overflow-hidden shadow-2xl animate-fade-in-up">
                  <div className="bg-indigo-900 p-6 text-white flex justify-between items-center"><h3 className="font-black flex items-center gap-2"><Zap size={20}/> 发起自主清运</h3><button onClick={() => setShowSelfOrderModal(false)}><X size={20}/></button></div>
                  <div className="p-8 space-y-6">
                      <div>
                          <label className="text-[10px] font-black text-gray-400 uppercase mb-2 block">1. 选择报备项目点</label>
                          <select className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl font-bold text-indigo-900" value={selectedProjectId} onChange={e => setSelectedProjectId(e.target.value)}>
                             <option value="">-- 请选择已备案项目 --</option>
                             {fleetProjects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                          </select>
                      </div>
                      <div>
                          <label className="text-[10px] font-black text-gray-400 uppercase mb-2 block">2. 拍摄起运现场图 (AI 估方)</label>
                          <div onClick={() => selfOrderPhotoRef.current?.click()} className="w-full h-40 border-4 border-dashed border-indigo-50 bg-slate-50 rounded-3xl flex flex-col items-center justify-center overflow-hidden relative cursor-pointer">
                             {selfOrderMedia ? <img src={selfOrderMedia} className="w-full h-full object-cover" /> : <><Camera size={32} className="text-indigo-200" /><span className="text-[10px] font-black text-indigo-300 mt-2">点击开启相机拍摄</span></>}
                             <input ref={selfOrderPhotoRef} type="file" accept="image/*" className="hidden" onChange={(e) => {
                                 const f = e.target.files?.[0];
                                 if (f) {
                                     const r = new FileReader();
                                     r.onload = (ev) => setSelfOrderMedia(ev.target?.result as string);
                                     r.readAsDataURL(f);
                                 }
                             }} />
                          </div>
                      </div>
                      <button onClick={handleCreateSelfOrder} disabled={!selfOrderMedia || !selectedProjectId || isAnalyzing} className={`w-full py-4 rounded-2xl font-black shadow-xl flex items-center justify-center gap-2 transition-all ${(!selfOrderMedia || !selectedProjectId || isAnalyzing) ? 'bg-slate-100 text-slate-300' : 'bg-indigo-600 text-white active:scale-95 shadow-indigo-200'}`}>
                         {isAnalyzing ? <><Loader2 className="animate-spin" /> AI 正在分析材质...</> : <><Sparkles size={18}/> 确认并开启运输监控</>}
                      </button>
                  </div>
              </div>
          </div>
      )}

      {showProjectModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-sm rounded-[2.5rem] overflow-hidden shadow-2xl animate-fade-in-up">
                <div className="bg-indigo-900 p-6 text-white flex justify-between items-center"><h3 className="font-black flex items-center gap-2"><PlusCircle size={20}/> 清运项目报备</h3><button onClick={() => setShowProjectModal(false)}><X size={20}/></button></div>
                <div className="p-8 space-y-5">
                    <input className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl font-bold" placeholder="工程/项目名称" value={projectForm.name} onChange={e => setProjectForm({...projectForm, name: e.target.value})} />
                    <input className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl font-bold" placeholder="清运起始地址" value={projectForm.address} onChange={e => setProjectForm({...projectForm, address: e.target.value})} />
                    <button onClick={handleAddProject} className="w-full py-4 bg-indigo-600 text-white font-black rounded-2xl">提交报备申请</button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};
