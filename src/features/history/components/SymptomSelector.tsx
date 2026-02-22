import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Search, Plus, Book } from 'lucide-react';
import { profileService } from '../../profile/services/profileService';
import type { SymptomCatalogItem } from '../../../shared/types';

interface SymptomSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSymptom: (symptomName: string) => void;
  existingSymptoms: string[]; // Pour éviter les doublons
}

export function SymptomSelector({ isOpen, onClose, onSelectSymptom, existingSymptoms }: SymptomSelectorProps) {
  const [catalog, setCatalog] = useState<SymptomCatalogItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      loadCatalog();
      // Prevent scrolling when modal is open
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';
    } else {
      // Restore scrolling when modal closes
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    }

    return () => {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    };
  }, [isOpen]);

  const loadCatalog = async () => {
    try {
      setLoading(true);
      const catalogData = await profileService.getSymptomCatalog();
      // Garder tous les symptômes (activés et désactivés)
      setCatalog(catalogData || []);
    } catch (error) {
      console.error('Erreur lors du chargement du catalogue:', error);
      setCatalog([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredSymptoms = catalog.filter(item => {
    const matchesSearch = item.label.toLowerCase().includes(searchTerm.toLowerCase());
    const notAlreadySelected = !existingSymptoms.some(existing => 
      existing.toLowerCase() === item.label.toLowerCase()
    );
    return matchesSearch && notAlreadySelected;
  });

  // Séparer les symptômes activés et désactivés
  const enabledSymptoms = filteredSymptoms.filter(item => item.enabled);
  const disabledSymptoms = filteredSymptoms.filter(item => !item.enabled);

  const handleSelectSymptom = (symptomName: string) => {
    onSelectSymptom(symptomName);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center" 
      style={{ zIndex: 10001, backgroundColor: 'rgba(227, 199, 159, 0.2)' }}
      onClick={onClose}
    >
      <div 
        className="bg-white/95 backdrop-blur-sm rounded-xl max-w-2xl w-full mx-4 shadow-lg border border-[#e3c79f]/30 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#e3c79f]/30">
          <h2 className="text-xl font-semibold text-[#303d25]">Catalogue des symptômes</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[#e3c79f]/20 rounded-lg transition-colors"
          >
            <X size={20} className="text-[#303d25]" />
          </button>
        </div>

        {/* Search */}
        <div className="p-6 border-b border-[#e3c79f]/30">
          <div className="relative">
            <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#303d25]/40" />
            <input
              type="text"
              placeholder="Rechercher un symptôme..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-[#e3c79f] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#b36b43] focus:border-transparent bg-white/50"
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#b36b43]"></div>
            </div>
          ) : (

            <div className="space-y-3">
              {/* Enabled symptoms */}
              {enabledSymptoms.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-[#303d25] mb-3">Symptômes disponibles</h3>
                  {enabledSymptoms.map((symptom) => (
                    <button
                       key={symptom.key}
                       onClick={() => handleSelectSymptom(symptom.label)}
                       disabled={existingSymptoms.includes(symptom.label)}
                       className={`w-full p-3 rounded-lg border transition-all duration-200 ${
                         existingSymptoms.includes(symptom.label)
                           ? 'bg-gray-50 border-gray-200 cursor-not-allowed opacity-50'
                           : 'bg-white/50 border-[#e3c79f] hover:bg-[#e3c79f]/10 hover:border-[#b36b43] group'
                       }`}
                     >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Book size={14} className="text-[#303d25]/40 group-hover:text-[#b36b43] transition-colors" />
                          <span className="text-[#303d25] group-hover:text-[#b36b43] transition-colors">
                            {symptom.label}
                          </span>
                          {existingSymptoms.includes(symptom.label) && (
                            <span className="text-xs text-gray-500 ml-2">(déjà ajouté)</span>
                          )}
                        </div>
                        {!existingSymptoms.includes(symptom.label) && (
                          <Plus size={16} className="text-[#303d25]/40 group-hover:text-[#b36b43] transition-colors" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Disabled symptoms */}
              {disabledSymptoms.length > 0 && (
                <div className="space-y-2 mt-6">
                  <h3 className="text-sm font-medium text-[#303d25]/60 mb-3">Symptômes désactivés</h3>
                  {disabledSymptoms.map((symptom) => (
                    <button
                       key={symptom.key}
                       onClick={() => handleSelectSymptom(symptom.label)}
                       disabled={existingSymptoms.includes(symptom.label)}
                       className={`w-full p-3 rounded-lg border transition-all duration-200 ${
                         existingSymptoms.includes(symptom.label)
                           ? 'bg-gray-50 border-gray-200 cursor-not-allowed opacity-30'
                           : 'bg-white/30 border-[#e3c79f]/50 hover:bg-[#e3c79f]/10 hover:border-[#b36b43] group opacity-60 hover:opacity-100'
                       }`}
                     >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Book size={14} className="text-[#303d25]/40 group-hover:text-[#b36b43] transition-colors" />
                          <span className="text-[#303d25]/70 group-hover:text-[#b36b43] transition-colors">
                            {symptom.label}
                          </span>
                        </div>
                        <Plus size={16} className="text-[#303d25]/40 group-hover:text-[#b36b43] transition-colors" />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#e3c79f]">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg border border-gray-300 hover:bg-gray-200 transition-colors"
          >
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
}