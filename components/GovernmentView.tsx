
import React, { useState, useMemo } from 'react';
import { GovernmentProfile, Order, GovernmentTask, GovernmentNotice, DropOffPoint, ComplaintEvent, PolicyGuide, WasteType, UserRole, DisposalProfile, FacilityType, FacilityOperationalStatus, OrderStatus } from '../types';
// Added Search to lucide-react imports
import { 
  Landmark, Map as MapIcon, Activity, Siren, Users, Send, X, Clock, AlertTriangle, 
  Megaphone, Bell, Plus, BarChart3, FileText, Globe, Store, User, MapPin, 
  Camera, Trash2, CheckCircle, ShieldCheck, Info, ChevronRight, PieChart, 
  TrendingUp, BookOpen, MessageSquare, Building2, Factory, Truck, Calendar, 
  Briefcase, Hammer, HelpCircle, Phone, Share2, Box, Eye, Navigation, ShieldAlert,
  ArrowUpRight, Target, Activity as ActivityIcon, Loader2, Search
} from 'lucide-react';

interface GovernmentViewProps {
  profile: GovernmentProfile;
  orders: Order[];
  notices: GovernmentNotice[];
  tasks: GovernmentTask[];
  onPublishNotice: (notice: GovernmentNotice) => void;
  onDispatchTask: (task: GovernmentTask) => void;
  allFacilities?: DisposalProfile[];
}

const MOCK_FACILITIES: DisposalProfile[] = [
    { 
        id: 'f1', 
        name: '浦东第一再生资源场', 
        address: '浦东新区川沙路88号', 
        location: { lat: 31.2, lng: 121.65 }, 
        contactPhone: '13800001111', 
        licenseImageUrl: '', 
        status: 'VERIFIED', 
        joinedAt: Date.now(), 
        operationalStatus: FacilityOperationalStatus.OPEN, 
        facilityType: FacilityType.FIXED_DISPOSAL, 
        specialty: '装修垃圾/砖渣',
        allowedWasteTypes: [WasteType.CONSTRUCTION, WasteType.BULKY],
        feeConfigs: [{ wasteType: WasteType.CONSTRUCTION, pricePerUnit: 450, unit: 'TRUCK' }],
        preferredSettlement: 'PLATFORM'
    },
    { 
        id: 'f2', 
        name: '张江临时中转站', 
        address: '张江路科苑路口', 
        location: { lat: 31.21, lng: 121.6 }, 
        contactPhone: '13800002222', 
        licenseImageUrl: '', 
        status: 'VERIFIED', 
        joinedAt: Date.now(), 
        operationalStatus: FacilityOperationalStatus.BUSY, 
        facilityType: FacilityType.TEMP_TRANSFER, 
        specialty: '大件垃圾/木材',
        allowedWasteTypes: [WasteType.BULKY, WasteType.GARDEN],
        feeConfigs: [{ wasteType: WasteType.BULKY, pricePerUnit: 600, unit: 'TRUCK' }],
        preferredSettlement: 'DIRECT'
    },
];

const MOCK_COMPLAINTS: ComplaintEvent[] = [
    { id: 'c1', userId: 'u123', type: 'ILLEGAL_DUMPING', location: { lat: 31.22, lng: 121.62, address: '科苑路188号路口' }, description: '发现大量装修垃圾堆放在人行道，无人清理。', mediaData: 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&w=400', status: 'PENDING', createdAt: Date.now() - 3600000 }
];

export const GovernmentView: React.FC<GovernmentViewProps> = ({ profile, orders, notices, tasks, onPublishNotice, onDispatchTask, allFacilities = MOCK_FACILITIES }) => {
  const [activeTab, setActiveTab] = useState<'MAP' | 'SUPERVISION' | 'COMPLAINTS' | 'MESSAGES' | 'STATS'>('SUPERVISION');
  const [facilities] = useState<DisposalProfile[]>(allFacilities);
  const [complaints, setComplaints] = useState<ComplaintEvent[]>(MOCK_COMPLAINTS);
  
  // Modals state
  const [showNoticeModal, setShowNoticeModal] = useState(false);
  const [showTrackModal, setShowTrackModal] = useState<DisposalProfile | null>(null);
  const [showInstructionModal, setShowInstructionModal] = useState<DisposalProfile | null>(null);
  
  const [newNotice, setNewNotice] = useState<{title: string, content: string, type: 'NOTICE' | 'ALERT' | 'MEETING' | 'ACTIVITY', targets: UserRole[]}>({
      title: '',
      content: '',
      type: 'NOTICE',
      targets: [UserRole.DISPOSAL, UserRole.PROPERTY]
  });

  const [instructionText, setInstructionText] = useState('');

  const stats = useMemo(() => {
      const completed = orders.filter(o => o.status === OrderStatus.COMPLETED);
      const totalVolume = completed.length * 5; // Simplified: 5m3 per truck
      const recyclingRate = 78.5; // Mocked
      return { totalVolume, recyclingRate, completedCount: completed.length };
  }, [orders]);

  const handleResolveComplaint = (id: string) => {
      setComplaints(prev => prev.map(c => c.id === id ? { ...c, status: 'RESOLVED' as const } : c));
      alert("整改通知已下发，事件已进入闭环流程。");
  };

  const handleToggleTarget = (role: UserRole) => {
      setNewNotice(prev => ({
          ...prev,
          targets: prev.targets.includes(role) 
            ? prev.targets.filter(r => r !== role)
            : [...prev.targets, role]
      }));
  };

  const handlePublishNotice = () => {
      if (!newNotice.title || !newNotice.content) return;
      onPublishNotice({
          id: Date.now().toString(),
          title: newNotice.title,
          content: newNotice.content,
          type: newNotice.type,
          time: Date.now(),
          targetRoles: newNotice.targets
      });
      alert(`公告已成功发布！`);
      setShowNoticeModal(false);
      setNewNotice({ title: '', content: '', type: 'NOTICE', targets: [UserRole.DISPOSAL, UserRole.PROPERTY] });
  };

  const handleSendInstruction = () => {
      if (!instructionText || !showInstructionModal) return;
      alert(`已向 ${showInstructionModal.name} 发送专项监管指令：\n"${instructionText}"`);
      setShowInstructionModal(null);
      setInstructionText('');
  };

  const getFacilityIcon = (type: FacilityType) => {
      switch(type) {
          case FacilityType.FIXED_DISPOSAL: return <Factory className="text-orange-600" />;
          case FacilityType.TEMP_TRANSFER: return <Box className="text-blue-600" />;
          case FacilityType.MOBILE_DISPOSAL: return <Truck className="text-purple-600" />;
          default: return <Trash2 className="text-emerald-600" />;
      }
  };

  return (
    <div className="pb-24 bg-slate-50 min-h-screen font-sans">
      {/* 顶部核心看板 */}
      <div className="bg-red-900 text-white pt-12 pb-14 px-6 rounded-b-[3.5rem] shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full blur-[100px] -mr-32 -mt-32"></div>
        <div className="relative z-10">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-black flex items-center gap-2">
                        <Landmark className="text-red-400" /> 城市管理大数据中心
                    </h1>
                    <p className="text-red-200/60 text-[10px] font-bold tracking-widest uppercase mt-1">Smart City Governance Console</p>
                </div>
                <button onClick={() => setShowNoticeModal(true)} className="bg-white text-red-900 p-3 rounded-2xl shadow-xl active:scale-95 transition-all">
                    <Send size={20} />
                </button>
            </div>

            <div className="grid grid-cols-4 gap-3">
                <div className="bg-black/20 backdrop-blur-md p-4 rounded-3xl border border-white/10 text-center">
                    <div className="text-[8px] text-red-200 font-black uppercase mb-1">监管点位</div>
                    <div className="text-xl font-black">{facilities.length + 5}</div>
                </div>
                <div className="bg-black/20 backdrop-blur-md p-4 rounded-3xl border border-white/10 text-center">
                    <div className="text-[8px] text-red-200 font-black uppercase mb-1">活跃车辆</div>
                    <div className="text-xl font-black">12</div>
                </div>
                <div className="bg-black/20 backdrop-blur-md p-4 rounded-3xl border border-white/10 text-center">
                    <div className="text-[8px] text-red-200 font-black uppercase mb-1">异常告警</div>
                    <div className="text-xl font-black text-yellow-400">2</div>
                </div>
                <div className="bg-black/20 backdrop-blur-md p-4 rounded-3xl border border-white/10 text-center">
                    <div className="text-[8px] text-red-200 font-black uppercase mb-1">待办投诉</div>
                    <div className="text-xl font-black">{complaints.filter(c=>c.status==='PENDING').length}</div>
                </div>
            </div>
        </div>
      </div>

      {/* 导航页签 */}
      <div className="px-4 -mt-8 relative z-20 overflow-x-auto no-scrollbar">
         <div className="bg-white p-1.5 rounded-3xl shadow-xl border border-slate-100 flex min-w-max">
            {(['SUPERVISION', 'MAP', 'COMPLAINTS', 'MESSAGES', 'STATS'] as const).map(tab => (
               <button key={tab} onClick={() => setActiveTab(tab)} className={`px-6 py-4 text-xs font-black rounded-2xl transition-all ${activeTab === tab ? 'bg-red-900 text-white shadow-lg' : 'text-slate-400'}`}>
                   {tab === 'SUPERVISION' ? '资源监管' : tab === 'MAP' ? 'GIS地图' : tab === 'COMPLAINTS' ? '执法处置' : tab === 'MESSAGES' ? '通知中心' : '统计效能'}
               </button>
            ))}
         </div>
      </div>

      <div className="p-4 pt-6">
          {/* 1. 资源监管 Tab */}
          {activeTab === 'SUPERVISION' && (
              <div className="space-y-4 animate-fade-in">
                  <div className="flex bg-white p-3 rounded-2xl border border-slate-100 items-center gap-3 mb-2 shadow-sm">
                      <Search size={18} className="text-slate-400" />
                      <input className="bg-transparent flex-1 text-sm font-bold outline-none" placeholder="搜索区域、设施或责任人..." />
                  </div>
                  {facilities.map(fac => (
                      <div key={fac.id} className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
                          <div className="p-6">
                              <div className="flex justify-between items-start mb-6">
                                  <div className="flex gap-4">
                                      <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100 shadow-inner">
                                          {getFacilityIcon(fac.facilityType)}
                                      </div>
                                      <div>
                                          <h3 className="font-black text-slate-900 text-base">{fac.name}</h3>
                                          <div className="text-[10px] text-slate-400 font-bold mt-1 flex items-center">
                                              <MapPin size={10} className="mr-1 text-red-500" /> {fac.address}
                                          </div>
                                      </div>
                                  </div>
                                  <span className={`text-[10px] font-black px-3 py-1 rounded-full border ${
                                      fac.operationalStatus === FacilityOperationalStatus.FULL ? 'bg-red-50 text-red-600 border-red-100 animate-pulse' :
                                      fac.operationalStatus === FacilityOperationalStatus.BUSY ? 'bg-orange-50 text-orange-600 border-orange-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                  }`}>
                                      {fac.operationalStatus === FacilityOperationalStatus.FULL ? '高能耗/爆仓' : fac.operationalStatus === FacilityOperationalStatus.BUSY ? '作业繁忙' : '正常运行'}
                                  </span>
                              </div>
                              <div className="grid grid-cols-2 gap-4 mb-6">
                                  <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100">
                                      <div className="text-[9px] text-slate-400 font-black uppercase mb-1">今日吞吐</div>
                                      <div className="text-lg font-black text-slate-800">42 <span className="text-[10px] text-slate-400">车次</span></div>
                                  </div>
                                  <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100">
                                      <div className="text-[9px] text-slate-400 font-black uppercase mb-1">资源化率</div>
                                      <div className="text-lg font-black text-emerald-600">88.5%</div>
                                  </div>
                              </div>
                              <div className="flex gap-2">
                                  <button onClick={() => setShowTrackModal(fac)} className="flex-1 py-4 bg-slate-900 text-white rounded-2xl text-xs font-black flex items-center justify-center gap-2 shadow-xl active:scale-95 transition-all">
                                      <Activity size={14}/> 实时监控/轨迹
                                  </button>
                                  <button onClick={() => setShowInstructionModal(fac)} className="flex-1 py-4 bg-red-50 text-red-700 rounded-2xl text-xs font-black flex items-center justify-center gap-2 border border-red-100 active:scale-95 transition-all">
                                      <Megaphone size={14}/> 下达专项指令
                                  </button>
                              </div>
                          </div>
                      </div>
                  ))}
              </div>
          )}

          {/* 2. GIS 地图 Tab */}
          {activeTab === 'MAP' && (
              <div className="bg-white rounded-[3rem] shadow-xl border border-slate-100 overflow-hidden h-[65vh] relative animate-fade-in">
                  <div className="absolute inset-0 bg-slate-100">
                      {/* Simulated Map with animated elements */}
                      <div className="absolute inset-0 bg-[url('https://api.mapbox.com/styles/v1/mapbox/light-v10/static/121.48,31.22,12,0/400x600?access_token=mock')] bg-cover opacity-50 grayscale"></div>
                      <div className="absolute top-1/3 left-1/3 w-4 h-4 bg-orange-500 rounded-full animate-ping opacity-75 shadow-lg shadow-orange-500/50"></div>
                      <div className="absolute top-1/2 left-1/2 w-4 h-4 bg-blue-500 rounded-full animate-ping opacity-75 shadow-lg shadow-blue-500/50"></div>
                      <div className="absolute bottom-1/4 right-1/4 w-3 h-3 bg-red-500 rounded-full animate-pulse shadow-lg shadow-red-500/50"></div>
                  </div>
                  <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-[90%] bg-slate-900/90 backdrop-blur-md p-6 rounded-[2.5rem] text-white border border-white/10 shadow-2xl">
                      <div className="flex justify-between items-center mb-4">
                          <h4 className="font-black text-sm flex items-center gap-2"><Globe className="text-cyan-400" size={16}/> 浦东新区实时点位视图</h4>
                          <span className="text-[8px] bg-red-600 px-2 py-1 rounded-full font-black animate-pulse">LIVE</span>
                      </div>
                      <div className="flex gap-4 overflow-x-auto no-scrollbar py-2">
                          <div className="shrink-0 flex items-center gap-2 bg-white/5 p-2 rounded-xl border border-white/10"><div className="w-2 h-2 rounded-full bg-orange-500"></div><span className="text-[10px] font-bold">消纳场</span></div>
                          <div className="shrink-0 flex items-center gap-2 bg-white/5 p-2 rounded-xl border border-white/10"><div className="w-2 h-2 rounded-full bg-blue-500"></div><span className="text-[10px] font-bold">中转站</span></div>
                          <div className="shrink-0 flex items-center gap-2 bg-white/5 p-2 rounded-xl border border-white/10"><div className="w-2 h-2 rounded-full bg-purple-500"></div><span className="text-[10px] font-bold">移动处理车</span></div>
                      </div>
                      <button onClick={()=>alert("正在调用全域 GIS 底座接口...")} className="w-full mt-4 py-4 bg-white text-slate-900 font-black rounded-2xl text-xs flex items-center justify-center gap-2">
                          <Navigation size={14} /> 进入全屏指挥大屏
                      </button>
                  </div>
              </div>
          )}
          
          {/* 3. 统计效能 Tab */}
          {activeTab === 'STATS' && (
              <div className="space-y-6 animate-fade-in pb-20">
                  <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
                          <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center text-red-600 mb-4"><PieChart size={20}/></div>
                          <div className="text-[10px] text-slate-400 font-black uppercase mb-1">年度减量化目标</div>
                          <div className="text-2xl font-black text-slate-800">74%</div>
                          <div className="h-1.5 w-full bg-slate-100 rounded-full mt-3 overflow-hidden">
                              <div className="h-full bg-red-600 w-[74%]"></div>
                          </div>
                      </div>
                      <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
                          <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 mb-4"><TrendingUp size={20}/></div>
                          <div className="text-[10px] text-slate-400 font-black uppercase mb-1">再生资源产值</div>
                          <div className="text-2xl font-black text-slate-800">¥4.2M</div>
                          <p className="text-[9px] text-emerald-600 font-bold mt-2 flex items-center gap-1"><ArrowUpRight size={10}/> 环比上涨 12.4%</p>
                      </div>
                  </div>

                  <div className="bg-slate-900 p-8 rounded-[3rem] text-white shadow-2xl relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-40 h-40 bg-red-500/10 rounded-full blur-3xl"></div>
                      <h3 className="font-black text-lg mb-6">全区清运流量分析 (实时)</h3>
                      <div className="flex items-end justify-between h-40 gap-2 mb-6">
                          {[30, 45, 25, 60, 80, 50, 95].map((h, i) => (
                              <div key={i} className="flex-1 group relative">
                                  <div style={{ height: `${h}%` }} className={`w-full rounded-t-xl transition-all duration-1000 ${i === 6 ? 'bg-red-500' : 'bg-white/20 group-hover:bg-white/40'}`}></div>
                                  <div className="text-[8px] text-white/40 text-center mt-2 font-mono">D{i+1}</div>
                              </div>
                          ))}
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                          <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                              <div className="text-[9px] text-white/40 font-bold mb-1">累计减碳量</div>
                              <div className="text-lg font-black text-cyan-400">1,204.5 tCO2</div>
                          </div>
                          <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                              <div className="text-[9px] text-white/40 font-bold mb-1">合规运输率</div>
                              <div className="text-lg font-black text-emerald-400">99.8%</div>
                          </div>
                      </div>
                  </div>
              </div>
          )}

          {/* 4. 执法处置 Tab */}
          {activeTab === 'COMPLAINTS' && (
              <div className="space-y-4 animate-fade-in pb-20">
                  <div className="bg-red-50 p-5 rounded-[2rem] border border-red-100 flex items-start gap-4">
                      <ShieldAlert size={24} className="text-red-600 shrink-0" />
                      <div>
                          <h4 className="text-sm font-black text-red-900">公众监督响应中心</h4>
                          <p className="text-[10px] text-red-700 font-medium mt-1 leading-relaxed">系统已通过 AI 自动筛查社交媒体及 12345 举报线索，请及时下达现场执法指令。</p>
                      </div>
                  </div>
                  {complaints.map(c => (
                      <div key={c.id} className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
                          <div className="p-6">
                              <div className="flex gap-4 mb-4">
                                  <div className="w-24 h-24 rounded-3xl bg-slate-100 overflow-hidden shrink-0 border border-slate-100">
                                      <img src={c.mediaData} className="w-full h-full object-cover" />
                                  </div>
                                  <div className="flex-1">
                                      <div className="flex justify-between items-center">
                                          <span className={`text-[10px] font-black px-2 py-1 rounded-lg ${c.status === 'PENDING' ? 'bg-orange-100 text-orange-600' : 'bg-emerald-100 text-emerald-600'}`}>
                                              {c.status === 'PENDING' ? '待处理' : '已归档'}
                                          </span>
                                          <span className="text-[10px] text-slate-300 font-mono">{new Date(c.createdAt).toLocaleTimeString()}</span>
                                      </div>
                                      <p className="text-sm font-black text-slate-800 mt-2 line-clamp-2">{c.description}</p>
                                      <div className="flex items-center text-[10px] text-slate-400 font-bold mt-3">
                                          <MapPin size={10} className="mr-1 text-red-500" /> {c.location.address}
                                      </div>
                                  </div>
                              </div>
                              {c.status === 'PENDING' ? (
                                <div className="flex gap-2">
                                    <button onClick={() => handleResolveComplaint(c.id)} className="flex-1 py-4 bg-red-600 text-white font-black rounded-2xl text-xs shadow-lg active:scale-95 transition-all">核实并下发整改单</button>
                                    <button onClick={()=>alert("正在联系该位置网格管理员进行核查...")} className="px-4 py-4 bg-slate-50 text-slate-400 font-black rounded-2xl text-xs border border-slate-100">现场核查</button>
                                </div>
                              ) : (
                                <div className="p-3 bg-emerald-50 rounded-2xl flex items-center justify-center gap-2 text-emerald-700 font-black text-[10px]">
                                    <CheckCircle size={14}/> 执法闭环 · 已整改
                                </div>
                              )}
                          </div>
                      </div>
                  ))}
              </div>
          )}

          {/* 5. 通知中心 Tab */}
          {activeTab === 'MESSAGES' && (
              <div className="space-y-4 animate-fade-in pb-20">
                  <div className="flex justify-between items-center px-1">
                      <h3 className="font-black text-slate-800 flex items-center gap-2"><Megaphone size={18} className="text-red-600"/> 历史公告看板</h3>
                      <button onClick={()=>setShowNoticeModal(true)} className="text-[10px] font-black text-red-600 border border-red-100 px-3 py-1.5 rounded-xl bg-red-50">新发通知</button>
                  </div>
                  {notices.map(notice => (
                      <div key={notice.id} className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 hover:shadow-md transition-all group">
                          <div className="flex justify-between items-start mb-3">
                              <span className={`text-[10px] font-black px-2 py-1 rounded-lg ${
                                  notice.type === 'ALERT' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                              }`}>
                                  {notice.type === 'ALERT' ? '紧急告警' : '业务通知'}
                              </span>
                              <span className="text-[10px] text-slate-300 font-mono">{new Date(notice.time).toLocaleDateString()}</span>
                          </div>
                          <h4 className="font-black text-slate-800 text-base mb-2">{notice.title}</h4>
                          <p className="text-xs text-slate-500 font-medium leading-relaxed line-clamp-2 mb-4">{notice.content}</p>
                          <div className="flex justify-between items-center pt-4 border-t border-slate-50">
                              <div className="flex -space-x-2">
                                  {notice.targetRoles?.slice(0, 3).map(r => (
                                      <div key={r} className="w-6 h-6 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[8px] font-black text-slate-400" title={r}>{r[0]}</div>
                                  ))}
                              </div>
                              <button className="text-[10px] font-black text-blue-600 flex items-center gap-1 group-hover:underline">阅读详情 <ChevronRight size={10}/></button>
                          </div>
                      </div>
                  ))}
              </div>
          )}
      </div>

      {/* 通知发布 Modal */}
      {showNoticeModal && (
          <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-md z-[100] flex items-center justify-center p-4">
              <div className="bg-white w-full max-w-sm rounded-[3rem] overflow-hidden shadow-2xl animate-fade-in-up">
                  <div className="bg-red-800 p-8 text-white flex justify-between items-center">
                      <div>
                          <h3 className="font-black text-lg flex items-center gap-2"><Megaphone size={20}/> 发布管辖指令</h3>
                          <p className="text-[10px] text-red-200 font-bold mt-1 uppercase tracking-tighter">Emergency Notification System</p>
                      </div>
                      <button onClick={() => setShowNoticeModal(false)} className="bg-white/10 p-2 rounded-full"><X size={20}/></button>
                  </div>
                  <div className="p-8 space-y-6">
                      <input 
                          className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black focus:border-red-500 outline-none text-sm" 
                          placeholder="通知标题" 
                          value={newNotice.title}
                          onChange={e => setNewNotice({...newNotice, title: e.target.value})}
                      />
                      <textarea 
                          className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold h-32 focus:border-red-500 outline-none text-sm" 
                          placeholder="详细指令内容..."
                          value={newNotice.content}
                          onChange={e => setNewNotice({...newNotice, content: e.target.value})}
                      ></textarea>

                      <div className="space-y-3">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">发布对象</label>
                          <div className="grid grid-cols-3 gap-2">
                              {[UserRole.DISPOSAL, UserRole.FLEET, UserRole.DRIVER].map(role => (
                                  <button 
                                      key={role}
                                      onClick={() => handleToggleTarget(role)}
                                      className={`py-3 rounded-xl text-[9px] font-black border-2 transition-all ${newNotice.targets.includes(role) ? 'bg-red-900 text-white border-red-900 shadow-md' : 'bg-white border-slate-100 text-slate-400'}`}
                                  >
                                      {role === UserRole.DISPOSAL ? '消纳点' : role === UserRole.FLEET ? '车队' : '运输司机'}
                                  </button>
                              ))}
                          </div>
                      </div>

                      <button onClick={handlePublishNotice} className="w-full py-5 bg-red-600 text-white font-black rounded-2xl shadow-xl shadow-red-200 active:scale-95 transition-all">
                          立即全区广播指令
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* 实时监控 Modal */}
      {showTrackModal && (
          <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-[100] flex items-center justify-center p-4">
              <div className="bg-white w-full max-w-sm rounded-[3rem] overflow-hidden shadow-2xl animate-fade-in-up">
                  <div className="bg-slate-900 p-8 text-white flex justify-between items-center">
                      <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-red-500 rounded-2xl flex items-center justify-center animate-pulse"><ActivityIcon size={24}/></div>
                          <div><h3 className="font-black text-sm">{showTrackModal.name}</h3><p className="text-[10px] text-slate-400 font-bold mt-0.5 tracking-widest">LIVE TRACKING</p></div>
                      </div>
                      <button onClick={() => setShowTrackModal(null)}><X size={24}/></button>
                  </div>
                  <div className="h-64 bg-slate-100 relative">
                      <div className="absolute inset-0 bg-[url('https://api.mapbox.com/styles/v1/mapbox/dark-v10/static/121.65,31.2,14/400x300?access_token=mock')] bg-cover"></div>
                      <div className="absolute inset-0 flex items-center justify-center">
                         <div className="w-32 h-32 border-4 border-red-500/30 rounded-full animate-ping"></div>
                         <div className="absolute p-2 bg-red-600 text-white rounded-lg shadow-xl font-black text-[10px] animate-bounce">
                             正在交叉对比影像数据...
                         </div>
                      </div>
                  </div>
                  <div className="p-8 space-y-4">
                      <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-100">
                          <div className="text-[10px] text-slate-400 font-black">周边载重车辆</div>
                          <div className="text-sm font-black text-slate-800">12 辆</div>
                      </div>
                      <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-100">
                          <div className="text-[10px] text-slate-400 font-black">异常停留点</div>
                          <div className="text-sm font-black text-red-600">0 处</div>
                      </div>
                      <button onClick={()=>setShowTrackModal(null)} className="w-full py-4 bg-slate-900 text-white font-black rounded-2xl">关闭实时监控</button>
                  </div>
              </div>
          </div>
      )}

      {/* 指令下达 Modal */}
      {showInstructionModal && (
          <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-[100] flex items-center justify-center p-4">
              <div className="bg-white w-full max-w-sm rounded-[3rem] overflow-hidden shadow-2xl animate-fade-in-up">
                  <div className="bg-red-800 p-8 text-white flex justify-between items-center">
                      <h3 className="font-black text-lg flex items-center gap-2"><Target size={20}/> 专项监管指令</h3>
                      <button onClick={() => setShowInstructionModal(null)}><X size={24}/></button>
                  </div>
                  <div className="p-8 space-y-6">
                      <div className="bg-red-50 p-4 rounded-2xl border border-red-100">
                          <div className="text-[10px] text-red-400 font-black mb-1 uppercase tracking-tighter">指令接收方</div>
                          <div className="text-sm font-black text-red-900">{showInstructionModal.name}</div>
                      </div>
                      <textarea 
                          className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold h-32 focus:border-red-500 outline-none text-sm" 
                          placeholder="请输入针对该站点的专项整改、限流或调度指令..."
                          value={instructionText}
                          onChange={e=>setInstructionText(e.target.value)}
                      ></textarea>
                      <button onClick={handleSendInstruction} className="w-full py-5 bg-red-600 text-white font-black rounded-2xl shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2">
                          <CheckCircle size={18}/> 确认下达指令
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};
