import { useState } from 'react';
import { logger } from '../../../shared/utils/logger';

interface UseTreatmentManagementProps {
  addTreatment: (name: string) => Promise<void>;
  removeTreatment: (treatmentId: string) => Promise<void>;
}

export function useTreatmentManagement({ addTreatment, removeTreatment }: UseTreatmentManagementProps) {
  const [isAddingTreatment, setIsAddingTreatment] = useState(false);
  const [newTreatmentName, setNewTreatmentName] = useState('');

  const handleAddTreatment = async () => {
    if (!newTreatmentName.trim()) return;

    try {
      await addTreatment(newTreatmentName.trim());
      setNewTreatmentName('');
      setIsAddingTreatment(false);
      logger.info('Treatment added successfully', { 
        treatmentName: newTreatmentName.trim(), 
        context: 'TreatmentManagement' 
      });
    } catch (error) {
      logger.error('Failed to add treatment', { 
        error, 
        treatmentName: newTreatmentName.trim(), 
        context: 'TreatmentManagement' 
      });
    }
  };

  const handleRemoveTreatment = async (treatmentId: string) => {
    try {
      await removeTreatment(treatmentId);
      logger.info('Treatment removed successfully', { 
        treatmentId, 
        context: 'TreatmentManagement' 
      });
    } catch (error) {
      logger.error('Failed to remove treatment', { 
        error, 
        treatmentId, 
        context: 'TreatmentManagement' 
      });
    }
  };

  return {
    isAddingTreatment,
    newTreatmentName,
    setIsAddingTreatment,
    setNewTreatmentName,
    handleAddTreatment,
    handleRemoveTreatment
  };
}
