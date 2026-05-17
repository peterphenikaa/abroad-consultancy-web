import React, { useState } from 'react';
import { BarChart3, PieChart, Activity, Info, TrendingUp, Maximize2 } from 'lucide-react';
import { motion } from 'framer-motion';

const DEFAULT_CHART_DATA = [
    { label: 'Tháng 1', value: 45, color: 'bg-blue-500' },
    { label: 'Tháng 2', value: 60, color: 'bg-indigo-500' },
    { label: 'Tháng 3', value: 35, color: 'bg-violet-500' },
    { label: 'Tháng 4', value: 80, color: 'bg-purple-500' },
    { label: 'Tháng 5', value: 55, color: 'bg-fuchsia-500' },
    { label: 'Tháng 6', value: 90, color: 'bg-pink-500' },
];

const InfographicPlayer = ({ title, description, data = DEFAULT_CHART_DATA, imageUrl }) => {
    const [activeTab, setActiveTab] = useState('chart'); 
    const [selectedDataPoint, setSelectedDataPoint] = useState(null);

    const currentData = data && data.length > 0 ? data : DEFAULT_CHART_DATA;
    const maxValue = Math.max(...currentData.map(d => d.value));

    return (
        <div className="w-full max-w-5xl mx-auto my-8 lg:my-12 bg-white rounded-3xl p-8 border border-gray-200 shadow-sm flex flex-col gap-6">
            {title && (
                <h3 className="text-xl font-semibold text-slate-800 mb-2">
                    {title}
                </h3>
            )}

            <div className="flex bg-white rounded-lg p-1 border border-slate-200 w-fit shadow-sm">
                <button
                    onClick={() => setActiveTab('chart')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'chart' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'
                        }`}
                >
                    <BarChart3 className="w-4 h-4" />
                    Biểu đồ động
                </button>
                {imageUrl && (
                    <button
                        onClick={() => setActiveTab('image')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'image' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'
                            }`}
                    >
                        <PieChart className="w-4 h-4" />
                        Hình đồ họa
                    </button>
                )}
                <button
                    onClick={() => setActiveTab('details')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'details' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'
                        }`}
                >
                    <Info className="w-4 h-4" />
                    Phân tích chi tiết
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden min-h-[350px]">
                {activeTab === 'chart' && (
                    <div className="p-6 flex flex-col h-full">
                        <div className="flex items-center justify-between mb-10">
                            <h4 className="text-lg font-medium text-slate-800 flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-indigo-500" />
                                Dữ liệu trực quan
                            </h4>
                            {selectedDataPoint && (
                                <div className="bg-indigo-50 px-4 py-2 rounded-lg text-sm border border-indigo-100 animate-in fade-in zoom-in duration-200 flex gap-2">
                                    <span className="text-indigo-600/70 font-medium">{selectedDataPoint.label}:</span>
                                    <span className="font-bold text-indigo-700 text-base">{selectedDataPoint.value}</span>
                                </div>
                            )}
                        </div>

                        <div className="flex-grow flex items-end gap-4 sm:gap-8 justify-around pt-10 h-72 border-b border-slate-200 relative pb-2 px-4 mt-auto">
                            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-8 opacity-40">
                                {[...Array(5)].map((_, i) => (
                                    <div key={i} className="w-full border-t border-dashed border-slate-300 flex-grow" />
                                ))}
                            </div>

                            {currentData.map((item, index) => {
                                const heightPercentage = (item.value / maxValue) * 100;
                                const isSelected = selectedDataPoint?.label === item.label;

                                return (
                                    <div key={index} className="flex flex-col items-center gap-3 z-10 w-full relative group h-full justify-end">
                                        <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white text-xs py-1.5 px-3 rounded-md whitespace-nowrap pointer-events-none shadow-lg z-20">
                                            <span className="font-semibold">{item.value}</span> đơn vị
                                            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
                                        </div>

                                        <motion.div
                                            initial={{ height: 0 }}
                                            animate={{ height: `${heightPercentage}%` }}
                                            transition={{ duration: 0.8, delay: index * 0.1, type: "spring", bounce: 0.3 }}
                                            onMouseEnter={() => setSelectedDataPoint(item)}
                                            onMouseLeave={() => setSelectedDataPoint(null)}
                                            className={`w-full max-w-[3rem] sm:max-w-[4rem] rounded-t-md cursor-pointer transition-all duration-300 ${item.color || 'bg-indigo-500'} ${isSelected ? 'brightness-110 shadow-[0_0_15px_rgba(79,70,229,0.3)] scale-y-[1.02] transform-origin-bottom' : 'hover:brightness-110 opacity-85'}`}
                                        />
                                        <span className="text-sm font-medium text-slate-600 truncate max-w-full px-1">{item.label}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {activeTab === 'image' && imageUrl && (
                    <div className="p-6 flex flex-col items-center justify-center min-h-[350px] bg-slate-50/50 relative group">
                        <img src={imageUrl} alt={title || 'Infographic'} className="max-h-[400px] object-contain rounded-lg shadow-sm border border-slate-200 bg-white p-2" />
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center bg-slate-900/5 cursor-zoom-in rounded-xl">
                            <div className="bg-white p-3 rounded-full shadow-lg text-slate-800 transform scale-90 group-hover:scale-100 transition-transform">
                                <Maximize2 className="w-6 h-6" />
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'details' && (
                    <div className="p-8">
                        <h4 className="text-lg font-medium text-slate-800 mb-4 flex items-center gap-2 border-b border-slate-100 pb-3">
                            <Activity className="w-5 h-5 text-indigo-500" />
                            Khái quát nội dung đồ họa
                        </h4>
                        <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed text-[15px]">
                            {description ? (
                                <div dangerouslySetInnerHTML={{ __html: description }} />
                            ) : (
                                <p>
                                    Infographic này cung cấp thông tin thống kê và báo cáo trực quan giúp người học dễ dàng nắm bắt dữ liệu phức tạp.
                                    Các số liệu được thu thập và cập nhật từ các nguồn uy tín, được biến đổi dưới dạng đồ thị cột động phía trước nhằm đảm bảo tính trực quan.
                                </p>
                            )}

                            <div className="mt-8 bg-gradient-to-r from-indigo-50/80 to-blue-50/80 border border-indigo-100/60 rounded-xl p-5 shadow-sm">
                                <h5 className="font-semibold text-indigo-800 mb-3 flex items-center gap-2">
                                    <Info className="w-4 h-4" /> Điểm kết luận chính:
                                </h5>
                                <ul className="space-y-2">
                                    <li className="flex items-center gap-2 text-indigo-700/80">
                                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 block shrink-0"></span>
                                        Giá trị đỉnh điểm đạt <strong>{maxValue}</strong> tại <strong>{currentData.find(d => d.value === maxValue)?.label || '...'}</strong>
                                    </li>
                                    <li className="flex items-center gap-2 text-indigo-700/80">
                                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 block shrink-0"></span>
                                        Giá trị thấp nhất đạt <strong>{Math.min(...currentData.map(d => d.value))}</strong> tại <strong>{currentData.find(d => d.value === Math.min(...currentData.map(d => d.value)))?.label || '...'}</strong>
                                    </li>
                                    <li className="flex items-center gap-2 text-indigo-700/80">
                                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 block shrink-0"></span>
                                        Biểu đồ phản ánh chuỗi biến động qua <strong>{currentData.length}</strong> mốc dữ liệu
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default InfographicPlayer;