/* ==========================================================================
   ui.js — interface, filtros, tabela, modal, rankings e textos analíticos
   Depende de: utils.js, config.js, data.js, charts.js
   ========================================================================== */
(function () {
  "use strict";

  var F = window.CENSO_FORMAT;
  var CFG = window.CENSO_CONFIG;
  var D = window.CENSO.data;

  var state = {
    search: "",
    region: "",
    uf: "",
    growth: "",
    size: "",
    sortKey: "pop2022",
    sortDir: "desc",
    page: 1
  };

  var filtered = [];
  var lastFocused = null;
  var toastTimer = null;
  var searchTimer = null;

  function $(id) { return document.getElementById(id); }

  function setText(id, value) {
    var node = $(id);
    if (node) node.textContent = value;
  }

  /* ------------------------------- Tema ---------------------------------- */
  function preferredTheme() {
    try {
      var stored = window.localStorage.getItem("censo-theme");
      if (stored === "light" || stored === "dark") return stored;
    } catch (error) { /* modo privado ou file:// restrito */ }
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    try {
      window.localStorage.setItem("censo-theme", theme);
    } catch (error) { /* ignora */ }

    var toggle = $("theme-toggle");
    if (toggle) {
      toggle.setAttribute("aria-pressed", theme === "dark" ? "true" : "false");
      toggle.setAttribute("title", theme === "dark" ? "Ativar tema claro" : "Ativar tema escuro");
    }

    if (window.CENSO.charts) {
      window.CENSO.charts.renderAll();
      var modal = $("municipio-modal");
      if (modal && !modal.hidden && modal.dataset.municipioId) {
        var mun = D.byId[modal.dataset.municipioId];
        if (mun) window.CENSO.charts.renderMunicipioChart(mun, "modal-chart");
      }
    }
  }

  function initTheme() {
    var theme = preferredTheme();
    document.documentElement.setAttribute("data-theme", theme);
    var toggle = $("theme-toggle");
    if (toggle) {
      toggle.setAttribute("aria-pressed", theme === "dark" ? "true" : "false");
      toggle.addEventListener("click", function () {
        var current = document.documentElement.getAttribute("data-theme");
        applyTheme(current === "dark" ? "light" : "dark");
      });
    }
  }

  /* ------------------------------- Navegação ------------------------------ */
  function initNavigation() {
    var menuBtn = $("menu-toggle");
    var nav = $("nav");

    if (menuBtn && nav) {
      menuBtn.addEventListener("click", function () {
        var open = nav.classList.toggle("is-open");
        menuBtn.setAttribute("aria-expanded", open ? "true" : "false");
        menuBtn.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
      });

      nav.addEventListener("click", function (event) {
        if (event.target.closest("a")) {
          nav.classList.remove("is-open");
          menuBtn.setAttribute("aria-expanded", "false");
          menuBtn.setAttribute("aria-label", "Abrir menu");
        }
      });
    }

    var links = Array.prototype.slice.call(document.querySelectorAll(".nav__link"));
    var sections = links.map(function (link) {
      var id = link.getAttribute("href");
      return id && id.charAt(0) === "#" ? document.querySelector(id) : null;
    }).filter(Boolean);

    if ("IntersectionObserver" in window && sections.length) {
      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          links.forEach(function (link) {
            link.classList.toggle(
              "is-active",
              link.getAttribute("href") === "#" + entry.target.id
            );
          });
        });
      }, { rootMargin: "-45% 0px -50% 0px", threshold: 0 });

      sections.forEach(function (section) { observer.observe(section); });
    }
  }

  /* ------------------------------- Hero / KPI ----------------------------- */
  function renderHero() {
    var total = D.national.municipios || 1;
    setText("hero-pop-2022", F.fmtInt(D.national.pop2022));
    setText("hero-growth", F.fmtSignedPct(D.national.varRel, 2));
    setText("hero-rate", F.fmtPct(D.national.taxaAnual, 2) + " a.a.");
    setText("hero-count", F.fmtInt(D.national.municipios));

    setText("hero-legend-growth", F.fmtInt(D.national.growing));
    setText("hero-legend-stable", F.fmtInt(D.national.stable));
    setText("hero-legend-decline", F.fmtInt(D.national.declining));

    var totalCount = D.national.municipios || 1;
    setText("panorama-growing", F.fmtPct((D.national.growing / totalCount) * 100, 1));
    setText("panorama-decline", F.fmtPct((D.national.declining / totalCount) * 100, 1));
    setText("panorama-stable", F.fmtPct((D.national.stable / totalCount) * 100, 1));

    var growthBar = $("hero-bar-growth");
    var stableBar = $("hero-bar-stable");
    var declineBar = $("hero-bar-decline");
    if (growthBar) growthBar.style.width = (D.national.growing / total) * 100 + "%";
    if (stableBar) stableBar.style.width = (D.national.stable / total) * 100 + "%";
    if (declineBar) declineBar.style.width = (D.national.declining / total) * 100 + "%";

    var extraction = F.fmtDate(D.meta.geradoEm);
    setText("data-extracao", extraction);
    setText("footer-data", extraction);
    setText("footer-universo", F.fmtInt(D.national.municipios));
  }

  function renderKpis() {
    var container = $("kpi-grid");
    if (!container) return;

    var growingShare = (D.national.growing / D.national.municipios) * 100;
    var decliningShare = (D.national.declining / D.national.municipios) * 100;

    var items = [
      {
        label: "População em 2022",
        value: F.fmtInt(D.national.pop2022),
        note: "Censo 2022 · 5.570 municípios",
        tone: ""
      },
      {
        label: "Ganho no período",
        value: F.fmtSignedInt(D.national.varAbs),
        note: "habitantes entre 2010 e 2022",
        tone: "positive"
      },
      {
        label: "Crescimento total",
        value: F.fmtSignedPct(D.national.varRel, 2),
        note: "variação relativa em 12 anos",
        tone: "positive"
      },
      {
        label: "Taxa anual",
        value: F.fmtPct(D.national.taxaAnual, 2),
        note: "crescimento geométrico ao ano",
        tone: ""
      },
      {
        label: "Municípios crescendo",
        value: F.fmtInt(D.national.growing),
        note: F.fmtPct(growingShare, 1) + " do universo",
        tone: "positive"
      },
      {
        label: "Municípios em retração",
        value: F.fmtInt(D.national.declining),
        note: F.fmtPct(decliningShare, 1) + " do universo",
        tone: "negative"
      }
    ];

    container.innerHTML = items.map(function (item) {
      return '<article class="kpi">' +
        '<span class="kpi__label">' + F.escapeHtml(item.label) + "</span>" +
        '<strong class="kpi__value' +
        (item.tone === "positive" ? " kpi__value--positive" : "") +
        (item.tone === "negative" ? " kpi__value--negative" : "") +
        '">' + F.escapeHtml(item.value) + "</strong>" +
        '<span class="kpi__note">' + F.escapeHtml(item.note) + "</span>" +
        "</article>";
    }).join("");
  }

  function renderInsights() {
    var container = $("insights-list");
    if (!container) return;

    var regions = D.regions.slice().sort(function (a, b) { return b.taxaAnual - a.taxaAnual; });
    var leader = regions[0];
    var laggard = regions[regions.length - 1];
    var topAbsolute = D.rankings.absoluteGain[0];
    var topRate = D.rankings.growth[0];

    var items = [
      "O Brasil somou <strong>" + F.fmtSignedInt(D.national.varAbs) +
        " habitantes</strong>, alta de " + F.fmtSignedPct(D.national.varRel, 2) +
        " em 12 anos — " + F.fmtPct(D.national.taxaAnual, 2) + " ao ano.",

      "<strong>" + F.escapeHtml(leader.name) + "</strong> lidera o ritmo regional (" +
        F.fmtPct(leader.taxaAnual, 2) + " a.a.), enquanto <strong>" +
        F.escapeHtml(laggard.name) + "</strong> cresce " + F.fmtPct(laggard.taxaAnual, 2) + " a.a.",

      "Pouco mais da metade avança: <strong>" + F.fmtInt(D.national.growing) +
        " municípios crescem</strong> e " + F.fmtInt(D.national.declining) +
        " entram em retração; " + F.fmtInt(D.national.stable) + " ficam em estabilidade.",

      "A mediana é de <strong>" + F.fmtSignedPct(D.national.medianRate, 2) +
        " ao ano</strong>; 10% dos municípios ficam abaixo de " +
        F.fmtSignedPct(D.national.p10Rate, 2) + " e 10% acima de " +
        F.fmtSignedPct(D.national.p90Rate, 2) + ".",

      "<strong>" + F.escapeHtml(topAbsolute.nome) + "/" + topAbsolute.uf +
        "</strong> teve o maior ganho absoluto (" + F.fmtSignedInt(topAbsolute.varAbs) +
        " habitantes).",

      "<strong>" + F.escapeHtml(topRate.nome) + "/" + topRate.uf +
        "</strong> registra a maior taxa anual (" + F.fmtSignedPct(topRate.taxaAnual, 2) +
        "), partindo de uma base de " + F.fmtInt(topRate.pop2022) + " habitantes."
    ];

    container.innerHTML = items.map(function (html) {
      return "<li><span>" + html + "</span></li>";
    }).join("");
  }

  /* ------------------------------- Filtros -------------------------------- */
  function populateSelect(id, options, placeholder) {
    var select = $(id);
    if (!select) return;
    var html = '<option value="">' + F.escapeHtml(placeholder) + "</option>";
    html += options.map(function (option) {
      return '<option value="' + F.escapeHtml(option.value) + '">' +
        F.escapeHtml(option.label) + "</option>";
    }).join("");
    select.innerHTML = html;
  }

  function initFilters() {
    populateSelect("filter-region", CFG.REGIONS.map(function (region) {
      return { value: region.name, label: region.name };
    }), "Todas as regiões");

    populateSelect("filter-uf", D.ufs.map(function (uf) {
      return { value: uf.uf, label: uf.uf + " — " + uf.regiao };
    }), "Todas as UFs");

    populateSelect("filter-growth", CFG.GROWTH_CLASSES.map(function (cls) {
      return { value: cls.id, label: cls.label };
    }), "Todos");

    populateSelect("filter-size", CFG.SIZE_CLASSES.map(function (cls) {
      return { value: cls.id, label: cls.label + " (" + cls.short + ")" };
    }), "Todos");

    var search = $("filter-search");
    if (search) {
      search.addEventListener("input", function () {
        window.clearTimeout(searchTimer);
        var value = search.value;
        searchTimer = window.setTimeout(function () {
          state.search = value;
          state.page = 1;
          update();
        }, CFG.SEARCH_DEBOUNCE);
      });
    }

    [["filter-region", "region"], ["filter-uf", "uf"], ["filter-growth", "growth"], ["filter-size", "size"]]
      .forEach(function (pair) {
        var select = $(pair[0]);
        if (!select) return;
        select.addEventListener("change", function () {
          state[pair[1]] = select.value;
          state.page = 1;
          update();
        });
      });

    var clear = $("filters-clear");
    if (clear) {
      clear.addEventListener("click", function () {
        state.search = "";
        state.region = "";
        state.uf = "";
        state.growth = "";
        state.size = "";
        state.sortKey = "pop2022";
        state.sortDir = "desc";
        state.page = 1;
        if (search) search.value = "";
        ["filter-region", "filter-uf", "filter-growth", "filter-size"].forEach(function (id) {
          var select = $(id);
          if (select) select.value = "";
        });
        update();
      });
    }
  }

  /* ------------------------------- Tabela --------------------------------- */
  function compare(a, b) {
    var key = state.sortKey;
    var dir = state.sortDir === "asc" ? 1 : -1;
    if (key === "nome" || key === "uf") {
      return dir * String(a[key]).localeCompare(String(b[key]), "pt-BR");
    }
    return dir * ((Number(a[key]) || 0) - (Number(b[key]) || 0));
  }

  function computeFiltered() {
    var term = F.normalizeText(state.search);
    filtered = D.municipios.filter(function (mun) {
      if (state.region && mun.regiao !== state.region) return false;
      if (state.uf && mun.uf !== state.uf) return false;
      if (state.growth && mun.growthClass !== state.growth) return false;
      if (state.size && mun.sizeClass !== state.size) return false;
      if (term && F.normalizeText(mun.nome + " " + mun.uf).indexOf(term) === -1) return false;
      return true;
    });
    filtered.sort(compare);
  }

  function rateClass(tone) {
    if (tone === "positive") return "rate--positive";
    if (tone === "negative") return "rate--negative";
    return "rate--neutral";
  }

  function varClass(value) {
    if (value > 0) return "var-value--positive";
    if (value < 0) return "var-value--negative";
    return "";
  }

  function renderTable() {
    var tbody = $("municipios-tbody");
    var cards = $("municipios-cards");
    if (!tbody) return;

    var start = (state.page - 1) * CFG.PAGE_SIZE;
    var pageRows = filtered.slice(start, start + CFG.PAGE_SIZE);

    tbody.innerHTML = pageRows.map(function (mun) {
      var pop2010 = mun.pop2010Censo == null
        ? '<span title="Município criado após 2010; a base compatibilizada está disponível.">n/d</span>'
        : F.fmtInt(mun.pop2010Censo);

      return "<tr>" +
        '<td><button class="municipio-link" type="button" data-id="' + mun.id + '">' +
        F.escapeHtml(mun.nome) + "</button></td>" +
        '<td><span class="uf-tag">' + F.escapeHtml(mun.uf) + "</span></td>" +
        '<td class="num">' + pop2010 + "</td>" +
        '<td class="num">' + F.fmtInt(mun.pop2022) + "</td>" +
        '<td class="num"><span class="var-value ' + varClass(mun.varAbs) + '">' +
        F.fmtSignedInt(mun.varAbs) + "</span></td>" +
        '<td class="num"><span class="rate ' + rateClass(mun.growthTone) +
        '" title="' + F.escapeHtml(mun.growthLabel) + '">' +
        F.fmtSignedPct(mun.taxaAnual, 2) + "</span></td>" +
        '<td class="num">' + F.fmtDensity(mun.densidade2022) + "</td>" +
        "</tr>";
    }).join("");

    if (cards) {
      cards.innerHTML = pageRows.map(function (mun) {
        return '<div class="m-card" data-id="' + mun.id + '">' +
          '<div class="m-card__head">' +
          "<div><h4><button class=\"m-card__name municipio-link\" type=\"button\" data-id=\"" +
          mun.id + "\">" + F.escapeHtml(mun.nome) + "</button></h4>" +
          '<p class="m-card__sub">' +
          F.escapeHtml(mun.uf) + " · " + F.escapeHtml(mun.regiao) + "</p></div>" +
          '<span class="badge ' + mun.growthBadge + '">' + F.escapeHtml(mun.growthLabel) + "</span>" +
          "</div>" +
          '<dl class="m-card__stats">' +
          "<div><dt>População 2022</dt><dd>" + F.fmtInt(mun.pop2022) + "</dd></div>" +
          "<div><dt>Variação</dt><dd>" + F.fmtSignedPct(mun.varRel, 2) + "</dd></div>" +
          "<div><dt>Taxa anual</dt><dd>" + F.fmtSignedPct(mun.taxaAnual, 2) + "</dd></div>" +
          "<div><dt>Densidade</dt><dd>" + F.fmtDensity(mun.densidade2022) + " hab/km²</dd></div>" +
          "</dl></div>";
      }).join("");
    }
  }

  function renderCount() {
    var node = $("results-count");
    if (!node) return;
    var totalPages = Math.max(1, Math.ceil(filtered.length / CFG.PAGE_SIZE));
    var start = filtered.length ? (state.page - 1) * CFG.PAGE_SIZE + 1 : 0;
    var end = Math.min(state.page * CFG.PAGE_SIZE, filtered.length);
    node.innerHTML = "<strong>" + F.fmtInt(filtered.length) + "</strong> " +
      (filtered.length === 1 ? "município" : "municípios") +
      (filtered.length ? " · exibindo " + F.fmtInt(start) + "–" + F.fmtInt(end) : "") +
      " · página " + state.page + " de " + totalPages;
  }

  function pageList(current, total) {
    var pages = [];
    var i;
    if (total <= 7) {
      for (i = 1; i <= total; i++) pages.push(i);
      return pages;
    }
    pages.push(1);
    if (current > 4) pages.push("…");
    var from = Math.max(2, current - 2);
    var to = Math.min(total - 1, current + 2);
    for (i = from; i <= to; i++) pages.push(i);
    if (current < total - 3) pages.push("…");
    pages.push(total);
    return pages;
  }

  function renderPagination() {
    var container = $("pagination");
    if (!container) return;
    var totalPages = Math.max(1, Math.ceil(filtered.length / CFG.PAGE_SIZE));
    if (state.page > totalPages) state.page = totalPages;

    var html = '<button class="page-btn" type="button" data-page="prev"' +
      (state.page === 1 ? " disabled" : "") + ' aria-label="Página anterior">Anterior</button>';

    pageList(state.page, totalPages).forEach(function (page) {
      if (page === "…") {
        html += '<span class="page-ellipsis" aria-hidden="true">…</span>';
        return;
      }
      html += '<button class="page-btn' + (page === state.page ? " is-active" : "") +
        '" type="button" data-page="' + page + '"' +
        (page === state.page ? ' aria-current="page"' : "") +
        ' aria-label="Página ' + page + '">' + page + "</button>";
    });

    html += '<button class="page-btn" type="button" data-page="next"' +
      (state.page === totalPages ? " disabled" : "") + ' aria-label="Próxima página">Próxima</button>';

    container.innerHTML = html;
  }

  function renderSortState() {
    var headers = document.querySelectorAll("#municipios-table thead th[data-sort]");
    Array.prototype.forEach.call(headers, function (th) {
      var key = th.getAttribute("data-sort");
      if (key === state.sortKey) {
        th.setAttribute("aria-sort", state.sortDir === "asc" ? "ascending" : "descending");
      } else {
        th.setAttribute("aria-sort", "none");
      }
    });
  }

  function initTable() {
    var table = $("municipios-table");
    if (table) {
      table.addEventListener("click", function (event) {
        var button = event.target.closest("[data-sort]");
        if (!button) return;
        var key = button.getAttribute("data-sort");
        if (key === state.sortKey) {
          state.sortDir = state.sortDir === "asc" ? "desc" : "asc";
        } else {
          state.sortKey = key;
          state.sortDir = (key === "nome" || key === "uf") ? "asc" : "desc";
        }
        state.page = 1;
        update();
      });
    }

    var tbody = $("municipios-tbody");
    if (tbody) {
      tbody.addEventListener("click", function (event) {
        var button = event.target.closest(".municipio-link");
        if (button) openModal(button.getAttribute("data-id"));
      });
    }

    var cards = $("municipios-cards");
    if (cards) {
      cards.addEventListener("click", function (event) {
        var card = event.target.closest(".m-card");
        if (card) openModal(card.getAttribute("data-id"));
      });
    }

    var pagination = $("pagination");
    if (pagination) {
      pagination.addEventListener("click", function (event) {
        var button = event.target.closest("[data-page]");
        if (!button) return;
        var value = button.getAttribute("data-page");
        var totalPages = Math.max(1, Math.ceil(filtered.length / CFG.PAGE_SIZE));
        if (value === "prev") state.page = Math.max(1, state.page - 1);
        else if (value === "next") state.page = Math.min(totalPages, state.page + 1);
        else state.page = Number(value) || 1;
        update();
      });
    }
  }

  /* ------------------------------- Modal ---------------------------------- */
  function openModal(id) {
    var mun = D.byId[String(id)];
    if (!mun) return;

    var modal = $("municipio-modal");
    var content = $("modal-content");
    if (!modal || !content) return;

    lastFocused = document.activeElement;
    modal.dataset.municipioId = String(mun.id);

    var pop2010 = mun.pop2010Censo == null
      ? "n/d"
      : F.fmtInt(mun.pop2010Censo);

    var apiUrl = "https://servicodados.ibge.gov.br/api/v3/agregados/4709/periodos/2022/" +
      "variaveis/93|5936|10605?localidades=N6[" + mun.id + "]";

    content.innerHTML =
      '<div class="modal__head">' +
      '<p class="eyebrow">Detalhe municipal</p>' +
      '<h2 id="modal-title">' + F.escapeHtml(mun.nome) + "</h2>" +
      '<p class="modal__subtitle">' + F.escapeHtml(mun.uf) + " · " +
      F.escapeHtml(mun.regiao) +
      (mun.regiaoImediata ? " · Região imediata de " + F.escapeHtml(mun.regiaoImediata) : "") +
      "</p></div>" +
      '<div class="modal__stats">' +
      '<div class="modal-stat"><span class="modal-stat__label">População 2022</span><span class="modal-stat__value">' +
      F.fmtInt(mun.pop2022) + "</span></div>" +
      '<div class="modal-stat"><span class="modal-stat__label">População 2010</span><span class="modal-stat__value">' +
      pop2010 + "</span></div>" +
      '<div class="modal-stat"><span class="modal-stat__label">Variação absoluta</span><span class="modal-stat__value">' +
      F.fmtSignedInt(mun.varAbs) + "</span></div>" +
      '<div class="modal-stat"><span class="modal-stat__label">Taxa anual</span><span class="modal-stat__value">' +
      F.fmtSignedPct(mun.taxaAnual, 2) + "</span></div>" +
      '<div class="modal-stat"><span class="modal-stat__label">Densidade 2022</span><span class="modal-stat__value">' +
      F.fmtDensity(mun.densidade2022) + " hab/km²</span></div>" +
      '<div class="modal-stat"><span class="modal-stat__label">Área territorial</span><span class="modal-stat__value">' +
      mun.areaKm2.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 }) +
      " km²</span></div>" +
      "</div>" +
      '<div class="modal__chart-wrap"><canvas id="modal-chart" role="img" aria-label="População de ' +
      F.escapeHtml(mun.nome) + " em 2010 e 2022\"></canvas></div>" +
      '<p class="modal__note"><strong>' + F.escapeHtml(mun.growthLabel) + "</strong> · " +
      F.escapeHtml(mun.sizeLabel) + ". A população de 2010 é a base compatibilizada pelo IBGE " +
      "(população de 2022 menos a variação absoluta). Crescimento de " +
      F.fmtSignedPct(mun.varRel, 2) + " no período.</p>" +
      '<div class="modal__actions">' +
      '<a class="btn btn--secondary btn--sm" href="' + apiUrl + '" target="_blank" rel="noopener">Consulta na API do IBGE</a>' +
      '<a class="btn btn--ghost btn--sm" href="https://sidra.ibge.gov.br/tabela/4709" target="_blank" rel="noopener">SIDRA 4709</a>' +
      "</div>";

    modal.hidden = false;
    document.body.classList.add("modal-open");

    var close = modal.querySelector(".modal__close");
    if (close) close.focus();

    window.requestAnimationFrame(function () {
      window.CENSO.charts.renderMunicipioChart(mun, "modal-chart");
    });
  }

  function closeModal() {
    var modal = $("municipio-modal");
    if (!modal || modal.hidden) return;
    modal.hidden = true;
    modal.removeAttribute("data-municipio-id");
    document.body.classList.remove("modal-open");
    window.CENSO.charts.destroy("modal-chart");
    if (lastFocused && typeof lastFocused.focus === "function") lastFocused.focus();
    lastFocused = null;
  }

  function initModal() {
    var modal = $("municipio-modal");
    if (!modal) return;

    modal.addEventListener("click", function (event) {
      if (event.target.closest("[data-close-modal]")) closeModal();
    });

    document.addEventListener("keydown", function (event) {
      if (modal.hidden) return;

      if (event.key === "Escape") {
        event.preventDefault();
        closeModal();
        return;
      }

      if (event.key !== "Tab") return;

      var focusables = modal.querySelectorAll(
        'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (!focusables.length) return;
      var first = focusables[0];
      var last = focusables[focusables.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });
  }

  /* ------------------------------ Rankings -------------------------------- */
  function renderRankList(id, items, valueFormatter) {
    var container = $(id);
    if (!container) return;
    container.innerHTML = items.map(function (mun, index) {
      return "<li>" +
        '<span class="rank-list__pos">' + String(index + 1).padStart(2, "0") + "</span>" +
        '<span class="rank-list__main"><strong>' + F.escapeHtml(mun.nome) + "</strong>" +
        "<span>" + F.escapeHtml(mun.uf) + " · " + F.fmtInt(mun.pop2022) + " hab.</span></span>" +
        '<span class="rank-list__value">' + valueFormatter(mun) + "</span>" +
        "</li>";
    }).join("");
  }

  function renderRanks() {
    renderRankList("rank-absolute", D.rankings.absoluteGain, function (mun) {
      return F.fmtSignedInt(mun.varAbs);
    });
    renderRankList("rank-growth", D.rankings.growth, function (mun) {
      return F.fmtSignedPct(mun.taxaAnual, 2);
    });
    renderRankList("rank-decline", D.rankings.decline, function (mun) {
      return F.fmtSignedPct(mun.taxaAnual, 2);
    });
  }

  /* ------------------------------ Quadrantes ------------------------------ */
  function renderQuadrants() {
    var container = $("quadrant-grid");
    if (!container) return;

    container.innerHTML = D.quadrants.map(function (quadrant) {
      var examples = quadrant.examples.map(function (mun) {
        return "<li><strong>" + F.escapeHtml(mun.nome) + "/" + mun.uf + "</strong>" +
          "<span>" + F.fmtSignedInt(mun.varAbs) + "</span></li>";
      }).join("");

      return '<article class="quadrant quadrant--' + quadrant.key + '">' +
        '<span class="quadrant__eyebrow">' + F.escapeHtml(quadrant.label) + "</span>" +
        '<strong class="quadrant__count">' + F.fmtInt(quadrant.count) + "</strong>" +
        '<span class="quadrant__share">' + F.fmtPct(quadrant.share, 1) +
        " dos municípios · " + F.fmtInt(quadrant.pop2022) + " hab.</span>" +
        '<p class="quadrant__desc">' + F.escapeHtml(quadrant.description) + "</p>" +
        (examples ? '<ul class="quadrant__examples">' + examples + "</ul>" : "") +
        "</article>";
    }).join("");
  }

  /* -------------------------------- Fontes -------------------------------- */
  function renderSources() {
    var container = $("source-list");
    if (!container) return;
    container.innerHTML = CFG.SOURCES.map(function (source) {
      return "<li><a href=\"" + source.url + "\" target=\"_blank\" rel=\"noopener\">" +
        F.escapeHtml(source.name) + "</a><span>" + F.escapeHtml(source.detail) + "</span></li>";
    }).join("");
  }

  function renderProvenance() {
    var node = $("provenance-text");
    if (!node) return;
    var checksum = String(D.meta.checksumMunicipiosSha256 || "").slice(0, 16);
    var passed = D.validation.filter(function (item) { return item.ok; }).length;
    node.innerHTML = "Snapshot gerado em <strong>" + F.fmtDate(D.meta.geradoEm) +
      "</strong> a partir de quatro consultas oficiais. Universo de <strong>" +
      F.fmtInt(D.national.municipios) + " municípios</strong>; população de 2022 = <strong>" +
      F.fmtInt(D.national.pop2022) + "</strong> e base de 2010 = <strong>" +
      F.fmtInt(D.national.pop2010) + "</strong>. Checksum SHA-256 do snapshot: <code>" +
      F.escapeHtml(checksum) + "…</code>. Verificações aprovadas: <strong>" +
      passed + "/" + D.validation.length + "</strong>.";
  }

  /* ------------------------------- Exportar ------------------------------- */
  function csvEscape(value) {
    var text = String(value == null ? "" : value);
    if (/[;"\n\r]/.test(text)) return '"' + text.replace(/"/g, '""') + '"';
    return text;
  }

  function decimal(value, digits) {
    return Number(value).toFixed(digits).replace(".", ",");
  }

  function exportCsv() {
    var rows = filtered.length ? filtered : D.municipios;
    var header = [
      "id", "municipio", "uf", "regiao", "regiao_imediata",
      "pop_2010_censo", "pop_2010_compatibilizada", "pop_2022",
      "variacao_absoluta", "variacao_relativa_pct", "taxa_anual_pct",
      "area_km2", "densidade_2010", "densidade_2022"
    ];

    var lines = [header.join(";")];
    rows.forEach(function (mun) {
      lines.push([
        mun.id,
        csvEscape(mun.nome),
        mun.uf,
        csvEscape(mun.regiao),
        csvEscape(mun.regiaoImediata || ""),
        mun.pop2010Censo == null ? "" : mun.pop2010Censo,
        mun.pop2010Compat,
        mun.pop2022,
        mun.varAbs,
        decimal(mun.varRel, 2),
        decimal(mun.taxaAnual, 2),
        decimal(mun.areaKm2, 2),
        decimal(mun.densidade2010, 2),
        decimal(mun.densidade2022, 2)
      ].join(";"));
    });

    var blob = new Blob(["\ufeff" + lines.join("\r\n")], { type: "text/csv;charset=utf-8" });
    var url = URL.createObjectURL(blob);
    var link = document.createElement("a");
    var stamp = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.download = "municipios-censo-" + stamp + ".csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.setTimeout(function () { URL.revokeObjectURL(url); }, 1000);

    showToast(F.fmtInt(rows.length) + " municípios exportados em CSV.", "success");
  }

  /* -------------------------------- Toast --------------------------------- */
  function showToast(message, type) {
    var toast = $("toast");
    if (!toast) return;
    toast.textContent = message;
    toast.className = "toast is-visible" + (type ? " toast--" + type : "");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () {
      toast.className = "toast";
    }, 5000);
  }

  /* --------------------------- Conferência na API ------------------------- */
  function initApiCheck() {
    var button = $("refresh-data");
    if (!button) return;

    button.addEventListener("click", function () {
      var original = button.textContent;
      button.disabled = true;
      button.textContent = "Conferindo…";

      var controller = "AbortController" in window ? new AbortController() : null;
      var timer = controller
        ? window.setTimeout(function () { controller.abort(); }, 45000)
        : null;

      fetch(CFG.API_CHECK_URL, {
        headers: { Accept: "application/json" },
        signal: controller ? controller.signal : undefined
      })
        .then(function (response) {
          if (!response.ok) throw new Error("HTTP " + response.status);
          return response.json();
        })
        .then(function (payload) {
          var variable = payload[0];
          if (!variable || !variable.resultados || !variable.resultados[0]) {
            throw new Error("Resposta inesperada da API.");
          }
          var series = variable.resultados[0].series || [];
          var total = 0;
          var count = 0;
          series.forEach(function (item) {
            var value = Number(item.serie && item.serie["2022"]);
            if (isFinite(value)) {
              total += value;
              count++;
            }
          });

          var matches = count === D.national.municipios && total === D.national.pop2022;
          if (matches) {
            showToast("API conferida: " + F.fmtInt(count) + " municípios e " +
              F.fmtInt(total) + " habitantes em 2022, iguais ao snapshot local.", "success");
          } else {
            showToast("A API retornou " + F.fmtInt(count) + " municípios e " +
              F.fmtInt(total) + " habitantes. O snapshot local foi mantido; " +
              "rode o pipeline para atualizar.", "error");
          }
        })
        .catch(function (error) {
          var message = error && error.name === "AbortError"
            ? "A consulta à API excedeu o tempo limite."
            : "Não foi possível consultar a API agora. O snapshot local continua válido.";
          showToast(message, "error");
        })
        .then(function () {
          if (timer) window.clearTimeout(timer);
          button.disabled = false;
          button.textContent = original;
        });
    });
  }

  /* -------------------------------- Update -------------------------------- */
  function update() {
    computeFiltered();
    var totalPages = Math.max(1, Math.ceil(filtered.length / CFG.PAGE_SIZE));
    if (state.page > totalPages) state.page = totalPages;
    renderCount();
    renderTable();
    renderPagination();
    renderSortState();
  }

  /* --------------------------------- Init --------------------------------- */
  function init() {
    initTheme();
    initNavigation();
    initFilters();
    initTable();
    initModal();
    initApiCheck();

    renderHero();
    renderKpis();
    renderInsights();
    renderSources();
    renderRanks();
    renderQuadrants();
    renderProvenance();
    update();

    var exportButton = $("export-csv");
    if (exportButton) exportButton.addEventListener("click", exportCsv);

    window.CENSO.charts.renderAll();

    if (!D.validationOk) {
      var failures = D.validation.filter(function (item) { return !item.ok; });
      console.error("Validação do snapshot falhou:", failures);
      showToast("Atenção: o snapshot não passou em todas as verificações. Consulte o console.", "error");
    } else {
      console.info(
        "Snapshot IBGE validado: " + F.fmtInt(D.national.municipios) +
        " municípios, " + F.fmtInt(D.national.pop2022) + " habitantes em 2022."
      );
    }
  }

  window.CENSO = window.CENSO || {};
  window.CENSO.ui = {
    init: init,
    update: update,
    showToast: showToast,
    openModal: openModal,
    closeModal: closeModal,
    state: state
  };
})();
