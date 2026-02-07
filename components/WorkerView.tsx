

import React, { useState, useRef } from 'react';
import { WorkerProfile, Order, OrderStatus, OrderType, MediaType, GeoLocation, PickupDetails, WasteType } from '../types';
import { Hammer, UserCog, Package, Camera, MapPin, Upload, Phone, CheckCircle, Truck, Construction, X } from 'lucide-react';

interface WorkerViewProps {
  profile: WorkerProfile;
  orders: Order[]; // All orders, we filter for service types
  addOrder: (order: Order) => void;
  updateStatus: (orderId: string, status: OrderStatus, data?: any) => void;
}

export const WorkerView: React.FC<WorkerViewProps> = ({ profile, orders, addOrder, updateStatus }) => {
  const [activeTab, setActiveTab] = useState<'HALL' | 'MY_JOBS' | 'POST_WASTE'>('HALL');
  
  // Post Waste State (Simplified)
  const [mediaData, setMediaData] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<MediaType>('IMAGE');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filter Service Orders (Demolition & Labor)
  const serviceOrders = orders.filter(o => 
      (o.orderType === OrderType.DEMOLITION || o.orderType === OrderType.LABOR) &&
      o.status === OrderStatus.PENDING_PICKUP &&
      !o.assignedWorker
  );

  const myJobs = orders.filter(o => 
      o.assignedWorker?.name === profile.name
  );

  const myWasteOrders = orders.filter(o => 
      o.userId === `worker-${profile.id}`
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const isVideo = file.type.startsWith('video/');
      setMediaType(isVideo ? 'VIDEO' : 'IMAGE');
      const reader = new FileReader();
      reader.onloadend = () => setMediaData(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleAcceptJob = (order: Order) => {
      // Assign self to order
      updateStatus(order.id, OrderStatus.IN_PROGRESS, {
          assignedWorker: {
              name: profile.name,
              phone: profile.phone,
              teamName: profile.teamName
          }
      });
      alert("抢单成功！请尽快联系客户。");
      setActiveTab('MY_JOBS');
  };

  const handlePostWaste = () => {
      if (!mediaData) {
          alert("请上传垃圾照片");
          return;
      }
      
      const newOrder: Order = {
          id: `worker-waste-${Date.now()}`,
          userId: `worker-${profile.id}`,
          createdAt: Date.now(),
          status: OrderStatus.ANALYZING, // Standard flow
          orderType: OrderType.WASTE_REMOVAL,
          location: { lat: 31.22, lng: 121.48, address: '作业现场' },
          pickupDetails: {
              city: '上海市', district: '浦东新区', street: '施工现场路边', community: '', isCollected: true, locationType: 'STREET_SIDE'
          },
          mediaType: mediaType,
          mediaData: mediaData,
          paymentStatus: 'UNPAID'
      };
      
      addOrder(newOrder);
      setMediaData(null);
      alert("清运订单已发布！正在等待司机接单。");
  };

  return (
    <div className="pb-24 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-yellow-600 text-white p-6 rounded-b-[2rem] shadow-lg mb-6 relative overflow-hidden">
         <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl transform translate-x-10 -translate-y-10"></div>
         <div className="relative z-10">
             <div className="flex justify-between items-start">
                 <div>
                    <h1 className="text-2xl font-bold flex items-center">
                        <Construction className="w-6 h-6 mr-2" /> 工队工作台
                    </h1>
                    <p className="text-yellow-100 text-sm mt-1">{profile.teamName || profile.name}</p>
                 </div>
                 <div className="bg-yellow-700/50 px-3 py-1 rounded-full text-xs font-bold border border-yellow-500/30">
                    {profile.skills.join('/')}
                 </div>
             </div>
             
             <div className="grid grid-cols-2 gap-3 mt-6">
                <div className="bg-yellow-700/40 p-3 rounded-xl border border-yellow-500/30 text-center">
                   <div className="text-xs text-yellow-200 mb-1">已完工</div>
                   <div className="text-xl font-bold">{myJobs.filter(o => o.status === OrderStatus.COMPLETED).length}</div>
                </div>
                <div className="bg-yellow-700/40 p-3 rounded-xl border border-yellow-500/30 text-center">
                   <div className="text-xs text-yellow-200 mb-1">清运支出</div>
                   <div className="text-xl font-bold text-white">¥{myWasteOrders.length * 200}</div>
                </div>
             </div>
         </div>
      </div>

      {/* Tabs */}
      <div className="px-4 mb-4">
         <div className="bg-white p-1 rounded-xl shadow-sm border border-gray-100 flex">
            <button 
               onClick={() => setActiveTab('HALL')}
               className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${activeTab === 'HALL' ? 'bg-yellow-50 text-yellow-700 shadow-sm' : 'text-gray-500'}`}
            >
               接单大厅
            </button>
            <button 
               onClick={() => setActiveTab('MY_JOBS')}
               className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${activeTab === 'MY_JOBS' ? 'bg-yellow-50 text-yellow-700 shadow-sm' : 'text-gray-500'}`}
            >
               我的任务
            </button>
            <button 
               onClick={() => setActiveTab('POST_WASTE')}
               className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${activeTab === 'POST_WASTE' ? 'bg-yellow-50 text-yellow-700 shadow-sm' : 'text-gray-500'}`}
            >
               我要清运
            </button>
         </div>
      </div>

      <div className="px-4 space-y-6">
          
          {/* JOB HALL */}
          {activeTab === 'HALL' && (
             <div className="space-y-4 animate-fade-in">
                 {serviceOrders.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-200">
                        <p className="text-gray-400">暂无合适的新订单</p>
                    </div>
                 ) : (
                    serviceOrders.map(order => (
                       <div key={order.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 relative overflow-hidden">
                           <div className="absolute top-0 right-0 bg-yellow-500 text-white text-[10px] font-bold px-2 py-1 rounded-bl-lg">
                               {order.orderType === OrderType.DEMOLITION ? '打拆' : '搬运'}
                           </div>
                           
                           <h3 className="font-bold text-gray-800 text-sm mb-2">{order.pickupDetails?.street}</h3>
                           
                           <div className="bg-gray-50 p-3 rounded-lg mb-3 space-y-2">
                               {order.orderType === OrderType.DEMOLITION && (
                                   <div className="flex justify-between text-sm">
                                       <span className="text-gray-500">类型: {order.demolitionDetails?.demolitionType === 'WALL' ? '拆墙' : '拆旧'}</span>
                                       <span className="font-bold text-gray-800">{order.demolitionDetails?.area} 平米</span>
                                   </div>
                               )}
                               {order.orderType === OrderType.LABOR && (
                                   <div className="flex justify-between text-sm">
                                       <span className="text-gray-500">{order.laborDetails?.useForklift ? '需叉车' : '人工搬运'}</span>
                                       <span className="font-bold text-gray-800">{order.laborDetails?.workerCount} 人</span>
                                   </div>
                               )}
                           </div>
                           
                           <button 
                              onClick={() => handleAcceptJob(order)}
                              className="w-full py-3 bg-yellow-600 text-white font-bold rounded-lg shadow hover:bg-yellow-700"
                           >
                              立即接单
                           </button>
                       </div>
                    ))
                 )}
             </div>
          )}

          {/* MY JOBS */}
          {activeTab === 'MY_JOBS' && (
             <div className="space-y-4 animate-fade-in">
                 {myJobs.length === 0 ? (
                    <div className="text-center py-10 bg-white rounded-xl text-gray-400">暂无进行中的任务</div>
                 ) : (
                    myJobs.map(order => (
                       <div key={order.id} className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-yellow-500">
                           <div className="flex justify-between mb-2">
                               <span className="font-bold text-gray-800 text-sm">订单号: {order.id.slice(-6)}</span>
                               <span className="text-xs text-yellow-600 font-bold bg-yellow-50 px-2 py-0.5 rounded">进行中</span>
                           </div>
                           <p className="text-sm text-gray-600 mb-3">{order.pickupDetails?.street}</p>
                           <button 
                              onClick={() => alert(`联系客户: 138-xxxx-xxxx`)}
                              className="w-full py-2 bg-gray-100 text-gray-600 font-bold rounded-lg text-sm flex items-center justify-center hover:bg-gray-200"
                           >
                              <Phone className="w-4 h-4 mr-2" /> 联系客户
                           </button>
                       </div>
                    ))
                 )}
             </div>
          )}

          {/* POST WASTE (Simplified Client Flow) */}
          {activeTab === 'POST_WASTE' && (
             <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 animate-fade-in">
                <div className="flex items-start gap-3 mb-4">
                    <Truck className="w-6 h-6 text-emerald-600 mt-1" />
                    <div>
                        <h3 className="font-bold text-gray-800">呼叫清运车辆</h3>
                        <p className="text-xs text-gray-500">打拆产生的建筑垃圾，直接在此下单清运。</p>
                    </div>
                </div>

                <div 
                   onClick={() => fileInputRef.current?.click()}
                   className="w-full h-40 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 flex flex-col items-center justify-center cursor-pointer relative overflow-hidden mb-4"
                >
                   {mediaData ? (
                      mediaType === 'VIDEO' ? <video src={mediaData} className="w-full h-full object-cover" /> : <img src={mediaData} className="w-full h-full object-cover" />
                   ) : (
                      <>
                         <Camera className="w-8 h-8 text-gray-400 mb-2" />
                         <span className="text-sm text-gray-500">拍摄垃圾堆放情况</span>
                      </>
                   )}
                   <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                </div>

                <button 
                   onClick={handlePostWaste}
                   disabled={!mediaData}
                   className={`w-full py-3 text-white font-bold rounded-xl shadow-lg ${mediaData ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-gray-300'}`}
                >
                   一键呼叫清运车
                </button>
                
                {/* Recent Waste Orders */}
                <div className="mt-6">
                    <h4 className="font-bold text-gray-700 text-xs uppercase mb-3">我的清运记录</h4>
                    {myWasteOrders.slice(0,3).map(o => (
                        <div key={o.id} className="text-xs bg-gray-50 p-2 rounded mb-2 flex justify-between">
                            <span>{new Date(o.createdAt).toLocaleDateString()}</span>
                            <span className={o.status === OrderStatus.COMPLETED ? 'text-green-600' : 'text-orange-600'}>{o.status}</span>
                        </div>
                    ))}
                </div>
             </div>
          )}

      </div>
    </div>
  );
};