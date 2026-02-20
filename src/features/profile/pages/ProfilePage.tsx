import React, { useState } from 'react';
import { useAuth } from '../../auth';
import { useProfile } from '../hooks/useProfile';
import { useTreatmentManagement } from '../hooks/useTreatmentManagement';
import { SymptomCatalogModal } from '../components/SymptomCatalogModal';
import { ProfileEditModal } from '../components/ProfileEditModal';
import { profileService } from '../services/profileService';
import { Layout } from '../../../shared/components/Layout';
import { Button } from '../../../shared/components/Button';
import { DIAGNOSES, RECTOCOLITE_SIGNATURES } from '../../../shared/constants';
import { 
  User, 
  Heart, 
  Activity, 
  Settings, 
  Edit, 
  Pill, 
  Plus, 
  Trash2 
} from 'lucide-react';

export function ProfilePage() {
  const { user, signOut } = useAuth();
  const { profile, treatments, updateProfile, updateProfileLocal, addTreatment, removeTreatment, loading, refetch } = useProfile();
  const [modalSection, setModalSection] = useState<'personal' | 'medical' | null>(null);
  const [isSymptomModalOpen, setIsSymptomModalOpen] = useState(false);
  
  // Hook personnalisé pour la gestion des traitements
  const treatmentManagement = useTreatmentManagement({ 
    addTreatment: async (name: string) => {
      await addTreatment({ name });
    },
    removeTreatment 
  });

  const handleOpenModal = (section: 'personal' | 'medical') => {
    setModalSection(section);
  };

  const getAge = () => {
    const birthDate = profile?.birth_date;
    const isBirthDateValid = profile && birthDate;

    if (!isBirthDateValid) return 'Non renseigné';

    const parsedDate = Date.parse(birthDate);
    return calculateAge(new Date(parsedDate));
  };

  const calculateAge = (birthDate: Date): number => {
    const birth = new Date(birthDate);
    const today = new Date();

    let age = today.getFullYear() - birth.getFullYear();

    const currentMonth = today.getMonth();
    const birthMonth = birth.getMonth();
    const currentDay = today.getDate();
    const birthDay = birth.getDate();

    const hasBirthdayOccurredThisYear =
      currentMonth > birthMonth ||
      (currentMonth === birthMonth && currentDay >= birthDay);

    if (!hasBirthdayOccurredThisYear) {
      age--;
    }

    return age;
  };

  const handleCloseModal = () => {
    setModalSection(null);
  };

  if (loading) {
    return (
      <Layout title="Mon Profil" showBackButton>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#303d25]"></div>
        </div>
      </Layout>
    );
  }

  // Calcul du statut de complétude du profil
  const getProfileCompleteness = () => {
    const fields = [
      profile?.name,
      profile?.birth_date,
      profile?.gender,
      profile?.diagnosis
    ];
    const completed = fields.filter(Boolean).length;
    const total = fields.length;
    return { completed, total, percentage: Math.round((completed / total) * 100) };
  };

  const completeness = getProfileCompleteness();

  // Gestion optimisée du catalogue de symptômes avec préservation du scroll
  const handleUpdateSymptomCatalog = async (catalog: any[]) => {
    const scrollPosition = window.scrollY;
    
    try {
      // Mise à jour immédiate de l'interface pour une UX fluide
      updateProfileLocal({ symptom_catalog: catalog });
      
      // Sauvegarde en base de données en arrière-plan
      await profileService.updateSymptomCatalog(catalog);
      
      // Restaurer la position de scroll
      window.scrollTo(0, scrollPosition);
      
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      
      // Restaurer l'état précédent en cas d'erreur
      await refetch();
      window.scrollTo(0, scrollPosition);
      alert('Erreur lors de la sauvegarde. Les données ont été restaurées.');
    }
  };

  return (
    <Layout title="Mon Profil" showBackButton>
      <div className="max-w-4xl mx-auto p-6 space-y-8">
        {/* Header avec statut du profil */}
        <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 sm:p-6 shadow-lg border border-[#e3c79f]/30">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-[#e3c79f] to-[#b36b43] rounded-full flex items-center justify-center">
              <span className="text-white text-xl font-bold">
                {profile?.name?.charAt(0)?.toUpperCase() || 'U'}
              </span>
            </div>
            <div className="flex-1">
              <h1 className="text-xl sm:text-2xl font-bold text-[#303d25] mb-1">
                {profile?.name || 'Utilisateur'}
              </h1>
              <p className="text-sm text-[#303d25]/60">
                {profile?.diagnosis ? `Diagnostic: ${DIAGNOSES.find(d => d.value === profile.diagnosis)?.label || profile.diagnosis}` : 'Profil en cours de configuration'}
              </p>
            </div>
          </div>

          {/* Barre de progression du profil */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-[#303d25]/70">Complétude du profil</span>
              <span className="font-medium text-[#303d25]">{completeness.percentage}%</span>
            </div>
            <div className="w-full bg-[#e3c79f]/30 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-[#e3c79f] to-[#b36b43] h-2 rounded-full transition-all duration-300"
                style={{ width: `${completeness.percentage}%` }}
              />
            </div>
            <p className="text-xs text-[#303d25]/60">
              {completeness.completed} sur {completeness.total} informations essentielles renseignées
            </p>
          </div>
        </div>

        {/* Section Informations personnelles */}
        <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 sm:p-6 shadow-lg border border-[#e3c79f]/30">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <User className="text-blue-600" size={20} />
              <h2 className="text-lg font-semibold text-[#303d25]">Informations personnelles</h2>
            </div>
            <Button
              onClick={() => handleOpenModal('personal')}
              variant="outline"
              size="sm"
              className="text-[#b36b43] border-[#b36b43] hover:bg-[#b36b43] hover:text-white"
            >
              <Edit size={16} />
              Modifier
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div>
                <span className="text-sm font-medium text-[#303d25]">Nom complet</span>
                <p className="text-[#303d25]/80">{profile?.name || 'Non renseigné'}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-[#303d25]">Âge</span>
                <p className="text-[#303d25]/80">
                  {getAge()}
                </p>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <span className="text-sm font-medium text-[#303d25]">Genre</span>
                <p className="text-[#303d25]/80">
                  {profile?.gender === 'male' ? 'Homme' : 
                   profile?.gender === 'female' ? 'Femme' : 'Non renseigné'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Section Informations médicales */}
        <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 sm:p-6 shadow-lg border border-[#e3c79f]/30">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Heart className="text-red-600" size={20} />
              <h2 className="text-lg font-semibold text-[#303d25]">Informations médicales</h2>
            </div>
            <Button
              onClick={() => handleOpenModal('medical')}
              variant="outline"
              size="sm"
              className="text-[#b36b43] border-[#b36b43] hover:bg-[#b36b43] hover:text-white"
            >
              <Edit size={16} />
              Modifier
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div>
                <span className="text-sm font-medium text-[#303d25]">Diagnostic</span>
                <p className="text-[#303d25]/80">
                  {profile?.diagnosis 
                    ? DIAGNOSES.find(d => d.value === profile.diagnosis)?.label || profile.diagnosis
                    : 'Non renseigné'
                  }
                </p>
              </div>
              {profile?.diagnosis === 'rectocolite_hemorragique' && profile?.rectocolite_signature && (
                <div>
                  <span className="text-sm font-medium text-[#303d25]">Signature de la rectocolite</span>
                  <p className="text-[#303d25]/80">
                    {RECTOCOLITE_SIGNATURES.find(s => s.value === profile.rectocolite_signature)?.label || profile.rectocolite_signature}
                  </p>
                </div>
              )}
            </div>
            <div className="space-y-3">
              <div>
                <span className="text-sm font-medium text-[#303d25]">Dernière calprotectine</span>
                <p className="text-[#303d25]/80">
                  {profile?.last_calprotectin_value 
                    ? `${profile.last_calprotectin_value} µg/g`
                    : 'Non renseigné'
                  }
                </p>
              </div>
              {profile?.last_calprotectin_date && (
                <div>
                  <span className="text-sm font-medium text-[#303d25]">Date du dosage</span>
                  <p className="text-[#303d25]/80">
                    {new Date(profile.last_calprotectin_date).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Section Gestion des symptômes */}
        <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 sm:p-6 shadow-lg border border-[#e3c79f]/30">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Activity className="text-purple-600" size={20} />
              <h2 className="text-lg font-semibold text-[#303d25]">Gestion des symptômes</h2>
            </div>
            <Button
              onClick={() => setIsSymptomModalOpen(true)}
              variant="outline"
              size="sm"
              className="text-[#b36b43] border-[#b36b43] hover:bg-[#b36b43] hover:text-white"
            >
              <Settings size={16} />
              Personnaliser
            </Button>
          </div>

          <div className="space-y-4">
            <div>
              <span className="text-sm font-medium text-[#303d25]">Symptômes actifs</span>
              <p className="text-[#303d25]/80">
                {profile?.symptom_catalog 
                  ? (profile.symptom_catalog as any[]).filter(s => s.enabled).length
                  : 'Non configuré'
                } symptôme{profile?.symptom_catalog && (profile.symptom_catalog as any[]).filter(s => s.enabled).length > 1 ? 's' : ''}
              </p>
            </div>
            
            {profile?.symptom_catalog && (profile.symptom_catalog as any[]).length > 0 && (
              <div className="bg-[#f6e6d6]/30 rounded-lg p-4 border border-[#e3c79f]/30">
                <h4 className="text-sm font-semibold text-[#303d25] mb-2">Symptômes suivis</h4>
                <div className="flex flex-wrap gap-2">
                  {(profile.symptom_catalog as any[])
                    .filter(s => s.enabled)
                    .map((symptom, index) => (
                      <span 
                        key={index}
                        className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full"
                      >
                        {symptom.label}
                      </span>
                    ))
                  }
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Section Traitements */}
        <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 sm:p-6 shadow-lg border border-[#e3c79f]/30">
          <div className="flex items-center gap-3 mb-6">
            <Pill className="text-green-600" size={20} />
            <h2 className="text-lg font-semibold text-[#303d25]">Traitements</h2>
          </div>

          <div className="space-y-4">
            {treatments.length > 0 ? (
              treatments.map((treatment) => (
                <div key={treatment.id} className="flex items-center justify-between p-4 bg-[#f6e6d6]/30 rounded-lg border border-[#e3c79f]/30">
                  <div className="flex-1">
                    <h3 className="font-medium text-[#303d25]">{treatment.name}</h3>
                    <p className="text-sm text-[#303d25]/70">
                      {treatment.dosage} - {treatment.frequency}
                    </p>
                  </div>
                  <Button
                    onClick={() => removeTreatment(treatment.id)}
                    variant="outline"
                    size="sm"
                    className="text-red-600 border-red-300 hover:bg-red-50"
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              ))
            ) : (
              <p className="text-[#303d25]/60 text-center py-8">
                Aucun traitement enregistré
              </p>
            )}

            <Button
              onClick={() => {/* TODO: Implémenter l'ajout de traitement */}}
              variant="outline"
              className="w-full text-[#b36b43] border-[#b36b43] hover:bg-[#b36b43] hover:text-white"
            >
              <Plus size={16} />
              Ajouter un traitement
            </Button>
          </div>
        </div>

        {/* Section Compte */}
        <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 sm:p-6 shadow-lg border border-[#e3c79f]/30">
          <div className="flex items-center gap-3 mb-6">
            <Settings className="text-gray-600" size={20} />
            <h2 className="text-lg font-semibold text-[#303d25]">Compte</h2>
          </div>

          <div className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-1">
                <span className="text-sm font-medium text-[#303d25]">Email</span>
                <p className="text-[#303d25]/80 break-all">{user?.email}</p>
              </div>
              <div className="space-y-1">
                <span className="text-sm font-medium text-[#303d25]">Membre depuis</span>
                <p className="text-[#303d25]/80">
                  {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('fr-FR') : 'N/A'}
                </p>
              </div>
            </div>
            
            <div className="pt-6 border-t border-[#e3c79f]/30">
              <Button
                onClick={signOut}
                variant="outline"
                className="w-full text-red-600 border-red-300 hover:bg-red-50"
              >
                Se déconnecter
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Modals d'édition */}
      {profile && (
        <>
          <ProfileEditModal
            isOpen={modalSection === 'personal'}
            onClose={handleCloseModal}
            section="personal"
            profile={profile}
            updateProfile={updateProfile}
          />
          <ProfileEditModal
            isOpen={modalSection === 'medical'}
            onClose={handleCloseModal}
            section="medical"
            profile={profile}
            updateProfile={updateProfile}
          />
          <SymptomCatalogModal
            isOpen={isSymptomModalOpen}
            onClose={() => setIsSymptomModalOpen(false)}
            catalog={profile?.symptom_catalog as any[] | null}
            onUpdate={handleUpdateSymptomCatalog}
            diagnosis={profile?.diagnosis || undefined}
          />
        </>
      )}
    </Layout>
  );
}
