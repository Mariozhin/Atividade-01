/* ==========================================================================
   charts.js — gráficos do projeto com Chart.js (carregado localmente)
   Depende de: config.js, data.js, utils.js e assets/vendor/chart.umd.min.js
   ========================================================================== */
(function () {
  "use strict";

  var F = window.CENSO_FORMAT;
  var CFG = window.CENSO_CONFIG;
  var D = window.CENSO.data;
  var instances = {};

  function cssVar(name, fallback) {
    var value = getComputedStyle(document.documentElement).getPropertyValue(name);
    return value ? value.trim() : fallback;
  }

  function palette() {
    return {
      text: cssVar("--text", "#101828"),
      muted: cssVar("--muted", "#5b6475"),
      border: cssVar("--border", "#dfe4ec"),
      surface: cssVar("--surface", "#ffffff"),
      positive: cssVar("--positive", "#0f766e"),
      negative: cssVar("--negative", "#b42318"),
      primary: cssVar("--primary", "#1d4ed8"),
      grid: cssVar("--border", "#dfe4ec")
    };
  }

  function fallback(canvasId, message) {
    var canvas = document.getElementById(canvasId);
    if (!canvas || !canvas.parentNode) return;
    var parent = canvas.parentNode;
    var existing = parent.querySelector(".chart-fallback");
    if (existing) return;
    canvas.style.display = "none";
    var p = document.createElement("p");
    p.className = "chart-fallback";
    p.textContent = message || "Não foi possível carregar o gráfico. Os dados continuam disponíveis na tabela e no arquivo CSV.";
    parent.appendChild(p);
  }

  function clearFallback(canvasId) {
    var canvas = document.getElementById(canvasId);
    if (!canvas || !canvas.parentNode) return;
    var existing = canvas.parentNode.querySelector(".chart-fallback");
    if (existing) existing.remove();
    canvas.style.display = "";
  }

  function create(canvasId, config) {
    if (!window.Chart) {
      fallback(canvasId);
      return null;
    }
    var canvas = document.getElementById(canvasId);
    if (!canvas) return null;
    clearFallback(canvasId);
    if (instances[canvasId]) {
      instances[canvasId].destroy();
      delete instances[canvasId];
    }
    instances[canvasId] = new window.Chart(canvas, config);
    return instances[canvasId];
  }

  function baseOptions(p) {
    return {
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 600
      },
      font: { family: '"Segoe UI", system-ui, sans-serif' },
      plugins: {
        legend: {
          labels: {
            color: p.muted,
            boxWidth: 10,
            boxHeight: 10,
            usePointStyle: true,
            font: { size: 11, weight: "600" }
          }
        },
        tooltip: {
          backgroundColor: "#0b1f3a",
          titleColor: "#f8fafc",
          bodyColor: "#e2e8f0",
          borderColor: "rgba(255,255,255,0.12)",
          borderWidth: 1,
          padding: 10,
          cornerRadius: 8,
          titleFont: { size: 12, weight: "700" },
          bodyFont: { size: 12 }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          border: { color: p.border },
          ticks: { color: p.muted, font: { size: 11 } }
        },
        y: {
          grid: { color: p.grid, drawTicks: false },
          border: { display: false },
          ticks: { color: p.muted, font: { size: 11 }, padding: 6 }
        }
      }
    };
  }

  /* Linhas de referência da matriz de oportunidades. */
  var referenceLines = {
    id: "censoReferenceLines",
    afterDatasetsDraw: function (chart) {
      var opts = chart.options.plugins.censoReferenceLines;
      if (!opts || !opts.enabled) return;
      var ctx = chart.ctx;
      var area = chart.chartArea;
      if (!area) return;

      ctx.save();
      ctx.strokeStyle = opts.color || "rgba(100,116,139,0.45)";
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 5]);

      if (chart.scales.x && typeof opts.x === "number") {
        var x = chart.scales.x.getPixelForValue(opts.x);
        if (x >= area.left && x <= area.right) {
          ctx.beginPath();
          ctx.moveTo(x, area.top);
          ctx.lineTo(x, area.bottom);
          ctx.stroke();
        }
      }

      if (chart.scales.y && typeof opts.y === "number") {
        var y = chart.scales.y.getPixelForValue(opts.y);
        if (y >= area.top && y <= area.bottom) {
          ctx.beginPath();
          ctx.moveTo(area.left, y);
          ctx.lineTo(area.right, y);
          ctx.stroke();
        }
      }

      ctx.restore();
    }
  };

  function renderNational(p) {
    create("chart-nacional", {
      type: "bar",
      data: {
        labels: ["2010 (compat.)", "2022"],
        datasets: [{
          label: "População residente",
          data: [D.national.pop2010, D.national.pop2022],
          backgroundColor: ["#93a4bd", p.positive],
          borderRadius: 8,
          borderSkipped: false,
          maxBarThickness: 96
        }]
      },
      options: (function () {
        var options = baseOptions(p);
        options.plugins.legend.display = false;
        options.plugins.tooltip.callbacks = {
          label: function (ctx) {
            return " " + F.fmtInt(ctx.parsed.y) + " habitantes";
          },
          afterLabel: function (ctx) {
            if (ctx.dataIndex === 1) {
              return "Variação: " + F.fmtSignedInt(D.national.varAbs) +
                " (" + F.fmtSignedPct(D.national.varRel, 2) + ")";
            }
            return "";
          }
        };
        options.scales.y.ticks.callback = function (value) { return F.fmtCompact(value); };
        return options;
      })()
    });
  }

  function renderHistogram(p) {
    var labels = D.histogram.map(function (bin) { return bin.label; });
    var values = D.histogram.map(function (bin) { return bin.count; });
    var colors = D.histogram.map(function (bin) { return bin.color; });

    create("chart-distribuicao", {
      type: "bar",
      data: {
        labels: labels,
        datasets: [{
          label: "Municípios",
          data: values,
          backgroundColor: colors,
          borderRadius: 4,
          borderSkipped: false
        }]
      },
      options: (function () {
        var options = baseOptions(p);
        options.plugins.legend.display = false;
        options.plugins.tooltip.callbacks = {
          title: function (items) {
            return items[0].label + "% ao ano";
          },
          label: function (ctx) {
            return " " + F.fmtInt(ctx.parsed.y) + " municípios";
          }
        };
        options.scales.x.ticks.font = { size: 9 };
        options.scales.x.ticks.maxRotation = 60;
        options.scales.x.ticks.minRotation = 45;
        options.scales.y.ticks.callback = function (value) { return F.fmtInt(value); };
        options.scales.y.title = {
          display: true,
          text: "Municípios",
          color: p.muted,
          font: { size: 10, weight: "600" }
        };
        return options;
      })()
    });
  }

  function renderRegions(p) {
    var sorted = D.regions.slice().sort(function (a, b) { return b.taxaAnual - a.taxaAnual; });
    var labels = sorted.map(function (region) { return region.name; });
    var values = sorted.map(function (region) { return region.taxaAnual; });
    var colors = sorted.map(function (region) { return region.color; });

    create("chart-regioes", {
      type: "bar",
      data: {
        labels: labels,
        datasets: [{
          label: "Taxa anual",
          data: values,
          backgroundColor: colors,
          borderRadius: 6,
          borderSkipped: false,
          maxBarThickness: 34
        }]
      },
      options: (function () {
        var options = baseOptions(p);
        options.indexAxis = "y";
        options.plugins.legend.display = false;
        options.plugins.tooltip.callbacks = {
          label: function (ctx) {
            var region = sorted[ctx.dataIndex];
            return " " + F.fmtPct(region.taxaAnual, 2) + " ao ano";
          },
          afterLabel: function (ctx) {
            var region = sorted[ctx.dataIndex];
            return [
              "População 2022: " + F.fmtInt(region.pop2022),
              "Crescimento: " + F.fmtSignedPct(region.varRel, 2)
            ];
          }
        };
        options.scales.x.ticks.callback = function (value) { return F.fmtPct(value, 1); };
        options.scales.x.grid = { color: p.grid, drawTicks: false };
        options.scales.y.grid = { display: false };
        return options;
      })()
    });
  }

  function renderScatter(p) {
    var datasets = CFG.REGIONS.map(function (region) {
      var points = D.scatterPoints.filter(function (point) {
        var mun = D.byId[String(point.id)];
        return mun && mun.regiao === region.name;
      });
      return {
        label: region.name,
        data: points,
        backgroundColor: region.color + "b3",
        borderColor: region.color,
        borderWidth: 0,
        pointRadius: 2.4,
        pointHoverRadius: 5,
        pointHitRadius: 6
      };
    });

    create("chart-dispersao", {
      type: "scatter",
      data: { datasets: datasets },
      plugins: [referenceLines],
      options: (function () {
        var options = baseOptions(p);
        options.plugins.censoReferenceLines = {
          enabled: true,
          x: CFG.QUADRANT_RATE_THRESHOLD,
          y: CFG.QUADRANT_POP_THRESHOLD,
          color: cssVar("--muted", "#64748b") + "88"
        };
        options.plugins.legend.labels.font = { size: 10, weight: "600" };
        options.plugins.tooltip.callbacks = {
          title: function (items) {
            var raw = items[0].raw;
            return raw.nome + "/" + raw.uf;
          },
          label: function (ctx) {
            return [
              "Taxa: " + F.fmtSignedPct(ctx.parsed.x, 2) + " ao ano",
              "População 2022: " + F.fmtInt(ctx.parsed.y)
            ];
          }
        };
        options.scales.x.title = {
          display: true,
          text: "Taxa de crescimento anual (%)",
          color: p.muted,
          font: { size: 10, weight: "600" }
        };
        options.scales.y.type = "logarithmic";
        options.scales.y.min = 500;
        options.scales.y.title = {
          display: true,
          text: "População 2022 (escala log)",
          color: p.muted,
          font: { size: 10, weight: "600" }
        };
        options.scales.y.ticks.callback = function (value) { return F.fmtCompact(value); };
        options.scales.y.grid.color = p.grid;
        return options;
      })()
    });
  }

  function renderAll() {
    if (!window.Chart) {
      ["chart-nacional", "chart-distribuicao", "chart-regioes", "chart-dispersao"].forEach(function (id) {
        fallback(id);
      });
      return;
    }
    var p = palette();
    window.Chart.defaults.font.family = '"Segoe UI", system-ui, -apple-system, sans-serif';
    window.Chart.defaults.color = p.muted;
    renderNational(p);
    renderHistogram(p);
    renderRegions(p);
    renderScatter(p);
  }

  function renderMunicipioChart(municipio, canvasId) {
    var p = palette();
    return create(canvasId, {
      type: "bar",
      data: {
        labels: ["2010 (compat.)", "2022"],
        datasets: [{
          data: [municipio.pop2010Compat, municipio.pop2022],
          backgroundColor: ["#93a4bd", p.positive],
          borderRadius: 6,
          borderSkipped: false,
          maxBarThickness: 72
        }]
      },
      options: (function () {
        var options = baseOptions(p);
        options.plugins.legend.display = false;
        options.plugins.tooltip.callbacks = {
          label: function (ctx) { return " " + F.fmtInt(ctx.parsed.y) + " habitantes"; }
        };
        options.scales.y.ticks.callback = function (value) { return F.fmtCompact(value); };
        options.scales.x.ticks.font = { size: 10 };
        return options;
      })()
    });
  }

  window.CENSO = window.CENSO || {};
  window.CENSO.charts = {
    renderAll: renderAll,
    renderMunicipioChart: renderMunicipioChart,
    destroy: function (id) {
      if (instances[id]) {
        instances[id].destroy();
        delete instances[id];
      }
    }
  };
})();
