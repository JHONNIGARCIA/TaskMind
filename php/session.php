<?php
session_start();
header('Content-Type: application/json');

echo json_encode([
    'authenticated' => isset($_SESSION['correo']),
    'correo' => $_SESSION['correo'] ?? null
]);
?>