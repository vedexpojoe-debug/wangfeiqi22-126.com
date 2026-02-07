

import React, { useState } from 'react';
import { OnboardingWrapper } from './OnboardingWrapper';
import { ClientProfile, PropertyProfile, FleetProfile, EnterpriseProfile, WorkerProfile, GovernmentProfile } from '../types';
import { User, Building, Briefcase, Building2, Hammer, Landmark, Upload, MapPin, Phone, ShieldCheck, Mail, Users, FileText, Loader2 } from 'lucide-react';

// Common Input Component
const InputField = ({ label, placeholder, value, onChange, type = "text", note }: any) => (
   <div className="mb-4">
      <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">{label}</label>
      <input 
         type={type} 
         placeholder={placeholder} 
         className="w-full p-4 bg-gray-50 rounded-xl border-2 border-transparent focus:border-current focus:bg-white outline-none transition-all duration-200 font-medium" 
         value={value} 
         onChange={onChange} 
      />
      {note && <p className="text-xs text-gray-400 mt-1 ml-1">{note}</p>}
   </div>
);

// Helper for Pending Screen
const PendingApprovalScreen = ({ title, desc, onSimulate, colorClass = "text-blue-600" }: any) => (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
        <div className="bg-white p-8 rounded-2xl shadow-lg text-center max-w-sm w-full animate-fade-in">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Loader2 className={`w-8 h-8 ${colorClass} animate-spin`} />
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">{title}</h2>
            <p className="text-gray-500 text-sm mb-6">{desc}</p>
            <button 
                onClick={onSimulate}
                className="w-full py-3 bg-gray-100 text-gray-500 hover:bg-gray-200 rounded-xl text-sm font-medium transition-colors"
            >
                [演示用] 模拟管理员通过审核
            </button>
        </div>
    </div>
);

// --- CLIENT ONBOARDING ---
export const ClientOnboarding: React.FC<{ onRegister: (p: ClientProfile) => void, currentProfile?: ClientProfile | null }> = ({ onRegister, currentProfile }) => {
  const [step, setStep] = useState(1);
  const [data, setData] = useState({ name: '', phone: '', address: '' });

  const handleNext = () => {
    if (step === 1) setStep(2);
    else {
        onRegister({
            id: 'client-' + Date.now(),
            name: data.name,
            phone: data.phone,
            defaultAddress: data.address,
            status: 'PENDING' 
        });
    }
  };

  if (currentProfile?.status === 'PENDING') {
      return <PendingApprovalScreen 
        title="用户资料审核中" 
        desc="平台正在核实您的注册信息，预计 10 分钟内完成。" 
        onSimulate={() => onRegister({ ...currentProfile, status: 'VERIFIED' })}
        colorClass="text-emerald-600"
      />;
  }

  return (
    <OnboardingWrapper
       title="欢迎使用 EcoClear"
       subtitle="注册个人账户，一键预约上门清运，参与绿色回收。"
       currentStep={step}
       totalSteps={2}
       onNext={handleNext}
       onBack={() => setStep(1)}
       nextLabel={step === 2 ? '提交注册' : '下一步'}
       isNextDisabled={step === 1 ? (!data.name || !data.phone) : !data.address}
       headerIcon={<User className="w-6 h-6 text-emerald-600" />}
       headerColorClass="bg-emerald-600"
    >
       {step === 1 && (
          <div className="space-y-2">
             <div className="text-center mb-6">
                <h3 className="text-lg font-bold text-gray-800">完善基本信息</h3>
                <p className="text-sm text-gray-500">方便司机联系您进行上门服务</p>
             </div>
             <InputField 
                label="昵称 / 称呼" 
                placeholder="请输入您的称呼 (例如: 张先生)" 
                value={data.name} 
                onChange={(e: any) => setData({...data, name: e.target.value})} 
             />
             <InputField 
                label="手机号码" 
                type="tel"
                placeholder="请输入11位手机号" 
                value={data.phone} 
                onChange={(e: any) => setData({...data, phone: e.target.value})} 
             />
          </div>
       )}
       {step === 2 && (
          <div className="space-y-4">
             <div className="text-center mb-6">
                <h3 className="text-lg font-bold text-gray-800">设置默认地址</h3>
                <p className="text-sm text-gray-500">便于快速为您匹配附近的清运服务</p>
             </div>
             <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 flex items-center text-emerald-700 mb-2 animate-pulse">
                <MapPin className="w-5 h-5 mr-3 shrink-0" />
                <span className="text-sm font-bold">自动定位中... (模拟)</span>
             </div>
             <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">详细地址</label>
                <textarea 
                   placeholder="请输入街道/小区/门牌号 (例如: 浦东新区张江路88号)" 
                   className="w-full p-4 bg-gray-50 rounded-xl border-2 border-transparent focus:border-emerald-500 focus:bg-white outline-none transition-colors h-32 font-medium" 
                   value={data.address} 
                   onChange={e => setData({...data, address: e.target.value})} 
                />
             </div>
          </div>
       )}
    </OnboardingWrapper>
  );
};

// --- PROPERTY ONBOARDING ---
export const PropertyOnboarding: React.FC<{ onRegister: (p: PropertyProfile) => void, currentProfile?: PropertyProfile | null }> = ({ onRegister, currentProfile }) => {
    const [step, setStep] = useState(1);
    const [data, setData] = useState({ name: '', phone: '', communities: '' });
  
    const handleNext = () => {
      if (step === 1) setStep(2);
      else if (step === 2) setStep(3);
      else {
          onRegister({
              id: 'prop-' + Date.now(),
              name: data.name,
              contactPhone: data.phone,
              managedCommunities: data.communities.split(',').map(s => s.trim()),
              status: 'PENDING' 
          });
      }
    };

    if (currentProfile?.status === 'PENDING') {
        return <PendingApprovalScreen 
          title="物业资质审核中" 
          desc="平台正在审核您的物业服务资质，通过后即可管理辖区。" 
          onSimulate={() => onRegister({ ...currentProfile, status: 'VERIFIED' })}
          colorClass="text-indigo-600"
        />;
    }
  
    return (
      <OnboardingWrapper
         title="物业管理入驻"
         subtitle="为辖区居民提供便捷清运服务，集中管理环境卫生。"
         currentStep={step}
         totalSteps={3}
         onNext={handleNext}
         onBack={() => setStep(Math.max(1, step - 1))}
         nextLabel={step === 3 ? '提交审核' : '下一步'}
         isNextDisabled={step === 1 ? (!data.name || !data.phone) : (step === 2 ? !data.communities : false)}
         headerIcon={<Building className="w-6 h-6 text-indigo-600" />}
         headerColorClass="bg-indigo-600"
      >
         {step === 1 && (
            <div className="space-y-2">
               <InputField 
                  label="物业公司名称" 
                  placeholder="请输入公司全称" 
                  value={data.name} 
                  onChange={(e: any) => setData({...data, name: e.target.value})} 
               />
               <InputField 
                  label="业务负责人电话" 
                  type="tel"
                  placeholder="请输入联系电话" 
                  value={data.phone} 
                  onChange={(e: any) => setData({...data, phone: e.target.value})} 
               />
            </div>
         )}
         {step === 2 && (
            <div className="space-y-4">
               <h3 className="text-lg font-bold text-gray-800 text-center">管辖小区/园区</h3>
               <p className="text-sm text-gray-500 text-center mb-4">请输入您管理的社区名称，用逗号分隔</p>
               <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">社区列表</label>
                  <textarea 
                     placeholder="例如: 阳光花苑, 滨江一号, 科技园区A栋..." 
                     className="w-full p-4 bg-gray-50 rounded-xl border-2 border-transparent focus:border-indigo-500 h-40 outline-none font-medium" 
                     value={data.communities} 
                     onChange={e => setData({...data, communities: e.target.value})} 
                  />
               </div>
            </div>
         )}
         {step === 3 && (
            <div className="text-center space-y-6">
                <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center mx-auto border-2 border-dashed border-indigo-200 hover:bg-indigo-100 transition-colors cursor-pointer">
                    <Upload className="w-8 h-8 text-indigo-400" />
                </div>
                <div>
                    <h3 className="font-bold text-gray-800">上传营业执照</h3>
                    <p className="text-sm text-gray-500 mt-1">需包含物业服务资质 (演示模式可跳过)</p>
                </div>
            </div>
         )}
      </OnboardingWrapper>
    );
};

// --- FLEET ONBOARDING ---
export const FleetOnboarding: React.FC<{ onRegister: (p: FleetProfile) => void, currentProfile?: FleetProfile | null }> = ({ onRegister, currentProfile }) => {
    const [step, setStep] = useState(1);
    const [data, setData] = useState({ name: '', manager: '', count: '' });
  
    const handleNext = () => {
      if (step === 1) setStep(2);
      else if (step === 2) setStep(3);
      else {
          onRegister({
              id: 'fleet-' + Date.now(),
              name: data.name,
              managerName: data.manager,
              totalVehicles: parseInt(data.count) || 0,
              safetyScore: 100,
              isAuthorizedPrint: false,
              status: 'PENDING',
              projects: [] 
          });
      }
    };

    if (currentProfile?.status === 'PENDING') {
        return <PendingApprovalScreen 
          title="运输资质审核中" 
          desc="平台正在审核您的道路运输许可证，预计 1-3 个工作日。" 
          onSimulate={() => onRegister({ ...currentProfile, status: 'VERIFIED' })}
          colorClass="text-cyan-600"
        />;
    }
  
    return (
      <OnboardingWrapper
         title="车队/运输公司入驻"
         subtitle="高效管理车队运力，承接大型清运项目。"
         currentStep={step}
         totalSteps={3}
         onNext={handleNext}
         onBack={() => setStep(Math.max(1, step - 1))}
         nextLabel={step === 3 ? '提交审核' : '下一步'}
         isNextDisabled={step === 1 ? (!data.name || !data.manager) : (step === 2 ? !data.count : false)}
         headerIcon={<Briefcase className="w-6 h-6 text-cyan-600" />}
         headerColorClass="bg-cyan-600"
      >
         {step === 1 && (
            <div className="space-y-2">
               <InputField 
                  label="车队/公司名称" 
                  placeholder="请输入车队全称" 
                  value={data.name} 
                  onChange={(e: any) => setData({...data, name: e.target.value})} 
               />
               <InputField 
                  label="管理员姓名" 
                  placeholder="请输入管理员姓名" 
                  value={data.manager} 
                  onChange={(e: any) => setData({...data, manager: e.target.value})} 
               />
            </div>
         )}
         {step === 2 && (
            <div className="space-y-4">
               <h3 className="text-lg font-bold text-gray-800 text-center">运力规模</h3>
               <InputField 
                  label="现有合规车辆数" 
                  type="number"
                  placeholder="请输入车辆数量 (辆)" 
                  value={data.count} 
                  onChange={(e: any) => setData({...data, count: e.target.value})} 
               />
            </div>
         )}
         {step === 3 && (
            <div className="text-center space-y-6">
                <div className="w-24 h-24 bg-cyan-50 rounded-full flex items-center justify-center mx-auto border-2 border-dashed border-cyan-200 hover:bg-cyan-100 transition-colors cursor-pointer">
                    <FileText className="w-8 h-8 text-cyan-400" />
                </div>
                <div>
                    <h3 className="font-bold text-gray-800">上传道路运输许可证</h3>
                    <p className="text-sm text-gray-500 mt-1">需包含渣土运输资质 (演示模式可跳过)</p>
                </div>
            </div>
         )}
      </OnboardingWrapper>
    );
};

// --- ENTERPRISE ONBOARDING ---
export const EnterpriseOnboarding: React.FC<{ onRegister: (p: EnterpriseProfile) => void, currentProfile?: EnterpriseProfile | null }> = ({ onRegister, currentProfile }) => {
    const [step, setStep] = useState(1);
    const [data, setData] = useState({ name: '', phone: '' });
  
    const handleNext = () => {
      if (step === 1) setStep(2);
      else {
          onRegister({
              id: 'ent-' + Date.now(),
              companyName: data.name,
              contactPhone: data.phone,
              creditLimit: 200000,
              usedCredit: 0,
              billingCycle: '每月 10 号',
              activeProjects: [], // Empty initially
              status: 'PENDING'
          });
      }
    };

    if (currentProfile?.status === 'PENDING') {
        return <PendingApprovalScreen 
          title="企业授信审核中" 
          desc="我们正在评估您的企业资质与信用额度申请。审核通过后，您可以在后台添加项目并发布任务。" 
          onSimulate={() => onRegister({ ...currentProfile, status: 'VERIFIED' })}
          colorClass="text-slate-700"
        />;
    }
  
    return (
      <OnboardingWrapper
         title="企业大客户入驻"
         subtitle="专为建筑施工/装修公司设计，支持月结与批量下单。"
         currentStep={step}
         totalSteps={2}
         onNext={handleNext}
         onBack={() => setStep(Math.max(1, step - 1))}
         nextLabel={step === 2 ? '申请开通' : '下一步'}
         isNextDisabled={step === 1 ? (!data.name || !data.phone) : false}
         headerIcon={<Building2 className="w-6 h-6 text-slate-700" />}
         headerColorClass="bg-slate-800"
      >
         {step === 1 && (
            <div className="space-y-2">
               <InputField 
                  label="企业/集团名称" 
                  placeholder="请输入企业全称" 
                  value={data.name} 
                  onChange={(e: any) => setData({...data, name: e.target.value})} 
                  note="* 须与营业执照一致"
               />
               <InputField 
                  label="管理员手机号" 
                  placeholder="用于登录与接收通知" 
                  value={data.phone} 
                  onChange={(e: any) => setData({...data, phone: e.target.value})} 
                  type="tel"
               />
            </div>
         )}
         {step === 2 && (
            <div className="space-y-6">
                <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                    <h4 className="font-bold text-slate-700 mb-2">授信额度申请</h4>
                    <p className="text-sm text-slate-500">平台将根据您的企业资质与过往信用，为您核定初始月结额度。</p>
                    <div className="mt-6 text-center">
                        <span className="text-3xl font-bold text-slate-800">¥200,000</span>
                        <span className="text-xs text-slate-400 block mt-1">预估初始额度</span>
                    </div>
                </div>
            </div>
         )}
      </OnboardingWrapper>
    );
};

// --- WORKER ONBOARDING ---
export const WorkerOnboarding: React.FC<{ onRegister: (p: WorkerProfile) => void, currentProfile?: WorkerProfile | null }> = ({ onRegister, currentProfile }) => {
    const [step, setStep] = useState(1);
    const [data, setData] = useState({ name: '', phone: '', team: '' });
  
    const handleNext = () => {
      if (step === 1) setStep(2);
      else if (step === 2) setStep(3);
      else {
          onRegister({
              id: 'worker-' + Date.now(),
              name: data.name,
              phone: data.phone,
              teamName: data.team,
              skills: ['DEMOLITION', 'MOVER'],
              rating: 5.0,
              status: 'AVAILABLE',
              profileStatus: 'PENDING'
          });
      }
    };

    if (currentProfile?.profileStatus === 'PENDING') {
        return <PendingApprovalScreen 
          title="工队实名审核" 
          desc="正在核实您的身份信息，通过后即可开始接单。" 
          onSimulate={() => onRegister({ ...currentProfile, profileStatus: 'VERIFIED' })}
          colorClass="text-yellow-700"
        />;
    }
  
    return (
      <OnboardingWrapper
         title="工队/搬运入驻"
         subtitle="接单打拆、搬运、叉车服务，发布清运需求。"
         currentStep={step}
         totalSteps={3}
         onNext={handleNext}
         onBack={() => setStep(Math.max(1, step - 1))}
         nextLabel={step === 3 ? '提交申请' : '下一步'}
         isNextDisabled={step === 1 ? (!data.name || !data.phone) : false}
         headerIcon={<Hammer className="w-6 h-6 text-yellow-700" />}
         headerColorClass="bg-yellow-600"
      >
         {step === 1 && (
            <div className="space-y-2">
               <InputField 
                  label="工长/负责人姓名" 
                  placeholder="请输入真实姓名" 
                  value={data.name} 
                  onChange={(e: any) => setData({...data, name: e.target.value})} 
               />
               <InputField 
                  label="接单电话" 
                  type="tel"
                  placeholder="请输入联系电话" 
                  value={data.phone} 
                  onChange={(e: any) => setData({...data, phone: e.target.value})} 
               />
            </div>
         )}
         {step === 2 && (
            <div className="space-y-4">
               <h3 className="text-lg font-bold text-gray-800 text-center">团队信息 (选填)</h3>
               <InputField 
                  label="队伍名称" 
                  placeholder="例如: 老李专业打拆" 
                  value={data.team} 
                  onChange={(e: any) => setData({...data, team: e.target.value})} 
               />
               
               <div className="grid grid-cols-2 gap-3 mt-2">
                   <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200 text-center text-sm font-bold text-yellow-800">专业打拆</div>
                   <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200 text-center text-sm font-bold text-yellow-800">搬运/力工</div>
               </div>
            </div>
         )}
         {step === 3 && (
            <div className="text-center space-y-6">
                <div className="w-24 h-24 bg-yellow-50 rounded-full flex items-center justify-center mx-auto border-2 border-dashed border-yellow-200 hover:bg-yellow-100 transition-colors cursor-pointer">
                    <ShieldCheck className="w-8 h-8 text-yellow-600" />
                </div>
                <div>
                    <h3 className="font-bold text-gray-800">实名认证</h3>
                    <p className="text-sm text-gray-500 mt-1">需上传身份证正面照片 (演示模式可跳过)</p>
                </div>
            </div>
         )}
      </OnboardingWrapper>
    );
};

// --- GOVERNMENT ONBOARDING ---
export const GovernmentOnboarding: React.FC<{ onRegister: (p: GovernmentProfile) => void, currentProfile?: GovernmentProfile | null }> = ({ onRegister, currentProfile }) => {
    const [step, setStep] = useState(1);
    const [data, setData] = useState({ region: '', dept: '' });
  
    const handleNext = () => {
      if (step === 1) setStep(2);
      else if (step === 2) setStep(3);
      else {
          onRegister({
              id: 'gov-' + Date.now(),
              regionName: data.region,
              department: data.dept,
              status: 'PENDING'
          });
      }
    };

    if (currentProfile?.status === 'PENDING') {
        return <PendingApprovalScreen 
          title="政务接入审核" 
          desc="正在验证政务邮箱及部门授权信息。" 
          onSimulate={() => onRegister({ ...currentProfile, status: 'VERIFIED' })}
          colorClass="text-red-700"
        />;
    }
  
    return (
      <OnboardingWrapper
         title="监管部门接入"
         subtitle="接入城市大脑，实时监控辖区环境卫生与车辆轨迹。"
         currentStep={step}
         totalSteps={3}
         onNext={handleNext}
         onBack={() => setStep(Math.max(1, step - 1))}
         nextLabel={step === 3 ? '申请接入' : '下一步'}
         isNextDisabled={step === 1 ? (!data.region || !data.dept) : false}
         headerIcon={<Landmark className="w-6 h-6 text-red-700" />}
         headerColorClass="bg-red-800"
      >
         {step === 1 && (
            <div className="space-y-2">
               <InputField 
                  label="行政区域" 
                  placeholder="请输入行政区 (例如: 浦东新区)" 
                  value={data.region} 
                  onChange={(e: any) => setData({...data, region: e.target.value})} 
               />
               <InputField 
                  label="部门名称" 
                  placeholder="请输入部门名称 (例如: 生态环境局)" 
                  value={data.dept} 
                  onChange={(e: any) => setData({...data, dept: e.target.value})} 
               />
            </div>
         )}
         {step === 2 && (
            <div className="text-center">
               <h3 className="text-lg font-bold text-gray-800 mb-2">配置监管范围</h3>
               <p className="text-sm text-gray-500 mb-6">系统将自动同步该区域的 GIS 地图数据与处置场点位。</p>
               <div className="bg-red-50 p-6 rounded-xl border border-red-100 flex flex-col items-center">
                   <MapPin className="w-8 h-8 text-red-600 mb-2 animate-bounce" />
                   <span className="font-bold text-red-800">正在同步 GIS 数据...</span>
               </div>
            </div>
         )}
         {step === 3 && (
            <div className="text-center space-y-6">
                <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mx-auto border-2 border-dashed border-red-200 hover:bg-red-100 transition-colors cursor-pointer">
                    <Mail className="w-8 h-8 text-red-600" />
                </div>
                <div>
                    <h3 className="font-bold text-gray-800">政务邮箱认证</h3>
                    <p className="text-sm text-gray-500 mt-1">验证码已发送至您的公务邮箱 (演示模式可跳过)</p>
                </div>
            </div>
         )}
      </OnboardingWrapper>
    );
};