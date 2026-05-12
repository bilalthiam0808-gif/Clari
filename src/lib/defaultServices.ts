export type ServiceOption = {
  id: string;
  label: string;
  price: string;
  isPercent?: boolean;
};

export type Service = {
  id: string;
  name: string;
  category: string;
  base_price: string;
  description: string;
  options: ServiceOption[];
};

export const DEFAULT_SERVICES: Service[] = [
  {
    id: "default_graphisme",
    name: "Design graphic",
    category: "Graphisme",
    base_price: "300",
    description: "Logo, identité visuelle, charte graphique et supports marketing",
    options: [
      { id: "g_o1", label: "Identité visuelle complète (logo + charte)", price: "700" },
      { id: "g_o2", label: "Version animée du logo", price: "150" },
      { id: "g_o3", label: "Pack réseaux sociaux (bannières, avatars)", price: "200" },
      { id: "g_o4", label: "Papeterie (carte de visite, en-tête)", price: "250" },
      { id: "g_o5", label: "Packaging / étiquette produit", price: "300" },
      { id: "g_o6", label: "Présentation PowerPoint / Google Slides", price: "200" },
      { id: "g_o7", label: "Fichiers sources AI / EPS", price: "100" },
      { id: "g_o8", label: "Révision supplémentaire", price: "80" },
      { id: "g_express", label: "Express — livraison 1 semaine", price: "30", isPercent: true },
      { id: "g_urgent", label: "Urgent — livraison 48h", price: "60", isPercent: true },
    ],
  },
  {
    id: "default_motion",
    name: "Motion design",
    category: "Motion Design",
    base_price: "400",
    description: "Animations, vidéos motion et habillage graphique pour vos contenus",
    options: [
      { id: "m_o1", label: "Intro / Outro vidéo", price: "300" },
      { id: "m_o2", label: "Vidéo motion complète (jusqu'à 60s)", price: "800" },
      { id: "m_o3", label: "Habillage graphique complet", price: "600" },
      { id: "m_o4", label: "Export MP4 4K", price: "100" },
      { id: "m_o5", label: "Ajout musique / son", price: "120" },
      { id: "m_o6", label: "Sous-titres animés", price: "100" },
      { id: "m_o7", label: "Fichiers sources After Effects", price: "200" },
      { id: "m_o8", label: "Révision supplémentaire", price: "100" },
      { id: "m_express", label: "Express — livraison 5 jours", price: "30", isPercent: true },
      { id: "m_urgent", label: "Urgent — livraison 48h", price: "60", isPercent: true },
    ],
  },
  {
    id: "default_website",
    name: "Site web",
    category: "Site web",
    base_price: "600",
    description: "Sites vitrines, e-commerce, portfolio et développement sur-mesure",
    options: [
      { id: "w_o1", label: "E-commerce (paiement en ligne, catalogue)", price: "600" },
      { id: "w_o2", label: "Portfolio (galerie projets filtrée)", price: "0" },
      { id: "w_o3", label: "Développement sur-mesure", price: "300" },
      { id: "w_o4", label: "Blog intégré", price: "150" },
      { id: "w_o5", label: "Prise de RDV en ligne", price: "200" },
      { id: "w_o6", label: "Multilingue (1 langue supplémentaire)", price: "250" },
      { id: "w_o7", label: "Référencement SEO approfondi", price: "300" },
      { id: "w_o8", label: "Maintenance mensuelle", price: "80" },
      { id: "w_express", label: "Express — livraison 2 semaines", price: "30", isPercent: true },
      { id: "w_urgent", label: "Urgent — livraison 1 semaine", price: "60", isPercent: true },
    ],
  },
];
