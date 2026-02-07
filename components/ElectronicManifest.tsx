
import React from 'react';
import { Order, OrderStatus } from '../types';
import { QrCode, FileCheck, Truck, MapPin, Calendar, X, ShieldCheck, Fingerprint, Shield, ExternalLink, Zap, Lock } from 'lucide-react';

interface ElectronicManifestProps {
  order: Order;
  onClose: () => void;
  isIndependent?: boolean; 
}

export const ElectronicManifest: React.FC<ElectronicManifestProps> = ({ order, onClose, isIndependent }) => {
  const isCompleted = order.status === OrderStatus.COMPLETED;
  
  // 核心样式差异化配置
  const theme = isIndependent 
    ? {
        mainColor: 'bg-indigo-950',
        borderColor: 'border-indigo-400',
        accentColor: 'text-indigo-600',
        sealColor: 'border-indigo-500/20 text-indigo-600',
        badge: 'bg-indigo-500',
        title: '技术链路合规认证',
        sub: 'Technical Protocol Verified',
        icon: <Fingerprint size={32} className="text-indigo-400" />,
        watermark: 'TECH VERIFIED',
        sealText: '平台技术\n存证专章'
      }
    : {
        mainColor: 'bg-emerald-950',
        borderColor: 'border-emerald-400',
        accentColor: 'text-emerald-600',
        sealColor: 'border-emerald-500/20 text-emerald-700',
        badge: 'bg-emerald-600',
        title: '建筑垃圾清运电子联单',
        sub: 'Official Digital Manifest',
        icon: <FileCheck size={32} className="text-emerald-400" />,
        watermark: 'OFFICIAL',
        sealText: '清运监管\n电子印章'
      };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-[100] p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-sm rounded-[3rem] overflow-hidden shadow-2xl relative animate-fade-in-up border-[8px] border-white">
        
        {/* Certificate Header */}
        <div className={`${theme.mainColor} p-8 text-white text-center relative border-b-4 ${theme.borderColor}`}>
          <button onClick={onClose} className="absolute top-6 right-6 text-white/30 hover:text-white transition-colors">
            <X size={20} />
          </button>
          
          <div className="flex justify-center mb-4">
             <div className="bg-white/10 p-4 rounded-3xl backdrop-blur-md border border-white/10">
                {theme.icon}
             </div>
          </div>
          
          <h2 className="text-xl font-black tracking-tight">{theme.title}</h2>
          <p className="text-[10px] font-mono opacity-60 uppercase tracking-[0.3em] mt-1">{theme.sub}</p>
          
          <div className="mt-4 flex justify-center gap-2">
             <div className="text-[9px] font-mono bg-black/40 px-3 py-1 rounded-full text-white/70 border border-white/10">
                SN: {order.manifestSerialNo || `CERT-${order.id.slice(-8).toUpperCase()}`}
             </div>
          </div>
        </div>

        {/* Diagonal Watermark */}
        <div className="absolute inset-0 top-40 flex items-center justify-center opacity-[0.03] pointer-events-none rotate-[-25deg]">
            <span className="text-8xl font-black whitespace-nowrap">{theme.watermark}</span>
        </div>

        <div className="p-6 bg-slate-50 space-y-6 relative">
          
          {/* Status & QR */}
          <div className="flex items-center justify-between">
             <div className="bg-white p-3 rounded-2xl shadow-inner border border-gray-100">
                <QrCode size={100} className="text-slate-800" />
             </div>
             <div className="text-right flex-1 pl-6">
                <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black text-white shadow-lg ${isCompleted ? theme.badge : 'bg-orange-500 animate-pulse'}`}>
                   {isCompleted ? <ShieldCheck size={12}/> : <Zap size={12}/>}
                   {isCompleted ? "全链路校验闭环" : "实时数据监控中"}
                </div>
                <p className="text-[10px] text-slate-400 font-bold mt-4 leading-relaxed">
                   {isIndependent 
                     ? "本认证由EcoClear智慧大脑实时核发，基于GPS全程追踪、AI装载识别、消纳场影像对比，确认为合规运输行为。" 
                     : "本联单受城市环卫、建设及交通管理部门全程数字化监管，符合《建筑垃圾排放管理条例》要求。"}
                </p>
             </div>
          </div>

          {/* Details Table */}
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
             <div className="grid grid-cols-2 border-b border-slate-100">
                <div className="p-4 border-r border-slate-100">
                   <div className="text-[8px] text-slate-400 font-black uppercase mb-1">作业日期</div>
                   <div className="text-xs font-black text-slate-800">{new Date(order.createdAt).toLocaleDateString()}</div>
                </div>
                <div className="p-4">
                   <div className="text-[8px] text-slate-400 font-black uppercase mb-1">排放地址</div>
                   <div className="text-xs font-black text-slate-800 truncate">{order.pickupDetails?.community || '报备点'}</div>
                </div>
             </div>

             <div className="p-4 border-b border-slate-100 bg-blue-50/10">
                <div className="text-[8px] text-slate-400 font-black uppercase mb-1 flex items-center gap-1">
                    <Truck size={10} /> 承运车辆信息
                </div>
                <div className="flex justify-between items-center mt-1">
                   <span className="text-xs font-black text-slate-800">{order.assignedDriver?.name}</span>
                   <span className="text-xs font-mono font-black text-blue-700 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-100">
                       {order.assignedDriver?.plate}
                   </span>
                </div>
             </div>

             <div className={`p-4 ${isCompleted ? 'bg-emerald-50/30' : ''}`}>
                <div className="text-[8px] text-slate-400 font-black uppercase mb-1 flex items-center gap-1">
                    <MapPin size={10} /> 消纳/处置终端
                </div>
                {isCompleted ? (
                   <div className="space-y-1 mt-1">
                      <div className="text-xs font-black text-slate-800">{order.disposalFacilityName || "认证消纳场"}</div>
                      <div className="flex items-center gap-1 text-[9px] font-black text-emerald-600">
                         <Zap size={10} className="fill-emerald-600" />
                         已入库 · 影像指纹匹配成功
                      </div>
                   </div>
                ) : (
                   <div className="text-xs text-slate-400 italic font-bold mt-1">待消纳场核签验证...</div>
                )}
             </div>
          </div>

          {/* Verification Footer with Seal */}
          <div className="flex justify-between items-end pt-2">
             <div className="space-y-3">
                <div className="flex items-center gap-1 text-[9px] font-bold text-slate-500">
                   <Lock size={10} /> {isIndependent ? "系统存证" : "官方核发"}: EcoClear Smart Brain
                </div>
                {isCompleted && (
                   <button className="text-[10px] font-black text-blue-600 flex items-center gap-1 hover:underline decoration-2">
                      <ExternalLink size={12}/> 查看区块链存证证书
                   </button>
                )}
             </div>
             
             {/* Circular Seal */}
             <div className="relative w-24 h-24 flex items-center justify-center pointer-events-none select-none">
                <div className={`absolute inset-0 border-2 ${theme.sealColor} rounded-full`}></div>
                <div className={`absolute inset-1.5 border border-dashed ${theme.sealColor} rounded-full animate-spin-slow`}></div>
                <div className={`text-[9px] font-black text-center ${theme.accentColor} uppercase rotate-12 leading-tight`}>
                   {theme.sealText}
                </div>
             </div>
          </div>
        </div>

        {/* Bottom Metadata */}
        <div className="bg-slate-100 p-4 border-t border-slate-200">
           <div className="flex items-center justify-center gap-2 text-[8px] text-slate-400 font-black uppercase tracking-widest">
              <Zap size={8} className="fill-slate-400" /> 
              DIGITAL CERTIFICATE PROTOCOL V2.5
           </div>
        </div>
      </div>
    </div>
  );
};
