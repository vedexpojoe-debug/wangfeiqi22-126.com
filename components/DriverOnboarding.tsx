
import React, { useState, useRef } from 'react';
import { DriverProfile, FleetProfile } from '../types';
import { Camera, Truck, ShieldCheck, Loader2, User, Users, CheckCircle, FileText, Fingerprint, Shield, Info, Building, Search, Plus } from 'lucide-react';
import { OnboardingWrapper } from './OnboardingWrapper';

interface DriverOnboardingProps {
  onRegister: (driverProfile: DriverProfile, newFleet?: FleetProfile) => void;
  currentProfile: DriverProfile | null;
  existingFleets: string[]; // 传入已有的车队名称列表用于搜索选择
}

export const DriverOnboarding: React.FC<DriverOnboardingProps> = ({ onRegister, currentProfile, existingFleets }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    licenseNumber: '',
    vehiclePlate: '',
    vehicleType: 'Small Truck',
    isIndependent: true,
    fleetName: '',
    isNewFleet: false,
  });

  const [fleetDetails, setFleetDetails] = useState({
    companyName: '',
    creditCode: '',
    companyLicenseImage: null as string | null
  });

  const [licenseImage, setLicenseImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const companyLicenseRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, target: 'DRIVER' | 'COMPANY') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (target === 'DRIVER') setLicenseImage(reader.result as string);
        else setFleetDetails({ ...fleetDetails, companyLicenseImage: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleNext = () => {
    // 逻辑分叉：如果是公司车且公司是新的，增加一个公司资质提交步骤
    if (step === 2 && !formData.isIndependent && !formData.fleetName) {
        setFormData({ ...formData, isNewFleet: true });
        setStep(2.5); // 进入公司资质补全页
        return;
    }

    if (step < 4) {
        setStep(Math.floor(step + 1));
    } else {
        const newDriver: DriverProfile = {
            id: 'driver-' + Date.now(),
            ...formData,
            licenseImageUrl: licenseImage || '',
            status: 'PENDING',
            joinedAt: Date.now(),
            fleetName: formData.isIndependent ? '个人自营' : (formData.isNewFleet ? fleetDetails.companyName : formData.fleetName)
        };

        let newFleet: FleetProfile | undefined;
        if (formData.isNewFleet) {
            newFleet = {
                id: 'fleet-' + Date.now(),
                name: fleetDetails.companyName,
                managerName: formData.name, // 初始默认为提交者
                totalVehicles: 1,
                safetyScore: 60, // 新入驻初始分
                isAuthorizedPrint: false,
                status: 'PENDING', // 状态为待审核
                projects: []
            };
        }

        onRegister(newDriver, newFleet);
    }
  };

  const simulateApproval = () => {
    if (currentProfile) {
      onRegister({ ...currentProfile, status: 'VERIFIED' });
    }
  };

  if (currentProfile?.status === 'PENDING') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
        <div className="bg-white p-8 rounded-2xl shadow-lg text-center max-w-sm w-full animate-fade-in border-t-8 border-blue-600">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
             <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">资质核验中</h2>
          <p className="text-gray-500 text-sm mb-6">
            正在核对您的身份。{formData.isNewFleet ? `所属公司“${fleetDetails.companyName}”资质已同步至管理后台，等待官方授权开通。` : '正在对接所属车队系统。'}
          </p>
          
          <div className="bg-gray-50 p-4 rounded-lg text-left text-sm text-gray-600 mb-6 space-y-1">
             <p><span className="font-bold">入驻模式:</span> {formData.isIndependent ? '个人合规' : '资质企业'}</p>
             {formData.isNewFleet && <p><span className="font-bold">新增公司:</span> {fleetDetails.companyName}</p>}
             <p><span className="font-bold">车牌:</span> {currentProfile.vehiclePlate}</p>
          </div>

          <button 
             onClick={simulateApproval}
             className="w-full py-4 bg-blue-600 text-white hover:bg-blue-700 rounded-xl text-sm font-black transition-all shadow-lg"
          >
             [演示环境] 模拟官方授权通过
          </button>
        </div>
      </div>
    );
  }

  return (
    <OnboardingWrapper
        title="司机入驻申请"
        subtitle="加入 EcoClear，开启智能化、合规化的清运作业之旅。"
        currentStep={Math.ceil(step)}
        totalSteps={4}
        onNext={handleNext}
        onBack={() => setStep(step === 2.5 ? 2 : Math.max(1, step - 1))}
        nextLabel={step === 4 ? '提交审核' : '下一步'}
        isNextDisabled={
            step === 1 ? (!formData.name || !formData.phone) :
            step === 2 ? (!formData.isIndependent && !formData.fleetName && !formData.isNewFleet) :
            step === 2.5 ? (!fleetDetails.companyName || !fleetDetails.creditCode || !fleetDetails.companyLicenseImage) :
            step === 3 ? !formData.vehiclePlate :
            (step === 4 ? !licenseImage : false)
        }
        headerIcon={<Truck className="w-6 h-6 text-blue-600" />}
        headerColorClass="bg-blue-600"
    >
        {step === 1 && (
            <div className="space-y-4 animate-fade-in">
               <h3 className="font-bold text-gray-800 text-lg text-center mb-4">身份基本信息</h3>
               <div className="space-y-4">
                  <input type="text" placeholder="真实姓名" className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl outline-none font-bold" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                  <input type="tel" placeholder="手机号码" className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl outline-none font-bold" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
               </div>
            </div>
        )}

        {step === 2 && (
            <div className="space-y-4 animate-fade-in">
                <h3 className="font-bold text-gray-800 text-lg text-center mb-4">选择入驻模式</h3>
                <div className="grid grid-cols-1 gap-4">
                    <div className={`p-6 rounded-3xl border-4 text-left transition-all ${!formData.isIndependent ? 'bg-emerald-50 border-emerald-500 shadow-xl' : 'bg-gray-50 border-transparent'}`}>
                        <button onClick={() => setFormData({...formData, isIndependent: false})} className="w-full text-left">
                            <div className="flex justify-between items-center mb-3">
                                <div className={`p-2 rounded-xl ${!formData.isIndependent ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-400'}`}>
                                    <Building size={24} />
                                </div>
                                {!formData.isIndependent && <CheckCircle className="text-emerald-500" size={20} />}
                            </div>
                            <div className={`font-black text-lg ${!formData.isIndependent ? 'text-emerald-900' : 'text-gray-700'}`}>资质公司/车队司机</div>
                            <p className="text-[11px] text-emerald-700/70 mt-2 font-bold leading-relaxed">适用于所属公司已在平台备案或需要新入驻的公司。</p>
                        </button>
                        
                        {!formData.isIndependent && (
                            <div className="mt-4 space-y-3 animate-fade-in">
                                <div className="relative">
                                    <Search className="absolute left-3 top-3 text-emerald-400" size={16} />
                                    <select 
                                        className="w-full p-3 pl-10 bg-white border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800 outline-none appearance-none"
                                        value={formData.fleetName}
                                        onChange={e => setFormData({...formData, fleetName: e.target.value, isNewFleet: false})}
                                    >
                                        <option value="">-- 请选择所属公司 --</option>
                                        {existingFleets.map(f => <option key={f} value={f}>{f}</option>)}
                                    </select>
                                </div>
                                <div className="text-center">
                                    <span className="text-[10px] text-emerald-400 font-bold">没有找到您的公司？</span>
                                    <button 
                                        onClick={() => { setFormData({...formData, isIndependent: false, fleetName: '', isNewFleet: true}); setStep(2.5); }}
                                        className="ml-2 text-[10px] text-emerald-600 font-black flex items-center gap-1 mx-auto mt-1 border-b border-emerald-600 pb-0.5"
                                    >
                                        <Plus size={10}/> 我要代劳申请公司入驻
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    <button 
                        onClick={() => setFormData({...formData, isIndependent: true, fleetName: '', isNewFleet: false})}
                        className={`p-6 rounded-3xl border-4 text-left transition-all ${formData.isIndependent ? 'bg-indigo-50 border-indigo-500 shadow-xl' : 'bg-gray-50 border-transparent'}`}
                    >
                        <div className="flex justify-between items-center mb-3">
                            <div className={`p-2 rounded-xl ${formData.isIndependent ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-400'}`}>
                                <Fingerprint size={24} />
                            </div>
                            {formData.isIndependent && <CheckCircle className="text-indigo-600" size={20} />}
                        </div>
                        <div className={`font-black text-lg ${formData.isIndependent ? 'text-indigo-900' : 'text-gray-700'}`}>个人合规运输车</div>
                        <p className="text-[11px] text-indigo-700/70 mt-2 font-bold leading-relaxed">自主备案，GPS+AI全时监控，获取技术合规认证。</p>
                    </button>
                </div>
            </div>
        )}

        {step === 2.5 && (
            <div className="space-y-4 animate-fade-in">
               <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 flex gap-3 mb-2">
                  <Building size={20} className="text-emerald-600 shrink-0" />
                  <p className="text-[10px] text-emerald-800 font-bold leading-tight">
                      若您的所属公司未入驻，请代为提交基础资料。审核通过后，我们将同步开通车队管理端口。
                  </p>
               </div>
               <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase mb-1 block ml-1">公司全称</label>
                    <input type="text" placeholder="例如：城投环境物流有限公司" className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl outline-none font-bold" value={fleetDetails.companyName} onChange={e => setFleetDetails({...fleetDetails, companyName: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase mb-1 block ml-1">社会统一信用代码</label>
                    <input type="text" placeholder="18位信用代码" className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl outline-none font-bold" value={fleetDetails.creditCode} onChange={e => setFleetDetails({...fleetDetails, creditCode: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase mb-1 block ml-1">营业执照扫描件</label>
                    <div onClick={() => companyLicenseRef.current?.click()} className="border-2 border-dashed border-emerald-200 rounded-2xl h-32 bg-emerald-50/30 flex flex-col items-center justify-center overflow-hidden relative group">
                        {fleetDetails.companyLicenseImage ? (
                            <img src={fleetDetails.companyLicenseImage} className="w-full h-full object-cover" alt="License" />
                        ) : (
                            <><Camera className="text-emerald-400" size={24} /><span className="text-[10px] font-bold text-emerald-600 mt-2">点击上传图片</span></>
                        )}
                        <input ref={companyLicenseRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange(e, 'COMPANY')} />
                    </div>
                  </div>
               </div>
            </div>
        )}

        {step === 3 && (
            <div className="space-y-4 animate-fade-in">
               <h3 className="font-bold text-gray-800 text-lg text-center mb-4">车辆资产信息</h3>
               <input type="text" placeholder="车牌号 (如: 沪A-88888)" className="w-full p-5 bg-gray-50 border-2 border-blue-100 rounded-2xl text-center text-2xl font-black uppercase text-blue-900" value={formData.vehiclePlate} onChange={e => setFormData({...formData, vehiclePlate: e.target.value})} />
               <select className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl font-black text-gray-700" value={formData.vehicleType} onChange={e => setFormData({...formData, vehicleType: e.target.value})}>
                    <option value="Dump Truck">重型自卸渣土车</option>
                    <option value="Small Truck">轻型平板货车</option>
                    <option value="Van">厢式垃圾运输车</option>
               </select>
            </div>
        )}

        {step === 4 && (
            <div className="space-y-4 animate-fade-in">
                <h3 className="font-bold text-gray-800 text-lg text-center mb-4">影像资料上传</h3>
                <div onClick={() => fileInputRef.current?.click()} className="border-4 border-dashed border-blue-100 rounded-[2.5rem] h-56 bg-blue-50/30 flex flex-col items-center justify-center cursor-pointer relative overflow-hidden group hover:bg-blue-50 transition-all">
                   {licenseImage ? (
                      <img src={licenseImage} className="w-full h-full object-contain" alt="License" />
                   ) : (
                      <>
                         <div className="w-16 h-16 bg-blue-100 rounded-3xl flex items-center justify-center text-blue-600 mb-3 group-hover:scale-110 transition-transform">
                            <Camera size={32} />
                         </div>
                         <span className="text-sm font-black text-blue-600">上传行驶证与车辆正面照</span>
                      </>
                   )}
                   <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange(e, 'DRIVER')} />
                </div>
            </div>
        )}
    </OnboardingWrapper>
  );
};
