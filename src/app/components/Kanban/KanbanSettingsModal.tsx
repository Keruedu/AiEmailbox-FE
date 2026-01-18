'use client';

import React, { useState, useEffect } from 'react';
import { Modal, Button, Input, Select, Space, message, Popconfirm, Empty, Spin, Tag, ColorPicker, Tooltip } from 'antd';
import { PlusOutlined, DeleteOutlined, EditOutlined, HolderOutlined, SaveOutlined, CloseOutlined } from '@ant-design/icons';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { kanbanService, KanbanColumn, GmailLabel } from '@/services/kanbanService';

interface KanbanSettingsModalProps {
  open: boolean;
  onClose: () => void;
  onColumnsChanged: () => void;
}

// Sortable item wrapper
const SortableColumnItem: React.FC<{
  column: KanbanColumn;
  onEdit: (col: KanbanColumn) => void;
  onDelete: (id: string) => void;
}> = ({ column, onEdit, onDelete }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: column.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(column);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Popconfirm will handle the actual deletion
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg mb-2 hover:shadow-sm transition-shadow"
    >
      <div {...attributes} {...listeners} className="cursor-grab text-gray-400 hover:text-gray-600">
        <HolderOutlined />
      </div>
      <div className="flex-1">
        <div className="font-medium">{column.label}</div>
        <div className="text-xs text-gray-500">
          {column.gmailLabel ? <Tag color="blue">{column.gmailLabel}</Tag> : <Tag>No Label</Tag>}
          {column.isDefault && <Tag color="green">Default</Tag>}
        </div>
      </div>
      <div onClick={(e) => e.stopPropagation()}>
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={handleEditClick} />
          <Tooltip title={column.isDefault ? "Default columns cannot be deleted" : ""}>
            <Popconfirm
              title="Delete this column?"
              onConfirm={() => onDelete(column.id)}
              okText="Yes"
              cancelText="No"
              disabled={column.isDefault}
            >
              <Button 
                size="small" 
                icon={<DeleteOutlined />} 
                danger 
                disabled={column.isDefault}
                onClick={handleDeleteClick}
              />
            </Popconfirm>
          </Tooltip>
        </Space>
      </div>
    </div>
  );
};

const KanbanSettingsModal: React.FC<KanbanSettingsModalProps> = ({ open, onClose, onColumnsChanged }) => {
  const [columns, setColumns] = useState<KanbanColumn[]>([]);
  const [gmailLabels, setGmailLabels] = useState<GmailLabel[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Edit state
  const [editingColumn, setEditingColumn] = useState<KanbanColumn | null>(null);
  const [editForm, setEditForm] = useState({ label: '', gmailLabel: '', color: '' });

  // New column state
  const [isAdding, setIsAdding] = useState(false);
  const [newForm, setNewForm] = useState({ label: '', gmailLabel: '', color: '' });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Check for duplicate Gmail labels
  const getDuplicateLabelWarning = (gmailLabel: string, excludeColumnId?: string) => {
    if (!gmailLabel) return null;
    const duplicateColumns = columns.filter(col => 
      col.gmailLabel === gmailLabel && col.id !== excludeColumnId
    );
    if (duplicateColumns.length > 0) {
      return `Warning: Label "${gmailLabel}" is already used by column "${duplicateColumns[0].label}". Emails may appear in multiple columns.`;
    }
    return null;
  };

  useEffect(() => {
    if (open) {
      fetchData();
    }
  }, [open]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [cols, labels] = await Promise.all([
        kanbanService.getColumns(),
        kanbanService.getGmailLabels(),
      ]);
      setColumns(cols.sort((a, b) => a.order - b.order));
      setGmailLabels(labels);
    } catch (error) {
      console.error('Failed to load settings:', error);
      message.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = columns.findIndex(c => c.id === active.id);
    const newIndex = columns.findIndex(c => c.id === over.id);
    const newOrder = arrayMove(columns, oldIndex, newIndex);
    setColumns(newOrder);

    // Save new order to backend
    try {
      const updatedColumns = await kanbanService.reorderColumns(newOrder.map(c => c.id));
      setColumns(updatedColumns.sort((a, b) => a.order - b.order));
      // No need to refetch board, just notify meta changed
      onColumnsChanged();
    } catch (error) {
      console.error('Failed to reorder:', error);
      message.error('Failed to save order');
      fetchData(); // Revert
    }
  };

  const handleAddColumn = async () => {
    if (!newForm.label.trim()) {
      message.warning('Label is required');
      return;
    }
    setSaving(true);
    
    // Optimistic update - create temporary column for immediate feedback
    const tempId = `temp_${Date.now()}`;
    const tempColumn = {
      id: tempId,
      key: newForm.label.toLowerCase().replace(/\s+/g, '_'),
      label: newForm.label,
      gmailLabel: newForm.gmailLabel,
      color: newForm.color,
      order: columns.length,
      isDefault: false,
      userId: ''
    };
    setColumns(prev => [...prev, tempColumn]);
    
    try {
      const newColumn = await kanbanService.createColumn({
        label: newForm.label,
        gmailLabel: newForm.gmailLabel,
        color: newForm.color,
      });
      message.success('Column created');
      setNewForm({ label: '', gmailLabel: '', color: '' });
      setIsAdding(false);
      // Replace temp column with real one
      setColumns(prev => prev.map(col => col.id === tempId ? newColumn : col).sort((a, b) => a.order - b.order));
      onColumnsChanged();
    } catch (error) {
      console.error('Failed to create column:', error);
      message.error('Failed to create column');
      // Revert optimistic update
      setColumns(prev => prev.filter(col => col.id !== tempId));
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateColumn = async () => {
    if (!editingColumn) return;
    if (!editForm.label.trim()) {
      message.warning('Label is required');
      return;
    }
    setSaving(true);
    try {
      const updated = await kanbanService.updateColumn(editingColumn.id, {
        label: editForm.label,
        gmailLabel: editForm.gmailLabel,
        color: editForm.color,
      });
      message.success('Column updated');
      setEditingColumn(null);
      // Update local state with returned column
      setColumns(prev => prev.map(col => col.id === updated.id ? updated : col).sort((a, b) => a.order - b.order));
      // Only notify parent, no need to refetch board for metadata changes
      onColumnsChanged();
    } catch (error) {
      console.error('Failed to update column:', error);
      message.error('Failed to update column');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteColumn = async (id: string) => {
    // Optimistic update - remove from UI immediately
    const backup = columns;
    setColumns(prev => prev.filter(col => col.id !== id));
    
    try {
      const remainingColumns = await kanbanService.deleteColumn(id);
      message.success('Column deleted');
      // Update with server response
      setColumns(remainingColumns.sort((a, b) => a.order - b.order));
      // Notify parent to refresh board (this removes column from board too)
      onColumnsChanged();
    } catch (error) {
      console.error('Failed to delete column:', error);
      message.error('Failed to delete column');
      // Revert optimistic update
      setColumns(backup);
    }
  };

  const startEdit = (col: KanbanColumn) => {
    setEditingColumn(col);
    setEditForm({ label: col.label, gmailLabel: col.gmailLabel || '', color: col.color || '' });
  };

  const cancelEdit = () => {
    setEditingColumn(null);
  };

  return (
    <Modal
      title="Kanban Board Settings"
      open={open}
      onCancel={onClose}
      footer={null}
      width={500}
      centered
      styles={{
        body: {
          maxHeight: '60vh',
          overflowY: 'auto',
        }
      }}
      destroyOnHidden
    >
      {loading ? (
        <div className="flex justify-center p-8"><Spin size="large" /></div>
      ) : (
        <div className="space-y-4">
          {/* Column List */}
          <div className="mb-4">
            <h4 className="font-medium mb-2">Columns (drag to reorder)</h4>
            {columns.length === 0 ? (
              <Empty description="No columns configured" />
            ) : (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={columns.map(c => c.id)} strategy={verticalListSortingStrategy}>
                  {columns.map(col => (
                    <SortableColumnItem
                      key={col.id}
                      column={col}
                      onEdit={startEdit}
                      onDelete={handleDeleteColumn}
                    />
                  ))}
                </SortableContext>
              </DndContext>
            )}
          </div>

          {/* Add New Column */}
          {isAdding ? (
            <div className="p-3 bg-gray-50 rounded-lg border border-dashed border-gray-300">
              <h4 className="font-medium mb-2">New Column</h4>
              <Space direction="vertical" className="w-full">
                <Input
                  placeholder="Column Name"
                  value={newForm.label}
                  onChange={e => setNewForm(prev => ({ ...prev, label: e.target.value }))}
                />
                <Select
                  placeholder="Map to Gmail Label (optional)"
                  value={newForm.gmailLabel || undefined}
                  onChange={val => setNewForm(prev => ({ ...prev, gmailLabel: val }))}
                  allowClear
                  className="w-full"
                  status={getDuplicateLabelWarning(newForm.gmailLabel) ? 'warning' : undefined}
                  options={gmailLabels.map(l => ({ value: l.id, label: `${l.name} (${l.type})` }))}
                />
                {getDuplicateLabelWarning(newForm.gmailLabel) && (
                  <div className="text-yellow-600 text-xs mt-1 bg-yellow-50 p-2 rounded">
                    ⚠️ {getDuplicateLabelWarning(newForm.gmailLabel)}
                  </div>
                )}
                <Space>
                  <Button type="primary" icon={<SaveOutlined />} onClick={handleAddColumn} loading={saving}>
                    Save
                  </Button>
                  <Button icon={<CloseOutlined />} onClick={() => setIsAdding(false)}>Cancel</Button>
                </Space>
              </Space>
            </div>
          ) : (
            <Button type="dashed" icon={<PlusOutlined />} onClick={() => setIsAdding(true)} block>
              Add Column
            </Button>
          )}

          {/* Edit Column Modal/Drawer */}
          <Modal
            title="Edit Column"
            open={!!editingColumn}
            onCancel={cancelEdit}
            footer={null}
            destroyOnHidden
          >
            <Space direction="vertical" className="w-full">
              <label className="text-sm text-gray-600">Label</label>
              <Input
                value={editForm.label}
                onChange={e => setEditForm(prev => ({ ...prev, label: e.target.value }))}
              />
              <label className="text-sm text-gray-600">Gmail Label Mapping</label>
              <Select
                placeholder="Map to Gmail Label"
                value={editForm.gmailLabel || undefined}
                onChange={val => setEditForm(prev => ({ ...prev, gmailLabel: val }))}
                allowClear
                className="w-full"
                status={getDuplicateLabelWarning(editForm.gmailLabel, editingColumn?.id) ? 'warning' : undefined}
                options={gmailLabels.map(l => ({ value: l.id, label: `${l.name} (${l.type})` }))}
              />
              {getDuplicateLabelWarning(editForm.gmailLabel, editingColumn?.id) && (
                <div className="text-yellow-600 text-xs mt-1 bg-yellow-50 p-2 rounded">
                  ⚠️ {getDuplicateLabelWarning(editForm.gmailLabel, editingColumn?.id)}
                </div>
              )}
              <label className="text-sm text-gray-600">Color (optional)</label>
              <ColorPicker
                value={editForm.color || '#1890ff'}
                onChange={(_, hex) => setEditForm(prev => ({ ...prev, color: hex }))}
              />
              <Space className="mt-4">
                <Button type="primary" onClick={handleUpdateColumn} loading={saving}>Save Changes</Button>
                <Button onClick={cancelEdit}>Cancel</Button>
              </Space>
            </Space>
          </Modal>
        </div>
      )}
    </Modal>
  );
};

export default KanbanSettingsModal;
