// Dashboard service - keeping existing functionality simple
export const dashboardService = {
  getAllTips(): string[] {
    return [
      'Notez vos émotions avant les repas en utilisant la méthode Ptilara.',
      'Buvez suffisamment d\'eau tout au long de la journée.',
      'Prenez le temps de bien mâcher vos aliments.',
      'Évitez les aliments déclencheurs identifiés dans votre suivi.',
      'Pratiquez la relaxation pour gérer le stress.'
    ];
  },

  getTodayTip(): string {
    const tips = this.getAllTips();
    return tips[new Date().getDay() % tips.length];
  },

  getDiagnosisLabel(signature: string): string {
    const signatures: Record<string, string> = {
      'pancolite': 'Pancolite',
      'colite-gauche': 'Colite gauche', 
      'rectite': 'Rectite',
      'proctosigmoidite': 'Proctosigmoïdite',
      'colite-extensive': 'Colite extensive',
      'colite-distale': 'Colite distale'
    };
    return signatures[signature] || signature;
  }
};
