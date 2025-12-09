import React, { useState, useRef, useEffect } from 'react';
import { RobotOutlined, ClockCircleOutlined, MoreOutlined, FileTextOutlined, EyeOutlined } from '@ant-design/icons';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import dayjs from 'dayjs';
import { KanbanCardType, kanbanService } from '@/services/kanbanService';

interface KanbanCardProps {
  card: KanbanCardType;
  onRefresh: () => void;
  onClick: () => void;
}

const SnoozePopover = ({ isOpen, onClose, onSnooze }: { isOpen: boolean; onClose: () => void; onSnooze: (date: string) => void }) => {
  const [value, setValue] = useState('later_today');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    let date = dayjs();
    if (value === 'later_today') date = date.add(4, 'hour');
    if (value === 'tomorrow') date = date.add(1, 'day').startOf('day').add(9, 'hour');
    if (value === 'next_week') date = date.add(1, 'week').startOf('week').add(9, 'hour');
    if (value === '1_min') date = date.add(1, 'minute');
    onSnooze(date.toISOString());
    onClose();
  };

  return (
    <div 
      ref={ref}
      className="absolute bottom-full right-0 mb-2 w-56 rounded-lg border border-gray-100 bg-white p-3 shadow-xl z-50"
      onClick={(e) => e.stopPropagation()}
    >
      <h4 className="mb-2 text-sm font-semibold text-gray-700">Snooze Until</h4>
      <select 
        className="w-full rounded border border-gray-200 p-1.5 text-sm mb-2 focus:ring-2 focus:ring-blue-500 outline-none"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      >
        <option value="later_today">Later Today (+4h)</option>
        <option value="tomorrow">Tomorrow morning</option>
        <option value="next_week">Next Week</option>
        <option value="1_min">In 1 minute (Test)</option>
      </select>
      <button 
        className="w-full rounded bg-blue-600 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
        onClick={handleConfirm}
      >
        Confirm
      </button>
    </div>
  );
}

export default function KanbanCard({ card, onRefresh, onClick }: KanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id });

  const [loadingSummary, setLoadingSummary] = useState(false);
  const [summary, setSummary] = useState(card.summary);
  const [showSnooze, setShowSnooze] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    cursor: 'move',
  };

  const handleSummarize = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // If currently showing summary, switch to original view
    if (summary && !showOriginal) {
        setShowOriginal(true);
        return;
    }

    // Otherwise (No summary OR Showing Original), fetch summary (Refresh or Create)
    setLoadingSummary(true);
    try {
      const res = await kanbanService.summarizeEmail(card.id);
      if (res.ok) {
        setSummary(res.summary);
        setShowOriginal(false); // Show the new summary
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingSummary(false);
    }
  };

  const handleSnooze = async (until: string) => {
    try {
      await kanbanService.snoozeCard(card.id, until);
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  // Extract initials and time
  const senderName = card.sender || "Unknown";
  const initials = senderName.substring(0, 2).toUpperCase();
  
  const dateObj = dayjs(card.received_at);
  const now = dayjs();
  let timeStr = dateObj.format('MMM D');
  
  if (dateObj.isSame(now, 'day')) {
      timeStr = dateObj.format('h:mm A');
  } else if (dateObj.isSame(now.subtract(1, 'day'), 'day')) {
      timeStr = 'Yesterday';
  } else if (dateObj.isSame(now, 'year')) {
      timeStr = dateObj.format('MMM D');
  } else {
      timeStr = dateObj.format('MMM D, YYYY');
  }

  // Determine what content to show
  // If summary exists and NOT showing original -> Show Summary
  // Else -> Show Preview (or placeholder)
  const isShowingSummary = summary && !showOriginal;

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      {...attributes} 
      {...listeners}
      className="group relative mb-4 w-full rounded-2xl bg-white p-5 shadow-sm hover:shadow-lg transition-all border border-gray-100 select-none cursor-grab active:cursor-grabbing"
    >
      {/* Header: Avatar + Meta */}
      <div className="mb-3 flex items-start justify-between">
         <div className="flex items-center gap-3">
             <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600 font-bold text-sm">
                 {initials}
             </div>
             <div>
                 <h4 className="text-sm font-bold text-gray-800 leading-tight">{senderName}</h4>
                 <span className="text-xs text-gray-400">{timeStr}</span>
             </div>
         </div>
         <button className="text-gray-300 hover:text-gray-600">
             <MoreOutlined />
         </button>
      </div>

      {/* Content */}
      <div className="mb-4">
          <h3 className="text-base font-bold text-gray-900 mb-2 leading-snug">
              {card.subject}
          </h3>
          <div className="rounded-lg bg-gray-50 p-3 text-xs text-gray-600 leading-relaxed">
             {isShowingSummary ? (
                 <>
                   <span className="text-blue-600 font-semibold block mb-1">✨ AI Summary</span>
                   {summary}
                 </>
             ) : (
                 <span className="line-clamp-3 opacity-80">
                    {/* Show Preview if available, else Card.summary (which might be empty if we are here), else fallback */}
                    {card.preview || "No preview content"}
                 </span>
             )}
          </div>
      </div>

      {/* Footer Actions */}
      <div className="flex items-center justify-between mt-2">
         <div className="flex items-center gap-2">
           <button 
              onClick={handleSummarize}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${isShowingSummary ? 'bg-green-100 text-green-700' : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'}`}
              title={loadingSummary ? "Generating..." : summary ? (showOriginal ? "View Summary" : "View Original") : "Summarize"}
           >
               {loadingSummary ? (
                  <span>Loading...</span>
               ) : summary ? (
                  // If summary exists, toggle text
                  showOriginal ? (
                      <>
                         <RobotOutlined /> Tóm tắt
                      </>
                  ) : (
                      <>
                         <FileTextOutlined /> Nội dung gốc
                      </>
                  )
               ) : (
                  <>
                     <RobotOutlined /> Tóm tắt AI
                  </>
               )}
           </button>
           <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onClick();
              }}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
           >
              Xem chi tiết
           </button>
         </div>

         <div className="relative" onPointerDown={(e) => e.stopPropagation()}>
             <button 
                onClick={() => setShowSnooze(!showSnooze)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1"
             >
                 <ClockCircleOutlined style={{ fontSize: '16px' }} />
             </button>
             <SnoozePopover isOpen={showSnooze} onClose={() => setShowSnooze(false)} onSnooze={handleSnooze} />
         </div>
      </div>
    </div>
  );
}
