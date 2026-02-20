import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Minus, GripVertical, Eye, EyeOff, Edit2, Check, X } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import {
  CSS,
} from '@dnd-kit/utilities';
import { Button } from '../../../shared/components/Button';
import { Input } from '../../../shared/components/Input';
import { symptomService } from '../../symptom-tracking/services/symptomService';
import type { SymptomCatalogItem } from '../../../shared/types';

interface SymptomCatalogManagerProps {
  catalog: SymptomCatalogItem[] | null;
  onUpdate: (catalog: SymptomCatalogItem[]) => Promise<void>;
  diagnosis?: string;
}

// Component for a sortable symptom item
interface SortableSymptomItemProps {
  item: SymptomCatalogItem;
  isEditing: boolean;
  editingItemId: string | null;
  editingName: string;
  onToggle: (key: string) => void;
  onStartEdit: (key: string, currentName: string) => void;
  onSaveEdit: (key: string) => void;
  onCancelEdit: () => void;
  onEditNameChange: (name: string) => void;
  onRemove: (key: string) => void;
  canRemove: boolean;
}

function SortableSymptomItem({
  item,
  isEditing,
  editingItemId,
  editingName,
  onToggle,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onEditNameChange,
  onRemove,
  canRemove
}: SortableSymptomItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.key });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? 'none' : transition, // Disable transition during drag for smoother movement
    opacity: isDragging ? 0.7 : 1,
    zIndex: isDragging ? 1000 : 'auto', // Ensure dragged item appears above others
  };

  const isEditingThis = editingItemId === item.key;
  const isCustom = item.key.startsWith('custom_');

  return (
    <div
      ref={setNodeRef}
      className={`sortable-item flex items-center gap-3 p-3 rounded-lg border transition-all duration-200 ${
         isDragging 
           ? 'dragging shadow-xl scale-102 !bg-blue-50 !border-blue-400'
           : item.enabled 
             ? 'bg-green-50 border-green-200 shadow-sm' 
             : 'bg-gray-50 border-gray-200'
       }`}
      style={{
        ...style,
        // Prevent text selection during drag on mobile
        userSelect: isEditing ? 'none' : 'auto',
        WebkitUserSelect: isEditing ? 'none' : 'auto',
        WebkitTouchCallout: isEditing ? 'none' : undefined,
        WebkitTapHighlightColor: isEditing ? 'transparent' : undefined,
        MozUserSelect: isEditing ? 'none' : undefined,
        msUserSelect: isEditing ? 'none' : undefined,
        // Performance optimizations for mobile
        willChange: isDragging ? 'transform' : 'auto',
        backfaceVisibility: 'hidden',
        WebkitBackfaceVisibility: 'hidden'
      }}
      onContextMenu={(e) => isEditing && e.preventDefault()}
      onMouseDown={(e) => {
        if (isEditing && e.detail > 1) {
          e.preventDefault();
        }
      }}
      onTouchStart={(e) => {
        if (isEditing) {
          e.currentTarget.style.webkitUserSelect = 'none';
          (e.currentTarget.style as any).webkitTouchCallout = 'none';
        }
      }}
    >
      {isEditing && (
        <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-200 rounded transition-colors"
        style={{
          touchAction: 'none', // Prevent default touch behaviors
          userSelect: 'none', // Prevent text selection
          WebkitUserSelect: 'none',
          WebkitTouchCallout: 'none', // Prevent callout on iOS
          WebkitTapHighlightColor: 'transparent', // Remove tap highlight
          MozUserSelect: 'none', // Firefox
          msUserSelect: 'none', // IE/Edge
          KhtmlUserSelect: 'none', // Old Safari
          pointerEvents: 'auto'
        }}
        onContextMenu={(e) => e.preventDefault()}
        onDragStart={(e) => e.preventDefault()}
      >
        <GripVertical className="text-gray-400" size={16} />
      </div>
      )}
      
      <button
        onClick={isEditing ? () => onToggle(item.key) : undefined}
        className={`flex items-center gap-2 p-1 rounded transition-colors ${
          isEditing 
            ? 'hover:bg-white/50 cursor-pointer' 
            : 'cursor-default'
        }`}
        title={isEditing ? (item.enabled ? 'Désactiver ce symptôme' : 'Activer ce symptôme') : ''}
        disabled={!isEditing}
      >
        {item.enabled ? (
          <Eye className="text-green-600" size={16} />
        ) : (
          <EyeOff className="text-gray-400" size={16} />
        )}
      </button>
      
      <div className="flex-1">
        {isEditingThis ? (
          <div className="flex items-center gap-2">
            <input
                type="text"
                value={editingName}
                onChange={(e) => onEditNameChange(e.target.value)}
                className="flex-1 text-sm px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#303d25] focus:border-transparent"
                placeholder="Nom du symptôme"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') onSaveEdit(item.key);
                  if (e.key === 'Escape') onCancelEdit();
                }}
                autoFocus
              />
            <button
              onClick={() => onSaveEdit(item.key)}
              className="text-green-600 hover:text-green-700 p-1 hover:bg-green-100 rounded transition-colors"
              title="Sauvegarder"
            >
              <Check size={14} />
            </button>
            <button
              onClick={onCancelEdit}
              className="text-gray-500 hover:text-gray-700 p-1 hover:bg-gray-100 rounded transition-colors"
              title="Annuler"
            >
              <X size={14} />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className={`font-medium ${
              item.enabled ? 'text-[#303d25]' : 'text-gray-500'
            }`}>
              {item.label}
            </span>
            {isCustom && (
              <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                Personnalisé
              </span>
            )}
            {isEditing && isCustom && (
              <button
                onClick={() => onStartEdit(item.key, item.label)}
                className="text-blue-500 hover:text-blue-700 p-1 hover:bg-blue-100 rounded transition-colors ml-1"
                title="Éditer le nom"
              >
                <Edit2 size={12} />
              </button>
            )}
          </div>
        )}
      </div>
      
      {isEditing && isCustom && !isEditingThis && (
        <button
          onClick={() => onRemove(item.key)}
          disabled={!canRemove}
          className={`p-1 rounded transition-colors ${
            canRemove 
              ? 'text-red-500 hover:text-red-700 hover:bg-red-100' 
              : 'text-gray-300 cursor-not-allowed'
          }`}
          title={canRemove ? 'Supprimer ce symptôme' : 'Au moins un symptôme doit rester actif'}
        >
          <Minus size={16} />
        </button>
      )}
    </div>
  );
}

export function SymptomCatalogManager({ catalog, onUpdate, diagnosis }: SymptomCatalogManagerProps) {
  const [localCatalog, setLocalCatalog] = useState<SymptomCatalogItem[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [newSymptomName, setNewSymptomName] = useState('');
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [confirmingDelete, setConfirmingDelete] = useState<string | null>(null);

  // Empêcher le scroll quand la modal est ouverte
  useEffect(() => {
    if (confirmingDelete) {
      // Bloquer le scroll simplement avec overflow hidden
      document.body.style.overflow = 'hidden';
      // Empêcher le scroll tactile sur mobile
      document.body.style.touchAction = 'none';
    } else {
      // Restaurer le scroll
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    }

    // Cleanup au démontage du composant
    return () => {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    };
  }, [confirmingDelete]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      // Optimized activation for better mobile experience
      activationConstraint: {
        distance: 5, // Reduced distance for more responsive drag
        tolerance: 5, // Add tolerance for better touch detection
        delay: 100, // Small delay to distinguish from scrolling
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (catalog) {
      setLocalCatalog(catalog);
    } else {
      // Initialize with default symptoms
      const defaultSymptoms = symptomService.getDefaultSymptomTypes();
      const defaultCatalog: SymptomCatalogItem[] = defaultSymptoms.map((symptom, index) => ({
        key: symptom.key as string,
        label: symptom.label,
        icon: 'default',
        enabled: true,
        order: index
      }));
      setLocalCatalog(defaultCatalog);
    }
  }, [catalog]);

  const handleToggleSymptom = async (key: string) => {
    const updatedCatalog = localCatalog.map(item => 
      item.key === key ? { ...item, enabled: !item.enabled } : item
    );
    setLocalCatalog(updatedCatalog);
    // Automatically save changes
    await onUpdate(updatedCatalog);
  };

  const handleAddCustomSymptom = () => {
    if (!newSymptomName.trim()) return;
    
    const newSymptom: SymptomCatalogItem = {
      key: `custom_${Date.now()}`,
      label: newSymptomName.trim(),
      icon: 'custom',
      enabled: true,
      order: localCatalog.length
    };
    
    setLocalCatalog(prev => [...prev, newSymptom]);
    setNewSymptomName('');
  };

  const handleRemoveSymptom = (key: string) => {
    const enabledCount = localCatalog.filter(item => item.enabled).length;
    const itemToRemove = localCatalog.find(item => item.key === key);
    
    // Prevent deletion if it's the last active symptom
    if (itemToRemove?.enabled && enabledCount <= 1) {
      return;
    }
    
    // Show confirmation dialog
    setConfirmingDelete(key);
  };

  const handleConfirmDelete = () => {
    if (confirmingDelete) {
      setLocalCatalog(prev => prev.filter(item => item.key !== confirmingDelete));
      setConfirmingDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setConfirmingDelete(null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setLocalCatalog((items) => {
        const oldIndex = items.findIndex(item => item.key === active.id);
        const newIndex = items.findIndex(item => item.key === over.id);
        
        const reorderedItems = arrayMove(items, oldIndex, newIndex);
        // Update orders
        return reorderedItems.map((item, index) => ({
          ...item,
          order: index
        }));
      });
    }
  };

  const handleStartEdit = (key: string, currentName: string) => {
    setEditingItemId(key);
    setEditingName(currentName);
  };

  const handleSaveEdit = (key: string) => {
    if (!editingName.trim()) return;
    
    setLocalCatalog(prev => prev.map(item => 
      item.key === key ? { ...item, label: editingName.trim() } : item
    ));
    setEditingItemId(null);
    setEditingName('');
  };

  const handleCancelEdit = () => {
    setEditingItemId(null);
    setEditingName('');
  };

  const handleSave = async () => {
    await onUpdate(localCatalog);
    setIsEditing(false);
  };

  const getRecommendedSymptoms = () => {
    const baseSymptoms = ['abdominal_pain', 'fatigue', 'bloating', 'sleep_quality'];
    
    if (diagnosis === 'crohn') {
      return [...baseSymptoms, 'joint_pain', 'weight_loss', 'fever'];
    } else if (diagnosis === 'colite-ulcereuse') {
      return [...baseSymptoms, 'rectal_bleeding', 'urgency', 'tenesmus'];
    }
    
    return baseSymptoms;
  };

  const enabledCount = localCatalog.filter(item => item.enabled).length;
  const canRemoveSymptoms = enabledCount > 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-[#303d25]">Catalogue de symptômes</h3>
          <p className="text-sm text-[#303d25]/70">
            {enabledCount} symptôme{enabledCount > 1 ? 's' : ''} activé{enabledCount > 1 ? 's' : ''}
          </p>
        </div>
        <Button
          variant={isEditing ? 'secondary' : 'primary'}
          onClick={() => setIsEditing(!isEditing)}
          size="sm"
        >
          {isEditing ? 'Annuler' : 'Personnaliser mes symptômes'}
        </Button>
      </div>

      {/* Recommandations basées sur le diagnostic */}
      {diagnosis && !isEditing && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-blue-800 mb-2">
            Symptômes recommandés pour {diagnosis === 'crohn' ? 'la maladie de Crohn' : 'la colite ulcéreuse'}
          </h4>
          <p className="text-xs text-blue-700">
            Basé sur votre diagnostic, certains symptômes sont particulièrement pertinents à suivre.
          </p>
        </div>
      )}

      {/* Liste des symptômes */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <style>{`
          .sortable-item {
            transform-origin: center;
            -webkit-transform: translateZ(0);
            transform: translateZ(0);
            -webkit-user-select: none;
            -moz-user-select: none;
            -ms-user-select: none;
            user-select: none;
            -webkit-touch-callout: none;
            -webkit-tap-highlight-color: transparent;
            -webkit-text-size-adjust: none !important;
            -webkit-font-smoothing: antialiased !important;
          }
          .sortable-item.dragging {
            pointer-events: none;
          }
          .sortable-item * {
            -webkit-user-select: none !important;
            -moz-user-select: none !important;
            -ms-user-select: none !important;
            user-select: none !important;
            -webkit-touch-callout: none !important;
            -webkit-tap-highlight-color: transparent !important;
          }
          .sortable-item::-webkit-selection {
            background: transparent !important;
          }
          .sortable-item::-moz-selection {
            background: transparent !important;
          }
          .sortable-item::selection {
            background: transparent !important;
          }
        `}</style>
        <SortableContext
          items={localCatalog.map(item => item.key)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {localCatalog
              .sort((a, b) => a.order - b.order)
              .map((item) => (
                <SortableSymptomItem
                  key={item.key}
                  item={item}
                  isEditing={isEditing}
                  editingItemId={editingItemId}
                  editingName={editingName}
                  onToggle={handleToggleSymptom}
                  onStartEdit={handleStartEdit}
                  onSaveEdit={handleSaveEdit}
                  onCancelEdit={handleCancelEdit}
                  onEditNameChange={setEditingName}
                  onRemove={handleRemoveSymptom}
                  canRemove={canRemoveSymptoms}
                />
              ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* Ajouter un symptôme personnalisé */}
      {isEditing && (
        <div className="border-t border-[#e3c79f]/30 pt-4">
          <h4 className="text-sm font-semibold text-[#303d25] mb-3">
            Ajouter un symptôme personnalisé
          </h4>
          <div className="flex gap-2">
            <Input
              value={newSymptomName}
              onChange={setNewSymptomName}
              placeholder="Ex: Nausées, Maux de tête..."
              className="flex-1"
            />
            <Button
              onClick={handleAddCustomSymptom}
              disabled={!newSymptomName.trim()}
              size="sm"
            >
              <Plus size={16} />
            </Button>
          </div>
        </div>
      )}

      {/* Actions */}
      {isEditing && (
        <div className="flex justify-end gap-2 pt-4 border-t border-[#e3c79f]/30">
          <Button
            variant="secondary"
            onClick={() => setIsEditing(false)}
          >
            Annuler
          </Button>
          <Button
            onClick={handleSave}
          >
            Sauvegarder
          </Button>
        </div>
      )}

      {/* Modal de confirmation de suppression */}
      {confirmingDelete && createPortal(
        <div 
           className="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-sm" 
           style={{ zIndex: 9999, backgroundColor: 'rgba(227, 199, 159, 0.2)' }}
           onClick={handleCancelDelete}
         >
          <div className="bg-white/95 backdrop-blur-sm rounded-xl p-8 max-w-md mx-4 shadow-lg border border-[#e3c79f]/30" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-[#e3c79f]/20 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-[#b36b43]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-xl font-medium text-[#303d25]">
                Confirmer la suppression
              </h3>
            </div>
            
            <div className="mb-8">
               <p className="text-[#303d25] mb-3 leading-relaxed">
                 Supprimer définitivement <strong className="text-[#b36b43]">"{localCatalog.find(item => item.key === confirmingDelete)?.label}"</strong> ?
               </p>
               <p className="text-sm text-[#303d25]/60">
                 Cette action ne peut pas être annulée.
               </p>
             </div>
            
            <div className="flex justify-end gap-3">
              <button
                onClick={handleCancelDelete}
                className="px-6 py-2.5 text-[#303d25] bg-[#e3c79f]/20 rounded-lg hover:bg-[#e3c79f]/30 transition-colors font-medium border border-[#e3c79f]"
              >
                Annuler
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-6 py-2.5 text-white bg-[#b36b43] rounded-lg hover:bg-[#9d5a37] transition-colors font-medium"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}