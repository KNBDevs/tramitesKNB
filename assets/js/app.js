import { initHelp } from "./help.js";

const content = document.getElementById("content");
const tabs = document.querySelectorAll(".tab");

async function loadView(view) {
    const res = await fetch(`views/${view}.html`);
    const html = await res.text();
    content.innerHTML = html;

    // ==============================
    // Inicialización por vista
    // ==============================

    if (view === "altas") {
        import("./altas.js").then(module => {
            module.initAltas();
        });
    }

    if (view === "bajas") {
        import("./bajas.js").then(module => {
            module.initBajas();
        });
    }

    if (view === "cambio-jornada") {
        import("./cambio-jornada.js").then(module => {
            module.initCambioJornada();
        });
    }

    if (view === "incidencias") {
        import("./incidencias.js").then(module => {
            module.initIncidencias();
        });
    }

    if (view === "sanciones") {
        import("./sanciones.js").then(module => {
            module.initSanciones();
        });
    }

    if (view === "consultas") {
        import("./consultas.js").then(module => {
            module.initConsultas();
        });
    }

    // ✅ NUEVA VISTA: VACACIONES
    if (view === "vacaciones") {
        import("./vacaciones.js").then(module => {
            module.initVacaciones();
        });
    }
}

tabs.forEach(tab => {
    tab.addEventListener("click", () => {
        tabs.forEach(t => t.classList.remove("active"));
        tab.classList.add("active");
        loadView(tab.dataset.view);
    });
});

// ==============================
// Inicialización global
// ==============================
initHelp();

// Carga inicial
loadView("altas");
