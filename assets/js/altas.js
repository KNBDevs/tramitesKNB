import { sendMail } from "./mailer.js";

const SKELLO_URL = "https://app.skello.io/users/sign_in?lang=es&_gl=1*1yo8e88*FPAU*NjIzMjc3MTEzLjE3NjYwNDk0ODE.*_fplc*N1plbEtyMEhzQWV1TEN0WVVUVVRHbU1VWG93SmhodUpBcnRUSGtPMVptSmJLSiUyQlZjJTJCb2tqR0FvdjNuWFhvN05NVkxUYlltSWlta2x1NkJzRzBpeWJpTHhZSHlUSnk1YjElMkJSUWtDeUQ4RlF6NWU1Tnp3a1h6eTZUNlN2amZnJTNEJTNE";

/* =======================================================
   INIT
======================================================= */

export function initAltas() {
  const form = document.getElementById("alta-form");
  const enviarBtn = document.getElementById("enviar");

  if (!form) return;

  const tipoContrato = document.getElementById("tipoContrato");
  const horasInput = document.getElementById("horas");

  const horasAnualesWrapper = document.getElementById("horasAnualesWrapper");
  const horasAnualesInput = document.getElementById("horasAnuales");

  const horarioGrid = document.getElementById("horario-semanal");
  const selectsHorario = [...horarioGrid.querySelectorAll("select")];

  const requiredInputs = form.querySelectorAll(
    "input[required], select[required]"
  );

  const requiredInputsSinHorario = [...requiredInputs].filter(
    el => !el.closest("#horario-semanal")
  );


  // -------------------------------------------------------
  // OPCIONES HORARIO
  // -------------------------------------------------------
  selectsHorario.forEach(sel => generarOpciones(sel));

  // -------------------------------------------------------
  // DESCANSO POR DÍA (sincronizado)
  // -------------------------------------------------------
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



  // -------------------------------------------------------
  // EMAIL opcional (No consta)
  // -------------------------------------------------------
  const emailNoConsta = document.getElementById("emailNoConsta");
  const emailInput = document.getElementById("email");

  function updateEmailState() {
    if (emailNoConsta.checked) {
      emailInput.value = "";
      emailInput.disabled = true;
      emailInput.removeAttribute("required");
      emailInput.classList.add("opacity-50");
    } else {
      emailInput.disabled = false;
      emailInput.setAttribute("required", "required");
      emailInput.classList.remove("opacity-50");
    }

    validarFormulario();
  }

  emailNoConsta.addEventListener("change", updateEmailState);



  // -------------------------------------------------------
  // TELÉFONO opcional (No consta)
  // -------------------------------------------------------
  const telefonoNoConsta = document.getElementById("telefonoNoConsta");
  const telefonoInput = document.getElementById("telefono");

  function updateTelefonoState() {
    if (telefonoNoConsta.checked) {
      telefonoInput.value = "";
      telefonoInput.disabled = true;
      telefonoInput.removeAttribute("required");
      telefonoInput.classList.add("opacity-50");
    } else {
      telefonoInput.disabled = false;
      telefonoInput.setAttribute("required", "required");
      telefonoInput.classList.remove("opacity-50");
    }

    validarFormulario();
  }

  telefonoNoConsta.addEventListener("change", updateTelefonoState);

  // -------------------------------------------------------
  // CONTRATO 100 → JORNADA COMPLETA
  // -------------------------------------------------------
  tipoContrato.addEventListener("change", () => {

    // CONTRATO 100 → jornada completa
    if (tipoContrato.value === "100") {
      horasInput.value = "40";
      horasInput.disabled = true;
      toggleHorario(true, selectsHorario);
    } else {
      horasInput.disabled = false;
      horasInput.value = "";
      toggleHorario(false, selectsHorario);
    }

    // CONTRATO 300 → horas anuales
    if (tipoContrato.value === "300") {
      horasAnualesWrapper.classList.remove("hidden");
      horasAnualesInput.setAttribute("required", "required");
    } else {
      horasAnualesWrapper.classList.add("hidden");
      horasAnualesInput.removeAttribute("required");
      horasAnualesInput.value = "";
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

  function validarFormulario() {
    let valido = requiredInputsSinHorario.every(el => {
      if (el.type === "file") {
        return el.files && el.files.length > 0;
      }
      if (el.disabled) return true;
      return el.value.trim() !== "";
    });

    // ⬇️ VALIDACIÓN REAL DEL HORARIO (MISMA QUE CAMBIO DE JORNADA)
    if (!horarioEsValido(selectsHorario)) {
      valido = false;
    }
    enviarBtn.disabled = !valido;


  }


  // -------------------------------------------------------
  // NAF opcional (No consta)
  // -------------------------------------------------------
  const nafNoConsta = document.getElementById("nafNoConsta");
  const nafGroup = document.getElementById("nafGroup");
  const nafInputs = nafGroup.querySelectorAll("input");

  function updateNAFState() {
    if (nafNoConsta.checked) {
      nafInputs.forEach(input => {
        input.value = "";
        input.disabled = true;
        input.removeAttribute("required");
        input.classList.add("opacity-50");
      });
    } else {
      nafInputs.forEach(input => {
        input.disabled = false;
        input.setAttribute("required", "required");
        input.classList.remove("opacity-50");
      });
    }

    validarFormulario();
  }

  nafNoConsta.addEventListener("change", updateNAFState);

  // -------------------------------------------------------
  // ENVÍO
  // -------------------------------------------------------
  form.addEventListener("submit", async e => {
    e.preventDefault();

    const fileInputs = form.querySelectorAll('input[type="file"]');

    const hayArchivos = [...fileInputs].every(
      input => input.files && input.files.length > 0
    );

    if (!hayArchivos) {
      alert("NO estás adjuntando los PDFs. Selecciónalos antes de enviar.");
      return;
    }

    enviarBtn.disabled = true;

    const data = recogerDatos(selectsHorario);

    const files = [];
    fileInputs.forEach(input => {
      if (input.files.length > 0) files.push(input.files[0]);
    });


    try {
      await sendMail({
        subject: `Alta de trabajador - ${data.apellidos}, ${data.nombre}`,
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
  validarFormulario();

}

/* =======================================================
   RECOGER DATOS
======================================================= */

function recogerDatos(selectsHorario) {
  const iban = [
    document.getElementById("ibanPais").value,
    document.getElementById("ibanDC").value,
    document.getElementById("ibanEntidad").value,
    document.getElementById("ibanOficina").value,
    document.getElementById("ibanDCCuenta").value,
    document.getElementById("ibanCuenta").value
  ].join("").trim();

  return {
    empresa: document.getElementById("empresa").value.trim(),
    fechaAlta: document.getElementById("fechaAlta").value,
    apellidos: document.getElementById("apellidos").value.trim(),
    nombre: document.getElementById("nombre").value.trim(),
    naf: document.getElementById("nafNoConsta")?.checked
      ? "No consta"
      : [
        document.getElementById("naf1").value,
        document.getElementById("naf2").value,
        document.getElementById("naf3").value
      ].join(""),
    nif: document.getElementById("nif").value.trim(),
    email: document.getElementById("emailNoConsta")?.checked
      ? "No consta"
      : document.getElementById("email").value.trim(),

    telefono: document.getElementById("telefonoNoConsta")?.checked
      ? "No consta"
      : document.getElementById("telefono").value.trim(),

    iban: iban || "No informado",
    tipoContrato: document.getElementById("tipoContrato").value,
    horas: document.getElementById("horas").value,
    horasAnuales:
      document.getElementById("tipoContrato").value === "300"
        ? document.getElementById("horasAnuales").value
        : "No aplica",

    horario: obtenerHorarioTexto(selectsHorario)
  };
}

/* =======================================================
   MENSAJE EMAIL
======================================================= */

function construirMensaje(data) {
  return `
ALTA DE NUEVO TRABAJADOR

Empresa: ${data.empresa}
Fecha de alta: ${data.fechaAlta}

--------------------------------------------------
DATOS DEL TRABAJADOR
--------------------------------------------------

Apellidos: ${data.apellidos}
Nombre: ${data.nombre}
NIF: ${data.nif}
NAF: ${data.naf}
Email: ${data.email}
Teléfono: ${data.telefono}
IBAN: ${data.iban}


--------------------------------------------------
CONDICIONES LABORALES
--------------------------------------------------

Tipo de contrato: ${data.tipoContrato}
Horas semanales: ${data.horas}
Horas anuales estimadas: ${data.horasAnuales}

--------------------------------------------------
HORARIO SEMANAL
--------------------------------------------------

${data.horario}

--------------------------------------------------
DOCUMENTACIÓN ADJUNTA
--------------------------------------------------

- DNI / NIF (cara frontal)
- DNI / NIF (cara trasera)
`;
}

/* =======================================================
   FUNCIONES AUXILIARES
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

function toggleHorario(disabled, selects) {
  selects.forEach(s => {
    s.disabled = disabled;
    if (disabled) {
      s.value = "";
      s.classList.remove("bg-red-50", "text-red-600");
      delete s.dataset.descanso;
    }
  });
}

function obtenerHorarioTexto(selects) {
  const dias = [
    "Lunes", "Martes", "Miércoles", "Jueves",
    "Viernes", "Sábado", "Domingo"
  ];

  let texto = "";

  for (let dia = 0; dia < 7; dia++) {
    const t1i = selects[dia]?.value;
    const t1f = selects[dia + 7]?.value;
    const t2i = selects[dia + 14]?.value;
    const t2f = selects[dia + 21]?.value;

    // Día completo de descanso
    if (t1i === "DESCANSO") {
      texto += `${dias[dia]}: Descanso\n`;
      continue;
    }

    // Turno 1 obligatorio (si no existe, no pintamos nada)
    if (!t1i || !t1f) continue;

    // Turno 2 SOLO si es completo y no descanso
    const turno2Valido =
      t2i && t2f &&
      t2i !== "DESCANSO" &&
      t2f !== "DESCANSO";

    if (turno2Valido) {
      texto += `${dias[dia]}: ${t1i}-${t1f} / ${t2i}-${t2f}\n`;
    } else {
      texto += `${dias[dia]}: ${t1i}-${t1f}\n`;
    }
  }

  return texto.trim();
}


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
    box-shadow: 0 10px 40px rgba(0,0,0,0.3);
  ">
    <p style="
      margin-bottom:24px;
      font-size:16px;
      line-height:1.4;
    ">
      Comunicación de alta enviada correctamente.
    </p>

    <!-- Botón Aceptar (solo cierra modal) -->
    <button id="cerrarModalBtn"
      style="
        background: transparent;
        color: var(--modal-text);
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

    <!-- Botón Skello -->
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


function horarioEsValido(selects) {
  for (let dia = 0; dia < 7; dia++) {

    const t1i = selects[dia]?.value;
    const t1f = selects[dia + 7]?.value;
    const t2i = selects[dia + 14]?.value;
    const t2f = selects[dia + 21]?.value;

    // Día completo de descanso
    if (t1i === "DESCANSO") continue;

    // Turno 1 obligatorio
    if (!t1i || !t1f) return false;

    const turno2Vacio = !t2i && !t2f;
    const turno2Completo = t2i && t2f;

    if (!(turno2Vacio || turno2Completo)) return false;
  }

  return true;
}


