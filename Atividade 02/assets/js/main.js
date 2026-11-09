/* ==========================================================================
   main.js — ponto de entrada da aplicação
   ========================================================================== */
(function () {
  "use strict";

  function boot() {
    if (!window.CENSO || !window.CENSO.ui) {
      console.error("Módulos da aplicação não carregaram corretamente.");
      return;
    }
    window.CENSO.ui.init();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
