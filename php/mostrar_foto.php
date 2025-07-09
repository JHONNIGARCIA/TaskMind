<?php
if (!isset($_GET['correo'])) {
    http_response_code(400);
    exit('Correo no especificado.');
}

$correo = $_GET['correo'];

// Incluir archivo de conexión
include_once __DIR__ . '/conexion/conexion.php';

$consulta = $conexion->prepare("SELECT foto_perfil FROM usuarios WHERE correo = ?");
$consulta->bind_param("s", $correo);
$consulta->execute();
$resultado = $consulta->get_result();

if ($fila = $resultado->fetch_assoc()) {
    $imagen = $fila['foto_perfil'];
    header("Content-Type: image/jpeg"); // Cambia a image/png si usas PNG
    echo $imagen;
} else {
    // Imagen por defecto si no se encuentra
    header("Location: https://ui-avatars.com/api/?name=U");
}
?>