import { sendMail } from "./mailer.js";

const SKELLO_URL =
  "https://app.skello.io/users/sign_in?lang=es&_gl=1*1yo8e88*FPAU*NjIzMjc3MTEzLjE3NjYwNDk0ODE.*_fplc*N1plbEtyMEhzQWV1TEN0WVVUVVRHbU1VWG93SmhodUpBcnRUSGtPMVptSmJLSiUyQlZjJTJCb2tqR0FvdjNuWFhvN05NVkxUYlltSWlta2x1NkJzRzBpeWJpTHhZSHlUSnk1YjElMkJSUWtDeUQ4RlF6NWU1Tnp3a1h6eTZUNlN2amZnJTNEJTNE";

/* =======================================================
   CAMBIO DE JORNADA
======================================================= */

export function initCambioJornada() {
  const form = document.getElementById("cambio-jornada-form");
  const enviarBtn = document.getElementById("enviar");

  const fechaCambio = document.getElementById("fechaCambio");
  const tipoSalario = document.getElementById("tipoSalario");
  const salarioNeto = document.getElementById("salarioNeto");
  const docCambioInput = document.getElementById("docCambio");

  const horarioGrid = document.getElementById("horario-semanal");

  if (!form || !fechaCambio || !horarioGrid) return;

  const selectsHorario = [...horarioGrid.querySelectorAll("select")];

  const requiredInputs = form.querySelectorAll(
    "input[required], select[required]"
  );

  /* ==============================
     OPCIONES HORARIO (IGUAL QUE ALTAS)
  ============================== */
  selectsHorario.forEach(sel => generarOpciones(sel));

  /* ==============================
     DESCANSO POR DÍA (SINCRONIZADO)
  ============================== */
  selectsHorario.forEach((sel, index) => {
    sel.addEventListener("change", () => {
      const col = index % 7;
      const diaSelects = selectsHorario.filter((_, i) => i % 7 === col);

      if (sel.value === "DESCANSO") {
        diaSelects.forEach(s => {
          s.value = "DESCANSO";
          s.classList.add("bg-red-50", "text-red-600");
          s.dataset.descanso = "true";
        });
      } else {
        const estabaDescanso = diaSelects.some(
          s => s.dataset.descanso === "true"
        );

        if (estabaDescanso) {
          diaSelects.forEach(s => {
            s.value = "";
            s.classList.remove("bg-red-50", "text-red-600");
            delete s.dataset.descanso;
          });
        }
      }

      validarFormulario();
    });
  });

  /* ==============================
     DESCARGA DOC AL SELECCIONAR FECHA
  ============================== */
  fechaCambio.addEventListener("change", () => {
    const link = document.createElement("a");
    link.href = "../docs/doc_cambiojornada.docx";
    link.download = "doc_cambiojornada.docx";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    validarFormulario();
  });

  /* ==============================
     SALARIO NETO
  ============================== */
  tipoSalario.addEventListener("change", () => {
    if (tipoSalario.value === "neto") {
      salarioNeto.disabled = false;
      salarioNeto.required = true;
      salarioNeto.focus();
    } else {
      salarioNeto.disabled = true;
      salarioNeto.required = false;
      salarioNeto.value = "";
    }

    validarFormulario();
  });

  /* ==============================
     VALIDACIÓN GENERAL
  ============================== */
  requiredInputs.forEach(el => {
    el.addEventListener("input", validarFormulario);
    el.addEventListener("change", validarFormulario);
  });

  function validarFormulario() {
    let valido = true;

    requiredInputs.forEach(el => {
      if (el.disabled) return;

      if (el.type === "file") {
        if (!el.files || el.files.length === 0) valido = false;
      } else {
        if (!el.value.trim()) valido = false;
      }
    });

    // ⬇️ VALIDACIÓN REAL DEL HORARIO
    if (!horarioEsValido(selectsHorario)) {
      valido = false;
    }

    enviarBtn.disabled = !valido;
  }


  /* ==============================
     ENVÍO
  ============================== */
  form.addEventListener("submit", async e => {
    e.preventDefault();
    enviarBtn.disabled = true;

    const data = recogerDatos(selectsHorario);

    const files = [];
    if (docCambioInput.files && docCambioInput.files.length > 0) {
      files.push(docCambioInput.files[0]);
    }

    try {
      await sendMail({
        subject: `Cambio de jornada - ${data.apellidos}, ${data.nombre}`,
        body: construirMensaje(data),
        files
      });

      mostrarConfirmacionSkello();

      form.reset();
      enviarBtn.disabled = true;
    } catch (err) {
      mostrarErrorComunicacion(
        err?.message || "Error al enviar la comunicación. Inténtalo de nuevo."
      );
      enviarBtn.disabled = false;
    }

  });
}

/* =======================================================
   RECOGER DATOS
======================================================= */

function recogerDatos(selectsHorario) {
  return {
    empresa: document.getElementById("empresa").value.trim(),
    fechaCambio: document.getElementById("fechaCambio").value,
    apellidos: document.getElementById("apellidos").value.trim(),
    nombre: document.getElementById("nombre").value.trim(),
    nif: document.getElementById("nif").value.trim(),
    tipoSalario: document.getElementById("tipoSalario").value,
    salarioNeto:
      document.getElementById("tipoSalario").value === "neto"
        ? document.getElementById("salarioNeto").value
        : "No aplica",
    horario: obtenerHorarioTexto(selectsHorario)
  };
}

/* =======================================================
   MENSAJE EMAIL
======================================================= */

function construirMensaje(data) {
  return `
COMUNICACIÓN DE CAMBIO DE JORNADA

--------------------------------------------------
DATOS GENERALES
--------------------------------------------------

Empresa: ${data.empresa}
Fecha de inicio del cambio: ${data.fechaCambio}

--------------------------------------------------
DATOS DEL TRABAJADOR
--------------------------------------------------

Apellidos: ${data.apellidos}
Nombre: ${data.nombre}
NIF: ${data.nif}

--------------------------------------------------
CONDICIONES SALARIALES
--------------------------------------------------

Tipo de salario: ${data.tipoSalario}
Salario neto: ${data.salarioNeto}

--------------------------------------------------
NUEVO HORARIO
--------------------------------------------------

${data.horario}
`;
}

/* =======================================================
   MODAL CONFIRMACIÓN SKELLO
======================================================= */

function mostrarConfirmacionSkello() {
  const isDark = document.body.classList.contains("dark");

  const modal = document.createElement("div");
  modal.style.position = "fixed";
  modal.style.inset = "0";
  modal.style.background = "rgba(0,0,0,0.6)";
  modal.style.display = "flex";
  modal.style.alignItems = "center";
  modal.style.justifyContent = "center";
  modal.style.zIndex = "9999";

  modal.style.setProperty("--modal-bg", isDark ? "#0f172a" : "#ffffff");
  modal.style.setProperty("--modal-text", isDark ? "#e5e7eb" : "#111827");

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
      <p style="margin-bottom:24px;font-size:16px;">
        Comunicación de cambio de jornada enviada correctamente.
      </p>

      <button id="cerrarModalBtn"
        style="
          background:transparent;
          color:var(--modal-text);
          padding:10px 16px;
          border-radius:8px;
          border:1px solid rgba(100,100,100,0.4);
          cursor:pointer;
          margin-bottom:12px;
          width:100%;
        ">
        Aceptar
      </button>

      <button id="abrirSkelloBtn"
        style="
          background:#2563eb;
          color:white;
          padding:12px 20px;
          border-radius:8px;
          border:none;
          cursor:pointer;
          width:100%;
        ">
        Anotar planificación Skello
      </button>
    </div>
  `;

  document.body.appendChild(modal);

  document.getElementById("cerrarModalBtn").addEventListener("click", () => {
    modal.remove();
  });

  document.getElementById("abrirSkelloBtn").addEventListener("click", () => {
    window.open(SKELLO_URL, "_blank", "noopener,noreferrer");
    modal.remove();
  });
}

/* =======================================================
   UTILIDADES
======================================================= */

function generarOpciones(select) {
  select.innerHTML = `
    <option value=""></option>
    <option value="DESCANSO">Descanso</option>
  `;

  for (let h = 0; h < 24; h++) {
    const v = `${String(h).padStart(2, "0")}:00`;
    select.innerHTML += `<option value="${v}">${v}</option>`;
  }
}

function obtenerHorarioTexto(selects) {
  const dias = [
    "Lunes", "Martes", "Miércoles", "Jueves",
    "Viernes", "Sábado", "Domingo"
  ];

  let texto = "";

  for (let i = 0; i < dias.length; i++) {
    const base = i * 4;
    const d = selects[base]?.value;

    if (d === "DESCANSO") {
      texto += `${dias[i]}: Descanso\n`;
      continue;
    }

    const t1i = selects[base].value;
    const t1f = selects[base + 1].value;
    const t2i = selects[base + 2].value;
    const t2f = selects[base + 3].value;

    if (t1i && t1f && t2i && t2f) {
      texto += `${dias[i]}: ${t1i}-${t1f} / ${t2i}-${t2f}\n`;
    } else if (t1i && t1f) {
      texto += `${dias[i]}: ${t1i}-${t1f}\n`;
    }
  }

  return texto.trim();
}

function horarioEsValido(selects) {
  const dias = 7;

  for (let i = 0; i < dias; i++) {
    const base = i * 4;

    const t1i = selects[base].value;
    const t1f = selects[base + 1].value;
    const t2i = selects[base + 2].value;
    const t2f = selects[base + 3].value;

    // 1️⃣ Día completo de descanso
    if (t1i === "DESCANSO") {
      continue;
    }

    // 2️⃣ Turno 1 obligatorio (inicio y fin)
    if (!t1i || !t1f) {
      return false;
    }

    // 3️⃣ Turno 2:
    const turno2Vacio = !t2i && !t2f;
    const turno2Completo = t2i && t2f;

    if (!(turno2Vacio || turno2Completo)) {
      return false;
    }
  }

  return true;
}

function mostrarErrorComunicacion(mensaje) {
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
        ${mensaje || "Se ha producido un error al enviar la comunicación."}
      </p>

      <button id="cerrarErrorModalBtn"
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
    .getElementById("cerrarErrorModalBtn")
    .addEventListener("click", () => {
      modal.remove();
    });
}
