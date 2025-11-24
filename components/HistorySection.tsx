
import React, { useState, useEffect, useMemo } from 'react';
import { YearRecord, Achievement, CompetitionCategory } from '../types';
import * as storage from '../services/storage';
import { Trophy, Edit, Save, Plus, X, Flag } from 'lucide-react';

interface HistorySectionProps {
  isAdmin: boolean;
}

const HistorySection: React.FC<HistorySectionProps> = ({ isAdmin }) => {
  const [records, setRecords] = useState<YearRecord[]>([]);
  const [filter, setFilter] = useState<'All' | CompetitionCategory>('All');
  
  // Editing State
  const [editingYearId, setEditingYearId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<YearRecord>>({});

  useEffect(() => {
    setRecords(storage.getRecords());
  }, []);

  // Prepare Chart Data (Chronological Order with Categorized Counts)
  const chartData = useMemo(() => {
    const sorted = [...records].sort((a, b) => parseInt(a.academicYear) - parseInt(b.academicYear));
    return sorted.map(r => ({
      year: r.academicYear,
      National: r.achievements.filter(a => a.category === 'National').length,
      Education: r.achievements.filter(a => a.category === 'Education').length,
      Other: r.achievements.filter(a => a.category === 'Other').length,
      All: r.achievements.length,
      // Check for championships
      isNationalChamp: r.achievements.some(a => a.category === 'National' && a.rank.includes('第一名')),
      isEduChamp: r.achievements.some(a => a.category === 'Education' && a.rank.includes('第一名'))
    }));
  }, [records]);

  // Chart Rendering Logic
  const width = 1000;
  const height = 400;
  const paddingY = 50;
  
  // Determine which lines to show based on filter
  // Requirement: Hide Total line if specific filter is applied
  const showTotal = filter === 'All';
  const showNational = filter === 'All' || filter === 'National';
  const showEducation = filter === 'All' || filter === 'Education';
  const showOther = filter === 'All' || filter === 'Other';

  // Calculate max count for Y-axis scale based on VISIBLE data
  const maxCount = useMemo(() => {
    if (chartData.length === 0) return 5;
    let max = 0;
    chartData.forEach(d => {
      const counts = [];
      if (showTotal) counts.push(d.All);
      if (showNational) counts.push(d.National);
      if (showEducation) counts.push(d.Education);
      if (showOther) counts.push(d.Other);
      max = Math.max(max, ...counts);
    });
    // Add generous buffer to top to prevent markers from clipping, especially when multiple markers stack
    return Math.max(max + 8, 10); 
  }, [chartData, showTotal, showNational, showEducation, showOther]);
  
  const getX = (index: number) => {
    if (chartData.length <= 1) return width / 2;
    // Stretch to full width (0 to width)
    return (index / (chartData.length - 1)) * width;
  };
  
  const getY = (count: number) => {
    return height - paddingY - (count / maxCount) * (height - paddingY * 2);
  };
  
  // Helper to generate path string
  const createPath = (key: 'National' | 'Education' | 'Other' | 'All') => {
    if (chartData.length === 0) return '';
    return `M ${getX(0)} ${getY(chartData[0][key])} ` + 
      chartData.slice(1).map((d, i) => `L ${getX(i + 1)} ${getY(d[key])}`).join(' ');
  };

  const getFilteredAchievements = (achievements: Achievement[]) => {
    if (filter === 'All') return achievements;
    return achievements.filter(a => a.category === filter);
  };

  const sortAchievements = (achievements: Achievement[]) => {
    const priority = { 'National': 0, 'Education': 1, 'Other': 2 };
    return [...achievements].sort((a, b) => priority[a.category] - priority[b.category]);
  };

  const handleEditClick = (record: YearRecord) => {
    setEditingYearId(record.id);
    setEditForm(JSON.parse(JSON.stringify(record))); // Deep copy
  };

  const handleSave = () => {
    if (!editingYearId || !editForm) return;

    const updatedRecords = records.map(r => 
      r.id === editingYearId ? { ...r, ...editForm } as YearRecord : r
    );

    setRecords(updatedRecords);
    storage.saveRecords(updatedRecords);
    setEditingYearId(null);
    setEditForm({});
  };

  const handleCancel = () => {
    setEditingYearId(null);
    setEditForm({});
  };

  const handleAchievementChange = (index: number, field: keyof Achievement, value: string) => {
    if (!editForm.achievements) return;
    const newAchievements = [...editForm.achievements];
    newAchievements[index] = { ...newAchievements[index], [field]: value };
    setEditForm({ ...editForm, achievements: newAchievements });
  };

  const handleAddAchievement = () => {
    if (!editForm.achievements) return;
    const newAch: Achievement = {
      id: Date.now().toString(),
      title: '新增得獎紀錄',
      rank: '名次',
      category: 'Other'
    };
    setEditForm({ ...editForm, achievements: [...editForm.achievements, newAch] });
  };

  const handleDeleteAchievement = (index: number) => {
    if (!editForm.achievements) return;
    const newAchievements = editForm.achievements.filter((_, i) => i !== index);
    setEditForm({ ...editForm, achievements: newAchievements });
  };

  const FilterButton = ({ type, label }: { type: 'All' | CompetitionCategory, label: string }) => (
    <button
      onClick={() => setFilter(type)}
      className={`px-4 py-2 rounded-full text-sm font-bold border transition-all
        ${filter === type 
          ? 'bg-sanyu-red border-sanyu-red text-white shadow-lg shadow-sanyu-red/50' 
          : 'bg-transparent border-gray-700 text-gray-400 hover:border-gray-500 hover:text-white'
        }`}
    >
      {label}
    </button>
  );

  return (
    // Added specific linear gradient stripe pattern for this section
    <section 
      id="history" 
      className="py-20 bg-sanyu-dark/95 relative backdrop-blur-sm border-t border-gray-900"
      style={{
        backgroundImage: `linear-gradient(45deg, rgba(255, 255, 255, 0.02) 25%, transparent 25%, transparent 50%, rgba(255, 255, 255, 0.02) 50%, rgba(255, 255, 255, 0.02) 75%, transparent 75%, transparent)`,
        backgroundSize: '40px 40px'
      }}
    >
      <div className="container mx-auto px-4 relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12">
          <div>
            <h2 className="text-4xl font-black italic uppercase tracking-tighter text-white mb-2">
              球隊大事記 <span className="text-sanyu-red">.</span>
            </h2>
            <p className="text-gray-400 max-w-lg">
              記錄自103學年度至今的榮耀軌跡。
            </p>
          </div>
          
          <div className="mt-6 md:mt-0 flex flex-wrap gap-2">
            <FilterButton type="All" label="全部" />
            <FilterButton type="National" label="全國賽" />
            <FilterButton type="Education" label="教育盃" />
            <FilterButton type="Other" label="其他盃賽" />
          </div>
        </div>

        {/* Tech Chart Section */}
        <div className="mb-16 bg-black/60 backdrop-blur-md border border-gray-800 rounded-xl p-6 relative group">
          <div className="absolute inset-0 bg-sanyu-red/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
              <span className="w-1 h-4 bg-sanyu-red"></span>
              歷年獎項統計趨勢
            </h3>
            {/* Chart Legend */}
            <div className="flex gap-4 text-xs font-bold flex-wrap">
              {showTotal && <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-sanyu-red border border-white/50"></span> 總獎項</div>}
              {showNational && <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-[#e6004c]"></span> 全國賽</div>}
              {showEducation && <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-[#eab308]"></span> 教育盃</div>}
              {showOther && <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-[#71717a]"></span> 其他</div>}
            </div>
          </div>
          
          <div className="w-full overflow-x-auto">
            <div className="min-w-[800px] h-64 md:h-80 relative">
              {chartData.length > 0 && (
                <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
                  <defs>
                    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="3" result="blur" />
                      <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                    <linearGradient id="totalGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#e6004c" />
                      <stop offset="100%" stopColor="#ff4d88" />
                    </linearGradient>
                  </defs>
                  
                  {/* Grid Lines */}
                  {[0, 0.25, 0.5, 0.75, 1].map((tick) => {
                    const y = height - paddingY - (tick * (height - paddingY * 2));
                    return (
                      <g key={tick}>
                        <line 
                          x1={0} 
                          y1={y} 
                          x2={width} 
                          y2={y} 
                          stroke="#333" 
                          strokeWidth="1" 
                          strokeDasharray="4 4" 
                        />
                        <text x={10} y={y - 5} textAnchor="start" fill="#555" fontSize="12">
                          {Math.round(tick * maxCount)}
                        </text>
                      </g>
                    );
                  })}

                  {/* Lines - Order matters for layering */}
                  {showOther && (
                    <path
                      d={createPath('Other')}
                      fill="none"
                      stroke="#71717a"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="opacity-40"
                    />
                  )}
                  {showEducation && (
                    <path
                      d={createPath('Education')}
                      fill="none"
                      stroke="#eab308"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="opacity-80"
                    />
                  )}
                  {showNational && (
                    <path
                      d={createPath('National')}
                      fill="none"
                      stroke="#e6004c"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="opacity-80"
                    />
                  )}

                  {/* Total Line (Conditional) */}
                  {showTotal && (
                    <path
                      d={createPath('All')}
                      fill="none"
                      stroke="url(#totalGradient)"
                      strokeWidth="4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      filter="url(#glow)"
                      className="drop-shadow-[0_0_8px_rgba(230,0,76,0.5)]"
                    />
                  )}

                  {/* Data Points */}
                  {chartData.map((d, i) => {
                    const x = getX(i);
                    // Determine where to anchor the point (highest visible line)
                    let anchorCount = 0;
                    if (showTotal) anchorCount = d.All;
                    else if (showNational) anchorCount = d.National;
                    else if (showEducation) anchorCount = d.Education;
                    else anchorCount = d.Other;

                    const y = getY(anchorCount);
                    
                    // Markers Logic: Strict filtering
                    const markers = [];
                    // Only show National marker if National filter is active (or All)
                    if ((filter === 'All' || filter === 'Education') && d.isEduChamp) {
                        markers.push({ type: 'Edu', color: '#eab308' });
                    }
                    if ((filter === 'All' || filter === 'National') && d.isNationalChamp) {
                        markers.push({ type: 'National', color: '#e6004c' });
                    }

                    // Tooltip Logic
                    const tooltipWidth = 140;
                    const tooltipHeight = 130; 
                    
                    // Clamping logic for X
                    let tooltipX = 0; // Relative offset from X
                    if (x < tooltipWidth / 2) {
                        tooltipX = (tooltipWidth / 2) - x; 
                    } else if (x > width - tooltipWidth / 2) {
                        tooltipX = (width - tooltipWidth / 2) - x;
                    }
                    
                    const rectX = -(tooltipWidth / 2) + tooltipX;

                    // Smart vertical positioning
                    // If the point is very high (small y value), flip tooltip below the point
                    const isHighPoint = y < 150; 
                    const tooltipYOffset = isHighPoint ? 20 : -160; 

                    return (
                      <g key={d.year} className="group/point cursor-pointer">
                         {/* X-Axis Label */}
                         <text x={x} y={height - paddingY + 25} textAnchor="middle" fill="#888" fontSize="14" className="group-hover/point:fill-white group-hover/point:font-bold transition-colors cursor-default">
                          {d.year}
                        </text>

                        {/* Hover Line */}
                        <line x1={x} y1={paddingY} x2={x} y2={height - paddingY} stroke="#444" strokeWidth="1" opacity="0" className="group-hover/point:opacity-100 transition-opacity" />

                        {/* Active Point Circle Group */}
                        <g transform={`translate(${x}, ${y})`}>
                            {/* Invisible Hit Area - LARGE FOR EASIER CLICKING */}
                            <circle r="25" fill="transparent" />
                            
                            {/* Visible Dot */}
                            <circle r="4" fill="#18181b" stroke={showTotal ? "#e6004c" : "#888"} strokeWidth="2" className="group-hover/point:r-6 transition-all" />
                        </g>
                        
                        {/* Special Markers (Strict Filtered) */}
                        {markers.map((m, idx) => {
                           const markerY = y - 20 - (idx * 25); // Stack upwards
                           return (
                              <g key={m.type} transform={`translate(${x}, ${markerY})`}>
                                 {m.type === 'Edu' && (
                                    <rect x="-6" y="-6" width="12" height="12" transform="rotate(45)" fill="#18181b" stroke={m.color} strokeWidth="3" />
                                 )}
                                 {m.type === 'National' && (
                                    <circle r="8" fill="#18181b" stroke={m.color} strokeWidth="3" strokeDasharray="2 1" />
                                 )}
                              </g>
                           )
                        })}

                        {/* Tooltip */}
                        <g transform={`translate(${x}, ${y})`} className="opacity-0 group-hover/point:opacity-100 transition-opacity pointer-events-none z-50">
                           <g transform={`translate(0, ${tooltipYOffset})`}>
                               {/* Tooltip Container */}
                               <rect 
                                x={rectX} 
                                y={0} 
                                width={tooltipWidth} 
                                height={tooltipHeight} 
                                rx="8" 
                                fill="#09090b" 
                                stroke="#333" 
                                strokeWidth="1" 
                                className="drop-shadow-2xl" 
                               />
                               
                               {/* Content centered relative to the rect */}
                               <g transform={`translate(${rectX + tooltipWidth / 2}, 0)`}>
                                    <text x={0} y={30} textAnchor="middle" fill="white" fontSize="18" fontWeight="bold" letterSpacing="1px">
                                        {d.year}學年度
                                    </text>
                                    <line x1={-60} y1={40} x2={60} y2={40} stroke="#333" strokeWidth="1" />
                                    
                                    {/* Vertical List */}
                                    <text x={-50} y={65} textAnchor="start" fill="#e6004c" fontSize="14" fontWeight="bold">
                                            全國賽：<tspan fill="#fff">{d.National}</tspan>
                                    </text>
                                    <text x={-50} y={90} textAnchor="start" fill="#eab308" fontSize="14" fontWeight="bold">
                                            教育盃：<tspan fill="#fff">{d.Education}</tspan>
                                    </text>
                                    <text x={-50} y={115} textAnchor="start" fill="#71717a" fontSize="14" fontWeight="bold">
                                            其他：<tspan fill="#fff">{d.Other}</tspan>
                                    </text>
                               </g>
                           </g>
                        </g>
                      </g>
                    );
                  })}
                </svg>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-12">
          {records.map((record) => {
            const isEditing = editingYearId === record.id;
            const achievementsToShow = isEditing 
              ? (editForm.achievements || []) 
              : sortAchievements(getFilteredAchievements(record.achievements));

            if (!isEditing && filter !== 'All' && achievementsToShow.length === 0) return null;

            return (
              <div key={record.id} className="relative pl-8 md:pl-0">
                {/* Timeline Line (Desktop) */}
                <div className="hidden md:block absolute left-[8.33%] top-0 bottom-0 w-px bg-gray-800"></div>
                
                <div className="grid md:grid-cols-12 gap-8">
                  {/* Year Column */}
                  <div className="md:col-span-2 md:text-right relative">
                    <div className="md:sticky md:top-24">
                      <h3 className="text-5xl font-black text-white/10 absolute -top-4 right-0 md:right-4 z-0 pointer-events-none select-none">
                        {record.academicYear}
                      </h3>
                      <h3 className="text-3xl font-black text-sanyu-red relative z-10">
                        {record.academicYear} <span className="text-sm font-normal text-white">學年度</span>
                      </h3>
                      {isAdmin && !isEditing && (
                        <button 
                          onClick={() => handleEditClick(record)}
                          className="mt-2 text-xs bg-gray-800 hover:bg-gray-700 text-white px-2 py-1 rounded inline-flex items-center gap-1 transition-colors"
                        >
                          <Edit size={12} /> 編輯
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Content Column */}
                  <div className="md:col-span-10 bg-black/40 border border-white/5 rounded-2xl p-6 md:p-8 hover:border-sanyu-red/30 transition-colors backdrop-blur-sm">
                    {isEditing ? (
                      /* Edit Mode Form */
                      <div className="space-y-4">
                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <label className="text-xs text-gray-500 uppercase block mb-1">教練</label>
                            <input 
                              className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white"
                              value={editForm.coaches || ''}
                              onChange={(e) => setEditForm({...editForm, coaches: e.target.value})}
                            />
                          </div>
                          <div>
                            <label className="text-xs text-gray-500 uppercase block mb-1">年度簡介</label>
                            <textarea 
                              className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white h-20"
                              value={editForm.description || ''}
                              onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                            />
                          </div>
                        </div>

                        <div className="border-t border-gray-800 pt-4">
                          <div className="flex justify-between items-center mb-2">
                            <h4 className="font-bold text-gray-400">得獎紀錄</h4>
                            <button onClick={handleAddAchievement} className="text-xs bg-green-900 text-green-300 px-2 py-1 rounded hover:bg-green-800">
                              <Plus size={12} /> 新增
                            </button>
                          </div>
                          <div className="space-y-2">
                            {editForm.achievements?.map((ach, idx) => (
                              <div key={idx} className="flex gap-2 items-center bg-gray-900 p-2 rounded">
                                <input 
                                  className="flex-1 bg-transparent border-b border-gray-700 text-sm" 
                                  value={ach.title} 
                                  onChange={(e) => handleAchievementChange(idx, 'title', e.target.value)}
                                  placeholder="比賽名稱"
                                />
                                <input 
                                  className="w-24 bg-transparent border-b border-gray-700 text-sm" 
                                  value={ach.rank} 
                                  onChange={(e) => handleAchievementChange(idx, 'rank', e.target.value)}
                                  placeholder="名次"
                                />
                                <select 
                                  className="bg-black border border-gray-700 text-xs rounded"
                                  value={ach.category}
                                  onChange={(e) => handleAchievementChange(idx, 'category', e.target.value as any)}
                                >
                                  <option value="National">全國賽</option>
                                  <option value="Education">教育盃</option>
                                  <option value="Other">其他</option>
                                </select>
                                <button onClick={() => handleDeleteAchievement(idx)} className="text-red-500 hover:text-red-400">
                                  <X size={16} />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-4">
                          <button onClick={handleCancel} className="px-4 py-2 rounded text-gray-400 hover:bg-gray-800">取消</button>
                          <button onClick={handleSave} className="px-4 py-2 rounded bg-sanyu-red text-white flex items-center gap-2 hover:bg-red-700">
                            <Save size={16} /> 儲存變更
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* View Mode */
                      <>
                        <div className="mb-6">
                          <div className="flex items-center gap-2 text-sanyu-red mb-2 text-sm font-bold uppercase tracking-wider">
                            <Flag size={16} />
                            <span>教練團</span>
                          </div>
                          <p className="text-white font-medium mb-3">{record.coaches}</p>
                          <p className="text-gray-400 text-sm leading-relaxed border-l-2 border-gray-700 pl-4">
                            {record.description}
                          </p>
                        </div>

                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {achievementsToShow.map((ach) => (
                            <div 
                              key={ach.id} 
                              className={`
                                p-4 rounded-lg border flex flex-col justify-between h-full transition-transform hover:-translate-y-1
                                ${ach.category === 'National' 
                                  ? 'bg-gradient-to-br from-sanyu-red/20 to-black border-sanyu-red/50' 
                                  : ach.category === 'Education' 
                                    ? 'bg-gradient-to-br from-yellow-900/20 to-black border-yellow-700/50' 
                                    : 'bg-zinc-900 border-zinc-800'}
                              `}
                            >
                              <div className="mb-3">
                                <span className={`
                                  text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider
                                  ${ach.category === 'National' ? 'bg-sanyu-red/50 text-white' 
                                    : ach.category === 'Education' ? 'bg-yellow-900/50 text-yellow-500' 
                                    : 'bg-gray-800 text-gray-400'}
                                `}>
                                  {ach.category === 'National' ? '全國賽' : ach.category === 'Education' ? '教育盃' : '其他'}
                                </span>
                                <h4 className="text-white font-bold mt-2 leading-tight">{ach.title}</h4>
                              </div>
                              <div className="flex items-center gap-2 text-sm font-semibold text-gray-300 border-t border-white/5 pt-2">
                                <Trophy size={14} className={ach.category === 'National' ? 'text-yellow-500' : 'text-gray-500'} />
                                <span>{ach.rank}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default HistorySection;
