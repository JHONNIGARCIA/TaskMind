<?php
$host = "localhost";
$user = "root";
$pass = ""; // Cambia si tienes contraseña en tu MySQL
$db = "agenda-digital";

$conn = new mysqli($host, $user, $pass, $db);

if ($conn->connect_error) {
    die("Error de conexión: " . $conn->connect_error);
}
?>
