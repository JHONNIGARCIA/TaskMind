<?php
header('Content-Type: application/json');

require_once("../conexion/conexion.php");
require_once("logger.php");

// Leer datos JSON
$input = json_decode(file_get_contents('php://input'), true);

// REGISTRO
if (isset($input['action']) && $input['action'] === 'register') {
    $correo = trim($input['correo'] ?? '');
    $contrasena = $input['contrasena'] ?? '';
    $nombre = trim($input['nombre_completo'] ?? '');

    if (!$correo || !$contrasena || !$nombre) {
        echo json_encode(['success' => false, 'message' => 'Faltan datos']);
        exit;
    }

    $recaptcha = $input['recaptcha'] ?? '';
    if (!$recaptcha) {
        echo json_encode(['success' => false, 'message' => 'Captcha no enviado']);
        exit;
    }

    // Verificar reCAPTCHA con Google
    $secretKey = "6LfH0oUrAAAAAInVIvLgrmxYB8jGM6UjI5YTJQEh";
    $response = file_get_contents("https://www.google.com/recaptcha/api/siteverify?secret={$secretKey}&response={$recaptcha}");
    $responseKeys = json_decode($response, true);

    if (!$responseKeys["success"]) {
        echo json_encode(['success' => false, 'message' => 'Captcha inválido']);
        exit;
    }

    // Verificar si ya existe el correo
    $stmt = $conn->prepare("SELECT id FROM usuarios WHERE correo = ?");
    $stmt->bind_param("s", $correo);
    $stmt->execute();
    $stmt->store_result();
    if ($stmt->num_rows > 0) {
        echo json_encode(['success' => false, 'message' => 'El correo ya está registrado']);
        registrar_log($conn, $correo, 'Intento fallido de registro: correo ya registrado'); // 🔒
        $stmt->close();
        exit;
    }
    $stmt->close();

    // Registrar usuario
    $hash = password_hash($contrasena, PASSWORD_DEFAULT);
    $stmt = $conn->prepare("INSERT INTO usuarios (correo, contrasena, nombre_completo) VALUES (?, ?, ?)");
    $stmt->bind_param("sss", $correo, $hash, $nombre);
    if ($stmt->execute()) {
        echo json_encode(['success' => true]);
        registrar_log($conn, $correo, 'Registro exitoso de usuario'); // 🔒
    } else {
        echo json_encode(['success' => false, 'message' => 'Error al registrar usuario']);
    }
    $stmt->close();
    exit;
}

// LOGIN
if (isset($input['action']) && $input['action'] === 'login') {
    $correo = trim($input['correo'] ?? '');
    $contrasena = $input['contrasena'] ?? '';

    if (!$correo || !$contrasena) {
        echo json_encode(['success' => false, 'message' => 'Faltan datos']);
        exit;
    }

    $stmt = $conn->prepare("SELECT id, contrasena, nombre_completo FROM usuarios WHERE correo = ?");
    $stmt->bind_param("s", $correo);
    $stmt->execute();
    $stmt->store_result();

    if ($stmt->num_rows === 1) {
        $stmt->bind_result($id, $hash, $nombre);
        $stmt->fetch();
        if (password_verify($contrasena, $hash)) {
            echo json_encode(['success' => true, 'nombre' => $nombre]);
            registrar_log($conn, $correo, 'Inicio de sesión exitoso'); // 🔒
        } else {
            echo json_encode(['success' => false, 'message' => 'Contraseña incorrecta']);
            registrar_log($conn, $correo, 'Intento de inicio de sesión con contraseña incorrecta'); // 🔒
        }
    } else {
        echo json_encode(['success' => false, 'message' => 'Usuario no encontrado']);
        registrar_log($conn, $correo, 'Intento de inicio de sesión con usuario no registrado'); // 🔒
    }
    $stmt->close();
    exit;
}

// ACCIÓN NO VÁLIDA
echo json_encode(['success' => false, 'message' => 'Acción no válida']);
$conn->close();
?>
