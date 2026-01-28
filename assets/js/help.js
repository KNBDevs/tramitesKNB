export async function initHelp() {
    // Cargar el HTML del modal solo una vez
    if (!document.getElementById("help-modal")) {
        const res = await fetch("views/help.html");
        const html = await res.text();
        document.body.insertAdjacentHTML("beforeend", html);
    }

    const helpToggle = document.getElementById("help-toggle");
    const helpModal = document.getElementById("help-modal");
    const closeButtons = helpModal.querySelectorAll("[data-help-close]");

    helpToggle.addEventListener("click", () => {
        helpModal.classList.remove("hidden");
        helpModal.classList.add("flex");
        document.body.classList.add("modal-open");
    });


    closeButtons.forEach(btn => {
        btn.addEventListener("click", closeHelp);
    });

    helpModal.addEventListener("click", e => {
        if (e.target === helpModal) closeHelp();
    });

    function closeHelp() {
        helpModal.classList.add("hidden");
        helpModal.classList.remove("flex");
        document.body.classList.remove("modal-open");
    }

}
