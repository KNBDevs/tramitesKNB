import { sendMail } from "./mailer.js";

/* =======================================================
   INIT CAMBIO JORNADA (NO TOCAR)
======================================================= */

export function initCambioJornada() {
  const form = document.getElementById("cambio-jornada-form");
  const enviarBtn = document.getElementById("enviar");
  if (!form) return;

  const fechaCambio = document.getElementById("fechaCambio");
  const tipoSalario = document.getElementById("tipoSalario");
  const salarioNeto = document.getElementById("salarioNeto");

  const horarioGrid = document.getElementById("horario-semanal");
  const selectsHorario = [...horarioGrid.querySelectorAll("select")];

  const requiredInputs = form.querySelectorAll("input[required], select[required]");

  fechaCambio.addEventListener("change", () => {
    descargarDocumento("doc_cambiojornada.docx");
    validarFormulario();
  });

  tipoSalario.addEventListener("change", () => {
    if (tipoSalario.value === "neto") {
      salarioNeto.disabled = false;
      salarioNeto.required = true;
    } else {
      salarioNeto.disabled = true;
      salarioNeto.required = false;
      salarioNeto.value = "";
    }
    validarFormulario();
  });

  selectsHorario.forEach(sel => generarOpciones(sel));

  selectsHorario.forEach((sel, index) => {
    sel.addEventListener("change", () => {
      const col = index % 7;
      const diaSelects = selectsHorario.filter((_, i) => i % 7 === col);

      if (sel.value === "DESCANSO") {
        diaSelects.forEach(s => {
          s.value = "DESCANSO";
          s.dataset.descanso = "true";
        });
      } else {
        const estaba = diaSelects.some(s => s.dataset.descanso === "true");
        if (estaba) {
          diaSelects.forEach(s => {
            s.value = "";
            delete s.dataset.descanso;
          });
        }
      }
      validarFormulario();
    });
  });

  requiredInputs.forEach(el => {
    el.addEventListener("input", validarFormulario);
    el.addEventListener("change", validarFormulario);
  });

  function validarFormulario() {
    const valido = [...requiredInputs].every(el => {
      if (el.disabled) return true;
      if (el.type === "file") return el.files.length > 0;
      return el.value.trim() !== "";
    });
    enviarBtn.disabled = !valido;
  }
}

/* =======================================================
   INCIDENCIAS
======================================================= */

export function initIncidencias() {
  const tipo = document.getElementById("tipoIncidencia");
  const form = document.getElementById("incidencia-form");
  const enviarBtn = document.getElementById("enviar");
  if (!tipo || !form || !enviarBtn) return;

  enviarBtn.disabled = true;

  const bloques = {
    anticipo: document.getElementById("bloque-anticipo"),
    prestamo: document.getElementById("bloque-prestamo"),
    vacaciones: document.getElementById("bloque-vacaciones"),
    baja: document.getElementById("bloque-baja"),
    absentismo: document.getElementById("bloque-absentismo"),
  };

  const prestamoTotal = document.getElementById("prestamo-total");
  const prestamoCuota = document.getElementById("prestamo-cuota");
  const prestamoMeses = document.getElementById("prestamo-meses");

  function calcularMesesPrestamo() {
    const total = parseFloat(prestamoTotal?.value);
    const cuota = parseFloat(prestamoCuota?.value);
    prestamoMeses.value = total > 0 && cuota > 0 ? Math.ceil(total / cuota) : "";
  }

  prestamoTotal?.addEventListener("input", calcularMesesPrestamo);
  prestamoCuota?.addEventListener("input", calcularMesesPrestamo);

  function ocultarTodos() {
    Object.values(bloques).forEach(b => {
      if (!b) return;
      desactivarRequired(b);
      b.classList.add("hidden");
    });
  }

  function validarFormulario() {
    const visibles = form.querySelectorAll("input[required], select[required], textarea[required]");
    const valido = [...visibles].every(el => {
      if (el.closest(".hidden")) return true;
      if (el.type === "file") return el.files.length > 0;
      return el.value.trim() !== "";
    });
    enviarBtn.disabled = !valido;
  }

  tipo.addEventListener("change", () => {
    ocultarTodos();
    const bloque = bloques[tipo.value];
    if (bloque) {
      bloque.classList.remove("hidden");
      activarRequired(bloque);
    }
    validarFormulario();
  });

  form.addEventListener("input", validarFormulario);
  form.addEventListener("change", validarFormulario);

  /* =========================
     ENVÍO
  ========================= */

  form.addEventListener("submit", async e => {
    e.preventDefault();
    enviarBtn.disabled = true;

    const files = recogerAdjuntosVisibles(form);
    const body = construirMensajeIncidencia(tipo.value);

    try {
      await sendMail({
        subject: `Incidencia laboral - ${tipo.value === "baja"
            ? "absentismo/incapacidad"
            : tipo.value
          }`,
        body,
        files
      });

      mostrarConfirmacionIncidencia();

      form.reset();
      ocultarTodos();
      enviarBtn.disabled = true;
    } catch (err) {
      mostrarErrorIncidencia(
        err?.message || "Error al enviar la incidencia. Inténtalo de nuevo."
      );
      enviarBtn.disabled = false;
    }

  });

  ocultarTodos();
}

/* =======================================================
   MENSAJE INCIDENCIA (COMPLETO POR TIPO)
======================================================= */
function construirMensajeIncidencia(tipo) {

  const naf = [
    document.getElementById("naf1").value,
    document.getElementById("naf2").value,
    document.getElementById("naf3").value
  ].join("");

  const base = `
INCIDENCIA LABORAL

Empresa: ${document.getElementById("empresa").value}
Fecha: ${document.getElementById("fecha").value}

Trabajador: ${document.getElementById("apellidos").value}, ${document.getElementById("nombre").value}
NIF: ${document.getElementById("nif").value}
NAF: ${naf}

Tipo de incidencia: ${tipo === "baja"
      ? "INCAPACIDAD / BAJA MÉDICA"
      : tipo === "absentismo"
        ? "ABSENTISMO"
        : tipo.toUpperCase()
    }

`;

  if (tipo === "anticipo") {
    const importe = document.querySelector(
      "#bloque-anticipo input[type='number']"
    )?.value || "No informado";

    return base + `
------------------------------------------
DETALLE ANTICIPO
------------------------------------------

Cuantía solicitada: ${importe} €
`;
  }

  if (tipo === "prestamo") {
    return base + `
------------------------------------------
DETALLE PRÉSTAMO
------------------------------------------

Importe total: ${document.getElementById("prestamo-total").value} €
Cuota mensual: ${document.getElementById("prestamo-cuota").value} €
Meses devolución: ${document.getElementById("prestamo-meses").value}
`;
  }

  if (tipo === "vacaciones") {
    const fechas = document.querySelectorAll(
      "#bloque-vacaciones input[type='date']"
    );
    return base + `
------------------------------------------
VACACIONES
------------------------------------------

Inicio: ${fechas[0].value}
Fin: ${fechas[1].value}
`;
  }

  if (tipo === "baja") {
    const fecha = document.querySelector(
      "#bloque-baja input[type='date']"
    ).value;

    return base + `
------------------------------------------
INCAPACIDAD / BAJA MÉDICA
------------------------------------------

Inicio de la incapacidad / ausencia: ${fecha}
`;
  }

  if (tipo === "absentismo") {
    const fecha = document.querySelector(
      "#bloque-absentismo input[type='date']"
    ).value;

    const obs = document.querySelector(
      "#bloque-absentismo textarea"
    ).value || "Sin observaciones";

    return base + `
------------------------------------------
ABSENTISMO
------------------------------------------

Fecha(s): ${fecha}
Observaciones:
${obs}
`;
  }

  return base;
}


function mostrarConfirmacionIncidencia() {
  const isDark = document.body.classList.contains("dark");

  const modal = document.createElement("div");
  modal.style.position = "fixed";
  modal.style.inset = "0";
  modal.style.background = "rgba(0,0,0,0.6)";
  modal.style.display = "flex";
  modal.style.alignItems = "center";
  modal.style.justifyContent = "center";
  modal.style.zIndex = "9999";

  modal.style.setProperty(
    "--modal-bg",
    isDark ? "#0f172a" : "#ffffff"
  );
  modal.style.setProperty(
    "--modal-text",
    isDark ? "#e5e7eb" : "#111827"
  );

  modal.innerHTML = `
    <div style="
      background: var(--modal-bg);
      color: var(--modal-text);
      padding:32px;
      border-radius:12px;
      max-width:480px;
      width:90%;
      text-align:center;
      box-shadow:0 10px 40px rgba(0,0,0,0.3);
    ">
      <p style="
        margin-bottom:24px;
        font-size:16px;
        line-height:1.4;
      ">
        Incidencia enviada correctamente.
      </p>

      <button id="cerrarIncidenciaOkBtn"
        style="
          background:#2563eb;
          color:white;
          padding:12px 20px;
          border-radius:8px;
          border:none;
          cursor:pointer;
          font-size:15px;
          width:100%;
        ">
        Aceptar
      </button>
    </div>
  `;

  document.body.appendChild(modal);

  document
    .getElementById("cerrarIncidenciaOkBtn")
    .addEventListener("click", () => {
      modal.remove();
    });
}


function mostrarErrorIncidencia(mensaje) {
  const isDark = document.body.classList.contains("dark");

  const modal = document.createElement("div");
  modal.style.position = "fixed";
  modal.style.inset = "0";
  modal.style.background = "rgba(0,0,0,0.6)";
  modal.style.display = "flex";
  modal.style.alignItems = "center";
  modal.style.justifyContent = "center";
  modal.style.zIndex = "9999";

  modal.style.setProperty(
    "--modal-bg",
    isDark ? "#0f172a" : "#ffffff"
  );
  modal.style.setProperty(
    "--modal-text",
    isDark ? "#e5e7eb" : "#111827"
  );

  modal.innerHTML = `
    <div style="
      background: var(--modal-bg);
      color: var(--modal-text);
      padding:32px;
      border-radius:12px;
      max-width:480px;
      width:90%;
      text-align:center;
      box-shadow:0 10px 40px rgba(0,0,0,0.3);
    ">
      <p style="
        margin-bottom:24px;
        font-size:16px;
        line-height:1.4;
      ">
        ${mensaje || "Error al enviar la incidencia. Inténtalo de nuevo."}
      </p>

      <button id="cerrarIncidenciaErrorBtn"
        style="
          background:#dc2626;
          color:white;
          padding:12px 20px;
          border-radius:8px;
          border:none;
          cursor:pointer;
          font-size:15px;
          width:100%;
        ">
        Aceptar
      </button>
    </div>
  `;

  document.body.appendChild(modal);

  document
    .getElementById("cerrarIncidenciaErrorBtn")
    .addEventListener("click", () => {
      modal.remove();
    });
}



/* =======================================================
   UTILIDADES
======================================================= */

function recogerAdjuntosVisibles(form) {
  const files = [];
  form.querySelectorAll("input[type='file']").forEach(input => {
    if (input.files && input.files.length > 0 && !input.closest(".hidden")) {
      files.push(input.files[0]);
    }
  });
  return files;
}

function desactivarRequired(bloque) {
  bloque.querySelectorAll("[required]").forEach(el => {
    el.dataset.required = "true";
    el.removeAttribute("required");
  });
}

function activarRequired(bloque) {
  bloque.querySelectorAll("[data-required]").forEach(el => {
    el.setAttribute("required", "required");
    delete el.dataset.required;
  });
}

function generarOpciones(select) {
  select.innerHTML = `<option value=""></option><option value="DESCANSO">Descanso</option>`;
  for (let h = 0; h < 24; h++) {
    const v = `${String(h).padStart(2, "0")}:00`;
    select.innerHTML += `<option value="${v}">${v}</option>`;
  }
}

function descargarDocumento(nombreArchivo) {
  const link = document.createElement("a");
  link.href = `../docs/${nombreArchivo}`;
  link.download = nombreArchivo;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
