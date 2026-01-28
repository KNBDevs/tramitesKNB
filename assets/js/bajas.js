import { sendMail } from "./mailer.js";

const SKELLO_URL =
  "https://app.skello.io/users/sign_in?lang=es&_gl=1*1yo8e88*FPAU*NjIzMjc3MTEzLjE3NjYwNDk0ODE.*_fplc*N1plbEtyMEhzQWV1TEN0WVVUVVRHbU1VWG93SmhodUpBcnRUSGtPMVptSmJLSiUyQlZjJTJCb2tqR0FvdjNuWFhvN05NVkxUYlltSWlta2x1NkJzRzBpeWJpTHhZSHlUSnk1YjElMkJSUWtDeUQ4RlF6NWU1Tnp3a1h6eTZUNlN2amZnJTNEJTNE";

/* =======================================================
   CONFIGURACIÓN DOCUMENTOS
======================================================= */

const DOCS_BAJA = {
  baja_voluntaria: "doc_bajavoluntaria.docx",
  periodo_prueba: "doc_periodoprueba.docx",
  paralizacion_fijo: "doc_paralizacion.docx",
};

/* =======================================================
   INIT
======================================================= */

export function initBajas() {
  const form = document.getElementById("baja-form");
  const enviarBtn = document.getElementById("enviar");

  if (!form) return;

  const tipoBaja = document.getElementById("tipoBaja");
  const documentoInput = document.getElementById("documentoBaja");
  const vacacionesSelect = document.getElementById("vacaciones");
  const diasVacacionesInput = document.getElementById("diasVacaciones");

  const requiredInputs = form.querySelectorAll(
    "input:not([type='file']), select"
  );

  // -------------------------------------------------------
  // CAMBIO TIPO DE BAJA
  // -------------------------------------------------------
  tipoBaja.addEventListener("change", () => {
    const tipo = tipoBaja.value;

    // Documento obligatorio excepto despido
    documentoInput.required = tipo !== "despido";
    documentoInput.value = "";

    // Descarga automática del modelo
    if (DOCS_BAJA[tipo]) {
      descargarDocumento(DOCS_BAJA[tipo]);
    }

    validarFormulario();
  });

  // -------------------------------------------------------
  // VACACIONES
  // -------------------------------------------------------
  vacacionesSelect.addEventListener("change", () => {
    if (vacacionesSelect.value === "si") {
      diasVacacionesInput.disabled = false;
      diasVacacionesInput.classList.remove("bg-gray-100");
      diasVacacionesInput.focus();
    } else {
      diasVacacionesInput.disabled = true;
      diasVacacionesInput.value = "";
      diasVacacionesInput.classList.add("bg-gray-100");
    }

    validarFormulario();
  });

  // -------------------------------------------------------
  // VALIDACIÓN GENERAL
  // -------------------------------------------------------
  requiredInputs.forEach(el => {
    el.addEventListener("input", validarFormulario);
    el.addEventListener("change", validarFormulario);
  });

  documentoInput.addEventListener("change", validarFormulario);

  function validarFormulario() {
    let valido = true;

    requiredInputs.forEach(el => {
      if (el.disabled) return;
      if (!el.value.trim()) valido = false;
    });

    // Documento obligatorio excepto despido
    if (
      tipoBaja.value !== "despido" &&
      !documentoInput.files.length
    ) {
      valido = false;
    }

    enviarBtn.disabled = !valido;
  }

  // -------------------------------------------------------
  // ENVÍO
  // -------------------------------------------------------
  form.addEventListener("submit", async e => {
    e.preventDefault();
    enviarBtn.disabled = true;

    const data = recogerDatos();

    // 🔹 RECOGER ADJUNTO
    const files = [];
    if (documentoInput.files && documentoInput.files.length > 0) {
      files.push(documentoInput.files[0]);
    }

    try {
      await sendMail({
        subject: `Baja de trabajador - ${data.apellidos}, ${data.nombre}`,
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

function recogerDatos() {
  return {
    tipoBaja: document.getElementById("tipoBaja").value,
    empresa: document.getElementById("empresa").value.trim(),
    fechaBaja: document.getElementById("fechaBaja").value,
    apellidos: document.getElementById("apellidos").value.trim(),
    nombre: document.getElementById("nombre").value.trim(),
    nif: document.getElementById("nif").value.trim(),
    vacaciones: document.getElementById("vacaciones").value,
    diasVacaciones:
      document.getElementById("vacaciones").value === "si"
        ? document.getElementById("diasVacaciones").value
        : "No aplica",
    documentoAdjunto:
      document.getElementById("tipoBaja").value !== "despido"
        ? "Carta de baja firmada"
        : "No requerido (despido)",
  };
}

/* =======================================================
   MENSAJE EMAIL
======================================================= */

function construirMensaje(data) {
  return `
COMUNICACIÓN DE BAJA DE TRABAJADOR

--------------------------------------------------
DATOS GENERALES
--------------------------------------------------

Empresa: ${data.empresa}
Fecha de baja: ${data.fechaBaja}
Tipo de baja: ${formatearTipoBaja(data.tipoBaja)}

--------------------------------------------------
DATOS DEL TRABAJADOR
--------------------------------------------------

Apellidos: ${data.apellidos}
Nombre: ${data.nombre}
NIF: ${data.nif}

--------------------------------------------------
VACACIONES
--------------------------------------------------

Vacaciones a disfrutar: ${data.vacaciones === "si" ? "Sí" : "No"}
Número de días: ${data.diasVacaciones}

--------------------------------------------------
DOCUMENTACIÓN
--------------------------------------------------

${data.documentoAdjunto}
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
        Comunicación de baja enviada correctamente.
      </p>

      <button id="cerrarModalBtn"
        style="
          background:transparent;
          color:var(--modal-text);
          padding:10px 16px;
          border-radius:8px;
          border:1px solid rgba(100,100,100,0.4);
          cursor:pointer;
          font-size:14px;
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
          font-size:15px;
          width:100%;
        ">
        Anotar planificación Skello
      </button>
    </div>
  `;

  document.body.appendChild(modal);

  document
    .getElementById("cerrarModalBtn")
    .addEventListener("click", () => {
      modal.remove();
    });

  document
    .getElementById("abrirSkelloBtn")
    .addEventListener("click", () => {
      window.open(SKELLO_URL, "_blank", "noopener,noreferrer");
      modal.remove();
    });
}

/* =======================================================
   UTILIDADES
======================================================= */

function descargarDocumento(nombreArchivo) {
  const link = document.createElement("a");
  link.href = `../docs/${nombreArchivo}`;
  link.download = nombreArchivo;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function formatearTipoBaja(tipo) {
  const map = {
    baja_voluntaria: "Baja voluntaria",
    periodo_prueba: "No supera período de prueba",
    paralizacion_fijo: "Paralización fijo discontinuo",
    despido: "Despido",
  };

  return map[tipo] || tipo;
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
