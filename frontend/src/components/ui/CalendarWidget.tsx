import { useState } from 'react';
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  isSameMonth,
  isSameDay,
  addDays
} from 'date-fns';
import { id } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CalendarWidgetProps {
  selectedDate: Date | null;
  onSelectDate: (date: Date) => void;
}

export const CalendarWidget = ({ selectedDate, onSelectDate }: CalendarWidgetProps) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const renderHeader = () => {
    return (
      <div className="flex justify-between items-center mb-4">
        <button
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          className="w-8 h-8 flex items-center justify-center bg-[#EEF3FB] hover:bg-blue-100 rounded-full text-[#1E40AF] transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <h2 className="text-sm font-bold text-slate-800">
          {format(currentMonth, 'MMMM yyyy', { locale: id })}
        </h2>
        <button
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          className="w-8 h-8 flex items-center justify-center bg-[#EEF3FB] hover:bg-blue-100 rounded-full text-[#1E40AF] transition-colors cursor-pointer"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    );
  };

  const renderDays = () => {
    const dateFormat = 'EEEEEE';
    const days = [];
    const startDate = startOfWeek(currentMonth, { weekStartsOn: 1 });

    for (let i = 0; i < 7; i++) {
      days.push(
        <div key={i} className="text-center text-xs font-semibold text-slate-400 py-1">
          {format(addDays(startDate, i), dateFormat, { locale: id })}
        </div>
      );
    }

    return <div className="grid grid-cols-7 mb-2">{days}</div>;
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const rows = [];
    let days = [];
    let day = startDate;

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const formattedDate = format(day, 'd');
        const cloneDay = day;
        const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;
        const isCurrentMonth = isSameMonth(day, monthStart);
        const isToday = isSameDay(day, new Date());

        days.push(
          <div
            key={day.toISOString()}
            onClick={() => onSelectDate(cloneDay)}
            className={`flex justify-center items-center p-1 cursor-pointer`}
          >
            <span
              className={`w-8 h-8 flex items-center justify-center rounded-full text-xs font-semibold transition-all
                ${!isCurrentMonth ? 'text-slate-300' : ''}
                ${isSelected ? 'bg-[#34C38F] text-white shadow-md shadow-emerald-200' : ''}
                ${!isSelected && isToday ? 'bg-[#F5BD2C]/20 text-amber-800 font-bold ring-1 ring-[#F5BD2C]' : ''}
                ${!isSelected && !isToday && isCurrentMonth ? 'text-slate-700 hover:bg-[#EEF3FB] hover:text-[#1E40AF]' : ''}
              `}
            >
              {formattedDate}
            </span>
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div className="grid grid-cols-7 gap-1" key={day.toISOString()}>
          {days}
        </div>
      );
      days = [];
    }
    return <div>{rows}</div>;
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-[0_6px_24px_-6px_rgba(30,64,175,0.08)] h-full flex flex-col">
      {renderHeader()}
      {renderDays()}
      {renderCells()}
    </div>
  );
};
