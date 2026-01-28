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

// ==============================
// Responsive burger menu (PRO)
// ==============================

const burgerToggle = document.getElementById("burger-toggle");
const navTabs = document.getElementById("nav-tabs");

let menuOpen = false;

function openMenu() {
    navTabs.classList.remove("hidden");
    menuOpen = true;
}

function closeMenu() {
    navTabs.classList.add("hidden");
    menuOpen = false;
}

function isMobile() {
    return window.innerWidth < 768;
}

if (burgerToggle && navTabs) {

    // Toggle burger
    burgerToggle.addEventListener("click", (e) => {
        e.stopPropagation();
        menuOpen ? closeMenu() : openMenu();
    });

    navTabs.addEventListener("click", (e) => {
        e.stopPropagation();
    });

    // Click fuera → cerrar
    document.addEventListener("click", (e) => {
        if (
            menuOpen &&
            isMobile() &&
            !navTabs.contains(e.target) &&
            !burgerToggle.contains(e.target)
        ) {
            closeMenu();
        }
    });

    // Click en una tab → cerrar en móvil
    tabs.forEach(tab => {
        tab.addEventListener("click", () => {
            if (isMobile()) closeMenu();
        });
    });

    // Cambio de tamaño → cerrar siempre
    window.addEventListener("resize", () => {
        closeMenu();
    });
}
