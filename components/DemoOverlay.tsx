import React from 'react';
import { Loader2 } from 'lucide-react';

interface DemoOverlayProps {
  step: number;
}

const DEMO_STEPS = [
    "场景一: 用户端 - 首页概览", 
    "场景一: 用户端 - 模拟一键下单 (AI 识别)",
    "场景二: 司机端 - 接收订单推送",
    "场景二: 司机端 - 司机接单并开始执行",
    "场景三: 车队端 - 实时监控与调度",
    "场景三: 车队端 - 处置场爆仓预警监控",
    "场景四: 处置端 - 车辆入场核验",
    "场景四: 处置端 - 确认收货与联单生成",
    "场景五: 政府端 - 城市数据大脑监控",
    "场景六: 交易集市 - 循环经济闭环",
    "演示结束"
];

export const DemoOverlay: React.FC<DemoOverlayProps> = ({ step }) => {
  const currentText = DEMO_STEPS[step] || "演示运行中...";
  const progress = (step / (DEMO_STEPS.length - 1)) * 100;

  return (
    <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-[100] w-full max-w-sm px-4 pointer-events-none">
       <div className="bg-black/80 backdrop-blur-md text-white rounded-xl p-4 shadow-2xl border border-white/10 animate-fade-in-down">
          <div className="flex items-center justify-between mb-2">
             <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                <span className="font-bold text-sm tracking-wide">AUTO DEMO MODE</span>
             </div>
             <span className="text-xs font-mono text-gray-400">{step + 1} / {DEMO_STEPS.length}</span>
          </div>
          
          <div className="text-lg font-bold mb-3 text-center py-2">
             {currentText}
          </div>

          <div className="w-full bg-gray-700 h-1 rounded-full overflow-hidden">
             <div 
               className="h-full bg-purple-500 transition-all duration-1000 ease-linear" 
               style={{ width: `${progress}%` }}
             ></div>
          </div>
       </div>
    </div>
  );
};