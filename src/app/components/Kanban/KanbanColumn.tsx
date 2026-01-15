import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import KanbanCard from './KanbanCard';
import { KanbanCardType } from '@/services/kanbanService';
import { 
  InboxOutlined, 
  ThunderboltFilled, 
  CheckSquareFilled,
  ClockCircleOutlined,
  ProjectOutlined,
  TagOutlined
} from '@ant-design/icons';
import { Empty } from 'antd';

interface KanbanColumnProps {
  id: string;
  label: string;
  cards: KanbanCardType[];
  onRefresh: () => void;
  onCardClick: (card: KanbanCardType) => void;
}

const getColumnConfig = (id: string, label: string) => {
  const lowerId = id.toLowerCase();
  
  if (lowerId.includes('inbox') || label.toLowerCase().includes('inbox')) {
     return { bg: 'bg-blue-50', icon: <InboxOutlined />, iconColor: 'text-blue-500', badgeColor: 'bg-blue-200 text-blue-700' };
  }
  if (lowerId.includes('todo') || lowerId.includes('to do')) {
     return { bg: 'bg-orange-50', icon: <ThunderboltFilled />, iconColor: 'text-orange-500', badgeColor: 'bg-orange-200 text-orange-700' };
  }
  if (lowerId.includes('process')) {
     return { bg: 'bg-purple-50', icon: <ProjectOutlined />, iconColor: 'text-purple-500', badgeColor: 'bg-purple-200 text-purple-700' };
  }
  if (lowerId.includes('snoozed')) {
     return { bg: 'bg-indigo-50', icon: <ClockCircleOutlined />, iconColor: 'text-indigo-400', badgeColor: 'bg-indigo-200 text-indigo-700' };
  }
  if (lowerId.includes('done')) {
     return { bg: 'bg-green-50', icon: <CheckSquareFilled />, iconColor: 'text-green-500', badgeColor: 'bg-green-200 text-green-700' };
  }

  // Default for custom columns
  return { bg: 'bg-gray-50', icon: <TagOutlined />, iconColor: 'text-gray-500', badgeColor: 'bg-gray-200 text-gray-700' };
}

// ... imports remain the same

export default React.memo(KanbanColumn);

function KanbanColumn({ id, label, cards, onRefresh, onCardClick }: KanbanColumnProps) {
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
        <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${config.badgeColor}`}>
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
            <KanbanCard key={card.id} card={card} onRefresh={onRefresh} onClick={onCardClick} />
          ))}
        </SortableContext>
        {cards.length === 0 && (
           <div className="mt-10 flex flex-col items-center justify-center">
             <Empty 
                image={Empty.PRESENTED_IMAGE_SIMPLE} 
                description={id === 'snoozed' ? 'Drag cards here' : 'No items'} 
                style={{ opacity: 0.5 }}
             />
           </div>
        )}
      </div>
    </div>
  );
}
