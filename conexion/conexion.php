<?php
if (basename($_SERVER['PHP_SELF']) === basename(__FILE__)) {
    die("Acceso denegado.");
}

$host = "localhost";
$user = "root";
$pass = "";
$db   = "agenda-digital";

$conn = new mysqli($host, $user, $pass, $db);

$conn->set_charset("utf8mb4");

if ($conn->connect_error) {
    die("Error de conexión a la base de datos: " . $conn->connect_error);
}
?>