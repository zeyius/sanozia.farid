import React, { useState } from 'react';
import { Button } from './Button';

import { ArrowLeft, ArrowRight, CheckCircle } from 'lucide-react';
import { onboardingService, type QuestionnaireResponse, type SignatureResult } from '../../features/onboarding';

interface SignatureQuestionnaireProps {
  profileId: string;
  onComplete: (result: SignatureResult) => void;
  onCancel: () => void;
}

const questions = [
  {
    id: 'question1',
    title: 'Où ressentez-vous principalement vos symptômes ?',
    options: [
      { value: 'rectum', label: 'Uniquement au niveau du rectum' },
      { value: 'rectum-sigmoide', label: 'Rectum et côlon sigmoïde' },
      { value: 'colon-gauche', label: 'Côlon gauche (descendant)' },
      { value: 'colon-droit', label: 'Côlon droit (ascendant)' },
      { value: 'tout-colon', label: 'Ensemble du côlon' }
    ]
  },
  {
    id: 'question2',
    title: 'Comment décririez-vous l\'étendue de votre atteinte ?',
    options: [
      { value: 'limitee', label: 'Limitée (moins de 15 cm)' },
      { value: 'moderee', label: 'Modérée (15-30 cm)' },
      { value: 'etendue', label: 'Étendue (plus de 30 cm)' }
    ]
  },
  {
    id: 'question3',
    title: 'À quelle fréquence observez-vous du sang dans vos selles ?',
    options: [
      { value: 'jamais', label: 'Jamais' },
      { value: 'parfois', label: 'Parfois (1-2 fois par semaine)' },
      { value: 'souvent', label: 'Souvent (quotidiennement)' }
    ]
  },
  {
    id: 'question4',
    title: 'Ressentez-vous des urgences défécatoires ?',
    options: [
      { value: 'aucune', label: 'Aucune urgence' },
      { value: 'moderee', label: 'Urgence modérée' },
      { value: 'severe', label: 'Urgence sévère (difficile à retenir)' }
    ]
  },
  {
    id: 'question5',
    title: 'Combien de selles avez-vous par jour en moyenne ?',
    options: [
      { value: '1-3', label: '1 à 3 selles par jour' },
      { value: '4-6', label: '4 à 6 selles par jour' },
      { value: '7-10', label: '7 à 10 selles par jour' },
      { value: 'plus-10', label: 'Plus de 10 selles par jour' }
    ]
  },
  {
    id: 'question6',
    title: 'Où ressentez-vous des douleurs abdominales ?',
    options: [
      { value: 'aucune', label: 'Aucune douleur' },
      { value: 'rectale', label: 'Douleur rectale uniquement' },
      { value: 'gauche', label: 'Côté gauche de l\'abdomen' },
      { value: 'diffuse', label: 'Douleur diffuse dans l\'abdomen' }
    ]
  },
  {
    id: 'question7',
    title: 'Comment répondez-vous aux traitements locaux (lavements, suppositoires) ?',
    options: [
      { value: 'tres-bien', label: 'Très bonne réponse' },
      { value: 'moderee', label: 'Réponse modérée' },
      { value: 'faible', label: 'Faible réponse' },
      { value: 'aucune', label: 'Aucune réponse' }
    ]
  },
  {
    id: 'question8',
    title: 'Comment évoluent vos symptômes récemment ?',
    options: [
      { value: 'amelioration', label: 'Amélioration' },
      { value: 'stable', label: 'Stable' },
      { value: 'aggravation', label: 'Aggravation' }
    ]
  }
];

export function SignatureQuestionnaire({ onComplete, onCancel }: SignatureQuestionnaireProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [responses, setResponses] = useState<Partial<QuestionnaireResponse>>({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SignatureResult | null>(null);

  const currentQuestion = questions[currentStep];
  const isLastQuestion = currentStep === questions.length - 1;
  const canProceed = responses[currentQuestion?.id as keyof QuestionnaireResponse];

  const handleNext = () => {
    if (isLastQuestion) {
      handleComplete();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => prev - 1);
  };

  const handleComplete = async () => {
    if (Object.keys(responses).length !== questions.length) {
      return;
    }

    setLoading(true);
    try {
      // Note: saveQuestionnaire is not available in current schema
      // const questionnaire = await onboardingService.saveQuestionnaire(
      //   profileId,
      //   responses as QuestionnaireResponse
      // );

      const calculatedResult = onboardingService.calculateSignature(
        responses as QuestionnaireResponse
      );

      setResult(calculatedResult);
      onComplete(calculatedResult);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResponseChange = (value: string) => {
    setResponses(prev => ({
      ...prev,
      [currentQuestion.id]: value
    }));
  };

  if (result) {
    return (
      <div className="bg-white/90 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-[#e3c79f]/30">
        <div className="text-center mb-6">
          <CheckCircle size={48} className="text-green-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-[#303d25] mb-2">
            Questionnaire terminé !
          </h2>
        </div>

        <div className="bg-[#e3c79f]/20 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-[#303d25] mb-2">Votre signature calculée :</h3>
          <p className="text-lg font-bold text-[#b36b43] mb-2">
            {result.signature.charAt(0).toUpperCase() + result.signature.slice(1).replace('-', ' ')}
          </p>
          <p className="text-sm text-[#303d25]/80 mb-2">
            {result.description}
          </p>
          <p className="text-xs text-[#303d25]/60">
            Niveau de confiance : {result.confidence}%
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-blue-800">
            <strong>Important :</strong> Ce résultat est indicatif et doit être confirmé 
            par votre médecin lors d'un examen clinique et endoscopique.
          </p>
        </div>

        <Button onClick={onCancel} fullWidth>
          Retour au profil
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-[#e3c79f]/30">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-[#303d25]">
            Questionnaire de signature
          </h2>
          <span className="text-sm text-[#303d25]/60">
            {currentStep + 1} / {questions.length}
          </span>
        </div>
        
        {/* Barre de progression */}
        <div className="w-full bg-[#e3c79f]/30 rounded-full h-2 mb-4">
          <div 
            className="bg-[#b36b43] h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentStep + 1) / questions.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="mb-8">
        <h3 className="text-lg font-medium text-[#303d25] mb-4">
          {currentQuestion.title}
        </h3>

        <div className="space-y-2">
          {currentQuestion.options.map((option) => (
            <label
              key={option.value}
              className={`flex items-center p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                responses[currentQuestion.id as keyof QuestionnaireResponse] === option.value
                  ? 'border-[#b36b43] bg-[#b36b43]/10'
                  : 'border-[#e3c79f] hover:border-[#b36b43]/50'
              }`}
            >
              <input
                type="radio"
                name={currentQuestion.id}
                value={option.value}
                checked={responses[currentQuestion.id as keyof QuestionnaireResponse] === option.value}
                onChange={(e) => handleResponseChange(e.target.value)}
                className="sr-only"
              />
              <div className={`w-4 h-4 rounded-full border-2 mr-3 flex items-center justify-center ${
                responses[currentQuestion.id as keyof QuestionnaireResponse] === option.value
                  ? 'border-[#b36b43] bg-[#b36b43]'
                  : 'border-[#e3c79f]'
              }`}>
                {responses[currentQuestion.id as keyof QuestionnaireResponse] === option.value && (
                  <div className="w-2 h-2 rounded-full bg-white" />
                )}
              </div>
              <span className="text-[#303d25]">{option.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex gap-3">
        {currentStep > 0 && (
          <Button
            onClick={handlePrevious}
            variant="outline"
            icon={<ArrowLeft size={16} />}
            disabled={loading}
          >
            Précédent
          </Button>
        )}
        
        <Button
          onClick={onCancel}
          variant="outline"
          disabled={loading}
        >
          Annuler
        </Button>

        <Button
          onClick={handleNext}
          disabled={!canProceed || loading}
          icon={isLastQuestion ? <CheckCircle size={16} /> : <ArrowRight size={16} />}
          className="flex-1"
        >
          {loading ? 'Calcul...' : isLastQuestion ? 'Terminer' : 'Suivant'}
        </Button>
      </div>
    </div>
  );
}