<?php
include_once __DIR__ . '/../conexion/conexion.php';
header('Content-Type: application/json');

$input = json_decode(file_get_contents("php://input"), true);

if (!isset($input['action']) || !isset($input['correo'])) {
    echo json_encode(['success' => false, 'message' => 'Datos incompletos']);
    exit;
}

$action = $input['action'];
$correo = $input['correo'];

if ($action === 'get_tareas_mes') {
    $mes = $input['mes'];
    $anio = $input['anio'];

    $stmt = $conexion->prepare("SELECT titulo, fecha_entrega, descripcion FROM tareas WHERE correo = ? AND MONTH(fecha_entrega) = ? AND YEAR(fecha_entrega) = ?");
    $stmt->bind_param("sii", $correo, $mes, $anio);
    $stmt->execute();
    $result = $stmt->get_result();

    $tareas = [];
    while ($fila = $result->fetch_assoc()) {
        $tareas[] = $fila;
    }

    echo json_encode(['success' => true, 'tareas' => $tareas]);
    exit;
}

echo json_encode(['success' => false, 'message' => 'Acción no válida']);
?>
