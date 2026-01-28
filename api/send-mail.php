<?php
header('Content-Type: application/json; charset=UTF-8');

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

require __DIR__ . '/../vendor/PHPMailer/src/Exception.php';
require __DIR__ . '/../vendor/PHPMailer/src/PHPMailer.php';
require __DIR__ . '/../vendor/PHPMailer/src/SMTP.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Método no permitido']);
    exit;
}

$subject = trim($_POST['subject'] ?? 'Comunicación laboral');
$body    = trim($_POST['body'] ?? '');

if ($body === '') {
    http_response_code(400);
    echo json_encode(['error' => 'Body vacío']);
    exit;
}

$mail = new PHPMailer(true);

try {
    // ===============================
    // CONFIGURACIÓN BÁSICA
    // ===============================
    $mail->CharSet = 'UTF-8';
    $mail->setFrom('tramites@tramites.knbcomp.com', 'Trámites laborales');
    $mail->addAddress('laboral@mesaredonda.es');
    $mail->addReplyTo('laboral@mesaredonda.es');
    $mail->Subject = $subject;
    $mail->isHTML(false);

    // ===============================
    // ADJUNTOS + LINKS
    // ===============================
    $uploadDir = __DIR__ . '/../uploads';
    $downloadLinks = [];

    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0755, true);
    }

    foreach ($_FILES as $file) {
        if ($file['error'] !== UPLOAD_ERR_OK) {
            continue;
        }

        $safeName = uniqid('doc_', true) . '_' . preg_replace(
            '/[^a-zA-Z0-9._-]/',
            '_',
            $file['name']
        );

        $destPath = $uploadDir . '/' . $safeName;

        // 1️⃣ mover archivo
        if (!move_uploaded_file($file['tmp_name'], $destPath)) {
            throw new Exception('No se pudo guardar el archivo');
        }

        // 2️⃣ adjuntar desde destino FINAL
        $mail->addAttachment($destPath, $file['name']);

        // 3️⃣ link público
        $downloadLinks[] = 'https://tramites.knbcomp.com/uploads/' . $safeName;
    }

    // ===============================
    // CUERPO FINAL
    // ===============================
    if ($downloadLinks) {
        $body .= "\n\n------------------------------------------\n";
        $body .= "DOCUMENTACIÓN ADJUNTA (DESCARGA DIRECTA)\n";
        $body .= "------------------------------------------\n\n";

        foreach ($downloadLinks as $link) {
            $body .= "- $link\n";
        }
    }

    $mail->Body = $body;

    // ===============================
    // ENVÍO
    // ===============================
    $mail->send();

    echo json_encode(['ok' => true]);

} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'error'  => 'Error enviando email',
        'detail' => $e->getMessage()
    ]);
}
