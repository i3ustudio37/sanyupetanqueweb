import React, { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, isToday } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, Clock, Trash2 } from 'lucide-react';
import { CalendarEvent } from '../types';
import * as storage from '../services/storage';

interface CalendarSectionProps {
  isAdmin: boolean;
}

const CalendarSection: React.FC<CalendarSectionProps> = ({ isAdmin }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  
  // New Event Form State
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventTime, setNewEventTime] = useState('');
  const [newEventType, setNewEventType] = useState<'practice' | 'competition' | 'event'>('practice');

  useEffect(() => {
    setEvents(storage.getEvents());
  }, []);

  const days = eachDayOfInterval({
    start: startOfMonth(currentDate),
    end: endOfMonth(currentDate),
  });

  const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));

  const handleDayClick = (day: Date) => {
    setSelectedDate(day);
  };

  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate) return;

    const newEvent: CalendarEvent = {
      id: Date.now().toString(),
      date: format(selectedDate, 'yyyy-MM-dd'),
      title: newEventTitle,
      time: newEventTime,
      type: newEventType,
    };

    const updatedEvents = [...events, newEvent];
    setEvents(updatedEvents);
    storage.saveEvents(updatedEvents);
    
    // Reset form
    setNewEventTitle('');
    setNewEventTime('');
  };

  const handleDeleteEvent = (id: string) => {
    const updatedEvents = events.filter(ev => ev.id !== id);
    setEvents(updatedEvents);
    storage.saveEvents(updatedEvents);
  };

  const selectedDateEvents = selectedDate 
    ? events.filter(ev => ev.date === format(selectedDate, 'yyyy-MM-dd'))
    : [];

  return (
    // Updated background to be semi-transparent dark gradient to reveal global tech bg
    // Added specific dot grid pattern overlay
    <section 
      id="calendar" 
      className="py-20 relative overflow-hidden bg-gradient-to-b from-gray-900 to-black backdrop-blur-sm"
      style={{
        backgroundImage: `radial-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px)`,
        backgroundSize: '24px 24px'
      }}
    >
      {/* Decorative BG */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-sanyu-red-5 rounded-full opacity-50 blur-xl pointer-events-none"></div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-end mb-10 border-b border-gray-800 pb-4">
          <div>
            <h2 className="text-4xl font-black italic uppercase tracking-tighter text-white mb-2">
              球隊行事曆 <span className="text-sanyu-red">.</span>
            </h2>
            <p className="text-gray-400">每月行程與即將到來的比賽。</p>
          </div>
        </div>

        <div className="grid md:grid-cols-12 gap-8">
          {/* Calendar Grid */}
          <div className="md:col-span-7 lg:col-span-8 bg-sanyu-dark-90 p-6 rounded-2xl border border-gray-800 shadow-xl backdrop-blur-sm">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-white">
                {format(currentDate, 'yyyy年 MMMM', { locale: zhTW })}
              </h3>
              <div className="flex gap-2">
                <button onClick={handlePrevMonth} className="p-2 hover:bg-gray-800 rounded-full text-white transition-colors">
                  <ChevronLeft />
                </button>
                <button onClick={handleNextMonth} className="p-2 hover:bg-gray-800 rounded-full text-white transition-colors">
                  <ChevronRight />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-2 text-center mb-2">
              {['日', '一', '二', '三', '四', '五', '六'].map(d => (
                <div key={d} className="text-xs font-bold text-gray-500 uppercase tracking-wider py-2">{d}</div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-2">
              {/* Padding for start of month (simple implementation) */}
              {Array.from({ length: startOfMonth(currentDate).getDay() }).map((_, i) => (
                <div key={`empty-${i}`} className="aspect-square"></div>
              ))}
              
              {days.map(day => {
                const dayEvents = events.filter(e => e.date === format(day, 'yyyy-MM-dd'));
                const isSelected = selectedDate && isSameDay(day, selectedDate);
                const isCurrentMonth = isSameMonth(day, currentDate);
                const isTodayDate = isToday(day);

                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => handleDayClick(day)}
                    className={`
                      aspect-square rounded-xl flex flex-col items-center justify-start pt-2 relative transition-all group
                      ${!isCurrentMonth ? 'opacity-30' : 'opacity-100'}
                      ${isSelected ? 'bg-sanyu-red text-white ring-2 ring-sanyu-red ring-offset-2 ring-offset-gray-900' : 'bg-sanyu-black-40 hover:bg-gray-800 text-gray-300'}
                      ${isTodayDate && !isSelected ? 'border border-sanyu-red text-sanyu-red' : ''}
                    `}
                  >
                    <span className={`text-sm font-bold ${isSelected ? 'text-white' : ''}`}>{format(day, 'd')}</span>
                    <div className="flex gap-1 mt-1 flex-wrap justify-center" style={{ maxWidth: '80%' }}>
                      {dayEvents.map((ev, idx) => (
                        <div 
                          key={idx} 
                          className={`w-1.5 h-1.5 rounded-full ${ev.type === 'competition' ? 'bg-yellow-400' : 'bg-white'}`}
                        />
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Details Panel - Updated to Dark Theme */}
          <div className="md:col-span-5 lg:col-span-4 flex flex-col h-full">
            <div className="bg-sanyu-dark-90 backdrop-blur-sm text-gray-200 p-6 rounded-2xl shadow-xl h-full border border-gray-700">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2 border-b border-gray-700 pb-4 text-white">
                <CalendarIcon className="text-sanyu-red" size={20} />
                {selectedDate ? format(selectedDate, 'PPP', { locale: zhTW }) : '請選擇日期'}
              </h3>

              <div className="flex-grow overflow-y-auto space-y-3 mb-4 custom-scrollbar">
                {selectedDateEvents.length > 0 ? (
                  selectedDateEvents.map(ev => (
                    <div key={ev.id} className="bg-zinc-800 p-3 rounded-lg border-l-4 border-sanyu-red group relative hover:bg-zinc-700 transition-colors">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-bold text-lg leading-tight text-white">{ev.title}</h4>
                          {ev.time && (
                            <div className="flex items-center gap-1 text-sm text-gray-400 mt-1">
                              <Clock size={14} />
                              <span>{ev.time}</span>
                            </div>
                          )}
                          <span className={`text-xs px-2 py-0.5 rounded-full mt-2 inline-block font-semibold 
                            ${ev.type === 'competition' ? 'bg-yellow-900-40 text-yellow-500 border border-yellow-700-50' : 'bg-gray-700 text-gray-300'}`}>
                            {ev.type === 'competition' ? '比賽' : ev.type === 'practice' ? '練習' : '活動'}
                          </span>
                        </div>
                        {isAdmin && (
                          <button 
                            onClick={() => handleDeleteEvent(ev.id)}
                            className="text-gray-500 hover:text-sanyu-red p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-gray-500 text-center py-10 italic">
                    {selectedDate ? "尚無行程。" : "點擊日期查看詳細內容。"}
                  </div>
                )}
              </div>

              {/* Admin Add Event Form */}
              {isAdmin && selectedDate && (
                <form onSubmit={handleAddEvent} className="border-t border-gray-700 pt-4 mt-auto">
                  <h4 className="text-sm font-bold text-gray-500 uppercase mb-3">新增行程</h4>
                  <div className="space-y-2">
                    <input 
                      type="text" 
                      placeholder="行程標題" 
                      value={newEventTitle}
                      onChange={e => setNewEventTitle(e.target.value)}
                      className="w-full bg-sanyu-black-50 border border-gray-700 rounded px-3 py-2 text-sm text-white focus:ring-2 focus:ring-sanyu-red focus:outline-none"
                      required
                    />
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        placeholder="時間 (例: 16:00)" 
                        value={newEventTime}
                        onChange={e => setNewEventTime(e.target.value)}
                        className="w-1/2 bg-sanyu-black-50 border border-gray-700 rounded px-3 py-2 text-sm text-white focus:ring-2 focus:ring-sanyu-red focus:outline-none"
                      />
                      <select 
                        value={newEventType}
                        onChange={e => setNewEventType(e.target.value as any)}
                        className="w-1/2 bg-sanyu-black-50 border border-gray-700 rounded px-3 py-2 text-sm text-white focus:ring-2 focus:ring-sanyu-red focus:outline-none"
                      >
                        <option value="practice">練習</option>
                        <option value="competition">比賽</option>
                        <option value="event">其他</option>
                      </select>
                    </div>
                    <button 
                      type="submit"
                      className="w-full bg-sanyu-red text-white font-bold py-2 rounded text-sm hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <Plus size={16} /> 新增行程
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CalendarSection;