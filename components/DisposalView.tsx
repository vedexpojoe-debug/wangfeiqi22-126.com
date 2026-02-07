
import React, { useState, useRef, useMemo } from 'react';
import { 
  Order, OrderStatus, RecycledProduct, RecycledProductType, 
  DisposalProfile, FacilityOperationalStatus, PromotionType, 
  WasteType, SettlementMethod, UserRole, GovernmentNotice
} from '../types';
import { analyzeRecycledProduct } from '../services/geminiService';
import { DisposalOnboarding } from './Disboarding';
import { 
  Factory, Scale, Camera, Upload, 
  Store, ChevronRight, Scan, Wallet, Archive, XCircle, FileSearch, Fingerprint, 
  Sparkles, Tag, Layers, CreditCard, Receipt, BarChart3, Search, Filter, FileDown, Eye, CheckCircle, Clock, Truck, Megaphone, TrendingDown, RefreshCw, ClipboardCheck,
  ShieldCheck, Loader2, X, AlertTriangle, Zap, Radio
} from 'lucide-react';

interface DisposalViewProps {
  orders: Order[];
  updateStatus: (orderId: string, status: OrderStatus, data?: any) => void;
  disposalProfile: DisposalProfile | null;
  onUpdateProfile: (profile: DisposalProfile) => void;
  onPublishProduct: (product: RecycledProduct) => void; 
  onPublishNotice?: (notice: GovernmentNotice) => void;
}

export const DisposalView: React.FC<DisposalViewProps> = ({ 
  orders, 
  updateStatus, 
  disposalProfile, 
  onUpdateProfile, 
  onPublishProduct,
  onPublishNotice
}) => {
  const [activeTab, setActiveTab] = useState<'OPERATIONS' | 'HISTORY' | 'INVENTORY' | 'MARKETING'>('OPERATIONS');
  const [analyzingProduct, setAnalyzingProduct] = useState(false);
  
  const [confirmingOrderId, setConfirmingOrderId] = useState<string | null>(null);
  const [vehiclePhoto, setVehiclePhoto] = useState<string | null>(null);
  const [historySearch, setHistorySearch] = useState('');
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<Order | null>(null);
  const [settlementFilter, setSettlementFilter] = useState<'ALL' | 'PENDING' | 'PAID'>('ALL');

  // 调度模态框状态
  const [showPromoModal, setShowPromoModal] = useState(false);
  const [promoType, setPromoType] = useState<'DISCOUNT' | 'REQUEST'>('DISCOUNT');
  const [promoForm, setPromoForm] = useState({ price: '380', reason: '库容充裕，低价招引运力错峰入场' });

  const vehicleInputRef = useRef<HTMLInputElement>(null);
  const productInputRef = useRef<HTMLInputElement>(null);

  if (!disposalProfile || disposalProfile.status !== 'VERIFIED') {
    return <div className="p-10 text-center font-black">身份验证中...</div>;
  }

  const isFull = disposalProfile.operationalStatus === FacilityOperationalStatus.FULL;
  const myFacilityOrders = orders.filter(o => 
    o.disposalFacilityName === disposalProfile.name || o.status === OrderStatus.ARRIVED_DISPOSAL || o.status === OrderStatus.LOADING_COMPLETE
  );
  const arrivedOrders = myFacilityOrders.filter(o => o.status === OrderStatus.ARRIVED_DISPOSAL || o.status === OrderStatus.LOADING_COMPLETE);
  const completedOrders = myFacilityOrders.filter(o => o.status === OrderStatus.COMPLETED);

  const filteredHistory = useMemo(() => {
    return completedOrders.filter(o => {
        const matchesSearch = o.assignedDriver?.plate.includes(historySearch) || 
                              o.id.includes(historySearch) ||
                              o.manifestSerialNo?.includes(historySearch) ||
                              o.pickupDetails?.community?.includes(historySearch);
        const matchesSettlement = settlementFilter === 'ALL' || 
                                 (settlementFilter === 'PENDING' && o.disposalSettlementStatus === 'PENDING_PLATFORM') ||
                                 (settlementFilter === 'PAID' && o.disposalSettlementStatus === 'PAID');
        return matchesSearch && matchesSettlement;
    });
  }, [completedOrders, historySearch, settlementFilter]);

  const financialStats = useMemo(() => {
    const platformPending = completedOrders
        .filter(o => o.disposalSettlementStatus === 'PENDING_PLATFORM')
        .reduce((sum, o) => sum + (o.disposalFee || 0), 0);
    const todayDirect = completedOrders
        .filter(o => o.disposalSettlementMethod === 'DIRECT')
        .reduce((sum, o) => sum + (o.disposalFee || 0), 0);
    const totalSettled = completedOrders
        .filter(o => o.disposalSettlementStatus === 'PAID')
        .reduce((sum, o) => sum + (o.disposalFee || 0), 0);
    return { platformPending, todayDirect, totalSettled };
  }, [completedOrders]);

  const handleToggleStatus = (newStatus: FacilityOperationalStatus) => {
    onUpdateProfile({ ...disposalProfile, operationalStatus: newStatus });
  };

  const handleStartEntrance = (order: Order) => {
    setConfirmingOrderId(order.id);
    setVehiclePhoto(null);
  };

  const submitArrivalConfirmation = (order: Order) => {
    if (confirmingOrderId && vehiclePhoto) {
      const isLargeClient = order.userId.startsWith('ent-') || order.userId.startsWith('prop-') || order.paymentStatus === 'MONTHLY_BILL';
      const method: SettlementMethod = isLargeClient ? 'PLATFORM' : 'DIRECT';
      updateStatus(confirmingOrderId, OrderStatus.COMPLETED, { 
         disposalEntryPhoto: vehiclePhoto,
         disposalFacilityName: disposalProfile.name,
         disposalFacilityId: disposalProfile.id,
         disposalFee: 450, 
         disposalSettlementMethod: method,
         disposalSettlementStatus: method === 'PLATFORM' ? 'PENDING_PLATFORM' : 'PAID',
         manifestSerialNo: `MF-${Date.now().toString().slice(-6)}`
      });
      setConfirmingOrderId(null);
      setVehiclePhoto(null);
      alert(`【核验成功】\n联单已生成，数据已上链。`);
    }
  };

  const handlePublishPromotion = () => {
      if (!onPublishNotice) return;
      const title = promoType === 'DISCOUNT' ? `📣 限时优惠：${disposalProfile.name}` : `🚨 运力召集：${disposalProfile.name}`;
      const content = promoType === 'DISCOUNT' 
        ? `入场费下调至 ¥${promoForm.price}/车！${promoForm.reason}` 
        : `急需空闲运力入场清运再生骨料。${promoForm.reason}`;

      onPublishNotice({
          id: `promo-${Date.now()}`,
          title,
          content,
          time: Date.now(),
          type: promoType === 'DISCOUNT' ? 'NOTICE' : 'ALERT',
          targetRoles: [UserRole.DRIVER, UserRole.FLEET]
      });
      setShowPromoModal(false);
      alert("调度信息已全网广播！");
  };

  return (
    <div className="bg-slate-50 min-h-screen pb-24 font-sans">
       <div className={`pt-12 pb-10 px-6 transition-all duration-700 relative overflow-hidden rounded-b-[3rem] shadow-2xl ${isFull ? 'bg-red-900' : 'bg-slate-900'}`}>
         <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-20 -mt-20"></div>
         <div className="relative z-10 text-white">
           <div className="flex justify-between items-start">
              <div>
                 <h1 className="text-2xl font-black flex items-center gap-2">
                    <Factory size={24} className="text-blue-400" /> {disposalProfile.name}
                 </h1>
                 <p className="text-xs text-slate-400 mt-1 font-bold flex items-center gap-2">
                    <ShieldCheck size={12} className="text-emerald-500" /> 认证处置单位
                 </p>
              </div>
              <div className="bg-black/40 backdrop-blur-md p-1 rounded-2xl border border-white/10 flex">
                {(['OPEN', 'BUSY', 'FULL'] as const).map(s => (
                    <button key={s} onClick={() => handleToggleStatus(FacilityOperationalStatus[s])} className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all ${disposalProfile.operationalStatus === s ? 'bg-white text-slate-900 shadow-xl' : 'text-white/40'}`}>
                        {s === 'OPEN' ? '正常' : s === 'BUSY' ? '繁忙' : '爆仓'}
                    </button>
                ))}
              </div>
           </div>
           <div className="mt-8 grid grid-cols-3 gap-3">
              <div className="bg-white/5 p-4 rounded-3xl border border-white/10 text-center">
                 <div className="text-[9px] text-slate-400 font-black uppercase mb-1">今日进场</div>
                 <div className="text-2xl font-black">{completedOrders.length}</div>
              </div>
              <div className="bg-white/5 p-4 rounded-3xl border border-white/10 text-center">
                 <div className="text-[9px] text-slate-400 font-black uppercase mb-1">待检队列</div>
                 <div className="text-2xl font-black text-orange-400">{arrivedOrders.length}</div>
              </div>
              <div className="bg-white/5 p-4 rounded-3xl border border-white/10 text-center">
                 <div className="text-[9px] text-slate-400 font-black uppercase mb-1">库容</div>
                 <div className={`text-2xl font-black ${isFull ? 'text-red-400' : 'text-emerald-400'}`}>{isFull ? '100%' : '62%'}</div>
              </div>
           </div>
         </div>
       </div>

       <div className="px-4 -mt-6 relative z-30">
          <div className="bg-white p-1.5 rounded-[2rem] shadow-xl border border-slate-100 flex gap-1 overflow-x-auto no-scrollbar">
             {[
               { id: 'OPERATIONS', label: '智能核验', icon: <Scan size={18} /> },
               { id: 'HISTORY', label: '结算对账', icon: <Receipt size={18} /> },
               { id: 'INVENTORY', label: 'AI 盘点', icon: <Archive size={18} /> },
               { id: 'MARKETING', label: '运力调度', icon: <Megaphone size={18} /> }
             ].map(tab => (
               <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`flex-1 min-w-[85px] py-4 rounded-2xl flex flex-col items-center gap-1 transition-all ${activeTab === tab.id ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>
                 {tab.icon}
                 <span className="text-[10px] font-black">{tab.label}</span>
               </button>
             ))}
          </div>
       </div>

       <div className="p-4 pt-6">
          {activeTab === 'OPERATIONS' && (
            <div className="space-y-4 animate-fade-in">
                {arrivedOrders.length === 0 ? (
                  <div className="text-center py-24 bg-white rounded-[3rem] border-2 border-dashed border-slate-200">
                     <p className="font-black text-slate-300 text-sm italic">当前站口无待检车辆</p>
                  </div>
                ) : (
                  arrivedOrders.map(order => (
                    <div key={order.id} className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 p-6">
                       <div className="flex justify-between items-center mb-6">
                          <div className="flex items-center gap-4">
                             <div className="w-14 h-14 bg-slate-50 rounded-[1.5rem] flex items-center justify-center font-mono font-black text-slate-400 border border-slate-100">{order.assignedDriver?.plate.slice(-5)}</div>
                             <div>
                                <h4 className="font-black text-slate-900 text-base">{order.assignedDriver?.plate}</h4>
                                <p className="text-[10px] text-slate-400 font-bold mt-0.5">{order.analysis?.wasteType}</p>
                             </div>
                          </div>
                          <span className={`text-[10px] font-black px-3 py-1 rounded-full ${order.status === OrderStatus.ARRIVED_DISPOSAL ? 'bg-orange-500 text-white animate-pulse' : 'bg-blue-50 text-blue-500'}`}>
                            {order.status === OrderStatus.ARRIVED_DISPOSAL ? '已在场外' : '运输监控中'}
                          </span>
                       </div>
                       {confirmingOrderId === order.id ? (
                        <div className="space-y-6 pt-6 border-t animate-fade-in">
                            <div className="grid grid-cols-2 gap-4">
                               <div className="h-40 bg-slate-100 rounded-[2rem] overflow-hidden"><img src={order.loadingPhoto || order.mediaData} className="w-full h-full object-cover" /></div>
                               <div onClick={() => vehicleInputRef.current?.click()} className="h-40 bg-blue-50 border-4 border-dashed border-blue-100 rounded-[2rem] flex flex-col items-center justify-center overflow-hidden cursor-pointer">
                                  {vehiclePhoto ? <img src={vehiclePhoto} className="w-full h-full object-cover" /> : <Camera className="text-blue-300" size={32} />}
                                  <input ref={vehicleInputRef} type="file" accept="image/*" className="hidden" onChange={e => {
                                      const f = e.target.files?.[0];
                                      if (f) { const r = new FileReader(); r.onload = ev => setVehiclePhoto(ev.target?.result as string); r.readAsDataURL(f); }
                                  }} />
                               </div>
                            </div>
                            <button onClick={() => submitArrivalConfirmation(order)} disabled={!vehiclePhoto} className={`w-full py-5 rounded-2xl font-black text-white shadow-xl flex items-center justify-center gap-2 ${vehiclePhoto ? 'bg-blue-600' : 'bg-slate-200'}`}><Fingerprint size={20} /> 交叉校验并卸货</button>
                        </div>
                       ) : (
                         <button onClick={() => handleStartEntrance(order)} className="w-full py-5 bg-slate-900 text-white rounded-3xl font-black text-sm flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-all"><Scan size={20} /> 开始核验入场</button>
                       )}
                    </div>
                  ))
                )}
            </div>
          )}

          {activeTab === 'HISTORY' && (
              <div className="space-y-6 animate-fade-in pb-10">
                  <div className="bg-slate-900 p-6 rounded-[2.5rem] text-white">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white/5 p-4 rounded-2xl">
                           <div className="text-[9px] text-slate-400 font-bold mb-1">待结余额</div>
                           <div className="text-2xl font-black text-blue-400">¥{financialStats.platformPending.toLocaleString()}</div>
                        </div>
                        <div className="bg-white/5 p-4 rounded-2xl">
                           <div className="text-[9px] text-slate-400 font-bold mb-1">今日流水</div>
                           <div className="text-2xl font-black text-emerald-400">¥{financialStats.todayDirect.toLocaleString()}</div>
                        </div>
                      </div>
                  </div>
                  <div className="flex bg-white p-3 rounded-2xl border items-center gap-3"><Search size={18} className="text-slate-400"/><input className="flex-1 outline-none text-sm font-bold" placeholder="搜车牌或联单号..." value={historySearch} onChange={e=>setHistorySearch(e.target.value)}/></div>
                  <div className="space-y-4">
                    {filteredHistory.map(o => (
                        <div key={o.id} className="bg-white p-5 rounded-[2.5rem] shadow-sm border border-slate-50">
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="flex items-center gap-2 mb-1.5"><span className="text-[8px] font-black px-1.5 py-0.5 rounded-lg bg-emerald-50 text-emerald-600">已完结</span><span className="text-[8px] font-black text-slate-300">#{o.manifestSerialNo}</span></div>
                                    <h4 className="text-base font-black text-slate-800">{o.assignedDriver?.plate}</h4>
                                </div>
                                <div className="text-right"><div className="text-xl font-black text-slate-900">¥450</div></div>
                            </div>
                        </div>
                    ))}
                  </div>
              </div>
          )}

          {activeTab === 'MARKETING' && (
            <div className="space-y-4 animate-fade-in">
                <div className="bg-orange-600 p-6 rounded-[2.5rem] text-white shadow-xl flex items-center gap-4 relative overflow-hidden">
                   <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                   <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md relative z-10"><Megaphone size={28} /></div>
                   <div className="relative z-10">
                      <h3 className="text-lg font-black">运力智能平衡</h3>
                      <p className="text-[10px] text-orange-100 mt-1 uppercase font-bold">Capacity Smart Balance</p>
                   </div>
                </div>

                <div className="grid grid-cols-1 gap-3">
                   <button onClick={() => { setPromoType('DISCOUNT'); setPromoForm({ price: '380', reason: '库容充裕，低价招引运力错峰入场' }); setShowPromoModal(true); }} className="w-full bg-white p-6 rounded-[2.5rem] border-2 border-slate-50 flex items-center justify-between group active:scale-[0.98] transition-all hover:border-orange-200">
                      <div className="flex items-center gap-4 text-left">
                         <div className="p-4 bg-orange-50 text-orange-600 rounded-3xl group-hover:bg-orange-600 group-hover:text-white transition-all"><TrendingDown size={28} /></div>
                         <div><div className="text-base font-black text-slate-800">发布入场优惠</div><p className="text-xs text-slate-400 font-bold mt-0.5">错峰调节，吸引周边车辆</p></div>
                      </div>
                      <ChevronRight className="text-slate-200" />
                   </button>
                   
                   <button onClick={() => { setPromoType('REQUEST'); setPromoForm({ price: '-', reason: '再生资源库存积压，需车队优先响应运出' }); setShowPromoModal(true); }} className="w-full bg-white p-6 rounded-[2.5rem] border-2 border-slate-50 flex items-center justify-between group active:scale-[0.98] transition-all hover:border-blue-200">
                      <div className="flex items-center gap-4 text-left">
                         <div className="p-4 bg-blue-50 text-blue-600 rounded-3xl group-hover:bg-blue-600 group-hover:text-white transition-all"><Truck size={28} /></div>
                         <div><div className="text-base font-black text-slate-800">请求再生资源调度</div><p className="text-xs text-slate-400 font-bold mt-0.5">定向清理库位积压</p></div>
                      </div>
                      <ChevronRight className="text-slate-200" />
                   </button>

                   <div className="mt-4 p-6 bg-slate-100 rounded-[2.5rem] border border-dashed border-slate-200 flex flex-col items-center gap-3">
                      <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center"><Radio className="text-slate-400 animate-ping" size={24}/></div>
                      <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest text-center">正在监控 5km 内空闲车次...</p>
                   </div>
                </div>
            </div>
          )}
       </div>

       {/* 调度发布模态框 */}
       {showPromoModal && (
          <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-md z-[100] flex items-center justify-center p-4">
             <div className="bg-white w-full max-w-sm rounded-[3rem] overflow-hidden shadow-2xl animate-fade-in-up">
                <div className={`${promoType === 'DISCOUNT' ? 'bg-orange-600' : 'bg-blue-600'} p-8 text-white flex justify-between items-center`}>
                   <div>
                      <h3 className="font-black text-lg flex items-center gap-2">
                        {promoType === 'DISCOUNT' ? <TrendingDown size={20}/> : <Megaphone size={20}/>}
                        {promoType === 'DISCOUNT' ? '发布入场价格政策' : '发起运力支援请求'}
                      </h3>
                      <p className="text-[10px] text-white/70 font-bold mt-1 uppercase">Broadcast Command Center</p>
                   </div>
                   <button onClick={() => setShowPromoModal(false)}><X size={24}/></button>
                </div>
                <div className="p-8 space-y-6">
                   {promoType === 'DISCOUNT' && (
                     <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block">优惠执行单价 (¥/车)</label>
                        <input className="w-full p-4 bg-slate-50 border-2 border-orange-100 rounded-2xl font-black text-2xl text-orange-600 outline-none" value={promoForm.price} onChange={e=>setPromoForm({...promoForm, price: e.target.value})} />
                     </div>
                   )}
                   <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block">发布说明/备注信息</label>
                      <textarea className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold h-24 outline-none text-sm" value={promoForm.reason} onChange={e=>setPromoForm({...promoForm, reason: e.target.value})} />
                   </div>
                   <div className="bg-slate-50 p-4 rounded-2xl flex items-center gap-3 border border-slate-100">
                      <Zap size={20} className="text-yellow-500 fill-yellow-500" />
                      <p className="text-[10px] text-slate-500 font-medium">信息将立即推送到周边 10km 范围内的所有司机端及合作车队控制台。</p>
                   </div>
                   <button onClick={handlePublishPromotion} className={`w-full py-5 ${promoType === 'DISCOUNT' ? 'bg-orange-600 shadow-orange-200' : 'bg-blue-600 shadow-blue-200'} text-white font-black rounded-2xl shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2`}>
                      确认全网广播指令
                   </button>
                </div>
             </div>
          </div>
       )}

       {selectedOrderDetails && (
          <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-md z-[100] flex items-center justify-center p-4">
             <div className="bg-white w-full max-w-sm rounded-[3rem] overflow-hidden shadow-2xl animate-fade-in-up">
                <div className="bg-slate-900 p-8 text-white flex justify-between items-center">
                   <h3 className="font-black">对账详情对比</h3>
                   <button onClick={() => setSelectedOrderDetails(null)}><X size={20}/></button>
                </div>
                <div className="p-8">
                   <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="h-40 rounded-2xl overflow-hidden border"><img src={selectedOrderDetails.loadingPhoto} className="w-full h-full object-cover" /></div>
                      <div className="h-40 rounded-2xl overflow-hidden border"><img src={selectedOrderDetails.disposalEntryPhoto} className="w-full h-full object-cover" /></div>
                   </div>
                   <button onClick={() => setSelectedOrderDetails(null)} className="w-full py-4 bg-slate-900 text-white font-black rounded-2xl">关闭详情</button>
                </div>
             </div>
          </div>
       )}
    </div>
  );
};
