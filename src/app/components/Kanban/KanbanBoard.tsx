import React, { useEffect, useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  DragEndEvent,
  DragStartEvent,
} from '@dnd-kit/core';
import {
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { ReloadOutlined } from '@ant-design/icons';
import KanbanColumn from './KanbanColumn';
import KanbanCard from './KanbanCard';
import { kanbanService, KanbanCardType, ColMeta } from '@/services/kanbanService';

export default function KanbanBoard({ onCardClick }: { onCardClick: (id: string) => void }) {
  const [columns, setColumns] = useState<Record<string, KanbanCardType[]>>({});
  const [meta, setMeta] = useState<ColMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const fetchBoard = async () => {
    setLoading(true);
    try {
      const [boardData, metaData] = await Promise.all([
        kanbanService.getKanban(),
        kanbanService.getMeta(),
      ]);
      
      const incomingMeta = metaData.columns || [];
      const incomingCols = boardData.columns || {};
      
      // Ensure all meta columns exist in state even if empty
      const finalCols: Record<string, KanbanCardType[]> = {};
      incomingMeta.forEach(m => {
          finalCols[m.key] = [];
      });
      // Merge actual data
      Object.entries(incomingCols).forEach(([k, v]) => {
          if (v) finalCols[k] = v;
      });

      setColumns(finalCols);
      setMeta(incomingMeta);
      setError('');
    } catch (err) {
      setError('Failed to load Kanban board');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBoard();
  }, []);

  const findContainer = (id: string, cols: Record<string, KanbanCardType[]>) => {
    if (id in cols) {
      return id;
    }
    return Object.keys(cols).find((key) => cols[key].find((c) => c.id === id));
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    const activeIdVal = active.id as string;
    setActiveId(null);

    if (!over) return;

    const overId = over.id as string;
    
    // Find source and destination containers
    // Note: over.id could be a container (column key) or an item ID
    // We treating column IDs as container IDs by direct match, or finding container if it's an item
    const activeContainer = findContainer(activeIdVal, columns);
    const overContainer = findContainer(overId, columns);
    
    if (!activeContainer || !overContainer) return;

    if (activeContainer !== overContainer) {
      // Moved to different column
      const activeItems = columns[activeContainer];

      const activeItem = activeItems.find(c => c.id === activeIdVal);
      if (!activeItem) return;

      // Optimistic Update
      setColumns((prev) => {
        const sourceList = [...prev[activeContainer]];
        const destList = [...(prev[overContainer] || [])];
        
        const itemIndex = sourceList.findIndex(c => c.id === activeIdVal);
        const [movedItem] = sourceList.splice(itemIndex, 1);
        
        // If dropping on a card, insert before/after? For now just append or simplistic logic
        // But better is to just append if dropping on column, or rely on sorting strategy if full reorder implemented.
        // For simplicity: Append to new column. Backend doesn't support generic reordering *within* column yet (just status change).
        destList.push(movedItem);

        return {
          ...prev,
          [activeContainer]: sourceList,
          [overContainer]: destList,
        };
      });

      // API Call
      try {
        await kanbanService.moveCard(activeIdVal, overContainer);
      } catch (err) {
        console.error("Move failed", err);
        // Could Revert here
        fetchBoard(); // easiest revert
      }
    }
  };

  const renderActiveCard = () => {
     if (!activeId) return null;
     // Find the card data
     for (const key in columns) {
        const found = columns[key].find(c => c.id === activeId);
        if (found) return <KanbanCard card={found} onRefresh={() => {}} />;
     }
     return null;
  };

  if (loading && meta.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-5">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="m-4 rounded-md bg-red-50 p-4 text-red-700">
         <div className="flex justify-between items-center">
            <span>{error}</span>
            <button 
              onClick={fetchBoard}
              className="px-3 py-1 bg-white border border-red-300 rounded hover:bg-red-50 text-sm"
            >
              Retry
            </button>
         </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-100px)] overflow-x-auto p-5 bg-gray-50">
      {/* Controls */}
      <div className="mb-4 flex justify-end">
         <button 
           onClick={fetchBoard}
           className="flex items-center gap-2 rounded-md bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 border border-gray-300 transition-colors"
         >
           <ReloadOutlined /> Refresh
         </button>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 h-full min-w-fit pb-4">
          {meta.map((col) => (
             <KanbanColumn
               key={col.key}
               id={col.key}
               label={col.label}
               cards={columns[col.key] || []}
               onRefresh={fetchBoard}
               onCardClick={onCardClick}
             />
          ))}
        </div>
        
        <DragOverlay>
           {activeId ? <KanbanCard card={columns[Object.keys(columns).find(k => columns[k].find(c => c.id === activeId))!]?.find(c => c.id === activeId)!} onRefresh={() => {}} onClick={() => {}} /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
