/* =======================================================
   MAILER — ENVÍO AUTOMÁTICO CON BACKEND (POSTFIX)
======================================================= */

export async function sendMail({ subject, body, files = [] }) {
  const formData = new FormData();

  // -------------------------------------------------------
  // CONTENIDO
  // -------------------------------------------------------
  formData.append("subject", subject || "Comunicación laboral");
  formData.append("body", body || "");

  // -------------------------------------------------------
  // ADJUNTOS (File reales)
  // -------------------------------------------------------
  if (Array.isArray(files)) {
    files.forEach((file, index) => {
      if (file instanceof File) {
        formData.append(`file_${index}`, file);
      }
    });
  }

  // -------------------------------------------------------
  // ENVÍO
  // -------------------------------------------------------
  let response;

  try {
    response = await fetch("/api/send-mail.php", {
      method: "POST",
      body: formData
    });
  } catch {
    throw new Error("No se pudo conectar con el servidor de correo.");
  }

  // -------------------------------------------------------
  // RESPUESTA
  // -------------------------------------------------------
  if (!response.ok) {
    let errorMsg = "Error enviando el correo.";

    try {
      const err = await response.json();
      if (err?.error) errorMsg = err.error;
    } catch {
      // respuesta no JSON
    }

    throw new Error(errorMsg);
  }

  try {
    return await response.json();
  } catch {
    return { ok: true };
  }
}
