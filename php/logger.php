<?php
function registrar_log($conn, $correo, $accion) {
    $ip = $_SERVER['REMOTE_ADDR'];
    $navegador = $_SERVER['HTTP_USER_AGENT'];

    $stmt = $conn->prepare("INSERT INTO logs (correo, accion, ip_usuario, navegador) VALUES (?, ?, ?, ?)");
    $stmt->bind_param("ssss", $correo, $accion, $ip, $navegador);
    $stmt->execute();
    $stmt->close();
}
?>