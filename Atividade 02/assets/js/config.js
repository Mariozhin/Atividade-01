/* ==========================================================================
   config.js — constantes analíticas e visuais do projeto
   Carregado depois de utils.js e antes de data.js.
   ========================================================================== */
(function () {
  "use strict";

  /* Classes de dinamismo demográfico.
     Critérios analíticos do projeto, não classificações oficiais do IBGE. */
  var GROWTH_CLASSES = [
    {
      id: "accel",
      label: "Expansão acelerada",
      short: "Acelerada",
      badge: "badge--accel",
      tone: "positive",
      min: 2,
      max: Infinity,
      rule: "taxa ≥ +2,0% ao ano"
    },
    {
      id: "moderate",
      label: "Expansão moderada",
      short: "Moderada",
      badge: "badge--moderate",
      tone: "positive",
      min: 0,
      max: 2,
      minExclusive: true,
      rule: "0% < taxa < +2,0%"
    },
    {
      id: "stable",
      label: "Estabilidade",
      short: "Estável",
      badge: "badge--stable",
      tone: "neutral",
      min: -0.1,
      max: 0,
      rule: "−0,1% ≤ taxa ≤ 0%"
    },
    {
      id: "decline",
      label: "Retração moderada",
      short: "Retração",
      badge: "badge--decline",
      tone: "negative",
      min: -1,
      max: -0.1,
      minInclusive: true,
      rule: "−1,0% ≤ taxa < −0,1%"
    },
    {
      id: "sharp",
      label: "Retração acentuada",
      short: "Acentuada",
      badge: "badge--sharp",
      tone: "negative",
      min: -Infinity,
      max: -1,
      rule: "taxa < −1,0%"
    }
  ];

  /* Porte populacional em 2022 (critério do projeto). */
  var SIZE_CLASSES = [
    { id: "xs", label: "Muito pequeno", short: "até 5 mil", min: 0, max: 5000 },
    { id: "sm", label: "Pequeno", short: "5 a 20 mil", min: 5000, max: 20000, minExclusive: true },
    { id: "md", label: "Médio-pequeno", short: "20 a 50 mil", min: 20000, max: 50000, minExclusive: true },
    { id: "ml", label: "Médio", short: "50 a 100 mil", min: 50000, max: 100000, minExclusive: true },
    { id: "lg", label: "Grande", short: "100 a 500 mil", min: 100000, max: 500000, minExclusive: true },
    { id: "xl", label: "Metrópole", short: "acima de 500 mil", min: 500000, max: Infinity, minExclusive: true }
  ];

  var REGIONS = [
    { name: "Norte", color: "#0f766e" },
    { name: "Nordeste", color: "#b45309" },
    { name: "Sudeste", color: "#1d4ed8" },
    { name: "Sul", color: "#7c3aed" },
    { name: "Centro-Oeste", color: "#be123c" }
  ];

  /* Limiares da matriz de oportunidades. */
  var QUADRANT_POP_THRESHOLD = 50000;
  var QUADRANT_RATE_THRESHOLD = 0;

  /* Fronteiras do histograma de taxas (pontos percentuais ao ano). */
  var HISTOGRAM_EDGES = [-5, -3, -2, -1.5, -1, -0.5, 0, 0.5, 1, 1.5, 2, 3, 4, 5, 6, 8, 10];

  var PAGE_SIZE = 50;
  var SEARCH_DEBOUNCE = 250;

  var SOURCES = [
    {
      name: "Localidades v1 — municípios",
      detail: "5.571 registros",
      url: "https://servicodados.ibge.gov.br/api/v1/localidades/municipios"
    },
    {
      name: "Agregado 4709 — população 2022, variação e taxa",
      detail: "variáveis 93, 5936 e 10605",
      url: "https://servicodados.ibge.gov.br/api/v3/agregados/4709/periodos/2022/variaveis/93|5936|10605?localidades=N6[all]"
    },
    {
      name: "Agregado 1378 — população 2010",
      detail: "variável 93, total da situação do domicílio",
      url: "https://servicodados.ibge.gov.br/api/v3/agregados/1378/periodos/2010/variaveis/93?localidades=N6[all]&classificacao=1[0]"
    },
    {
      name: "Agregado 4714 — área e densidade 2022",
      detail: "variáveis 6318 e 614",
      url: "https://servicodados.ibge.gov.br/api/v3/agregados/4714/periodos/2022/variaveis/6318|614?localidades=N6[all]"
    }
  ];

  var EXPECTED = {
    municipios: 5570,
    pop2022: 203080756,
    pop2010Compat: 190755799,
    pop2010Censo: 190755799,
    ufs: 27,
    regioes: 5
  };

  var API_CHECK_URL =
    "https://servicodados.ibge.gov.br/api/v3/agregados/4709/periodos/2022/variaveis/93?localidades=N6[all]";

  function classifyGrowth(rate) {
    var value = Number(rate);
    if (!isFinite(value)) return GROWTH_CLASSES[2];
    if (value >= 2) return GROWTH_CLASSES[0];
    if (value > 0) return GROWTH_CLASSES[1];
    if (value >= -0.1) return GROWTH_CLASSES[2];
    if (value >= -1) return GROWTH_CLASSES[3];
    return GROWTH_CLASSES[4];
  }

  function classifySize(population) {
    var value = Number(population);
    if (!isFinite(value) || value <= 0) return SIZE_CLASSES[0];
    for (var i = 0; i < SIZE_CLASSES.length; i++) {
      var cls = SIZE_CLASSES[i];
      if (value > cls.min && value <= cls.max) return cls;
    }
    return SIZE_CLASSES[SIZE_CLASSES.length - 1];
  }

  function regionColor(name) {
    for (var i = 0; i < REGIONS.length; i++) {
      if (REGIONS[i].name === name) return REGIONS[i].color;
    }
    return "#64748b";
  }

  window.CENSO_CONFIG = {
    GROWTH_CLASSES: GROWTH_CLASSES,
    SIZE_CLASSES: SIZE_CLASSES,
    REGIONS: REGIONS,
    QUADRANT_POP_THRESHOLD: QUADRANT_POP_THRESHOLD,
    QUADRANT_RATE_THRESHOLD: QUADRANT_RATE_THRESHOLD,
    HISTOGRAM_EDGES: HISTOGRAM_EDGES,
    PAGE_SIZE: PAGE_SIZE,
    SEARCH_DEBOUNCE: SEARCH_DEBOUNCE,
    SOURCES: SOURCES,
    EXPECTED: EXPECTED,
    API_CHECK_URL: API_CHECK_URL,
    classifyGrowth: classifyGrowth,
    classifySize: classifySize,
    regionColor: regionColor
  };
})();
