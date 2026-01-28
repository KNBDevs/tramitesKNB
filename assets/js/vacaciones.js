export function initVacaciones() {
    const fechaAlta = document.getElementById("fechaAlta");
    const fechaCalculo = document.getElementById("fechaCalculo");
    const hastaHoy = document.getElementById("hastaHoy");
    const vacacionesDisfrutadasInput = document.getElementById("vacacionesDisfrutadas");

    const resultado = document.getElementById("resultado");
    const diasTrabajadosEl = document.getElementById("diasTrabajados");
    const vacacionesExactasEl = document.getElementById("vacacionesExactas");
    const vacacionesDisfrutadasEl = document.getElementById("vacacionesDisfrutadasResultado");
    const vacacionesDisponiblesEl = document.getElementById("vacacionesDisponibles");

    if (!fechaAlta) return;

    function calcular() {
        if (!fechaAlta.value) {
            resultado.classList.add("hidden");
            return;
        }

        const inicio = new Date(fechaAlta.value);
        const fin = hastaHoy.checked
            ? new Date()
            : fechaCalculo.value
                ? new Date(fechaCalculo.value)
                : null;

        if (!fin || fin < inicio) {
            resultado.classList.add("hidden");
            return;
        }

        // Normalizar horas para evitar desfases por zona horaria
        inicio.setHours(0, 0, 0, 0);
        fin.setHours(0, 0, 0, 0);

        const diffMs = fin - inicio;
        const diasTrabajados = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        const vacacionesGeneradas = diasTrabajados * (2.5 / 30);

        const disfrutadas = parseFloat(vacacionesDisfrutadasInput.value) || 0;
        const disponibles = Math.max(vacacionesGeneradas - disfrutadas, 0);

        diasTrabajadosEl.textContent = diasTrabajados;
        vacacionesExactasEl.textContent = Math.floor(vacacionesGeneradas);
        vacacionesDisfrutadasEl.textContent = disfrutadas.toFixed(2);
        vacacionesDisponiblesEl.textContent = disponibles.toFixed(2);

        resultado.classList.remove("hidden");
    }

    // ------------------------------
    // Checkbox "Hasta hoy"
    // ------------------------------
    hastaHoy.addEventListener("change", () => {
        if (hastaHoy.checked) {
            fechaCalculo.value = "";
            fechaCalculo.disabled = true;
            fechaCalculo.classList.add("opacity-50");
        } else {
            fechaCalculo.disabled = false;
            fechaCalculo.classList.remove("opacity-50");
        }
        calcular();
    });

    // ------------------------------
    // Recalcular en tiempo real
    // ------------------------------
    fechaAlta.addEventListener("change", calcular);
    fechaCalculo.addEventListener("change", calcular);
    vacacionesDisfrutadasInput.addEventListener("input", calcular);
}
