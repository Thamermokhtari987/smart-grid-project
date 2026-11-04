export type Language = 'fr' | 'ar' | 'en';

export interface Translations {
  [key: string]: {
    fr: string;
    ar: string;
    en: string;
  };
}

export const translations: Translations = {
  // Brand & Navigation
  platform_name: {
    fr: 'SMARTGRID',
    ar: 'الشبكة الذكية',
    en: 'SMARTGRID',
  },
  platform_subtitle: {
    fr: 'PLATEFORME ÉNERGÉTIQUE',
    ar: 'منصة إدارة الطاقة',
    en: 'ENERGY PLATFORM',
  },
  nav_overview: {
    fr: "Vue d'ensemble",
    ar: 'نظرة عامة',
    en: 'Overview',
  },
  nav_monitoring: {
    fr: 'Surveillance Énergétique',
    ar: 'مراقبة الطاقة',
    en: 'Energy Monitoring',
  },
  nav_zones: {
    fr: 'Gestion des Zones',
    ar: 'إدارة المناطق',
    en: 'Zones Management',
  },
  nav_appliances: {
    fr: 'Appareils Électriques',
    ar: 'إدارة الأجهزة',
    en: 'Appliance Management',
  },
  nav_batteries: {
    fr: 'Gestion des Batteries',
    ar: 'إدارة البطاريات',
    en: 'Battery Management',
  },
  nav_distribution: {
    fr: 'Distribution Intelligente',
    ar: 'التوزيع الذكي',
    en: 'Smart Distribution',
  },
  nav_trading: {
    fr: "Bourse d'Énergie",
    ar: 'تداول الطاقة',
    en: 'Energy Trading',
  },
  nav_simulation: {
    fr: 'Laboratoire de Simulation',
    ar: 'مركز المحاكاة',
    en: 'Simulation Center',
  },
  nav_analytics: {
    fr: 'Analyses & Rapports',
    ar: 'التحليلات والتقارير',
    en: 'Analytics & Reports',
  },
  nav_steg: {
    fr: 'Simulateur Facture STEG',
    ar: 'محاكي فاتورة الستاغ (STEG)',
    en: 'STEG Bill Simulator',
  },
  nav_savings: {
    fr: 'Économies Solaires & ROI',
    ar: 'التوفير الشمسي والعائد',
    en: 'Solar Savings',
  },
  nav_alerts: {
    fr: 'Alertes & Notifications',
    ar: 'التنبيهات والإشعارات',
    en: 'Alerts & Notifications',
  },
  nav_carbon: {
    fr: 'Empreinte Carbone',
    ar: 'البصمة الكربونية',
    en: 'Carbon Footprint',
  },
  nav_reports: {
    fr: 'Rapports Mensuels',
    ar: 'التقارير الشهرية',
    en: 'Monthly Reports',
  },
  nav_settings: {
    fr: 'Paramètres Généraux',
    ar: 'الإعدادات العامة',
    en: 'Settings',
  },

  // Operating Modes
  mode_automatic: {
    fr: 'Automatique',
    ar: 'أوتوماتيكي',
    en: 'Automatic',
  },
  mode_eco: {
    fr: 'Éco (Réduction)',
    ar: 'اقتصادي (تخفيض)',
    en: 'Eco (Reduction)',
  },
  mode_manual: {
    fr: 'Manuel',
    ar: 'يدوي',
    en: 'Manual',
  },
  mode_label: {
    fr: 'Mode :',
    ar: 'الوضع :',
    en: 'Mode:',
  },

  // Header & Status
  system_live: {
    fr: 'Système En Ligne • Moteur Actif',
    ar: 'النظام متصل • محرك المحاكاة نشط',
    en: 'System Live • Simulation Engine',
  },
  tunis_time: {
    fr: 'Tunis',
    ar: 'تونس',
    en: 'Tunis',
  },
  operator_profile: {
    fr: 'Opérateur Réseau',
    ar: 'مشغل الشبكة',
    en: 'Grid Operator',
  },
  steg_tier: {
    fr: 'Abonnement STEG Pro',
    ar: 'اشتراك الستاغ الاحترافي',
    en: 'STEG Pro Tier',
  },
  notifications_title: {
    fr: 'Notifications & Alertes',
    ar: 'الإشعارات والتنبيهات',
    en: 'Notifications & Alerts',
  },
  unread: {
    fr: 'non lu',
    ar: 'غير مقروء',
    en: 'unread',
  },
  view_all: {
    fr: 'Tout voir',
    ar: 'عرض الكل',
    en: 'View All',
  },
  mark_read: {
    fr: 'Marquer lu',
    ar: 'تحديد كمقروء',
    en: 'Mark Read',
  },
  mark_all_read: {
    fr: 'Tout marquer comme lu',
    ar: 'تحديد الكل كمقروء',
    en: 'Mark All Read',
  },

  // Overview KPIs
  kpi_solar_production: {
    fr: 'Production Solaire',
    ar: 'الإنتاج الشمسي',
    en: 'Solar Production',
  },
  kpi_total_consumption: {
    fr: 'Consommation Totale',
    ar: 'الاستهلاك الإجمالي',
    en: 'Total Consumption',
  },
  kpi_battery_energy: {
    fr: 'Énergie Batteries',
    ar: 'طاقة البطاريات المتاحة',
    en: 'Battery Energy',
  },
  kpi_avg_battery_soc: {
    fr: 'Charge Moyenne (SOC)',
    ar: 'متوسط شحن البطاريات (SOC)',
    en: 'Average Battery SOC',
  },
  kpi_active_zones: {
    fr: 'Zones Actives',
    ar: 'المناطق النشطة',
    en: 'Active Zones',
  },
  kpi_total_sold: {
    fr: 'Énergie Vendue (Réseau)',
    ar: 'الطاقة المصدرة للشبكة',
    en: 'Total Energy Sold',
  },

  // Situations
  surplus: {
    fr: 'SURPLUS',
    ar: 'فائض',
    en: 'SURPLUS',
  },
  deficit: {
    fr: 'DÉFICIT',
    ar: 'عجز',
    en: 'DEFICIT',
  },
  balanced: {
    fr: 'ÉQUILIBRÉ',
    ar: 'متوازن',
    en: 'BALANCED',
  },
  critical: {
    fr: 'CRITIQUE',
    ar: 'حرج',
    en: 'CRITICAL',
  },

  // Dates
  filter_today: {
    fr: "Aujourd'hui",
    ar: 'اليوم',
    en: 'Today',
  },
  filter_yesterday: {
    fr: 'Hier',
    ar: 'أمس',
    en: 'Yesterday',
  },
  filter_7d: {
    fr: '7 Derniers Jours',
    ar: 'آخر 7 أيام',
    en: 'Last 7 Days',
  },
  filter_30d: {
    fr: '30 Derniers Jours',
    ar: 'آخر 30 يومًا',
    en: 'Last 30 Days',
  },
  filter_90d: {
    fr: '3 Derniers Mois',
    ar: 'آخر 3 أشهر',
    en: 'Last 3 Months',
  },
  filter_1y: {
    fr: '12 Derniers Mois',
    ar: 'آخر 12 شهرًا',
    en: 'Last 12 Months',
  },

  // Flow Diagram
  flow_title: {
    fr: 'Réseau Dynamique des Flux Énergétiques Multi-Nœuds',
    ar: 'شبكة تدفق الطاقة الحية متعددة المسارات',
    en: 'Live Multi-Node Energy Flow Network',
  },
  flow_subtitle: {
    fr: 'Routage en temps réel et arbitrage dynamique du stockage et des priorités',
    ar: 'توجيه فوري وتوزيع ديناميكي للتخزين وأولويات الأحمال',
    en: 'Real-time dynamic power routing & storage dispatch',
  },
  node_solar: {
    fr: 'PANNEAUX PHOTOVOLTAÏQUES',
    ar: 'الألواح الشمسية',
    en: 'SOLAR PANELS',
  },
  node_ems: {
    fr: 'SYSTÈME EMS INTELLIGENT',
    ar: 'نظام إدارة الطاقة الذكي',
    en: 'SMART EMS',
  },
  node_ems_desc: {
    fr: 'Cœur de Distribution',
    ar: 'نواة التوزيع الذكية',
    en: 'Distribution Core',
  },
  node_grid: {
    fr: 'RÉSEAU NATIONAL (STEG)',
    ar: 'الشبكة الوطنية (STEG)',
    en: 'NATIONAL GRID',
  },
  legend_solar: {
    fr: 'Solaire Photovoltaïque',
    ar: 'الطاقة الشمسية',
    en: 'Solar Photovoltaic',
  },
  legend_battery: {
    fr: 'Stockage Batteries',
    ar: 'تخزين البطاريات',
    en: 'Battery Storage',
  },
  legend_consumption: {
    fr: 'Consommation Zones',
    ar: 'استهلاك المناطق',
    en: 'Zone Consumption',
  },
  legend_export: {
    fr: 'Surplus Exporté',
    ar: 'الفائض المصدر',
    en: 'Exported Surplus',
  },
  legend_grid: {
    fr: 'Réseau Électrique',
    ar: 'شبكة الكهرباء',
    en: 'Grid Utility',
  },

  // Zones
  zone_1_name: {
    fr: 'Zone 1 : Charge Critique',
    ar: 'المنطقة 1: أحمال حرجة',
    en: 'Zone 1: Critical Zone',
  },
  zone_2_name: {
    fr: 'Zone 2 : Haute Priorité',
    ar: 'المنطقة 2: أولوية عالية',
    en: 'Zone 2: High Priority Zone',
  },
  zone_3_name: {
    fr: 'Zone 3 : Priorité Moyenne',
    ar: 'المنطقة 3: أولوية متوسطة',
    en: 'Zone 3: Medium Priority Zone',
  },
  zone_4_name: {
    fr: 'Zone 4 : Basse Priorité (Délestage)',
    ar: 'المنطقة 4: أولوية منخفضة (فصل الأحمال)',
    en: 'Zone 4: Low Priority Zone',
  },
  priority_critical: {
    fr: 'Critique (P1)',
    ar: 'حرجة (P1)',
    en: 'Critical (P1)',
  },
  priority_high: {
    fr: 'Haute (P2)',
    ar: 'عالية (P2)',
    en: 'High (P2)',
  },
  priority_medium: {
    fr: 'Moyenne (P3)',
    ar: 'متوسطة (P3)',
    en: 'Medium (P3)',
  },
  priority_low: {
    fr: 'Basse (P4)',
    ar: 'منخفضة (P4)',
    en: 'Low (P4)',
  },
  reconnect: {
    fr: 'Reconnecter',
    ar: 'إعادة التوصيل',
    en: 'Reconnect',
  },
  disconnect: {
    fr: 'Déconnecter',
    ar: 'فصل',
    en: 'Disconnect',
  },

  // Batteries
  stored_energy: {
    fr: 'Énergie Stockée',
    ar: 'الطاقة المخزنة',
    en: 'Stored Energy',
  },
  usable_energy: {
    fr: 'Réserve Utilisable',
    ar: 'الاحتياطي القابل للاستخدام',
    en: 'Available Discharge',
  },
  sim_charge: {
    fr: 'Simuler Charge',
    ar: 'محاكاة الشحن',
    en: 'Sim Charge',
  },
  sim_discharge: {
    fr: 'Simuler Décharge',
    ar: 'محاكاة التفريغ',
    en: 'Sim Discharge',
  },
  configure_battery: {
    fr: 'Configurer Limites & Priorité',
    ar: 'تعديل الحدود والأولوية',
    en: 'Configure Limits & Priority',
  },

  // Appliances & Aging
  consumption_evolution: {
    fr: 'Évolution de la Consommation',
    ar: 'تطور الاستهلاك وتقادم الجهاز',
    en: 'Consumption Evolution',
  },
  add_appliance: {
    fr: 'Ajouter un Appareil',
    ar: 'إضافة جهاز جديد',
    en: 'Add Appliance',
  },
  audit_recommendation: {
    fr: "Recommandation d'Audit Énergétique",
    ar: 'توصية التدقيق الطاقي',
    en: 'Appliance Audit Recommendation',
  },
  annual_savings: {
    fr: 'Économies Annuelles Estimées',
    ar: 'التوفير السنوي المتوقع',
    en: 'Estimated Annual Savings',
  },
  payback_period: {
    fr: "Période d'Amortissement (ROI)",
    ar: 'فترة استرداد رأس المال',
    en: 'Payback Horizon',
  },

  // STEG Billing
  steg_title: {
    fr: 'Simulateur de Facture STEG Basse Tension',
    ar: 'محاكي فاتورة الكهرباء للشركة التونسية للكهرباء والغاز (STEG)',
    en: 'STEG Electricity Bill Simulator',
  },
  steg_subtitle: {
    fr: 'Calculs certifiés conformes au barème officiel de la STEG (Réf: steg.com.tn/fr/node/12034)',
    ar: 'حسابات مطابقة للتعريفة الرسمية للشركة التونسية للكهرباء والغاز (steg.com.tn)',
    en: 'Official STEG Low Voltage Basse Tension tariff schedule',
  },
  customer_category: {
    fr: 'Catégorie Client',
    ar: 'صنف الحريف',
    en: 'Customer Category',
  },
  residential: {
    fr: 'Usage Domestique / Résidentiel',
    ar: 'استعمال منزلي / سكني',
    en: 'Domestic / Residential',
  },
  non_residential: {
    fr: 'Usage Non-Résidentiel / Commercial',
    ar: 'استعمال غير سكني / تجاري',
    en: 'Non-Residential / Commercial',
  },
  contracted_power: {
    fr: 'Puissance Souscrite (kVA)',
    ar: 'القدرة المكتتبة (كيلوفولت أمبير)',
    en: 'Contracted Power (kVA)',
  },
  billing_period: {
    fr: 'Période de Facturation',
    ar: 'دورية الفوترة',
    en: 'Billing Period',
  },
  bimonthly: {
    fr: '2 Mois (Bimestrielle STEG)',
    ar: 'شهران (فاتورة الستاغ الدورية)',
    en: '2 Months (Bimonthly)',
  },
  monthly: {
    fr: '1 Mois (Mensuelle)',
    ar: 'شهر واحد',
    en: '1 Month',
  },
  total_ht: {
    fr: 'TOTAL HORS TAXES (HT)',
    ar: 'المجموع الخام دون أداءات (HT)',
    en: 'TOTAL PRE-TAX (HT)',
  },
  total_taxes: {
    fr: 'Total Taxes et Contributions',
    ar: 'مجموع الأداءات والمعاليم',
    en: 'Total Taxes & Fees',
  },
  total_ttc: {
    fr: 'MONTANT NET TTC À PAYER',
    ar: 'المبلغ الإجمالي الواجب دفعه (TTC)',
    en: 'NET TOTAL TTC',
  },
  download_invoice: {
    fr: 'Télécharger / Imprimer Facture PDF',
    ar: 'تحميل / طباعة الفاتورة PDF',
    en: 'Print / Download Invoice PDF',
  },

  // Actions
  save: {
    fr: 'Enregistrer',
    ar: 'حفظ',
    en: 'Save',
  },
  cancel: {
    fr: 'Annuler',
    ar: 'إلغاء',
    en: 'Cancel',
  },
  reset: {
    fr: 'Réinitialiser',
    ar: 'إعادة ضبط',
    en: 'Reset',
  },
  run_simulation: {
    fr: 'Exécuter la Simulation',
    ar: 'بدء المحاكاة',
    en: 'Run Simulation',
  },
  export_csv: {
    fr: 'Exporter le Fichier (CSV)',
    ar: 'تصدير البيانات (CSV)',
    en: 'Export Dataset (CSV)',
  },
};
