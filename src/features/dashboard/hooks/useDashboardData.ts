import { useState, useEffect } from 'react';
import { consumptionService } from '../../consumption';
import { stoolService } from '../../stool';
import { symptomService } from '../../symptom-tracking';
import { useAuth } from '../../auth';
import { format } from 'date-fns';
import type { Database } from '../../../lib/supabase';
import { exportToExcel } from '../utils/excelExport';
import { supabase } from '../../../lib/supabase';
import { errorService, ErrorType } from '../../../shared/services/errorService';
import type { ConsumptionData } from '../../consumption/types';

type Stool = Database['public']['Tables']['stools']['Row'];
type FeelingCapture = Database['public']['Tables']['feeling_captures']['Row'];
type CapturedSymptom = Database['public']['Tables']['captured_symptoms']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];

// Type for symptom data with captured symptoms
type SymptomData = FeelingCapture & {
  captured_symptoms: CapturedSymptom[];
};

export function useDashboardData() {
  const { user } = useAuth();
  const [consumptions, setConsumptions] = useState<ConsumptionData[]>([]);
  const [stools, setStools] = useState<Stool[]>([]);
  const [symptoms, setSymptoms] = useState<SymptomData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.profile && supabase) {
      loadData();
    } else {
      setConsumptions([]);
      setStools([]);
      setSymptoms([]);
      setLoading(false);
    }
  }, [user]);

  const loadData = async () => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      const [consumptionsData, stoolsData, symptomsData] = await Promise.all([
        consumptionService.getConsumptions(user!.profile!.id),
        stoolService.getStools(50),
        symptomService.getFeelingCaptures(50),
      ]);
      
      setConsumptions(consumptionsData);
      setStools(stoolsData);
      setSymptoms(symptomsData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading data');
    } finally {
      setLoading(false);
    }
  };

  // addMeal function removed - now using consumptionService.createConsumption directly

  const addStool = async (stoolData: {
    consistency: number;
    // New enriched fields
    urgency?: 'none' | 'moderate' | 'severe';
    blood_level?: string;
    mucus_level?: string;
    stool_color?: string | null;
    evacuation_effort?: string | null;
    duration_minutes?: number | null;
    pain_level?: number;
    notes?: string | null;
    // Existing fields
    stool_date: string;
    stool_time: string;
  }) => {
    try {
      const newStool = await stoolService.createStool(stoolData);
      setStools(prev => [newStool, ...prev]);
      return newStool;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error adding stool';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const addSymptom = async (symptomData: {
    global_feeling: 'bad' | 'ok' | 'good' | 'excellent';
    capture_date: string;
    capture_time: string;
    notes?: string;
    symptoms: { [key: string]: number };
  }) => {
    try {
      // Adapt data to match SymptomFormData
      const formData = {
        global_feeling: symptomData.global_feeling,
        capture_date: symptomData.capture_date,
        capture_time: symptomData.capture_time,
        notes: symptomData.notes || '', // Ensure notes is a string
        ...symptomData.symptoms // Spread dynamic symptoms
      };
      
      const result = await symptomService.createSymptom(formData);
      
      // Create a SymptomData compatible with our state
      const newSymptom: SymptomData = {
        ...result.feelingCapture,
        captured_symptoms: result.capturedSymptoms
      };
      
      setSymptoms(prev => [newSymptom, ...prev]);
      return newSymptom;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error adding symptoms';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const addConsumption = async (consumptionData: {
    consumption_type: string;
    consumption: string;
    consumption_date: string;
    consumption_time: string;
    prep_mode?: string;
    after_effects?: string;
  }) => {
    try {
      if (!user?.profile?.id) {
        throw new Error('User not connected');
      }
      
      const newConsumption = await consumptionService.createConsumption({
        ...consumptionData,
        profile_id: user.profile.id
      });
      setConsumptions(prev => [newConsumption, ...prev]);
      return newConsumption;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error adding consumption';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const removeStool = (stoolId: string) => {
    setStools(prev => prev.filter(stool => stool.id !== stoolId));
  };

  const updateStool = async (updatedStool: Stool) => {
    try {
      // Persister en DB via le service
      const savedStool = await stoolService.updateStool(updatedStool.id, updatedStool);
      
      // Mettre à jour l'état local avec les données sauvegardées
      setStools(prev => prev.map(stool => 
        stool.id === savedStool.id ? savedStool : stool
      ));
      
      return savedStool;
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la selle:', error);
      throw error;
    }
  };

  const restoreStool = (stool: Stool) => {
    setStools(prev => {
      // Insert stool at its correct chronological position
      const newStools = [...prev, stool];
      return newStools.sort((a, b) => {
        const dateA = new Date(`${a.stool_date} ${a.stool_time}`);
        const dateB = new Date(`${b.stool_date} ${b.stool_time}`);
        return dateB.getTime() - dateA.getTime(); // Most recent first
      });
    });
  };

  // Functions for consumptions
  const removeConsumption = (consumptionId: string) => {
    setConsumptions(prev => prev.filter(consumption => consumption.id !== consumptionId));
  };

  const updateConsumption = (updatedConsumption: ConsumptionData) => {
    setConsumptions(prev => prev.map(consumption => 
      consumption.id === updatedConsumption.id ? updatedConsumption : consumption
    ));
  };

  const restoreConsumption = (consumption: ConsumptionData) => {
    setConsumptions(prev => {
      const newConsumptions = [...prev, consumption];
      return newConsumptions.sort((a, b) => {
        const dateA = new Date(`${a.consumption_date} ${a.consumption_time}`);
        const dateB = new Date(`${b.consumption_date} ${b.consumption_time}`);
        return dateB.getTime() - dateA.getTime();
      });
    });
  };

  // Functions for symptoms
  const removeSymptom = (symptomId: string) => {
    setSymptoms(prev => prev.filter(symptom => symptom.id !== symptomId));
  };

  const updateSymptom = (updatedSymptom: SymptomData) => {
    setSymptoms(prev => prev.map(symptom => 
      symptom.id === updatedSymptom.id ? updatedSymptom : symptom
    ));
  };

  const restoreSymptom = (symptom: SymptomData) => {
    setSymptoms(prev => {
      const newSymptoms = [...prev, symptom];
      return newSymptoms.sort((a, b) => {
        const dateA = new Date(`${a.capture_date} ${a.capture_time}`);
        const dateB = new Date(`${b.capture_date} ${b.capture_time}`);
        return dateB.getTime() - dateA.getTime();
      });
    });
  };

  const getTodayStats = () => {
    const today = format(new Date(), 'yyyy-MM-dd');
    
    return {
      consumptionsCount: consumptions.filter(c => c.consumption_date === today).length,
      symptomsCount: symptoms.filter(s => s.capture_date === today).length,
      stoolsCount: stools.filter(s => s.stool_date === today).length,
      date: today
    };
  };

  const exportData = async () => {
    try {
      const { exportToExcel } = await import('../utils/excelExport');
      
      if (!user?.profile) {
        throw new Error('User profile not available');
      }

      // Fetch all data
      const [consumptionsData, stoolsData, symptomsData] = await Promise.all([
        consumptionService.getConsumptions(user.profile.id),
        stoolService.getStools(),
        symptomService.getFeelingCaptures()
      ]);

      // Create a profile object compatible with export
      const profileForExport = {
        name: user.profile.name,
        birth_date: user.profile.birth_date,
        gender: user.profile.gender,
        diagnosis: user.profile.diagnosis,
        rectocolite_signature: user.profile.rectocolite_signature || null,
        last_calprotectin_value: user.profile.last_calprotectin_value ?? null,
        last_calprotectin_date: user.profile.last_calprotectin_date || null,
      };

      exportToExcel(consumptionsData, stoolsData, symptomsData, profileForExport);
    } catch (error) {
      console.error('Error during export:', error);
      throw error;
    }
  };

const exportPdf = async () => {
  try {
    if (!user?.profile) throw new Error("User profile not available");

    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;

    const accessToken = data.session?.access_token;
    if (!accessToken) throw new Error("No access token");

    const from = "2026-02-01";
    const to = "2026-02-28";

    const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/export-report-pdf`;

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // ✅ both headers
        "Authorization": `Bearer ${accessToken}`,
        "apikey": import.meta.env.VITE_SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({
        profile_id: user.profile.id,
        from,
        to,
        language: "fr",
      }),
    });

    // ✅ print server error body
    if (!res.ok) {
      const text = await res.text();
      console.error("PDF export failed (status):", res.status);
      console.error("PDF export failed (body):", text);
      throw new Error(text);
    }

    const blob = await res.blob();
    const downloadUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = downloadUrl;
    a.download = `Sanozia_Report_${from}_to_${to}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(downloadUrl);
  } catch (e) {
    console.error("PDF export failed:", e);
    throw e;
  }
};


  return {
    consumptions,
    stools,
    symptoms,
    loading,
    error,
    addStool,
    addConsumption,
    addSymptom,
    removeStool,
    updateStool,
    restoreStool,
    removeConsumption,
    updateConsumption,
    restoreConsumption,
    removeSymptom,
    updateSymptom,
    restoreSymptom,
    getTodayStats,
    refetch: loadData,
    exportData,
    exportPdf,
  };
}