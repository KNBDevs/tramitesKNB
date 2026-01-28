import { sendMail } from "./mailer.js";

/* =======================================================
   INIT
======================================================= */

export function initSanciones() {
  const form = document.getElementById("sancion-form");
  const enviarBtn = document.getElementById("enviar");

  if (!form) return;

  const descripcion = document.getElementById("descripcion");
  const requiredInputs = form.querySelectorAll("input[required], textarea[required]");

  // -------------------------------------------------------
  // CONTADOR DE CARACTERES
  // -------------------------------------------------------
  const counter = document.createElement("div");
  counter.className = "text-xs text-gray-500 mt-1 text-right";
  counter.textContent = "0 / 200 caracteres";
  descripcion.after(counter);

  // -------------------------------------------------------
  // VALIDACIÓN GENERAL
  // -------------------------------------------------------
  function validarFormulario() {
    let valido = true;

    requiredInputs.forEach(el => {
      if (!el.value.trim()) valido = false;
    });

    if (descripcion.value.trim().length < 200) {
      valido = false;
    }

    enviarBtn.disabled = !valido;
  }

  // -------------------------------------------------------
  // EVENTOS INPUT
  // -------------------------------------------------------
  requiredInputs.forEach(el => {
    el.addEventListener("input", validarFormulario);
    el.addEventListener("change", validarFormulario);
  });

  descripcion.addEventListener("input", () => {
    const length = descripcion.value.length;
    counter.textContent = `${length} / 200 caracteres`;

    if (length < 200) {
      counter.classList.add("text-red-500");
      counter.classList.remove("text-gray-500");
    } else {
      counter.classList.remove("text-red-500");
      counter.classList.add("text-gray-500");
    }

    validarFormulario();
  });

  // -------------------------------------------------------
  // ENVÍO
  // -------------------------------------------------------
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    enviarBtn.disabled = true;

    const data = recogerDatos();

    try {
      await sendMail({
        subject: `Sanción / conducta sancionable - ${data.apellidos}, ${data.nombre}`,
        body: construirMensaje(data)
      });

      mostrarConfirmacionSancion();

      form.reset();
      counter.textContent = "0 / 200 caracteres";
      enviarBtn.disabled = true;
    } catch (err) {
      mostrarErrorSancion(
        err?.message || "Error al enviar la comunicación de sanción. Inténtalo de nuevo."
      );
      enviarBtn.disabled = false;
    }

  });
}


function mostrarConfirmacionSancion() {
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
        Comunicación de sanción enviada correctamente.
      </p>

      <button id="cerrarSancionOkBtn"
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
    .getElementById("cerrarSancionOkBtn")
    .addEventListener("click", () => {
      modal.remove();
    });
}


function mostrarErrorSancion(mensaje) {
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
        ${mensaje || "Error al enviar la comunicación de sanción. Inténtalo de nuevo."}
      </p>

      <button id="cerrarSancionErrorBtn"
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
    .getElementById("cerrarSancionErrorBtn")
    .addEventListener("click", () => {
      modal.remove();
    });
}




/* =======================================================
   RECOGER DATOS
======================================================= */

function recogerDatos() {
  return {
    empresa: document.getElementById("empresa").value.trim(),
    fecha: document.getElementById("fechaSancion").value,
    apellidos: document.getElementById("apellidos").value.trim(),
    nombre: document.getElementById("nombre").value.trim(),
    naf: [
      document.getElementById("naf1").value,
      document.getElementById("naf2").value,
      document.getElementById("naf3").value,
    ].join(""),
    nif: document.getElementById("nif").value.trim(),
    descripcion: document.getElementById("descripcion").value.trim(),
  };
}

/* =======================================================
   MENSAJE EMAIL
======================================================= */

function construirMensaje(data) {
  return `
COMUNICACIÓN DE SANCIÓN / CONDUCTA SANCIONABLE

--------------------------------------------------
DATOS GENERALES
--------------------------------------------------

Empresa: ${data.empresa}
Fecha de comunicación: ${data.fecha}

--------------------------------------------------
DATOS DEL TRABAJADOR
--------------------------------------------------

Apellidos: ${data.apellidos}
Nombre: ${data.nombre}
NIF: ${data.nif}
NAF: ${data.naf}

--------------------------------------------------
DESCRIPCIÓN DE LOS HECHOS
--------------------------------------------------

${data.descripcion}
`;
}
