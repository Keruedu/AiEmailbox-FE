import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import KanbanCard from './KanbanCard';
import { KanbanCardType } from '@/services/kanbanService';
import { 
  InboxOutlined, 
  ThunderboltFilled, 
  CheckSquareFilled 
} from '@ant-design/icons';

interface KanbanColumnProps {
  id: string;
  label: string;
  cards: KanbanCardType[];
  onRefresh: () => void;
  onCardClick: (id: string) => void;
}

const getColumnConfig = (id: string, label: string) => {
  const defaults = { bg: 'bg-gray-50', icon: <InboxOutlined />, iconColor: 'text-gray-500' };
  
  if (id === 'inbox' || label.toLowerCase().includes('inbox')) {
    return { bg: 'bg-white', icon: <div className="text-red-500 text-lg">📥</div>, iconColor: 'text-gray-700' }; // Using emoji as placeholder or specific icon
    // Actually let's use AntD icons properly colored
  }
  
  const lowerId = id.toLowerCase();
  
  if (lowerId.includes('inbox')) {
     return { bg: 'bg-blue-50', icon: <InboxOutlined />, iconColor: 'text-blue-500' };
  }
  if (lowerId.includes('todo') || lowerId.includes('process')) {
     return { bg: 'bg-yellow-50', icon: <ThunderboltFilled />, iconColor: 'text-yellow-500' };
  }
  if (lowerId.includes('snoozed')) {
     return { bg: 'bg-white', icon: <span className="font-bold text-lg leading-none">💤</span>, iconColor: 'text-blue-400' };
  }
  if (lowerId.includes('done')) {
     return { bg: 'bg-green-50', icon: <CheckSquareFilled />, iconColor: 'text-green-500' };
  }

  return defaults;
}

export default function KanbanColumn({ id, label, cards, onRefresh, onCardClick }: KanbanColumnProps) {
  const { setNodeRef } = useDroppable({ id });
  const config = getColumnConfig(id, label);

  return (
    <div className={`flex h-full w-[320px] shrink-0 flex-col rounded-xl px-2 py-3 ${config.bg}`}>
      {/* Header */}
      <div className="mb-4 flex items-center justify-between px-2">
        <div className="flex items-center gap-2">
            <span className={`text-xl ${config.iconColor}`}>
               {config.icon}
            </span>
            <h3 className="text-lg font-bold text-gray-700 m-0">{label}</h3>
        </div>
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-200 text-xs font-bold text-gray-500">
            {cards.length}
        </span>
      </div>
      
      {/* Droppable Area */}
      <div
        ref={setNodeRef}
        className="flex-1 overflow-y-auto"
      >
        <SortableContext items={cards.map(c => c.id)} strategy={verticalListSortingStrategy}>
          {cards.map((card) => (
            <KanbanCard key={card.id} card={card} onRefresh={onRefresh} onClick={() => onCardClick(card.id)} />
          ))}
        </SortableContext>
        {cards.length === 0 && (
           <div className="mt-10 text-center text-sm text-gray-400 italic">
             {id === 'snoozed' ? 'Kéo thẻ vào đây' : 'Empty'}
           </div>
        )}
      </div>
    </div>
  );
}
