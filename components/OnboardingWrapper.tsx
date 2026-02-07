
import React from 'react';
import { ArrowLeft, ArrowRight, CheckCircle, Lock } from 'lucide-react';

interface OnboardingWrapperProps {
  title: string;
  subtitle: string;
  currentStep: number;
  totalSteps: number;
  onBack?: () => void;
  onNext?: () => void;
  nextLabel?: string;
  isNextDisabled?: boolean;
  children: React.ReactNode;
  headerIcon: React.ReactNode;
  headerColorClass: string; // e.g. "bg-blue-600"
}

export const OnboardingWrapper: React.FC<OnboardingWrapperProps> = ({
  title,
  subtitle,
  currentStep,
  totalSteps,
  onBack,
  onNext,
  nextLabel = "下一步",
  isNextDisabled = false,
  children,
  headerIcon,
  headerColorClass
}) => {
  const progressPercentage = ((currentStep) / totalSteps) * 100;

  return (
    <div className="min-h-screen bg-white pb-32 flex flex-col font-sans">
      {/* Header */}
      <div className={`${headerColorClass} p-6 text-white pt-10 pb-20 rounded-b-[2.5rem] shadow-xl relative transition-all duration-500`}>
        <div className="flex justify-between items-start mb-4">
           {onBack && currentStep > 1 ? (
             <button onClick={onBack} className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition active:scale-95">
               <ArrowLeft size={20} />
             </button>
           ) : (
             <div className="w-9"></div> // Spacer
           )}
           <div className="bg-white/20 px-3 py-1 rounded-full text-xs font-bold backdrop-blur-sm shadow-sm">
             步骤 {currentStep} / {totalSteps}
           </div>
        </div>
        
        <h1 className="text-2xl font-bold mb-2 text-center tracking-tight">{title}</h1>
        <p className="opacity-90 text-center text-sm px-4 leading-relaxed">{subtitle}</p>
        
        <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 bg-white p-4 rounded-full shadow-lg border-4 border-gray-50">
           <div className={`w-12 h-12 rounded-full flex items-center justify-center ${headerColorClass.replace('bg-', 'text-').replace('600', '100').replace('700', '100').replace('800', '100')} bg-opacity-10`}>
              {headerIcon}
           </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mt-14 px-8 mb-8">
         <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
             <div 
               className={`h-full ${headerColorClass} transition-all duration-500 ease-out`}
               style={{ width: `${progressPercentage}%` }}
             ></div>
         </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-6 animate-fade-in">
         {children}
      </div>

      {/* Footer Actions */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-white/95 backdrop-blur-sm border-t border-gray-100 z-50 safe-area-bottom">
         <button 
            onClick={onNext}
            disabled={isNextDisabled}
            className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg flex items-center justify-center transition-all duration-300 transform ${
               isNextDisabled 
                 ? 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none' 
                 : `${headerColorClass} text-white hover:opacity-90 hover:shadow-xl hover:-translate-y-1 active:scale-95`
            }`}
         >
            {isNextDisabled ? (
                <span className="flex items-center text-base"><Lock className="w-4 h-4 mr-2" /> 请填写完整信息</span>
            ) : (
                <span className="flex items-center">
                    {nextLabel} 
                    {(nextLabel.includes('提交') || nextLabel.includes('完成') || nextLabel.includes('开始') || nextLabel.includes('接入') || nextLabel.includes('申请')) ? <CheckCircle className="w-5 h-5 ml-2" /> : <ArrowRight className="w-5 h-5 ml-2" />}
                </span>
            )}
         </button>
      </div>
    </div>
  );
};
