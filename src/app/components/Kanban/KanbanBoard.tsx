import React, { useEffect, useState, useMemo, useCallback } from 'react';
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
import {
  ReloadOutlined
} from '@ant-design/icons';
import { KanbanCardType, ColMeta, kanbanService } from '@/services/kanbanService';
import KanbanColumn from './KanbanColumn';
import KanbanCard from './KanbanCard';

export default function KanbanBoard({ onCardClick }: { onCardClick: (card: KanbanCardType) => void }) {
  const [columns, setColumns] = useState<Record<string, KanbanCardType[]>>({});
  const [meta, setMeta] = useState<ColMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeId, setActiveId] = useState<string | null>(null);

  // Sorting & Filtering
  const [sortMode, setSortMode] = useState<'date-desc' | 'date-asc' | 'sender'>('date-desc');
  const [filters, setFilters] = useState({
    unread: false,
    hasAttachment: false
  });

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

  const fetchBoard = useCallback(async () => {
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
  }, []); // Empty dependency array as setters are stable

  useEffect(() => {
    fetchBoard();
  }, [fetchBoard]);

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
        if (found) return <KanbanCard card={found} onRefresh={() => {}} onClick={() => {}} />;
     }
     return null;
  };

  // Process columns for display
  const processedColumns = useMemo(() => {
    const processed: Record<string, KanbanCardType[]> = {};

    Object.keys(columns).forEach(key => {
      let list = [...columns[key]];

      // Filter
      if (filters.unread) {
         list = list.filter(card => !card.is_read);
      }
      if (filters.hasAttachment) {
         list = list.filter(card => card.has_attachments);
      }

      // Sort
      list.sort((a, b) => {
        if (sortMode === 'date-desc') {
           return new Date(b.received_at).getTime() - new Date(a.received_at).getTime();
        } else if (sortMode === 'date-asc') {
           return new Date(a.received_at).getTime() - new Date(b.received_at).getTime();
        } else if (sortMode === 'sender') {
           return a.sender.localeCompare(b.sender);
        }
        return 0;
      });

      processed[key] = list;
    });
    return processed;
  }, [columns, filters, sortMode]);

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
    <div className="h-full overflow-x-auto p-5 bg-gray-50">
      {/* Controls Container */}
      <div className="mb-6 flex flex-wrap items-center gap-4 bg-white p-2 rounded-xl border border-gray-100 shadow-sm w-fit">

         {/* Filter Section */}
         <div className="flex items-center gap-3 pl-2">
            <div className="flex items-center gap-2 text-gray-500 font-medium">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
               </svg>
               <span>Filter:</span>
            </div>

            <button 
               onClick={() => setFilters(prev => ({ ...prev, unread: !prev.unread }))}
               className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm transition-all ${filters.unread ? 'border-blue-200 bg-blue-50 text-blue-700 font-medium' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
            >
               <div className={`w-4 h-4 rounded border flex items-center justify-center ${filters.unread ? 'bg-blue-600 border-blue-600' : 'border-gray-300 bg-white'}`}>
                  {filters.unread && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
               </div>
               Unread
            </button>

            <button 
               onClick={() => setFilters(prev => ({ ...prev, hasAttachment: !prev.hasAttachment }))}
               className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm transition-all ${filters.hasAttachment ? 'border-blue-200 bg-blue-50 text-blue-700 font-medium' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
            >
               <div className={`w-4 h-4 rounded border flex items-center justify-center ${filters.hasAttachment ? 'bg-blue-600 border-blue-600' : 'border-gray-300 bg-white'}`}>
                  {filters.hasAttachment && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
               </div>
               Has attachment
            </button>
         </div>

         {/* Divider */}
         <div className="h-6 w-px bg-gray-200 mx-1"></div>

         {/* Sort Section */}
         <div className="flex items-center gap-3 pr-2">
            <div className="flex items-center gap-2 text-gray-500 font-medium">
               <ReloadOutlined className={loading ? "animate-spin" : ""} />
               <span>Sort:</span>
            </div>
            
            <div className="relative">
                <select 
                   value={sortMode}
                   onChange={(e) => setSortMode(e.target.value as any)}
                   className="appearance-none bg-white border border-gray-200 text-gray-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full pl-3 pr-8 py-1.5 outline-none cursor-pointer hover:border-gray-300 transition-colors"
                >
                    <option value="date-desc">Newest First</option>
                    <option value="date-asc">Oldest First</option>
                    <option value="sender">Sender Name</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </div>
            </div>
         </div>
         
         <div className="ml-auto pl-2">
             <button title="Refresh Board" onClick={fetchBoard} className="p-2 text-gray-400 hover:text-blue-600 transition-colors">
                 <ReloadOutlined spin={loading} />
             </button>
         </div>
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
               cards={processedColumns[col.key] || []}
               onRefresh={fetchBoard}
               onCardClick={onCardClick}
             />
          ))}
        </div>
        
        <DragOverlay>
           {renderActiveCard()}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
