import { useState, useCallback, useRef } from 'react';
import { logger, loggerContexts } from '../utils/logger';

// Déclaration des types pour l'API Web Speech Recognition
interface SpeechRecognitionResult {
  [index: number]: SpeechRecognitionAlternative;
  length: number;
  isFinal: boolean;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionResultList {
  [index: number]: SpeechRecognitionResult;
  length: number;
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface SpeechRecognitionInterface {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  onstart: ((this: SpeechRecognitionInterface, ev: Event) => any) | null;
  onend: ((this: SpeechRecognitionInterface, ev: Event) => any) | null;
  onresult: ((this: SpeechRecognitionInterface, ev: SpeechRecognitionEvent) => any) | null;
  onerror: ((this: SpeechRecognitionInterface, ev: SpeechRecognitionErrorEvent) => any) | null;
  start(): void;
  stop(): void;
}

declare global {
  interface Window {
    SpeechRecognition: {
      new (): SpeechRecognitionInterface;
    };
    webkitSpeechRecognition: {
      new (): SpeechRecognitionInterface;
    };
  }
}

interface UseSpeechToTextOptions {
  language?: string;
  continuous?: boolean;
  interimResults?: boolean;
  maxAlternatives?: number;
}

interface UseSpeechToTextReturn {
  isListening: boolean;
  isSupported: boolean;
  transcript: string;
  error: string | null;
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
}

export function useSpeechToText(options: UseSpeechToTextOptions = {}): UseSpeechToTextReturn {
  const {
    language = 'fr-FR',
    continuous = true,  // Activer le mode continu pour éviter les coupures
    interimResults = true,  // Afficher les résultats intermédiaires
    maxAlternatives = 1
  } = options;

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognitionInterface | null>(null);
  const finalTranscriptRef = useRef(''); // Garder trace du texte final déjà traité

  // Vérifier la compatibilité du navigateur (plus robuste pour mobile)
  const isSupported = typeof window !== 'undefined' && 
    (('SpeechRecognition' in window) || 
     ('webkitSpeechRecognition' in window) ||
     (window as any).SpeechRecognition ||
     (window as any).webkitSpeechRecognition);

  const startListening = useCallback(() => {
    if (!isSupported) {
      setError('La reconnaissance vocale n\'est pas supportée par ce navigateur');
      logger.warn('Speech recognition not supported', {}, loggerContexts.UI);
      return;
    }

    if (isListening) {
      logger.debug('Speech recognition already listening', {}, loggerContexts.UI);
      return;
    }

    try {
      // Créer une nouvelle instance de reconnaissance vocale
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();

      recognition.continuous = continuous;
      recognition.interimResults = interimResults;
      recognition.lang = language;
      recognition.maxAlternatives = maxAlternatives;
      
      // Paramètres pour éviter les coupures trop rapides
      if ('serviceURI' in recognition) {
        // Certains navigateurs supportent des paramètres étendus
        (recognition as any).serviceURI = '';
      }

      // Événements de reconnaissance vocale
      recognition.onstart = () => {
        setIsListening(true);
        setError(null);
        finalTranscriptRef.current = ''; // Réinitialiser le transcript final
        logger.debug('Speech recognition started', { language }, loggerContexts.UI);
      };

      recognition.onend = () => {
        setIsListening(false);
        logger.debug('Speech recognition ended', {}, loggerContexts.UI);
      };

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let newFinalTranscript = '';
        let interimTranscript = '';
        
        // Traiter tous les résultats
        for (let i = 0; i < event.results.length; i++) {
          const result = event.results[i];
          const transcriptText = result[0].transcript;
          
          if (result.isFinal) {
            newFinalTranscript += transcriptText;
          } else if (i >= event.resultIndex) {
            // Seulement les nouveaux résultats intermédiaires
            interimTranscript += transcriptText;
          }
        }
        
        // Vérifier s'il y a du nouveau contenu final
        if (newFinalTranscript && newFinalTranscript !== finalTranscriptRef.current) {
          // Nouveau texte final - l'envoyer
          const newContent = newFinalTranscript.substring(finalTranscriptRef.current.length);
          if (newContent.trim()) {
            setTranscript(newContent.trim());
            finalTranscriptRef.current = newFinalTranscript;
            logger.debug('Speech recognition final result', { 
              newContent: newContent.trim(),
              totalFinal: newFinalTranscript
            }, loggerContexts.UI);
          }
        } else if (interimTranscript && !newFinalTranscript) {
          // Seulement des résultats intermédiaires - ne pas les envoyer pour éviter la duplication
          logger.debug('Speech recognition interim result (not sent)', { 
            interim: interimTranscript
          }, loggerContexts.UI);
        }
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        setIsListening(false);
        let errorMessage = 'Erreur de reconnaissance vocale';
        
        switch (event.error) {
          case 'no-speech':
            errorMessage = 'Aucun son détecté. Veuillez réessayer.';
            break;
          case 'audio-capture':
            errorMessage = 'Microphone non accessible. Vérifiez les permissions.';
            break;
          case 'not-allowed':
            errorMessage = 'Permission microphone refusée. Activez-la dans les paramètres.';
            break;
          case 'network':
            errorMessage = 'Erreur réseau. Vérifiez votre connexion.';
            break;
          default:
            errorMessage = `Erreur: ${event.error}`;
        }
        
        setError(errorMessage);
        logger.error('Speech recognition error', { error: event.error, message: event.message }, loggerContexts.UI);
      };

      recognitionRef.current = recognition;
      recognition.start();

    } catch (err) {
      setError('Impossible d\'initialiser la reconnaissance vocale');
      logger.error('Failed to initialize speech recognition', { error: err }, loggerContexts.UI);
    }
  }, [isSupported, isListening, language, continuous, interimResults]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      logger.debug('Speech recognition stopped manually', {}, loggerContexts.UI);
    }
  }, [isListening]);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setError(null);
  }, []);

  return {
    isListening,
    isSupported,
    transcript,
    error,
    startListening,
    stopListening,
    resetTranscript
  };
}
