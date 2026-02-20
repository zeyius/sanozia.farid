import { useState } from 'react';

interface DeletedItem {
  item: any;
  type: 'stool' | 'consumption' | 'symptom';
}

export function useItemDeleter(
  removeStool: (id: string) => void,
  removeConsumption: (id: string) => void,
  removeSymptom: (id: string) => void,
  restoreStool: (item: any) => void,
  restoreConsumption: (item: any) => void,
  restoreSymptom: (item: any) => void
) {
  const [deletingItem, setDeletingItem] = useState<{id: string, type: 'stool' | 'consumption' | 'symptom'} | null>(null);
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);
  const [deletedItem, setDeletedItem] = useState<DeletedItem | null>(null);
  const [showUndoToast, setShowUndoToast] = useState(false);
  const [undoTimeout, setUndoTimeout] = useState<NodeJS.Timeout | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleDeleteItem = (itemId: string, type: 'stool' | 'consumption' | 'symptom') => {
    setDeletingItem({ id: itemId, type });
  };

  const handleConfirmDelete = async (
    stools: any[],
    consumptions: any[],
    symptoms: any[]
  ) => {
    if (!deletingItem) return;
    
    // Trouver l'élément à supprimer selon son type
    let itemToDelete: any;
    switch (deletingItem.type) {
      case 'stool':
        itemToDelete = stools.find(s => s.id === deletingItem.id);
        break;
      case 'consumption':
        itemToDelete = consumptions.find(c => c.id === deletingItem.id);
        break;
      case 'symptom':
        itemToDelete = symptoms.find(s => s.id === deletingItem.id);
        break;
    }
    
    if (!itemToDelete) return;
    
    setDeleting(true);
    try {
      // 1. Animation de disparition
      setDeletingItemId(deletingItem.id);
      
      // 2. Attendre l'animation
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // 3. Supprimer de la liste
      switch (deletingItem.type) {
        case 'stool':
          removeStool(deletingItem.id);
          break;
        case 'consumption':
          removeConsumption(deletingItem.id);
          break;
        case 'symptom':
          removeSymptom(deletingItem.id);
          break;
      }
      
      // 4. Sauvegarder pour undo et afficher le toast
      setDeletedItem({ item: itemToDelete, type: deletingItem.type });
      setShowUndoToast(true);
      
      // 5. Timer d'auto-dismiss
      const timeout = setTimeout(() => {
        setShowUndoToast(false);
        setDeletedItem(null);
      }, 5000);
      setUndoTimeout(timeout);
      
      // 6. Fermer la modal
      setDeletingItem(null);
      setDeletingItemId(null);
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      setDeletingItemId(null);
    } finally {
      setDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setDeletingItem(null);
  };

  const handleUndoDelete = () => {
    if (!deletedItem) return;
    
    // Annuler le timeout
    if (undoTimeout) {
      clearTimeout(undoTimeout);
      setUndoTimeout(null);
    }
    
    // Restaurer l'élément
    switch (deletedItem.type) {
      case 'stool':
        restoreStool(deletedItem.item);
        break;
      case 'consumption':
        restoreConsumption(deletedItem.item);
        break;
      case 'symptom':
        restoreSymptom(deletedItem.item);
        break;
    }
    
    // Nettoyer les états
    setDeletedItem(null);
    setShowUndoToast(false);
  };

  const handleDismissToast = () => {
    if (undoTimeout) {
      clearTimeout(undoTimeout);
      setUndoTimeout(null);
    }
    setShowUndoToast(false);
    setDeletedItem(null);
  };

  return {
    deletingItem,
    deletingItemId,
    deletedItem,
    showUndoToast,
    deleting,
    handleDeleteItem,
    handleConfirmDelete,
    handleCancelDelete,
    handleUndoDelete,
    handleDismissToast
  };
}
