/* ==========================================================================
   data.js — agregações, classificações e rankings sobre o snapshot do IBGE
   Depende de: data/municipios.js, config.js
   ========================================================================== */
(function () {
  "use strict";

  var CFG = window.CENSO_CONFIG;
  var F = window.CENSO_FORMAT;

  if (!window.CENSO_DATA || !Array.isArray(window.CENSO_DATA.municipios)) {
    throw new Error("Snapshot do IBGE não encontrado. Verifique data/municipios.js.");
  }

  var meta = window.CENSO_DATA.meta || {};
  var municipios = window.CENSO_DATA.municipios.slice();

  function sum(list, key) {
    var total = 0;
    for (var i = 0; i < list.length; i++) {
      var value = Number(list[i][key]);
      if (isFinite(value)) total += value;
    }
    return total;
  }

  function geometricRate(popStart, popEnd, years) {
    if (!(popStart > 0) || !(popEnd > 0)) return 0;
    return (Math.pow(popEnd / popStart, 1 / years) - 1) * 100;
  }

  function percentile(sorted, p) {
    if (!sorted.length) return 0;
    var pos = (sorted.length - 1) * p;
    var base = Math.floor(pos);
    var rest = pos - base;
    if (sorted[base + 1] !== undefined) {
      return sorted[base] + rest * (sorted[base + 1] - sorted[base]);
    }
    return sorted[base];
  }

  function aggregate(list) {
    var pop2010 = sum(list, "pop2010Compat");
    var pop2022 = sum(list, "pop2022");
    var varAbs = pop2022 - pop2010;
    return {
      municipios: list.length,
      pop2010: pop2010,
      pop2022: pop2022,
      varAbs: varAbs,
      varRel: pop2010 > 0 ? (pop2022 / pop2010 - 1) * 100 : 0,
      taxaAnual: geometricRate(pop2010, pop2022, 12),
      areaKm2: sum(list, "areaKm2"),
      densidade2022: sum(list, "areaKm2") > 0 ? pop2022 / sum(list, "areaKm2") : 0
    };
  }

  function countByClass(list) {
    var counts = {};
    for (var i = 0; i < CFG.GROWTH_CLASSES.length; i++) {
      counts[CFG.GROWTH_CLASSES[i].id] = 0;
    }
    for (var j = 0; j < list.length; j++) {
      counts[CFG.classifyGrowth(list[j].taxaAnual).id]++;
    }
    return counts;
  }

  /* ----------------------------- Enriquecimento ---------------------------- */
  for (var i = 0; i < municipios.length; i++) {
    var m = municipios[i];
    var growth = CFG.classifyGrowth(m.taxaAnual);
    var size = CFG.classifySize(m.pop2022);
    m.growthClass = growth.id;
    m.growthLabel = growth.label;
    m.growthBadge = growth.badge;
    m.growthTone = growth.tone;
    m.sizeClass = size.id;
    m.sizeLabel = size.label;
    m.regiaoCor = CFG.regionColor(m.regiao);
  }

  var byId = {};
  var byRegion = {};
  var byUf = {};
  for (var k = 0; k < CFG.REGIONS.length; k++) byRegion[CFG.REGIONS[k].name] = [];
  for (var n = 0; n < municipios.length; n++) {
    var mun = municipios[n];
    byId[String(mun.id)] = mun;
    if (!byRegion[mun.regiao]) byRegion[mun.regiao] = [];
    byRegion[mun.regiao].push(mun);
    if (!byUf[mun.uf]) byUf[mun.uf] = [];
    byUf[mun.uf].push(mun);
  }

  /* ------------------------------- Nacional -------------------------------- */
  var national = aggregate(municipios);
  national.growthCounts = countByClass(municipios);
  national.growing = national.growthCounts.accel + national.growthCounts.moderate;
  national.stable = national.growthCounts.stable;
  national.declining = national.growthCounts.decline + national.growthCounts.sharp;

  var rates = municipios.map(function (item) { return Number(item.taxaAnual) || 0; }).sort(function (a, b) { return a - b; });
  national.medianRate = percentile(rates, 0.5);
  national.p10Rate = percentile(rates, 0.1);
  national.p90Rate = percentile(rates, 0.9);
  national.minRate = rates[0];
  national.maxRate = rates[rates.length - 1];

  /* -------------------------------- Regiões -------------------------------- */
  var regions = CFG.REGIONS.map(function (region) {
    var list = byRegion[region.name] || [];
    var agg = aggregate(list);
    agg.name = region.name;
    agg.color = region.color;
    agg.growthCounts = countByClass(list);
    agg.growing = agg.growthCounts.accel + agg.growthCounts.moderate;
    agg.stable = agg.growthCounts.stable;
    agg.declining = agg.growthCounts.decline + agg.growthCounts.sharp;
    return agg;
  });

  /* ---------------------------------- UFs ---------------------------------- */
  var ufs = Object.keys(byUf).map(function (uf) {
    var list = byUf[uf];
    var agg = aggregate(list);
    agg.uf = uf;
    agg.name = uf;
    agg.regiao = list[0].regiao;
    agg.ufId = list[0].ufId;
    agg.color = CFG.regionColor(agg.regiao);
    agg.growthCounts = countByClass(list);
    return agg;
  }).sort(function (a, b) {
    if (a.regiao === b.regiao) return a.uf.localeCompare(b.uf, "pt-BR");
    return CFG.REGIONS.map(function (r) { return r.name; }).indexOf(a.regiao) -
      CFG.REGIONS.map(function (r) { return r.name; }).indexOf(b.regiao);
  });

  /* ------------------------------ Distribuição ----------------------------- */
  var edges = CFG.HISTOGRAM_EDGES;
  var histogram = [];
  for (var e = 0; e < edges.length - 1; e++) {
    histogram.push({
      from: edges[e],
      to: edges[e + 1],
      count: 0,
      label: F.fmtPct(edges[e], Number.isInteger(edges[e]) ? 0 : 1).replace("%", "") +
        " a " + F.fmtPct(edges[e + 1], Number.isInteger(edges[e + 1]) ? 0 : 1).replace("%", "")
    });
  }
  for (var h = 0; h < municipios.length; h++) {
    var rate = Number(municipios[h].taxaAnual) || 0;
    for (var b = 0; b < histogram.length; b++) {
      var isLast = b === histogram.length - 1;
      if (rate >= histogram[b].from && (isLast ? rate <= histogram[b].to : rate < histogram[b].to)) {
        histogram[b].count++;
        break;
      }
    }
  }
  for (var hb = 0; hb < histogram.length; hb++) {
    var mid = (histogram[hb].from + histogram[hb].to) / 2;
    histogram[hb].color = mid > 0 ? "#0f766e" : (mid > -0.5 ? "#94a3b8" : "#b42318");
  }

  /* ------------------------------- Quadrantes ------------------------------ */
  function quadrant(key, label, description, filter) {
    var list = municipios.filter(filter);
    var agg = aggregate(list);
    var examples = list.slice().sort(function (a, b) {
      return Math.abs(b.varAbs) - Math.abs(a.varAbs);
    }).slice(0, 3);
    return {
      key: key,
      label: label,
      description: description,
      count: list.length,
      share: municipios.length ? (list.length / municipios.length) * 100 : 0,
      pop2022: agg.pop2022,
      varAbs: agg.varAbs,
      taxaAnual: agg.taxaAnual,
      examples: examples
    };
  }

  var popThreshold = CFG.QUADRANT_POP_THRESHOLD;
  var rateThreshold = CFG.QUADRANT_RATE_THRESHOLD;

  var quadrants = [
    quadrant(
      "large-growing",
      "Grande e crescendo",
      "Expansão consolidada: volume relevante e dinamismo positivo.",
      function (item) { return item.pop2022 >= popThreshold && item.taxaAnual > rateThreshold; }
    ),
    quadrant(
      "large-declining",
      "Grande e sem crescimento",
      "Mercado maduro: volume alto, mas sem dinamismo populacional.",
      function (item) { return item.pop2022 >= popThreshold && item.taxaAnual <= rateThreshold; }
    ),
    quadrant(
      "small-growing",
      "Pequeno e crescendo",
      "Fronteira de crescimento: base menor, em expansão.",
      function (item) { return item.pop2022 < popThreshold && item.taxaAnual > rateThreshold; }
    ),
    quadrant(
      "small-declining",
      "Pequeno e sem crescimento",
      "Baixa prioridade: volume baixo e sem dinamismo demográfico.",
      function (item) { return item.pop2022 < popThreshold && item.taxaAnual <= rateThreshold; }
    )
  ];

  /* -------------------------------- Rankings ------------------------------- */
  function byNumber(key, direction) {
    return municipios.slice().sort(function (a, b) {
      return direction * (Number(b[key]) - Number(a[key]));
    });
  }

  var rankings = {
    absoluteGain: byNumber("varAbs", 1).slice(0, 10),
    growth: byNumber("taxaAnual", 1).slice(0, 10),
    decline: byNumber("taxaAnual", -1).slice(0, 10),
    population: byNumber("pop2022", 1).slice(0, 10)
  };

  /* --------------------------------- Pontos -------------------------------- */
  var scatterPoints = municipios.map(function (item) {
    return {
      x: Number(item.taxaAnual),
      y: Number(item.pop2022),
      nome: item.nome,
      uf: item.uf,
      id: item.id
    };
  });

  /* ------------------------------- Validação ------------------------------- */
  var validation = [];
  function check(name, actual, expected, ok) {
    validation.push({
      name: name,
      actual: actual,
      expected: expected,
      ok: typeof ok === "boolean" ? ok : actual === expected
    });
  }

  check("Municípios", municipios.length, CFG.EXPECTED.municipios);
  check("Soma da população de 2022", national.pop2022, CFG.EXPECTED.pop2022);
  check("Soma da população de 2010 compatibilizada", national.pop2010, CFG.EXPECTED.pop2010Compat);
  check("UFs", ufs.length, CFG.EXPECTED.ufs);
  check("Regiões", regions.filter(function (r) { return r.municipios > 0; }).length, CFG.EXPECTED.regioes);

  var nulls = municipios.filter(function (item) {
    return item.pop2022 == null || item.varAbs == null ||
      item.taxaAnual == null || item.areaKm2 == null ||
      item.pop2010Compat == null;
  }).length;
  check("Campos centrais nulos", nulls, 0);

  var formulaBad = municipios.filter(function (item) {
    var calc = geometricRate(item.pop2010Compat, item.pop2022, 12);
    return Math.abs(calc - Number(item.taxaAnual)) > 0.02;
  }).length;
  check("Divergências na fórmula da taxa", formulaBad, 0);

  var pop2010Censo = sum(
    municipios.filter(function (item) { return item.pop2010Censo != null; }),
    "pop2010Censo"
  );
  check("Soma da população de 2010 (censo)", pop2010Censo, CFG.EXPECTED.pop2010Censo);

  var validationOk = validation.every(function (item) { return item.ok; });

  /* ---------------------------------- API ---------------------------------- */
  window.CENSO = window.CENSO || {};
  window.CENSO.data = {
    meta: meta,
    municipios: municipios,
    byId: byId,
    byRegion: byRegion,
    byUf: byUf,
    national: national,
    regions: regions,
    ufs: ufs,
    histogram: histogram,
    quadrants: quadrants,
    rankings: rankings,
    scatterPoints: scatterPoints,
    validation: validation,
    validationOk: validationOk,
    percentile: percentile,
    aggregate: aggregate,
    geometricRate: geometricRate
  };
})();
