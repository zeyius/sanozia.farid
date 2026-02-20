// Stool tracking service - complete service with utilities and DB functions
import { StoolConsistency, UrgencyLevel } from '../types';
import { supabase } from '../../../lib/supabase';
import type { Database } from '../../../lib/supabase';

type Stool = Database['public']['Tables']['stools']['Row'];
type StoolInsert = Database['public']['Tables']['stools']['Insert'];
type StoolUpdate = Database['public']['Tables']['stools']['Update'];

// Mapping pour la conversion urgence string ↔ number
const URGENCE_TO_NUMBER: Record<'none' | 'moderate' | 'severe', number> = {
  'none': 0,
  'moderate': 1,
  'severe': 2
};

const URGENCE_FROM_NUMBER: Record<number, 'none' | 'moderate' | 'severe'> = {
  0: 'none',
  1: 'moderate',
  2: 'severe'
};

export const stoolService = {
  // Conversion helpers pour l'urgence
  urgenceToNumber(urgence: 'none' | 'moderate' | 'severe'): number {
    return URGENCE_TO_NUMBER[urgence] ?? 0;
  },

  urgenceFromNumber(urgence: number | null | undefined): 'none' | 'moderate' | 'severe' {
    if (urgence === null || urgence === undefined) return 'none';
    return URGENCE_FROM_NUMBER[urgence] ?? 'none';
  },

  getStoolConsistencies(): StoolConsistency[] {
    return [
      {
        value: 0,
        label: "Aucune selle",
        description: "Pas de selles lors de cette visite aux toilettes",
        medicalNote: "Absence",
        backgroundColor: "bg-gray-50",
        selectedColor: "bg-gray-200 text-gray-800"
      },
      {
        value: 1,
        label: "Dure",
        description: "Morceaux durs séparés, comme des noix (difficiles à évacuer)",
        medicalNote: "Constipation sévère",
        backgroundColor: "bg-red-50",
        selectedColor: "bg-red-200 text-red-800"
      },
      {
        value: 2,
        label: "Grumeleuse",
        description: "En forme de saucisse mais grumeleuse",
        medicalNote: "Constipation légère",
        backgroundColor: "bg-orange-50",
        selectedColor: "bg-orange-200 text-orange-800"
      },
      {
        value: 3,
        label: "Fissurée",
        description: "Comme une saucisse mais avec des fissures à la surface",
        medicalNote: "Normal",
        backgroundColor: "bg-yellow-50",
        selectedColor: "bg-yellow-200 text-yellow-800"
      },
      {
        value: 4,
        label: "Normale",
        description: "Comme une saucisse ou un serpent, lisse et molle",
        medicalNote: "Normal",
        backgroundColor: "bg-green-50",
        selectedColor: "bg-green-200 text-green-800"
      },
      {
        value: 5,
        label: "Molle",
        description: "Morceaux mous aux bords nets (faciles à évacuer)",
        medicalNote: "Manque de fibres",
        backgroundColor: "bg-blue-50",
        selectedColor: "bg-blue-200 text-blue-800"
      },
      {
        value: 6,
        label: "Pâteuse",
        description: "Morceaux duveteux aux bords déchiquetés, selles pâteuses",
        medicalNote: "Diarrhée légère",
        backgroundColor: "bg-purple-50",
        selectedColor: "bg-purple-200 text-purple-800"
      },
      {
        value: 7,
        label: "Liquide",
        description: "Liquide, sans morceaux solides, entièrement liquide",
        medicalNote: "Diarrhée",
        backgroundColor: "bg-red-50",
        selectedColor: "bg-red-200 text-red-800"
      },
      {
        value: 8,
        label: "Envie afécale",
        description: "Envie afécale",
        medicalNote: "Envie sans selles",
        backgroundColor: "bg-gray-50",
        selectedColor: "bg-gray-200 text-gray-800"
      }
    ];
  },

  getUrgencyLevels(): UrgencyLevel[] {
    return [
      { value: 'none', label: 'Aucune' },
      { value: 'moderate', label: 'Modérée' },
      { value: 'severe', label: 'Sévère' }
    ];
  },

  getConsistencyForSubmission(consistency: number): number {
    // Pour "Aucune selle", utiliser consistency = 8 pour éviter la confusion avec le type 1 de Bristol
    return consistency === 0 ? 8 : consistency;
  },

  // DB Functions
  async createStool(stoolData: Omit<StoolInsert, 'profile_id'>): Promise<Stool> {
    if (!supabase) {
      throw new Error('Supabase non configuré');
    }
    
    const profile = await this.getCurrentProfile();
    
    // Convertir l'urgence string → number pour la DB
    const urgenceValue = (stoolData as any).urgency 
      ? this.urgenceToNumber((stoolData as any).urgency)
      : 0;
    
    // Insertion avec tous les champs enrichis
    const { data, error } = await supabase
      .from('stools')
      .insert({
        consistency: stoolData.consistency,
        stool_date: stoolData.stool_date,
        stool_time: stoolData.stool_time,
        profile_id: profile.id,
        urgence: urgenceValue,
        blood_level: stoolData.blood_level || 'none',
        mucus_level: stoolData.mucus_level || 'none',
        stool_color: stoolData.stool_color,
        evacuation_effort: stoolData.evacuation_effort,
        duration_minutes: stoolData.duration_minutes,
        pain_level: stoolData.pain_level || 0,
        notes: stoolData.notes
      })
      .select()
      .single();

    if (error) {
      console.error('Erreur lors de l\'insertion:', error);
      throw error;
    }
    
    return data;
  },

  async createStoolAlternative(stoolData: Omit<StoolInsert, 'profile_id'>): Promise<Stool> {
    if (!supabase) {
      throw new Error('Supabase non configuré');
    }
    
    const profile = await this.getCurrentProfile();
    
    // Convertir l'urgence string → number pour la DB
    const urgenceValue = (stoolData as any).urgency 
      ? this.urgenceToNumber((stoolData as any).urgency)
      : 0;
    
    const dataToInsert = {
      ...stoolData,
      urgence: urgenceValue,
      profile_id: profile.id,
    };
    
    const { data, error } = await supabase
      .from('stools')
      .insert(dataToInsert)
      .select()
      .single();

    if (error) {
      throw error;
    }
    
    return data;
  },

  async getStools(limit?: number): Promise<Stool[]> {
    if (!supabase) {
      return [];
    }
    
    const profile = await this.getCurrentProfile();

    // Sélection de tous les champs enrichis existants
    let query = supabase
      .from('stools')
      .select(`
        id,
        consistency,
        stool_date,
        stool_time,
        created_at,
        updated_at,
        profile_id,
        urgence,
        blood_level,
        mucus_level,
        stool_color,
        evacuation_effort,
        duration_minutes,
        pain_level,
        notes
      `)
      .eq('profile_id', profile.id)
      .order('stool_date', { ascending: false })
      .order('stool_time', { ascending: false });

    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Erreur Supabase getStools:', error);
      throw error;
    }
    
    return data || [];
  },

  async getStoolsByDate(date: string): Promise<Stool[]> {
    if (!supabase) {
      return [];
    }
    
    const profile = await this.getCurrentProfile();

    const { data, error } = await supabase
      .from('stools')
      .select('*')
      .eq('profile_id', profile.id)
      .eq('stool_date', date)
      .order('stool_time', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async updateStool(id: string, updates: StoolUpdate): Promise<Stool> {
    if (!supabase) {
      throw new Error('Supabase non configuré');
    }
    
    // Construire un objet propre avec uniquement les champs autorisés
    const cleanUpdates: any = {
      consistency: (updates as any).consistency,
      stool_date: (updates as any).stool_date,
      stool_time: (updates as any).stool_time,
      blood_level: (updates as any).blood_level,
      mucus_level: (updates as any).mucus_level,
      stool_color: (updates as any).stool_color,
      evacuation_effort: (updates as any).evacuation_effort,
      duration_minutes: (updates as any).duration_minutes,
      pain_level: (updates as any).pain_level,
      notes: (updates as any).notes
    };
    
    // Convertir l'urgence string → number si présente
    if ((updates as any).urgency !== undefined) {
      cleanUpdates.urgence = this.urgenceToNumber((updates as any).urgency);
    }
    
    // Supprimer les champs undefined pour ne pas les envoyer
    Object.keys(cleanUpdates).forEach(key => {
      if (cleanUpdates[key] === undefined) {
        delete cleanUpdates[key];
      }
    });
    
    const { data, error } = await supabase
      .from('stools')
      .update(cleanUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteStool(id: string): Promise<void> {
    if (!supabase) {
      throw new Error('Supabase non configuré');
    }
    
    const { error } = await supabase
      .from('stools')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async getCurrentProfile() {
    if (!supabase) {
      throw new Error('Supabase non configuré');
    }
    
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) throw error;
    if (!profile) throw new Error('User profile not found');
    return profile;
  }
};
