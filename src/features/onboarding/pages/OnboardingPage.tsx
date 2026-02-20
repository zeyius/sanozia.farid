import React from 'react';
import { useOnboarding } from '../hooks/useOnboarding';
import { Layout } from '../../../shared/components/Layout';
import { Button } from '../../../shared/components/Button';
import { FormField } from '../../../shared/components/FormField';
import { Input } from '../../../shared/components/Input';
import { Select } from '../../../shared/components/Select';
import { DIAGNOSES, RECTOCOLITE_SIGNATURES } from '../../../shared/constants';

export function OnboardingPage() {
  // Test simple pour diagnostiquer le problème
  console.log('OnboardingPage: Rendu de la page');
  
  let hookData;
  try {
    hookData = useOnboarding();
    console.log('OnboardingPage: Hook useOnboarding fonctionne', { loading: hookData.loading, currentStep: hookData.currentStep });
  } catch (error) {
    console.error('OnboardingPage: Erreur avec useOnboarding:', error);
    return <div>Erreur: {error.message}</div>;
  }
  
  const {
    formData,
    currentStep,
    totalSteps,
    errors,
    loading,
    updateFormData,
    nextStep,
    previousStep,
    addTreatment,
    updateTreatment,
    removeTreatment
  } = hookData;

  const isLastStep = currentStep === totalSteps || (currentStep === 2 && (!formData.diagnosis || formData.diagnosis === '' || formData.diagnosis === 'aucune'));

  return (
    <Layout>
      <div className="flex items-start justify-center pt-8">
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-8 w-full max-w-md">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-[#303d25] mb-2">
              Configuration de votre profil
            </h1>
            <div className="flex justify-center space-x-2 mb-4">
              {Array.from({ length: totalSteps }, (_, i) => (
                <div
                  key={i}
                  className={`w-3 h-3 rounded-full ${
                    i + 1 <= currentStep ? 'bg-[#303d25]' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
            <p className="text-gray-600">
              Étape {currentStep} sur {totalSteps}
            </p>
          </div>

          {errors.general && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-red-800 text-sm">{errors.general}</p>
            </div>
          )}

          {/* Step 1: Personal Information */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-[#303d25] mb-4">
                Informations personnelles
              </h2>
              
              <FormField label="Nom complet" error={errors.name}>
                <Input
                  value={formData.name}
                  onChange={(value) => updateFormData({ name: value })}
                  placeholder="Votre nom complet"
                  disabled={loading}
                />
              </FormField>
              
              <FormField label="Date de naissance" error={errors.birth_date}>
                <Input
                  type="date"
                  value={formData.birth_date}
                  onChange={(value) => updateFormData({ birth_date: value })}
                  disabled={loading}
                />
              </FormField>
              
              <FormField label="Sexe" error={errors.gender}>
                <Select
                  value={formData.gender}
                  onChange={(value) => updateFormData({ gender: value as 'male' | 'female' })}
                  options={[
                    { value: 'male', label: 'Homme' },
                    { value: 'female', label: 'Femme' }
                  ]}
                  placeholder="Sélectionnez votre sexe"
                  disabled={loading}
                />
              </FormField>
            </div>
          )}

          {/* Step 2: Diagnosis */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-[#303d25] mb-4">
                Diagnostic (optionnel)
              </h2>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-blue-800">
                  <strong>Information :</strong> Cette étape est optionnelle. 
                  Vous pouvez renseigner votre diagnostic si vous en avez un, 
                  ou passer cette étape si vous n'en avez pas encore.
                </p>
              </div>
              
              <FormField label="Diagnostic">
                <Select
                  value={formData.diagnosis}
                  onChange={(value) => updateFormData({ diagnosis: value })}
                  options={[
                    { value: 'aucune', label: 'Aucun diagnostic' },
                    ...DIAGNOSES.map(d => ({ value: d.value, label: d.label }))
                  ]}
                  placeholder="Sélectionnez un diagnostic (optionnel)"
                  disabled={loading}
                />
              </FormField>
            </div>
          )}

          {/* Step 3: UC Specific Questions */}
          {currentStep === 3 && formData.diagnosis === 'colite-ulcereuse' && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-[#303d25] mb-4">
                Questions spécifiques - Rectocolite hémorragique
              </h2>
              
              <FormField label="Signature de votre rectocolite">
                <Select
                  value={formData.rectocolite_signature}
                  onChange={(value) => updateFormData({ rectocolite_signature: value })}
                  options={[
                    ...RECTOCOLITE_SIGNATURES.map(r => ({ value: r.value, label: r.label }))
                  ]}
                  disabled={loading}
                  placeholder="Sélectionnez la localisation"
                />
              </FormField>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                <h4 className="text-sm font-semibold text-blue-800 mb-2">
                  💡 Information sur les signatures
                </h4>
                <p className="text-xs text-blue-700">
                  La signature de votre rectocolite correspond à la localisation de l'inflammation 
                  dans votre côlon. Cette information est importante pour adapter votre traitement 
                  et votre suivi médical.
                </p>
              </div>
            </div>
          )}

          {/* Step 4: Treatments */}
          {currentStep === (formData.diagnosis === 'colite-ulcereuse' ? 4 : 3) && formData.diagnosis && formData.diagnosis !== 'aucune' && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-[#303d25] mb-4">
                Traitement (optionnel)
              </h2>
              
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-green-800">
                  <strong>Information :</strong> Vous pouvez ajouter vos traitements actuels. 
                  Cette étape est optionnelle et vous pourrez modifier ces informations à tout moment.
                </p>
              </div>
              
              <div className="space-y-4">
                {formData.treatments.map((treatment) => (
                  <div key={treatment.id} className="bg-[#f6e6d6] p-4 rounded-lg">
                    <Input
                      value={treatment.name}
                      onChange={(value) => updateTreatment(treatment.id, { name: value })}
                      placeholder="Nom du traitement (ex: Humira, Pentasa...)"
                      disabled={loading}
                    />
                    <button
                      onClick={() => removeTreatment(treatment.id)}
                      className="mt-2 text-red-600 text-sm hover:text-red-800"
                      disabled={loading}
                    >
                      Supprimer
                    </button>
                  </div>
                ))}
                
                <Button
                  onClick={addTreatment}
                  variant="outline"
                  fullWidth
                  disabled={loading}
                >
                  Ajouter un traitement
                </Button>
              </div>
            </div>
          )}

          <div className="flex gap-3 mt-8">
            {currentStep > 1 && (
              <Button
                onClick={previousStep}
                variant="outline"
                fullWidth
                disabled={loading}
              >
                Précédent
              </Button>
            )}
            <Button
              onClick={nextStep}
              fullWidth
              disabled={loading}
            >
              {loading ? 'Chargement...' : (isLastStep ? 'Terminer' : 'Suivant')}
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
