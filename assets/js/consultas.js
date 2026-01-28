import { sendMail } from "./mailer.js";

/* =======================================================
   CONSULTAS GENERALES
======================================================= */

export function initConsultas() {
  const form = document.getElementById("consulta-form");
  const enviarBtn = document.getElementById("enviar");

  if (!form || !enviarBtn) return;

  // --------------------------------------------
  // VALIDACIÓN BÁSICA
  // --------------------------------------------
  const requiredFields = form.querySelectorAll("[required]");

  function validarFormulario() {
    const valido = [...requiredFields].every(el => {
      if (el.type === "file") return true;
      return el.value.trim() !== "";
    });
    enviarBtn.disabled = !valido;
  }

  requiredFields.forEach(el => {
    el.addEventListener("input", validarFormulario);
    el.addEventListener("change", validarFormulario);
  });

  validarFormulario();

  // --------------------------------------------
  // ENVÍO
  // --------------------------------------------
  form.addEventListener("submit", async e => {
    e.preventDefault();
    enviarBtn.disabled = true;

    const files = recogerAdjuntos(form);
    const body = construirMensajeConsulta();

    try {
      await sendMail({
        subject: "Consulta / Comunicación general",
        body,
        files
      });

      mostrarConfirmacionConsulta();

      form.reset();
      enviarBtn.disabled = true;
    } catch (err) {
      mostrarErrorConsulta(
        err?.message || "Error al enviar la consulta. Inténtalo de nuevo."
      );
      enviarBtn.disabled = false;
    }

  });
}



function mostrarConfirmacionConsulta() {
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
      <p style="
        margin-bottom:24px;
        font-size:16px;
        line-height:1.4;
      ">
        Consulta enviada correctamente.
      </p>

      <button id="cerrarConsultaOkBtn"
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
    .getElementById("cerrarConsultaOkBtn")
    .addEventListener("click", () => {
      modal.remove();
    });
}



function mostrarErrorConsulta(mensaje) {
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
      <p style="
        margin-bottom:24px;
        font-size:16px;
        line-height:1.4;
      ">
        ${mensaje || "Error al enviar la consulta. Inténtalo de nuevo."}
      </p>

      <button id="cerrarConsultaErrorBtn"
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
    .getElementById("cerrarConsultaErrorBtn")
    .addEventListener("click", () => {
      modal.remove();
    });
}




/* =======================================================
   MENSAJE
======================================================= */

function construirMensajeConsulta() {
  const inputs = document.querySelectorAll("#consulta-form input, #consulta-form select, #consulta-form textarea");

  const [
    empresa,
    fecha,
    trabajador,
    tipo,
    descripcion
  ] = [
      inputs[0].value,
      inputs[1].value,
      inputs[2].value || "No especificado",
      inputs[3].value,
      inputs[4].value
    ];

  return `
CONSULTA / COMUNICACIÓN GENERAL

Empresa / Centro: ${empresa}
Fecha: ${fecha}

Trabajador afectado: ${trabajador}
Tipo de consulta: ${tipo}

------------------------------------------
DESCRIPCIÓN
------------------------------------------

${descripcion}
`;
}

/* =======================================================
   ADJUNTOS
======================================================= */

function recogerAdjuntos(form) {
  const files = [];
  form.querySelectorAll("input[type='file']").forEach(input => {
    if (input.files && input.files.length > 0) {
      [...input.files].forEach(f => files.push(f));
    }
  });
  return files;
}
