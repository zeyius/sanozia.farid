import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth';
import { useDashboardData } from '../hooks/useDashboardData';
import { errorService, ErrorType } from '../../../shared/services/errorService';
import { Layout } from '../../../shared/components/Layout';
import { Button } from '../../../shared/components/Button';
import { UtensilsCrossed, Toilet, Heart, History, Download, User, X, FileText, Calendar } from 'lucide-react';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { fr } from 'date-fns/locale';
import { dashboardService } from '../services/dashboardService';
import { supabase } from '../../../lib/supabase';
import { useEffect, useState } from 'react';

type AiTip = {
  insight?: string;
  action?: string;
  question?: string;
  warnings?: string[];
  confidence?: number;
};

// ─── PDF Date Picker Modal ────────────────────────────────────────────────────
function PdfExportModal({
  onConfirm,
  onClose,
  exporting,
}: {
  onConfirm: (from: string, to: string) => void;
  onClose: () => void;
  exporting: boolean;
}) {
  const today = format(new Date(), 'yyyy-MM-dd');
  const firstOfMonth = format(startOfMonth(new Date()), 'yyyy-MM-dd');

  const [from, setFrom] = useState(firstOfMonth);
  const [to, setTo] = useState(today);
  const [error, setError] = useState<string | null>(null);

  const shortcuts = [
    { label: 'Ce mois', from: format(startOfMonth(new Date()), 'yyyy-MM-dd'), to: today },
    { label: 'Mois dernier', from: format(startOfMonth(subMonths(new Date(), 1)), 'yyyy-MM-dd'), to: format(endOfMonth(subMonths(new Date(), 1)), 'yyyy-MM-dd') },
    { label: '3 mois', from: format(startOfMonth(subMonths(new Date(), 2)), 'yyyy-MM-dd'), to: today },
    { label: '6 mois', from: format(startOfMonth(subMonths(new Date(), 5)), 'yyyy-MM-dd'), to: today },
  ];

  const handleConfirm = () => {
    if (!from || !to) { setError('Veuillez sélectionner les deux dates.'); return; }
    if (from > to) { setError('La date de début doit être avant la date de fin.'); return; }
    setError(null);
    onConfirm(from, to);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#303d25] rounded-lg flex items-center justify-center">
              <FileText size={16} className="text-white" />
            </div>
            <h2 className="text-lg font-bold text-[#303d25]">Exporter le rapport PDF</h2>
          </div>
          <button onClick={onClose} className="text-[#303d25]/40 hover:text-[#303d25] transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Shortcuts */}
        <div>
          <p className="text-xs font-semibold text-[#303d25]/50 uppercase tracking-wider mb-2">Raccourcis</p>
          <div className="grid grid-cols-2 gap-2">
            {shortcuts.map((s) => (
              <button
                key={s.label}
                onClick={() => { setFrom(s.from); setTo(s.to); setError(null); }}
                className={`text-sm px-3 py-2 rounded-lg border transition-all ${
                  from === s.from && to === s.to
                    ? 'bg-[#303d25] text-white border-[#303d25]'
                    : 'bg-white text-[#303d25] border-[#e3c79f] hover:border-[#303d25]'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Custom dates */}
        <div>
          <p className="text-xs font-semibold text-[#303d25]/50 uppercase tracking-wider mb-2">Période personnalisée</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-[#303d25]/60 mb-1 block">Du</label>
              <input
                type="date" value={from} max={to}
                onChange={(e) => { setFrom(e.target.value); setError(null); }}
                className="w-full text-sm border border-[#e3c79f] rounded-lg px-3 py-2 text-[#303d25] focus:outline-none focus:border-[#303d25]"
              />
            </div>
            <div>
              <label className="text-xs text-[#303d25]/60 mb-1 block">Au</label>
              <input
                type="date" value={to} min={from} max={today}
                onChange={(e) => { setTo(e.target.value); setError(null); }}
                className="w-full text-sm border border-[#e3c79f] rounded-lg px-3 py-2 text-[#303d25] focus:outline-none focus:border-[#303d25]"
              />
            </div>
          </div>
        </div>

        {/* Summary */}
        {from && to && from <= to && (
          <div className="flex items-center gap-2 bg-[#e3c79f]/20 rounded-lg px-3 py-2">
            <Calendar size={14} className="text-[#303d25]/60" />
            <p className="text-xs text-[#303d25]/70">
              {format(new Date(from), 'd MMM yyyy', { locale: fr })} → {format(new Date(to), 'd MMM yyyy', { locale: fr })}
            </p>
          </div>
        )}

        {error && <p className="text-xs text-red-500">{error}</p>}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-[#e3c79f] text-[#303d25] text-sm font-medium hover:bg-[#e3c79f]/20 transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleConfirm}
            disabled={exporting}
            className="flex-1 py-2.5 rounded-xl bg-[#303d25] text-white text-sm font-medium hover:bg-[#303d25]/90 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {exporting ? (
              <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />Génération...</>
            ) : (
              <><Download size={14} />Générer PDF</>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getTodayStats, loading, exportData, exportPdf } = useDashboardData();
  const stats = getTodayStats();
  const [exporting, setExporting] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [showPdfModal, setShowPdfModal] = useState(false);

  const todayTip = dashboardService.getTodayTip();
  const [aiTip, setAiTip] = useState<AiTip | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;

    (async () => {
      try {
        setAiLoading(true);
        if (!supabase) { setAiTip(null); return; }

        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        const accessToken = sessionData?.session?.access_token;
        console.log('sessionError:', sessionError);
        console.log('accessToken present:', !!accessToken);
        if (!accessToken) { setAiTip(null); return; }

        const today = new Date();
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(today.getDate() - 7);
        const fromDate = sevenDaysAgo.toISOString().split('T')[0];

        const { data: profile } = await supabase.from('profiles').select('id, diagnosis, rectocolite_signature').eq('user_id', user.id).single();
        if (!profile) { setAiTip(null); return; }

        const [{ data: consumptions }, { data: stools }, { data: feelings }, { data: treatments }] = await Promise.all([
          supabase.from('consumptions').select('consumption_date, consumption_time, consumption_type, consumption, prep_mode, after_effects').eq('profile_id', profile.id).gte('consumption_date', fromDate),
          supabase.from('stools').select('stool_date, stool_time, consistency, blood_level, mucus_level, pain_level, urgence, notes').eq('profile_id', profile.id).gte('stool_date', fromDate),
          supabase.from('feeling_captures').select('capture_date, capture_time, global_feeling, notes, captured_symptoms(symptom_name, symptom_intensity)').eq('profile_id', profile.id).gte('capture_date', fromDate),
          supabase.from('treatments').select('name, dosage, frequency, is_active').eq('profile_id', profile.id).eq('is_active', true),
        ]);

        const snapshot = {
          range: 'last_7_days', from: fromDate, to: today.toISOString().split('T')[0],
          profile: { diagnosis: profile.diagnosis, rectocolite_signature: profile.rectocolite_signature },
          consumptions: consumptions ?? [], stools: stools ?? [], feelings: feelings ?? [], active_treatments: treatments ?? [],
        };

        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
        const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
        if (!supabaseUrl || !anonKey) { setAiTip(null); return; }

        const res = await fetch(`${supabaseUrl}/functions/v1/analyze-week`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', apikey: anonKey, Authorization: `Bearer ${accessToken}` },
          body: JSON.stringify(snapshot),
        });

        const text = await res.text();
        let payload: any = null;
        try { payload = text ? JSON.parse(text) : null; } catch { payload = { raw: text }; }
        if (cancelled) return;
        if (!res.ok) { setAiTip(null); return; }
        setAiTip(payload ?? null);
      } catch (e) {
        if (!cancelled) { console.error('analyze-week exception:', e); setAiTip(null); }
      } finally {
        if (!cancelled) setAiLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [user?.id]);

  const handleExport = async () => {
    if (!user?.profile) { alert('Profil utilisateur non disponible'); return; }
    setExporting(true);
    try {
      await exportData();
      alert('Données exportées avec succès');
    } catch (error) {
      errorService.handleError(ErrorType.DATA_EXPORT_FAILED, error as Error, { context: 'Dashboard_export' });
    } finally {
      setExporting(false);
    }
  };

  const handlePdfConfirm = async (from: string, to: string) => {
    setExportingPdf(true);
    try {
      await exportPdf(from, to);
      setShowPdfModal(false);
    } catch (e) {
      console.error('PDF export failed:', e);
    } finally {
      setExportingPdf(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#303d25]"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {showPdfModal && (
        <PdfExportModal
          onConfirm={handlePdfConfirm}
          onClose={() => setShowPdfModal(false)}
          exporting={exportingPdf}
        />
      )}

      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-[#e3c79f]/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-[#303d25] rounded-full flex items-center justify-center">
                <User className="text-white" size={24} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-[#303d25]">{user?.profile?.name || 'Mon Tableau de Bord'}</h1>
                <p className="text-sm text-[#303d25]/70">Suivi Santé - {format(new Date(), 'dd MMMM yyyy', { locale: fr })}</p>
              </div>
            </div>
            <Button onClick={() => navigate('/profile')} variant="outline" size="sm" icon={<User size={16} />}>Profil</Button>
          </div>
        </div>

        {/* Daily Stats */}
        <div className="bg-[#e3c79f]/40 backdrop-blur-sm rounded-xl p-5 shadow-lg border border-[#e3c79f]/30">
          <h2 className="text-lg font-semibold text-[#303d25] mb-3 uppercase tracking-wide">Récapitulatif du jour</h2>
          <div className="space-y-1">
            <button onClick={() => navigate('/history?tab=consumptions&filter=today')} className="w-full flex justify-between items-center p-2 rounded-lg hover:bg-white/30 transition-colors group">
              <div className="flex items-center gap-2"><UtensilsCrossed size={16} className="text-[#303d25]" /><span className="text-[#303d25]">Consommations</span></div>
              <div className="flex items-center gap-2"><span className="font-semibold text-[#303d25]">{stats.consumptionsCount}</span><span className="text-[#303d25]/50 group-hover:text-[#303d25] transition-colors">→</span></div>
            </button>
            <button onClick={() => navigate('/history?tab=symptoms&filter=today')} className="w-full flex justify-between items-center p-2 rounded-lg hover:bg-white/30 transition-colors group">
              <div className="flex items-center gap-2"><Heart size={16} className="text-[#303d25]" /><span className="text-[#303d25]">Ressenti</span></div>
              <div className="flex items-center gap-2"><span className="font-semibold text-[#303d25]">{stats.symptomsCount}</span><span className="text-[#303d25]/50 group-hover:text-[#303d25] transition-colors">→</span></div>
            </button>
            <button onClick={() => navigate('/history?tab=stools&filter=today')} className="w-full flex justify-between items-center p-2 rounded-lg hover:bg-white/30 transition-colors group">
              <div className="flex items-center gap-2"><Toilet size={16} className="text-[#303d25]" /><span className="text-[#303d25]">Selles</span></div>
              <div className="flex items-center gap-2"><span className="font-semibold text-[#303d25]">{stats.stoolsCount}</span><span className="text-[#303d25]/50 group-hover:text-[#303d25] transition-colors">→</span></div>
            </button>
          </div>
        </div>

        {/* Nav grid */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <button onClick={() => navigate('/meal')} className="bg-white/90 backdrop-blur-sm hover:bg-[#b4b08a] rounded-xl p-4 flex flex-col items-center gap-3 transition-colors shadow-lg border border-[#e3c79f]/30">
            <div className="w-12 h-12 bg-[#303d25] rounded-lg flex items-center justify-center"><UtensilsCrossed className="text-white" size={24} /></div>
            <span className="text-sm font-medium text-[#303d25] text-center">Consommations</span>
          </button>
          <button onClick={() => navigate('/stool')} className="bg-white/90 backdrop-blur-sm hover:bg-[#b4b08a] rounded-xl p-4 flex flex-col items-center gap-3 transition-colors shadow-lg border border-[#e3c79f]/30">
            <div className="w-12 h-12 bg-[#303d25] rounded-lg flex items-center justify-center"><Toilet className="text-white" size={24} /></div>
            <span className="text-sm font-medium text-[#303d25] text-center">Selles</span>
          </button>
        </div>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <button onClick={() => navigate('/symptom')} className="bg-white/90 backdrop-blur-sm hover:bg-[#b4b08a] rounded-xl p-4 flex flex-col items-center gap-3 transition-colors shadow-lg border border-[#e3c79f]/30">
            <div className="w-12 h-12 bg-[#303d25] rounded-lg flex items-center justify-center"><Heart className="text-white" size={24} /></div>
            <span className="text-sm font-medium text-[#303d25] text-center">Ressenti</span>
          </button>
          <button onClick={() => navigate('/history')} className="bg-white/90 backdrop-blur-sm hover:bg-[#b4b08a] rounded-xl p-4 flex flex-col items-center gap-3 transition-colors shadow-lg border border-[#e3c79f]/30">
            <div className="w-12 h-12 bg-[#303d25] rounded-lg flex items-center justify-center"><History className="text-white" size={24} /></div>
            <span className="text-sm font-medium text-[#303d25] text-center">Historique</span>
          </button>
        </div>

        {/* Export Buttons */}
        <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-[#e3c79f]/30 space-y-3">
          <Button onClick={handleExport} disabled={exporting} fullWidth variant="secondary" icon={<Download size={20} />}>
            {exporting ? 'Export en cours...' : 'Exporter Excel (données brutes)'}
          </Button>
          <Button onClick={() => setShowPdfModal(true)} fullWidth variant="primary" icon={<Download size={20} />}>
            Exporter PDF (Résumé IA + Graphiques)
          </Button>
          <p className="text-xs text-[#303d25]/70 text-center">Excel : données complètes • PDF : résumé clinique intelligent</p>
        </div>

        {/* Daily Tip */}
        <div className="bg-white/90 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-[#e3c79f]/30">
          <div className="flex items-center gap-2 mb-3">
            <h2 className="text-lg font-semibold text-[#303d25] uppercase tracking-wide">Conseil du jour</h2>
          </div>
          {aiLoading ? (
            <p className="text-[#303d25]/70 leading-relaxed">Analyse en cours...</p>
          ) : aiTip?.insight || aiTip?.action ? (
            <div className="space-y-2 text-[#303d25] leading-relaxed">
              {aiTip.insight && <p><span className="font-semibold">Insight:</span> {aiTip.insight}</p>}
              {aiTip.action && <p><span className="font-semibold">Action:</span> {aiTip.action}</p>}
              {aiTip.question && <p><span className="font-semibold">Question:</span> {aiTip.question}</p>}
            </div>
          ) : (
            <p className="text-[#303d25] leading-relaxed">{todayTip}</p>
          )}
          {user?.profile?.diagnosis === 'colite-ulcereuse' && user?.profile?.rectocolite_signature && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="text-sm font-semibold text-blue-800 mb-1">Votre signature : {dashboardService.getDiagnosisLabel(user.profile.rectocolite_signature)}</h3>
              <p className="text-xs text-blue-700">N'hésitez pas à discuter avec votre médecin de l'évolution de votre maladie et de l'adaptation de votre traitement selon votre signature.</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}