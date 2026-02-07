
import React, { useState } from 'react';
import { RecycledProduct, RecycledProductType, FacilityOperationalStatus, PromotionType, Order, OrderType } from '../types';
import { Search, MapPin, Phone, Filter, ShoppingBag, ArrowUpRight, AlertCircle, Info, Gift, TrendingDown, Factory, Building2, Wallet } from 'lucide-react';

interface MarketplaceViewProps {
  products: RecycledProduct[];
  orders?: Order[]; // Added orders to show demands
}

export const MarketplaceView: React.FC<MarketplaceViewProps> = ({ products, orders = [] }) => {
  const [activeTab, setActiveTab] = useState<'SUPPLY' | 'DEMAND'>('SUPPLY');
  const [filterType, setFilterType] = useState<RecycledProductType | 'ALL'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Filter Supply Products
  const filteredProducts = products.filter(p => {
    const matchesType = filterType === 'ALL' || p.type === filterType;
    const matchesSearch = 
      p.quantity.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.facilityName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getProductTypeName(p.type).includes(searchTerm);
    return matchesType && matchesSearch;
  });

  // Filter Demand Orders (Enterprise Procurement)
  const procurementOrders = orders.filter(o => 
    o.orderType === OrderType.RECYCLE_TRADE && 
    o.tradeDirection === 'BUY' &&
    o.status !== 'COMPLETED'
  );

  const clearanceProducts = products.filter(p => p.promotionType === PromotionType.FREE || p.promotionType === PromotionType.DISCOUNT);

  return (
    <div className="pb-24">
      {/* Hero Header */}
      <div className="bg-emerald-700 text-white p-6 rounded-b-[2rem] shadow-lg mb-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl transform translate-x-10 -translate-y-10"></div>
        <div className="relative z-10">
          <h1 className="text-2xl font-bold mb-1">再生资源交易平台</h1>
          <p className="text-emerald-100 text-sm mb-4">绿色循环 · 骨料 · 低值可回收物</p>
          
          <div className="relative">
             <Search className="absolute left-3 top-3.5 text-gray-400 w-5 h-5" />
             <input 
               type="text" 
               placeholder="搜索资源 (如: 石子, 废铁, 玻璃...)"
               className="w-full pl-10 pr-4 py-3 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-400 shadow-lg"
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
             />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 mb-4 flex justify-center">
         <div className="bg-gray-100 p-1 rounded-xl flex w-full max-w-sm">
            <button 
               onClick={() => setActiveTab('SUPPLY')}
               className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'SUPPLY' ? 'bg-white text-emerald-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
               <Factory className="w-4 h-4 inline-block mr-1 mb-0.5" /> 找货源 (供应)
            </button>
            <button 
               onClick={() => setActiveTab('DEMAND')}
               className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'DEMAND' ? 'bg-white text-purple-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
               <Building2 className="w-4 h-4 inline-block mr-1 mb-0.5" /> 接订单 (需求)
            </button>
         </div>
      </div>

      {/* SUPPLY TAB CONTENT */}
      {activeTab === 'SUPPLY' && (
      <div className="animate-fade-in">
        {/* Emergency Clearance Banner */}
        {clearanceProducts.length > 0 && (
            <div className="px-4 mb-6">
                <div className="bg-gradient-to-r from-red-600 to-orange-500 rounded-xl shadow-lg p-4 text-white relative overflow-hidden">
                <div className="relative z-10 flex justify-between items-center">
                    <div>
                        <h2 className="font-bold text-lg flex items-center">
                            <AlertCircle className="w-5 h-5 mr-2 text-yellow-300" />
                            爆仓清库 · 紧急大促
                        </h2>
                        <p className="text-xs text-red-100 mt-1">
                            部分消纳场库存积压，再生骨料 <span className="font-bold text-yellow-300">免费赠送</span> 或 <span className="font-bold text-yellow-300">超低价</span> 处理中！
                        </p>
                    </div>
                    <div className="bg-white/20 p-2 rounded-full backdrop-blur-sm animate-pulse">
                        <TrendingDown className="w-6 h-6 text-white" />
                    </div>
                </div>
                </div>
            </div>
        )}

        {/* Categories */}
        <div className="px-4 mb-6 overflow-x-auto no-scrollbar">
            <div className="flex gap-3">
                <CategoryChip 
                label="全部" 
                isActive={filterType === 'ALL'} 
                onClick={() => setFilterType('ALL')} 
                />
                <CategoryChip 
                label="再生石子" 
                isActive={filterType === RecycledProductType.GRAVEL} 
                onClick={() => setFilterType(RecycledProductType.GRAVEL)} 
                />
                <CategoryChip 
                label="石粉" 
                isActive={filterType === RecycledProductType.STONE_POWDER} 
                onClick={() => setFilterType(RecycledProductType.STONE_POWDER)} 
                />
                <CategoryChip 
                label="废铁/金属" 
                isActive={filterType === RecycledProductType.SCRAP_IRON} 
                onClick={() => setFilterType(RecycledProductType.SCRAP_IRON)} 
                />
                <CategoryChip 
                label="废木材" 
                isActive={filterType === RecycledProductType.WOOD} 
                onClick={() => setFilterType(RecycledProductType.WOOD)} 
                />
                <CategoryChip 
                label="废塑料" 
                isActive={filterType === RecycledProductType.PLASTIC} 
                onClick={() => setFilterType(RecycledProductType.PLASTIC)} 
                />
                <CategoryChip 
                label="废玻璃" 
                isActive={filterType === RecycledProductType.GLASS} 
                onClick={() => setFilterType(RecycledProductType.GLASS)} 
                />
            </div>
        </div>

        {/* Product Grid */}
        <div className="px-4">
            <h2 className="font-bold text-gray-800 mb-4 flex items-center">
                <ShoppingBag className="w-5 h-5 mr-2 text-emerald-600" />
                热门资源 ({filteredProducts.length})
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredProducts.map(product => (
                <div key={product.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow relative">
                    
                    {/* Promotion Badge */}
                    {product.promotionType === PromotionType.FREE && (
                        <div className="absolute top-0 right-0 z-20 bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-bl-xl shadow-md flex items-center">
                            <Gift className="w-3 h-3 mr-1" /> 免费赠送
                        </div>
                    )}
                    {product.promotionType === PromotionType.DISCOUNT && (
                        <div className="absolute top-0 right-0 z-20 bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-bl-xl shadow-md flex items-center">
                            <TrendingDown className="w-3 h-3 mr-1" /> 紧急促销
                        </div>
                    )}

                    <div className="h-40 relative bg-gray-100">
                        <img src={product.imageUrl} className="w-full h-full object-cover" alt="Resource" />
                        <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md text-white text-xs px-2 py-1 rounded">
                            {getProductTypeName(product.type)}
                        </div>
                        
                        {/* Facility Status Badge */}
                        {product.facilityStatus === FacilityOperationalStatus.FULL && (
                            <div className="absolute bottom-2 right-2 bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded animate-pulse flex items-center">
                            <AlertCircle className="w-3 h-3 mr-1" /> 爆仓清库
                            </div>
                        )}
                    </div>
                    <div className="p-4">
                        <div className="flex justify-between items-start mb-2">
                            <div>
                            <div className="text-sm font-bold text-gray-800">{product.facilityName || '认证处置中心'}</div>
                            <div className="text-xs text-gray-500 flex items-center mt-1">
                                <MapPin className="w-3 h-3 mr-1" />
                                {product.facilityLocation || '未知地点'}
                            </div>
                            {product.facilitySpecialty && (
                                <div className="text-[10px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded mt-1 w-fit">
                                    主营: {product.facilitySpecialty}
                                </div>
                            )}
                            </div>
                            <div className="text-right">
                            <div className={`text-lg font-bold ${product.promotionType === PromotionType.FREE ? 'text-red-600' : 'text-emerald-600'}`}>
                                {product.promotionType === PromotionType.FREE ? '免费' : `¥${product.estimatedValue}`}
                            </div>
                            <div className="text-xs text-gray-400">
                                {product.promotionType === PromotionType.FREE ? '仅限自提' : '预估总价'}
                            </div>
                            </div>
                        </div>
                        
                        <div className="bg-gray-50 px-3 py-2 rounded-lg text-sm text-gray-600 font-medium mb-4 flex justify-between">
                            <span>库存数量</span>
                            <span>{product.quantity}</span>
                        </div>

                        <button 
                            onClick={() => alert(`拨打商家电话: ${product.contactPhone || '400-888-8888'}`)}
                            className={`w-full py-2.5 font-bold rounded-lg transition-colors flex items-center justify-center text-sm ${
                            product.promotionType === PromotionType.FREE 
                            ? 'bg-red-50 text-red-600 hover:bg-red-100'
                            : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                            }`}
                        >
                            <Phone className="w-4 h-4 mr-2" />
                            {product.promotionType === PromotionType.FREE ? '联系免费拉货' : '联系卖家'}
                        </button>
                    </div>
                </div>
                ))}

                {filteredProducts.length === 0 && (
                <div className="col-span-full text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                    <p className="text-gray-400">暂无该类资源</p>
                </div>
                )}
            </div>
        </div>
      </div>
      )}

      {/* DEMAND TAB CONTENT */}
      {activeTab === 'DEMAND' && (
         <div className="px-4 animate-fade-in">
             <div className="bg-purple-50 p-4 rounded-xl border border-purple-100 mb-6 flex items-start gap-3">
                 <div className="bg-purple-100 p-2 rounded-full text-purple-600 mt-0.5">
                     <Building2 className="w-5 h-5" />
                 </div>
                 <div>
                     <h3 className="font-bold text-purple-800 text-sm">企业采购大厅</h3>
                     <p className="text-xs text-purple-600 mt-1">
                         展示大型建筑企业发布的物资采购需求。处置场和供应商可在此接单供货，车队可寻找运输机会。
                     </p>
                 </div>
             </div>

             <div className="grid grid-cols-1 gap-4">
                 {procurementOrders.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-200">
                        <ShoppingBag className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                        <p className="text-gray-400 text-sm">暂无活跃采购需求</p>
                    </div>
                 ) : (
                    procurementOrders.map(order => (
                       <div key={order.id} className="bg-white rounded-xl shadow-md border-l-4 border-purple-500 overflow-hidden relative">
                           <div className="p-4">
                               <div className="flex justify-between items-start mb-3">
                                   <div className="flex items-center gap-2">
                                       <div className="bg-purple-100 text-purple-700 font-bold p-2 rounded-lg">
                                           <Building2 className="w-5 h-5" />
                                       </div>
                                       <div>
                                           <div className="text-xs text-gray-400">采购方</div>
                                           <div className="font-bold text-gray-800 text-sm">认证建筑企业</div>
                                       </div>
                                   </div>
                                   <div className="text-right">
                                       <div className="text-xs text-gray-400 flex items-center justify-end">
                                           <Wallet className="w-3 h-3 mr-1" /> 目标出价
                                       </div>
                                       <div className="text-xl font-bold text-purple-600">¥{order.buyRequirements?.targetPrice?.toLocaleString()}</div>
                                   </div>
                               </div>

                               <div className="bg-gray-50 p-3 rounded-lg mb-3">
                                   <div className="flex justify-between items-center mb-1">
                                       <span className="text-xs text-gray-500 font-bold">需求物资</span>
                                       <span className="text-sm font-bold text-gray-800">{getProductTypeName(order.buyRequirements?.productType as RecycledProductType)}</span>
                                   </div>
                                   <div className="flex justify-between items-center">
                                       <span className="text-xs text-gray-500 font-bold">需求数量</span>
                                       <span className="text-sm font-bold text-gray-800">{order.buyRequirements?.quantity}</span>
                                   </div>
                               </div>

                               <div className="flex items-center text-xs text-gray-500 mb-4">
                                   <MapPin className="w-3 h-3 mr-1" />
                                   <span>送货地址: {order.pickupDetails?.district} {order.pickupDetails?.street}</span>
                               </div>

                               <button 
                                  onClick={() => alert("请切换至【处置端】或【司机端】进行响应接单")}
                                  className="w-full py-3 bg-purple-600 text-white font-bold rounded-lg shadow hover:bg-purple-700 flex items-center justify-center"
                               >
                                  <ArrowUpRight className="w-4 h-4 mr-2" /> 立即响应供货 / 报价
                               </button>
                           </div>
                       </div>
                    ))
                 )}
             </div>
         </div>
      )}
    </div>
  );
};

const CategoryChip = ({ label, isActive, onClick }: { label: string, isActive: boolean, onClick: () => void }) => (
   <button 
     onClick={onClick}
     className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
        isActive 
        ? 'bg-emerald-600 text-white shadow-md' 
        : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
     }`}
   >
      {label}
   </button>
);

const getProductTypeName = (type: RecycledProductType) => {
    const map: Record<string, string> = {
      STONE_POWDER: '石粉',
      GRAVEL: '再生石子',
      LIGHT_MATERIAL: '轻物质',
      SCRAP_IRON: '废铁/金属',
      WOOD: '废木材',
      PLASTIC: '废塑料',
      GLASS: '废玻璃',
      OTHER: '其他资源'
    };
    return map[type] || type;
};
