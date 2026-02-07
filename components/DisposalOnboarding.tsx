
import React, { useState, useRef } from 'react';
import { DisposalProfile, FacilityOperationalStatus, FacilityType, WasteType } from '../types';
import { Camera, Factory, ShieldCheck, Loader2 } from 'lucide-react';
import { OnboardingWrapper } from './OnboardingWrapper';

interface DisposalOnboardingProps {
  onRegister: (profile: DisposalProfile) => void;
  currentProfile: DisposalProfile | null;
}

export const DisposalOnboarding: React.FC<DisposalOnboardingProps> = ({ onRegister, currentProfile }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    contactPhone: '',
    specialty: ''
  });
  const [licenseImage, setLicenseImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setLicenseImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleNext = () => {
    if (step === 1) setStep(2);
    else {
        const newProfile: DisposalProfile = {
            id: 'disposal-' + Date.now(),
            ...formData,
            location: { lat: 31.2222, lng: 121.4444, address: formData.address },
            facilityType: FacilityType.FIXED_DISPOSAL,
            licenseImageUrl: licenseImage || '',
            status: 'PENDING',
            joinedAt: Date.now(),
            operationalStatus: FacilityOperationalStatus.OPEN,
            specialty: formData.specialty || '综合消纳',
            allowedWasteTypes: [WasteType.CONSTRUCTION], // Default
            feeConfigs: [{ wasteType: WasteType.CONSTRUCTION, pricePerUnit: 450, unit: 'TRUCK' }],
            preferredSettlement: 'PLATFORM',
            description: ''
          };
      
          onRegister(newProfile);
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
        <div className="bg-white p-8 rounded-2xl shadow-lg text-center max-w-sm w-full animate-fade-in">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
             <Loader2 className="w-8 h-8 text-orange-600 animate-spin" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">资质审核中</h2>
          <p className="text-gray-500 text-sm mb-6">您的处置场入驻申请已提交，平台正在审核您的经营许可证及环保资质。预计 3-5 个工作日完成。</p>
          
          <div className="bg-gray-50 p-4 rounded-lg text-left text-sm text-gray-600 mb-6">
             <p><span className="font-bold">场地名称:</span> {currentProfile.name}</p>
             <p><span className="font-bold">地址:</span> {currentProfile.address}</p>
             <p><span className="font-bold">提交时间:</span> {new Date(currentProfile.joinedAt).toLocaleString()}</p>
          </div>

          <button 
             onClick={simulateApproval}
             className="w-full py-3 bg-gray-100 text-gray-500 hover:bg-gray-200 rounded-xl text-sm font-medium transition-colors"
          >
             [演示用] 模拟审核通过
          </button>
        </div>
      </div>
    );
  }

  return (
    <OnboardingWrapper
        title="处置场/消纳点入驻"
        subtitle="正规消纳，绿色循环，加入 EcoClear 处置网络。"
        currentStep={step}
        totalSteps={2}
        onNext={handleNext}
        onBack={() => setStep(Math.max(1, step - 1))}
        nextLabel={step === 2 ? '提交审核' : '下一步'}
        isNextDisabled={step === 1 ? (!formData.name || !formData.address) : !licenseImage}
        headerIcon={<Factory className="w-6 h-6 text-orange-600" />}
        headerColorClass="bg-orange-600"
    >
        {step === 1 && (
            <div className="space-y-2">
                <h3 className="font-bold text-gray-800 text-lg text-center mb-4">场地基本信息</h3>
                <div>
                   <label className="block text-sm font-bold text-gray-700 mb-1 ml-1">消纳场全称</label>
                   <input 
                       type="text" 
                       placeholder="请输入处置场名称"
                       className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:border-orange-500 outline-none font-medium"
                       value={formData.name}
                       onChange={e => setFormData({...formData, name: e.target.value})}
                   />
                </div>
                <div>
                   <label className="block text-sm font-bold text-gray-700 mb-1 ml-1">详细地址</label>
                   <input 
                       type="text" 
                       placeholder="请输入地址 (自动关联 GIS)"
                       className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:border-orange-500 outline-none font-medium"
                       value={formData.address}
                       onChange={e => setFormData({...formData, address: e.target.value})}
                   />
                </div>
                <div>
                   <label className="block text-sm font-bold text-gray-700 mb-1 ml-1">业务联系电话</label>
                   <input 
                       type="tel" 
                       placeholder="请输入联系电话"
                       className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:border-orange-500 outline-none font-medium"
                       value={formData.contactPhone}
                       onChange={e => setFormData({...formData, contactPhone: e.target.value})}
                   />
                </div>
                <div>
                   <label className="block text-sm font-bold text-gray-700 mb-1 ml-1">主营业务</label>
                   <input 
                       type="text" 
                       placeholder="e.g. 装修垃圾, 砖渣"
                       className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:border-orange-500 outline-none font-medium"
                       value={formData.specialty}
                       onChange={e => setFormData({...formData, specialty: e.target.value})}
                   />
                </div>
            </div>
        )}

        {step === 2 && (
            <div className="space-y-4">
                <h3 className="font-bold text-gray-800 text-lg text-center mb-4">环评资质认证</h3>
                <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-orange-200 rounded-xl h-48 bg-orange-50 flex flex-col items-center justify-center cursor-pointer relative overflow-hidden hover:bg-orange-100 transition-colors"
                >
                    {licenseImage ? (
                        <img src={licenseImage} className="w-full h-full object-contain" alt="License" />
                    ) : (
                        <>
                            <Camera className="w-10 h-10 text-orange-400 mb-3" />
                            <span className="text-sm font-bold text-orange-500">上传经营许可证/环评文件</span>
                        </>
                    )}
                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                </div>
                <div className="bg-gray-50 p-3 rounded-lg flex items-start text-xs text-gray-500">
                    <ShieldCheck className="w-4 h-4 mr-2 shrink-0 mt-0.5" />
                    只有通过政府备案的正规消纳场所才能接入系统接收订单。
                </div>
            </div>
        )}
    </OnboardingWrapper>
  );
};
