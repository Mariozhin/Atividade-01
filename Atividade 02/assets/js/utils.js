/* Utilitários de formatação e texto. Carregado antes dos demais módulos. */
(function () {
  "use strict";

  const nfInt = new Intl.NumberFormat("pt-BR");
  const nf1 = new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
  });
  const nf2 = new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  function toNumber(value) {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  }

  function fmtInt(value) {
    return nfInt.format(Math.round(toNumber(value)));
  }

  function fmtCompact(value) {
    const n = toNumber(value);
    const abs = Math.abs(n);
    if (abs >= 1e9) {
      return nf1.format(n / 1e9) + " bi";
    }
    if (abs >= 1e6) {
      return nf1.format(n / 1e6) + " mi";
    }
    if (abs >= 1e3) {
      return nf1.format(n / 1e3) + " mil";
    }
    return nfInt.format(n);
  }

  function fmtPct(value, digits) {
    const n = toNumber(value);
    const d = typeof digits === "number" ? digits : 2;
    return n.toLocaleString("pt-BR", {
      minimumFractionDigits: d,
      maximumFractionDigits: d
    }) + "%";
  }

  function fmtSignedInt(value) {
    const n = Math.round(toNumber(value));
    const sign = n > 0 ? "+" : "";
    return sign + nfInt.format(n);
  }

  function fmtSignedPct(value, digits) {
    const n = toNumber(value);
    const d = typeof digits === "number" ? digits : 2;
    const sign = n > 0 ? "+" : "";
    return sign + n.toLocaleString("pt-BR", {
      minimumFractionDigits: d,
      maximumFractionDigits: d
    }) + "%";
  }

  function fmtDensity(value) {
    const n = toNumber(value);
    return n.toLocaleString("pt-BR", {
      maximumFractionDigits: n >= 100 ? 0 : 1
    });
  }

  function fmtDate(iso) {
    if (!iso) return "—";
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return "—";
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    });
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function normalizeText(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();
  }

  function round(value, digits) {
    const factor = Math.pow(10, digits || 0);
    return Math.round((toNumber(value) + Number.EPSILON) * factor) / factor;
  }

  window.CENSO_FORMAT = {
    fmtInt,
    fmtCompact,
    fmtPct,
    fmtSignedInt,
    fmtSignedPct,
    fmtDensity,
    fmtDate,
    escapeHtml,
    normalizeText,
    round,
    nf1,
    nf2
  };
})();
