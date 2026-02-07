
import React, { useState, useRef, useEffect } from 'react';
import { Order, OrderStatus, GeoLocation, WasteAnalysisResult, WasteType, PickupDetails, MediaType, OrderType, RecycledProduct, GovernmentNotice, LaborServiceType, CollectionMethod, RenovationApplication, DropOffPoint } from '../types';
import { analyzeWasteMedia } from '../services/geminiService';
// Added Box and ShieldCheck to lucide-react imports
import { Camera, MapPin, Loader2, AlertTriangle, Sparkles, CheckCircle, Search, MessageSquare, Navigation, X, DollarSign, Trash2, ChevronRight, Clock, FileSignature, Info, Truck, Calendar, Building, Map as MapIcon, Image as ImageIcon, MapPinned, Zap, Box, ShieldCheck } from 'lucide-react';

const BASE_RATES_PER_TRUCK: Record<string, number> = {
  [WasteType.CONSTRUCTION]: 1200, 
  [WasteType.HAZARDOUS]: 2500,
  [WasteType.ELECTRONIC]: 1500,
  [WasteType.GENERAL]: 800,
  [WasteType.ORGANIC]: 900,
  [WasteType.RECYCLABLE]: 600,
  [WasteType.BULKY]: 1000,
  [WasteType.GARDEN]: 800,
  [WasteType.UNKNOWN]: 1200,
};

const LABOR_RATES: Record<LaborServiceType, number> = {
  'NONE': 0,
  'LOADING_ONLY': 100,
  'CARRY_AND_LOAD': 300
};

const MOCK_POINTS: DropOffPoint[] = [
  { id: 'p1', name: '阳光花苑东门投放点', location: { lat: 31.22, lng: 121.61 }, allowedTypes: [WasteType.CONSTRUCTION, WasteType.BULKY], capacityStatus: 'NORMAL', managerName: '张工', managerPhone: '13811110000', openingHours: '08:00-20:00', requirements: '需袋装入池', lastMaintenance: Date.now() },
  { id: 'p2', name: '滨江一号临时消纳池', location: { lat: 31.23, lng: 121.62 }, allowedTypes: [WasteType.CONSTRUCTION], capacityStatus: 'EMPTY', managerName: '李师傅', managerPhone: '13811112222', openingHours: '24小时', requirements: '禁止混入生活垃圾', lastMaintenance: Date.now() },
];

interface ClientViewProps {
  addOrder: (order: Order) => void;
  updateOrder: (order: Order) => void;
  userOrders: Order[];
  marketRecommendations: RecycledProduct[];
  govNotices: GovernmentNotice[];
  renovationApps?: RenovationApplication[];
  onApplyRenovation?: (app: RenovationApplication) => void;
}

export const ClientView: React.FC<ClientViewProps> = ({ 
  addOrder, 
  updateOrder, 
  userOrders, 
  marketRecommendations, 
  govNotices, 
  renovationApps = [], 
  onApplyRenovation 
}) => {
  const [viewState, setViewState] = useState<'LIST' | 'CREATE_FORM' | 'REVIEW_ORDER' | 'RENOVATION_FORM' | 'EXPLORE'>('LIST');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [mediaData, setMediaData] = useState<string | null>(null);
  const [location, setLocation] = useState<GeoLocation | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [pickupDetails, setPickupDetails] = useState<PickupDetails>({
    city: '上海市', district: '', street: '', community: '', isCollected: true, locationType: 'GROUND_FLOOR'
  });
  const [activeReviewOrder, setActiveReviewOrder] = useState<Order | null>(null);
  
  // 报备表单状态
  const [renoForm, setRenoForm] = useState({
    community: '阳光花苑',
    room: '',
    company: '',
    days: 30
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const startCreate = () => {
    setMediaData(null);
    setLocation(null);
    setViewState('CREATE_FORM');
    // Try auto-locate
    tryAutoLocate();
  };

  const tryAutoLocate = () => {
    setIsLocating(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setLocation({ lat, lng, address: "上海市浦东新区张江路 88 号 (实时定位)" });
          setPickupDetails(prev => ({ ...prev, district: '浦东新区', street: '张江路 88 号', community: '张江科技园' }));
          setIsLocating(false);
        },
        () => {
          setIsLocating(false);
          // Fallback is user clicks button
        },
        { timeout: 5000 }
      );
    } else {
      setIsLocating(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setMediaData(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const mockLocation = () => {
    setIsLocating(true);
    setTimeout(() => {
      setLocation({ lat: 31.23, lng: 121.47, address: "上海市浦东新区张江路 88 号" });
      setPickupDetails(prev => ({ ...prev, district: '浦东新区', street: '张江路 88 号', community: '张江科技园' }));
      setIsLocating(false);
    }, 800);
  };

  const handleStartAnalysis = async () => {
    if (!mediaData || !location) return;
    setIsAnalyzing(true);
    try {
      const result = await analyzeWasteMedia(mediaData, 'IMAGE', 'image/jpeg');
      result.estimatedPrice = (BASE_RATES_PER_TRUCK[result.wasteType] || 1000) + (LABOR_RATES[result.laborServiceRecommendation] || 0);
      
      const newOrder: Order = {
        id: `ord-${Date.now()}`,
        userId: 'user-1',
        createdAt: Date.now(),
        status: OrderStatus.REVIEW_REQUIRED,
        orderType: OrderType.WASTE_REMOVAL,
        location,
        pickupDetails,
        mediaType: 'IMAGE',
        mediaData,
        analysis: result
      };
      addOrder(newOrder);
      setActiveReviewOrder(newOrder);
      setViewState('REVIEW_ORDER');
    } catch (e) {
      console.error(e);
      alert("AI 分析遇到了一些问题，已生成基础建议。");
      // Create a fallback order if Gemini fails
      const fallbackOrder: Order = {
        id: `ord-${Date.now()}`,
        userId: 'user-1',
        createdAt: Date.now(),
        status: OrderStatus.REVIEW_REQUIRED,
        orderType: OrderType.WASTE_REMOVAL,
        location,
        pickupDetails,
        mediaType: 'IMAGE',
        mediaData,
        analysis: {
          wasteType: WasteType.CONSTRUCTION,
          estimatedWeightKg: 100,
          estimatedVolume: "1.0m³",
          estimatedPrice: 1200,
          description: "检测到疑似建筑装修废弃物，建议使用中型货车。",
          recommendedVehicle: "中型自卸车",
          isBagged: false,
          isCollected: true,
          // Fixed: Use enum values instead of strings
          laborServiceRecommendation: LaborServiceType.LOADING_ONLY,
          recommendedCollectionMethod: CollectionMethod.IMMEDIATE
        }
      };
      addOrder(fallbackOrder);
      setActiveReviewOrder(fallbackOrder);
      setViewState('REVIEW_ORDER');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSubmitRenovation = () => {
    if (!renoForm.room || !onApplyRenovation) return;
    const newApp: RenovationApplication = {
      id: `reno-${Date.now()}`,
      userId: 'user-1',
      applicantName: '陈先生',
      applicantPhone: '13812349999',
      applicantRole: 'OWNER',
      projectType: 'RESIDENTIAL',
      communityName: renoForm.community,
      roomNumber: renoForm.room,
      renovationCompany: renoForm.company,
      startDate: Date.now(),
      estimatedDurationDays: renoForm.days,
      status: 'PENDING',
      createdAt: Date.now()
    };
    onApplyRenovation(newApp);
    alert("报备申请已提交，请等待物业审核。");
    setViewState('LIST');
  };

  // --- 1. 预约清运流程 (CREATE_FORM) ---
  if (viewState === 'CREATE_FORM') {
    return (
      <div className="bg-white min-h-screen flex flex-col animate-fade-in">
        <div className="p-4 border-b flex items-center justify-between sticky top-0 bg-white z-10">
          <button onClick={() => setViewState('LIST')} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X className="text-gray-400" /></button>
          <h2 className="font-black text-gray-800 tracking-tight">发布清运需求</h2>
          <div className="w-10"></div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* Step Progress */}
          <div className="flex justify-between items-center px-4">
            <div className={`flex flex-col items-center gap-1 ${mediaData ? 'text-emerald-600' : 'text-gray-300'}`}>
              <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold ${mediaData ? 'bg-emerald-50 border-emerald-500' : 'border-gray-200'}`}>
                {mediaData ? <CheckCircle size={16} /> : "1"}
              </div>
              <span className="text-[10px] font-bold">现场图</span>
            </div>
            <div className={`h-0.5 flex-1 mx-2 ${mediaData ? 'bg-emerald-500' : 'bg-gray-100'}`}></div>
            <div className={`flex flex-col items-center gap-1 ${location ? 'text-emerald-600' : 'text-gray-300'}`}>
              <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold ${location ? 'bg-emerald-50 border-emerald-500' : 'border-gray-200'}`}>
                {location ? <CheckCircle size={16} /> : "2"}
              </div>
              <span className="text-[10px] font-bold">定位置</span>
            </div>
            <div className={`h-0.5 flex-1 mx-2 ${location ? 'bg-emerald-500' : 'bg-gray-100'}`}></div>
            <div className={`flex flex-col items-center gap-1 text-gray-300`}>
              <div className="w-8 h-8 rounded-full border-2 border-gray-200 flex items-center justify-center font-bold">3</div>
              <span className="text-[10px] font-bold">AI识别</span>
            </div>
          </div>

          <section>
            <div className="flex justify-between items-center mb-3">
              <label className="text-sm font-black text-gray-700 flex items-center gap-2">
                <ImageIcon size={18} className="text-emerald-500" /> 第一步：拍摄堆放现场
              </label>
              {mediaData && (
                <button onClick={() => setMediaData(null)} className="text-[10px] text-red-500 font-bold">重新拍摄</button>
              )}
            </div>
            <div 
              onClick={() => fileInputRef.current?.click()} 
              className={`h-64 rounded-[2.5rem] border-4 border-dashed transition-all duration-300 flex flex-col items-center justify-center overflow-hidden relative group ${mediaData ? 'border-emerald-500 bg-emerald-50 shadow-inner' : 'border-gray-100 bg-gray-50 hover:bg-gray-100'}`}
            >
              {mediaData ? (
                <>
                  <img src={mediaData} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Camera className="text-white" size={32} />
                  </div>
                </>
              ) : (
                <div className="text-center animate-pulse-gentle">
                  <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Camera size={32} className="text-emerald-600" />
                  </div>
                  <span className="text-sm font-bold text-emerald-700 block">点击开启相机</span>
                  <p className="text-[10px] text-gray-400 mt-1 px-10">AI 将根据图片预估方量与费用</p>
                </div>
              )}
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            </div>
          </section>

          <section className="animate-slide-in-up">
            <div className="flex justify-between items-center mb-3">
              <label className="text-sm font-black text-gray-700 flex items-center gap-2">
                <MapPinned size={18} className="text-emerald-500" /> 第二步：确认上门地址
              </label>
              <button 
                onClick={mockLocation} 
                className="text-[10px] font-bold text-emerald-600 flex items-center gap-1"
                disabled={isLocating}
              >
                {isLocating ? <Loader2 size={12} className="animate-spin" /> : <MapPin size={12} />} 自动校准
              </button>
            </div>
            <div className={`p-5 rounded-3xl flex items-center justify-between border-2 transition-all duration-300 ${location ? 'bg-white border-emerald-500 shadow-lg' : 'bg-gray-50 border-gray-100'}`}>
              <div className="flex items-center gap-4 flex-1">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${location ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-400'}`}>
                  <MapPin size={20} />
                </div>
                <div className="flex-1">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">当前位置</p>
                  <span className={`text-sm font-black leading-tight block mt-1 ${location ? 'text-gray-800' : 'text-gray-400'}`}>
                    {isLocating ? "定位检索中..." : (location?.address || "请授权地理位置信息")}
                  </span>
                </div>
              </div>
            </div>
          </section>

          <div className="bg-blue-50 p-4 rounded-3xl border border-blue-100 flex gap-3">
            <Info size={18} className="text-blue-500 shrink-0" />
            <p className="text-[10px] text-blue-800 leading-relaxed font-medium italic">
              AI 会识别垃圾材质是否属于建筑废弃物、大件家具或有害物质，并据此推荐合法消纳场。
            </p>
          </div>
        </div>

        <div className="p-6 border-t bg-white sticky bottom-0">
          <button 
            disabled={!mediaData || !location || isAnalyzing}
            onClick={handleStartAnalysis}
            className={`w-full py-5 rounded-[2rem] font-black text-lg shadow-2xl flex items-center justify-center gap-3 transition-all transform active:scale-95 ${mediaData && location ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-200' : 'bg-gray-100 text-gray-300 shadow-none'}`}
          >
            {isAnalyzing ? (
              <><Loader2 className="animate-spin" /> AI 正在分析环境与材质...</>
            ) : (
              <><Zap size={22} className="fill-white" /> 生成清运方案</>
            )}
          </button>
        </div>
      </div>
    );
  }

  // --- 2. 方案审核流程 (REVIEW_ORDER) ---
  if (viewState === 'REVIEW_ORDER' && activeReviewOrder) {
    const a = activeReviewOrder.analysis!;
    return (
      <div className="bg-gray-50 min-h-screen flex flex-col animate-fade-in">
        <div className="p-4 bg-white border-b flex items-center justify-between sticky top-0 z-10">
          <button onClick={() => setViewState('CREATE_FORM')} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X size={20}/></button>
          <h2 className="font-black text-gray-800">清运方案建议</h2>
          <button onClick={() => setViewState('LIST')} className="p-2 text-xs font-bold text-gray-400">取消</button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-5 pb-10">
          <div className="bg-white p-6 rounded-[2.5rem] shadow-xl border border-emerald-100 animate-slide-in-up">
            <div className="flex gap-5 mb-6">
              <div className="w-24 h-24 rounded-3xl overflow-hidden border shadow-sm shrink-0">
                <img src={activeReviewOrder.mediaData} className="w-full h-full object-cover" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles size={14} className="text-emerald-500 fill-emerald-500" />
                  <span className="text-[10px] font-black text-emerald-600 uppercase tracking-tighter">AI 智能识别结果</span>
                </div>
                <h3 className="text-2xl font-black text-gray-900 leading-tight">{a.wasteType}</h3>
                <p className="text-xs text-gray-500 mt-2 font-medium leading-relaxed italic line-clamp-2">“{a.description}”</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 p-4 rounded-3xl border border-gray-100">
                <div className="text-[10px] text-gray-400 font-bold uppercase mb-1 flex items-center gap-1">
                  <Box className="w-3 h-3" /> 预估方量
                </div>
                <div className="text-lg font-black text-gray-800">{a.estimatedVolume}</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-3xl border border-gray-100">
                <div className="text-[10px] text-gray-400 font-bold uppercase mb-1 flex items-center gap-1">
                  <Truck className="w-3 h-3" /> 推荐车型
                </div>
                <div className="text-lg font-black text-gray-800 truncate">{a.recommendedVehicle}</div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-[2.5rem] border shadow-sm space-y-6 animate-slide-in-up delay-75">
            <div className="flex justify-between items-center">
              <span className="font-black text-gray-800 text-lg">预估费用方案</span>
              <div className="text-right">
                <div className="text-3xl font-black text-emerald-600">¥{a.estimatedPrice}</div>
                <div className="text-[10px] text-emerald-400 font-bold">全包一口价预估</div>
              </div>
            </div>
            
            <div className="space-y-3 pt-4 border-t border-dashed">
               <div className="flex justify-between text-sm">
                 <span className="text-gray-500 font-medium">基础收运费用 (一车次)</span>
                 <span className="font-bold text-gray-800">¥{BASE_RATES_PER_TRUCK[a.wasteType]}</span>
               </div>
               <div className="flex justify-between text-sm">
                 <span className="text-gray-500 font-medium">装载/搬运建议服务</span>
                 <span className="font-bold text-gray-800">{a.laborServiceRecommendation === 'NONE' ? '自装车' : `+ ¥${LABOR_RATES[a.laborServiceRecommendation]}`}</span>
               </div>
               <div className="flex justify-between text-sm font-black text-emerald-600">
                 <span className="flex items-center gap-1"><Zap size={14} className="fill-emerald-600"/> 绿色循环补贴</span>
                 <span>-¥50.00</span>
               </div>
            </div>
          </div>

          <div className="bg-emerald-50 p-5 rounded-3xl flex gap-3 border border-emerald-100 animate-slide-in-up delay-150">
            <ShieldCheck size={20} className="text-emerald-600 shrink-0" />
            <div>
              <p className="text-xs font-bold text-emerald-800 mb-1">合规承诺</p>
              <p className="text-[10px] text-emerald-700 leading-relaxed font-medium">
                本订单将为您核发“电子清运联单”，确保所有废弃物最终进入正规消纳场所进行资源化处理，拒绝非法倾倒。
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 bg-white border-t sticky bottom-0">
          <button 
            onClick={() => { updateOrder({...activeReviewOrder, status: OrderStatus.PENDING_PICKUP}); setViewState('LIST'); alert("预约成功！已为您调度附近最匹配的车辆。"); }}
            className="w-full py-5 bg-emerald-600 text-white font-black rounded-[2rem] shadow-2xl shadow-emerald-200 flex items-center justify-center gap-3 transition-all transform active:scale-95 text-lg"
          >
            <DollarSign size={22} className="fill-white" /> 接受方案并下单
          </button>
        </div>
      </div>
    );
  }

  // --- 3. 施工报备界面 (RENOVATION_FORM) ---
  if (viewState === 'RENOVATION_FORM') {
    return (
      <div className="bg-white min-h-screen flex flex-col animate-fade-in">
        <div className="p-4 border-b flex items-center justify-between sticky top-0 bg-white z-10">
          <button onClick={() => setViewState('LIST')} className="p-2 hover:bg-gray-100 rounded-full"><X className="text-gray-400" /></button>
          <h2 className="font-black text-gray-800">施工报备申请</h2>
          <div className="w-10"></div>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
           <div className="bg-indigo-50 p-6 rounded-[2rem] flex gap-4 border border-indigo-100">
             <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-indigo-200">
               <FileSignature size={24} />
             </div>
             <div>
               <h3 className="font-black text-indigo-900 text-sm mb-1">物业联管通道</h3>
               <p className="text-[10px] text-indigo-700 leading-relaxed font-medium">申报通过后，系统将为您核发电子施工许可，并自动指引清运车辆入场。无需线下跑物业。</p>
             </div>
           </div>
           
           <div className="space-y-5">
              <div>
                <label className="text-xs font-black text-gray-400 mb-2 block uppercase tracking-widest">选择小区/园区</label>
                <select className="w-full p-5 bg-gray-50 border-2 border-gray-100 rounded-[1.5rem] font-bold text-gray-800 focus:border-indigo-500 outline-none appearance-none" value={renoForm.community} onChange={e => setRenoForm({...renoForm, community: e.target.value})}>
                  <option>阳光花苑</option>
                  <option>滨江一号</option>
                  <option>张江科技园</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-black text-gray-400 mb-2 block uppercase tracking-widest">详细地址 (楼栋房号)</label>
                <input className="w-full p-5 bg-gray-50 border-2 border-gray-100 rounded-[1.5rem] font-bold text-gray-800 focus:border-indigo-500 outline-none" placeholder="例如: 6号楼 1201室" value={renoForm.room} onChange={e => setRenoForm({...renoForm, room: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-black text-gray-400 mb-2 block uppercase tracking-widest">预计工期 (天)</label>
                  <input type="number" className="w-full p-5 bg-gray-50 border-2 border-gray-100 rounded-[1.5rem] font-bold text-gray-800 focus:border-indigo-500 outline-none" value={renoForm.days} onChange={e => setRenoForm({...renoForm, days: parseInt(e.target.value)})} />
                </div>
                <div>
                   <label className="text-xs font-black text-gray-400 mb-2 block uppercase tracking-widest">负责人姓名</label>
                   <input className="w-full p-5 bg-gray-50 border-2 border-gray-100 rounded-[1.5rem] font-bold text-gray-800 focus:border-indigo-500 outline-none" placeholder="陈先生" />
                </div>
              </div>
              <div>
                <label className="text-xs font-black text-gray-400 mb-2 block uppercase tracking-widest">施工单位 (选填)</label>
                <input className="w-full p-5 bg-gray-50 border-2 border-gray-100 rounded-[1.5rem] font-bold text-gray-800 focus:border-indigo-500 outline-none" placeholder="例如: 业之峰装饰" value={renoForm.company} onChange={e => setRenoForm({...renoForm, company: e.target.value})} />
              </div>
           </div>
        </div>
        <div className="p-6 border-t sticky bottom-0 bg-white">
          <button onClick={handleSubmitRenovation} className="w-full py-5 bg-indigo-600 text-white font-black rounded-[2rem] shadow-2xl shadow-indigo-100 flex items-center justify-center gap-3 active:scale-95">
            <CheckCircle size={22} /> 提交报备申请
          </button>
        </div>
      </div>
    );
  }

  // --- 4. 投放点查看界面 (EXPLORE) ---
  if (viewState === 'EXPLORE') {
    return (
      <div className="bg-gray-50 min-h-screen flex flex-col animate-fade-in">
        <div className="p-4 bg-white border-b flex items-center justify-between sticky top-0 z-10">
          <button onClick={() => setViewState('LIST')} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X className="text-gray-400" /></button>
          <h2 className="font-black text-gray-800">附近临时投放点</h2>
          <div className="w-10"></div>
        </div>
        <div className="bg-blue-600 h-56 relative overflow-hidden flex items-center justify-center text-white/10 shrink-0">
            <div className="absolute inset-0 opacity-20">
              <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                <path d="M0 0 L100 0 L100 100 L0 100 Z" fill="none" stroke="currentColor" strokeWidth="0.5" strokeDasharray="5,5" />
                <circle cx="50" cy="50" r="30" fill="none" stroke="currentColor" strokeWidth="0.5" />
                <circle cx="50" cy="50" r="10" fill="currentColor" className="animate-pulse" />
              </svg>
            </div>
            <MapIcon size={120} className="animate-pulse text-white/20" />
            <div className="absolute inset-0 bg-gradient-to-t from-blue-900/60 to-transparent"></div>
            <div className="absolute bottom-6 left-6 text-white text-left">
              <p className="text-[10px] font-black opacity-70 uppercase tracking-[0.2em] mb-1">CURRENT RADAR</p>
              <h3 className="text-xl font-black flex items-center"><MapPin size={18} className="mr-2 text-yellow-400 fill-yellow-400" /> 浦东新区张江板块</h3>
              <p className="text-[10px] mt-1 font-medium text-blue-200">周围 3km 内共发现 5 个合规清运投放点</p>
            </div>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">正在为您实时排序</h3>
          {MOCK_POINTS.map(point => (
            <div key={point.id} className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 hover:shadow-xl transition-all active:scale-95 group">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1 pr-4">
                  <h4 className="font-black text-gray-800 text-lg leading-tight">{point.name}</h4>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Clock size={10} /> {point.openingHours}
                    </span>
                    <span className="text-[10px] font-bold text-gray-400">距离 800m</span>
                  </div>
                </div>
                <div className={`px-3 py-1.5 rounded-2xl text-[10px] font-black uppercase tracking-tight shadow-sm ${point.capacityStatus === 'EMPTY' ? 'bg-emerald-500 text-white' : 'bg-blue-600 text-white'}`}>
                  {point.capacityStatus === 'EMPTY' ? '空闲' : '正常'}
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mb-6">
                {point.allowedTypes.map(t => (
                  <span key={t} className="text-[10px] bg-gray-50 text-gray-500 px-3 py-1 rounded-xl font-black border border-gray-100">{t}</span>
                ))}
              </div>
              <button onClick={() => alert("正在开启高德地图/百度地图导航...")} className="w-full py-4 bg-gray-50 text-gray-800 font-black rounded-2xl flex items-center justify-center gap-2 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                <Navigation size={18} className="group-hover:fill-white" /> 立即导航前往
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // --- 5. 主视图 (Dashboard / LIST) ---
  return (
    <div className="pb-24 bg-gray-50 min-h-screen">
      <div className="bg-white p-6 rounded-b-[3rem] shadow-xl mb-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
        <div className="flex justify-between items-center mb-8 relative z-10">
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight leading-none">智慧清运</h1>
            <p className="text-emerald-600 font-bold text-xs mt-2 flex items-center gap-1">
              <Sparkles size={12} className="fill-emerald-600" /> AI 赋能 · 合规消纳
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white font-black shadow-lg shadow-emerald-200">
            U
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 relative z-10">
          <button onClick={startCreate} className="bg-emerald-600 text-white p-5 rounded-[2.5rem] shadow-xl shadow-emerald-200 flex flex-col items-center justify-center h-28 active:scale-90 transition-all group">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-2 group-hover:rotate-12 transition-transform">
              <Trash2 size={24} className="fill-white" />
            </div>
            <span className="text-[11px] font-black uppercase tracking-tighter">预约清运</span>
          </button>
          <button onClick={() => setViewState('EXPLORE')} className="bg-blue-600 text-white p-5 rounded-[2.5rem] shadow-xl shadow-blue-200 flex flex-col items-center justify-center h-28 active:scale-90 transition-all group">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-2 group-hover:rotate-12 transition-transform">
              <MapPin size={24} className="fill-white" />
            </div>
            <span className="text-[11px] font-black uppercase tracking-tighter">投放点</span>
          </button>
          <button onClick={() => setViewState('RENOVATION_FORM')} className="bg-indigo-600 text-white p-5 rounded-[2.5rem] shadow-xl shadow-indigo-200 flex flex-col items-center justify-center h-28 active:scale-90 transition-all group">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-2 group-hover:rotate-12 transition-transform">
              <FileSignature size={24} className="fill-white" />
            </div>
            <span className="text-[11px] font-black uppercase tracking-tighter">施工报备</span>
          </button>
        </div>
      </div>

      <div className="px-6 space-y-6">
        {/* 政府通告展示 */}
        {govNotices && govNotices.length > 0 && (
          <div className="bg-orange-50 p-4 rounded-3xl border border-orange-100 flex items-start gap-4 animate-slide-in-up">
            <div className="bg-orange-500 text-white p-2.5 rounded-2xl shadow-lg shadow-orange-200"><MessageSquare size={18} /></div>
            <div className="flex-1">
              <p className="text-xs font-black text-orange-900 uppercase tracking-widest">{govNotices[0].title}</p>
              <p className="text-[11px] text-orange-700 mt-1 font-medium line-clamp-1">{govNotices[0].content}</p>
            </div>
            <ChevronRight size={16} className="text-orange-300 mt-1" />
          </div>
        )}

        <div>
          <h3 className="font-black text-gray-800 flex items-center gap-2 text-sm mb-4 px-1">
            <Clock size={16} className="text-emerald-500" /> 订单动态
          </h3>
          <div className="space-y-4">
            {userOrders.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-[2.5rem] border-2 border-dashed border-gray-100 text-gray-400 text-xs flex flex-col items-center gap-4">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center">
                  <Trash2 size={24} className="opacity-10" />
                </div>
                <p className="font-bold tracking-tight">暂无活跃订单，点击上方按钮发起清运</p>
              </div>
            ) : (
              userOrders.map(order => (
                <div key={order.id} className="bg-white p-5 rounded-[2rem] shadow-sm border border-gray-50 flex gap-5 animate-slide-in-up group active:scale-[0.98] transition-all">
                  <div className="w-20 h-20 rounded-[1.5rem] bg-gray-50 overflow-hidden relative border shadow-inner shrink-0">
                    <img src={order.mediaData} className="w-full h-full object-cover" />
                    {order.status === OrderStatus.REVIEW_REQUIRED && (
                      <div className="absolute inset-0 bg-red-600/40 flex items-center justify-center">
                        <AlertTriangle size={24} className="text-white animate-pulse" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-black text-gray-800 truncate pr-2 text-base">{order.analysis?.wasteType || 'AI 方案计算中...'}</span>
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-lg whitespace-nowrap ${order.status === OrderStatus.REVIEW_REQUIRED ? 'bg-red-500 text-white' : 'bg-blue-100 text-blue-600'}`}>
                        {order.status === OrderStatus.REVIEW_REQUIRED ? '待审核' : order.status}
                      </span>
                    </div>
                    <div className="text-[10px] text-gray-400 font-bold flex items-center gap-2 mt-1">
                      <Calendar size={10} /> {new Date(order.createdAt).toLocaleDateString()}
                      <span className="w-1 h-1 bg-gray-200 rounded-full"></span>
                      <MapPin size={10} /> {order.pickupDetails?.street || '作业点'}
                    </div>
                    {order.status === OrderStatus.REVIEW_REQUIRED && (
                      <button 
                        onClick={() => { setActiveReviewOrder(order); setViewState('REVIEW_ORDER'); }} 
                        className="w-full text-[10px] bg-red-500 text-white py-2.5 rounded-2xl mt-3 font-black shadow-lg shadow-red-100 flex items-center justify-center gap-2 active:scale-95 transition-transform"
                      >
                        <Zap size={12} className="fill-white" /> 确认方案并下单
                      </button>
                    )}
                    {order.status === OrderStatus.PENDING_PICKUP && (
                      <div className="mt-3 text-[10px] text-emerald-600 font-black flex items-center gap-2 bg-emerald-50 py-2 px-3 rounded-2xl w-fit">
                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></div>
                        车辆调度中...
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 报备应用展示 */}
        {renovationApps.length > 0 && (
          <div className="pt-4 pb-10">
            <h3 className="font-black text-gray-800 flex items-center gap-2 text-sm mb-4 px-1">
              <FileSignature size={16} className="text-indigo-500" /> 报备进度
            </h3>
            <div className="space-y-4">
              {renovationApps.map(app => (
                 <div key={app.id} className="bg-white p-5 rounded-[2rem] border border-indigo-50 shadow-sm flex justify-between items-center group active:scale-[0.98] transition-all">
                    <div className="flex gap-4 items-center">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${app.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-600' : 'bg-indigo-50 text-indigo-600'}`}>
                        <Building size={24} />
                      </div>
                      <div>
                        <div className="text-sm font-black text-gray-800">{app.roomNumber}</div>
                        <div className="text-[10px] text-gray-400 font-bold mt-1 uppercase tracking-tighter">
                          {app.renovationCompany || '自营装修'} · {app.estimatedDurationDays} Days
                        </div>
                      </div>
                    </div>
                    <div className={`text-[10px] font-black px-3 py-1.5 rounded-2xl border-2 ${app.status === 'APPROVED' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-orange-50 border-orange-100 text-orange-700'}`}>
                      {app.status === 'APPROVED' ? '准予施工' : '审核中'}
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
