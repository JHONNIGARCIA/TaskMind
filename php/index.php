<?php
session_start();

header('Content-Type: application/json');
require_once("../conexion/conexion.php");

// Leer datos JSON
$input = json_decode(file_get_contents('php://input'), true);

if (isset($input['action']) && $input['action'] === 'register') {
    $correo = filter_var(trim($input['correo'] ?? ''), FILTER_VALIDATE_EMAIL);
    $contrasena = $input['contrasena'] ?? '';
    $nombre = htmlspecialchars(trim($input['nombre_completo'] ?? ''), ENT_QUOTES, 'UTF-8');

    if (!$correo || !$contrasena || !$nombre) {
        echo json_encode(['success' => false, 'message' => 'Datos inválidos']);
        exit;
    }

    // Verificar si el correo ya existe
    $stmt = $conn->prepare("SELECT id FROM usuarios WHERE correo = ?");
    $stmt->bind_param("s", $correo);
    $stmt->execute();
    $stmt->store_result();
    if ($stmt->num_rows > 0) {
        echo json_encode(['success' => false, 'message' => 'El correo ya está registrado']);
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
    } else {
        echo json_encode(['success' => false, 'message' => 'Error al registrar usuario']);
    }
    $stmt->close();
    exit;
}

// Manejo de login
if (isset($input['action']) && $input['action'] === 'login') {
    $correo = filter_var(trim($input['correo'] ?? ''), FILTER_VALIDATE_EMAIL);
    $contrasena = $input['contrasena'] ?? '';

    if (!$correo || !$contrasena) {
        echo json_encode(['success' => false, 'message' => 'Datos inválidos']);
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

            session_regenerate_id(true);     
            $_SESSION['correo'] = $correo;
  
            echo json_encode(['success' => true, 'nombre' => $nombre]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Contraseña incorrecta']);
        }
    } else {
        echo json_encode(['success' => false, 'message' => 'Usuario no encontrado']);
    }
    $stmt->close();
    exit;
}

// Si no es una acción válida
echo json_encode(['success' => false, 'message' => 'Acción no válida']);
$conn->close();
?>
