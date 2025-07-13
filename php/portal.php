<?php
session_start();
header('Content-Type: application/json');
require_once("../conexion/conexion.php");

// Leer datos JSON
$input = json_decode(file_get_contents('php://input'), true);

if (isset($input['action']) && $input['action'] === 'get_portal_data') {
    // Aquí deberías obtener el usuario autenticado, por ejemplo desde sesión.
    // Para demo, puedes recibir el correo por POST o usar un valor fijo.
    // $correo = $_SESSION['correo'] ?? '';
    $correo = $_SESSION['correo'] ?? '';
    if (!$correo) {
        echo json_encode(['success' => false, 'message' => 'Usuario no autenticado']);
        exit;
    }

    if (!$correo) {
        echo json_encode(['success' => false, 'message' => 'Usuario no autenticado']);
        exit;
    }

    // Obtener datos del usuario
    $stmt = $conn->prepare("SELECT id, correo, nombre_completo, semestre, foto_perfil FROM usuarios WHERE correo = ?");
    $stmt->bind_param("s", $correo);
    $stmt->execute();
    $result = $stmt->get_result();
    $usuario = $result->fetch_assoc();
    $stmt->close();

    if (!$usuario) {
        echo json_encode(['success' => false, 'message' => 'Usuario no encontrado']);
        exit;
    }

    $usuario_id = $usuario['id'];

    // Obtener materias del usuario
    $materias = [];
    $stmt = $conn->prepare("SELECT id, nombre_materia, color_etiqueta FROM materias WHERE usuario_id = ?");
    $stmt->bind_param("i", $usuario_id);
    $stmt->execute();
    $result = $stmt->get_result();
    while ($row = $result->fetch_assoc()) {
        $materias[] = $row;
    }
    $stmt->close();

    // Obtener tareas del usuario
    $tareas = [];
    $stmt = $conn->prepare("SELECT t.id, t.titulo, t.descripcion, t.fecha_entrega, t.completada, m.nombre_materia 
                            FROM tareas t 
                            INNER JOIN materias m ON t.materia_id = m.id 
                            WHERE t.usuario_id = ? 
                            ORDER BY t.fecha_entrega ASC");
    $stmt->bind_param("i", $usuario_id);
    $stmt->execute();
    $result = $stmt->get_result();
    while ($row = $result->fetch_assoc()) {
        $tareas[] = $row;
    }
    $stmt->close();

    echo json_encode([
        'success' => true,
        'usuario' => $usuario,
        'materias' => $materias,
        'tareas' => $tareas
    ]);
    exit;
}

// Obtener materias para el usuario (para el select de tareas)
if (isset($input['action']) && $input['action'] === 'get_materias') {
    $correo = $input['correo'] ?? '';
    if (!$correo) {
        echo json_encode(['success' => false, 'message' => 'Usuario no autenticado']);
        exit;
    }
    $stmt = $conn->prepare("SELECT id FROM usuarios WHERE correo = ?");
    $stmt->bind_param("s", $correo);
    $stmt->execute();
    $result = $stmt->get_result();
    $usuario = $result->fetch_assoc();
    $stmt->close();
    if (!$usuario) {
        echo json_encode(['success' => false, 'message' => 'Usuario no encontrado']);
        exit;
    }
    $usuario_id = $usuario['id'];
    $materias = [];
    $stmt = $conn->prepare("SELECT id, nombre_materia FROM materias WHERE usuario_id = ?");
    $stmt->bind_param("i", $usuario_id);
    $stmt->execute();
    $result = $stmt->get_result();
    while ($row = $result->fetch_assoc()) {
        $materias[] = $row;
    }
    $stmt->close();
    echo json_encode(['success' => true, 'materias' => $materias]);
    exit;
}

// Agregar materia
if (isset($input['action']) && $input['action'] === 'add_materia') {
    $correo = $input['correo'] ?? '';
    $nombre_materia = $input['nombre_materia'] ?? '';
    $color_etiqueta = $input['color_etiqueta'] ?? 'indigo';
    if (!$correo || !$nombre_materia) {
        echo json_encode(['success' => false, 'message' => 'Datos incompletos']);
        exit;
    }
    $stmt = $conn->prepare("SELECT id FROM usuarios WHERE correo = ?");
    $stmt->bind_param("s", $correo);
    $stmt->execute();
    $result = $stmt->get_result();
    $usuario = $result->fetch_assoc();
    $stmt->close();
    if (!$usuario) {
        echo json_encode(['success' => false, 'message' => 'Usuario no encontrado']);
        exit;
    }
    $usuario_id = $usuario['id'];
    $stmt = $conn->prepare("INSERT INTO materias (usuario_id, nombre_materia, color_etiqueta) VALUES (?, ?, ?)");
    $stmt->bind_param("iss", $usuario_id, $nombre_materia, $color_etiqueta);
    $success = $stmt->execute();
    $stmt->close();
    echo json_encode(['success' => $success]);
    exit;
}

// Agregar tarea
if (isset($input['action']) && $input['action'] === 'add_tarea') {
    $correo = $input['correo'] ?? '';
    $titulo = $input['titulo'] ?? '';
    $materia_id = $input['materia_id'] ?? '';
    $fecha_entrega = $input['fecha_entrega'] ?? '';
    $descripcion = $input['descripcion'] ?? '';
    if (!$correo || !$titulo || !$materia_id || !$fecha_entrega) {
        echo json_encode(['success' => false, 'message' => 'Datos incompletos']);
        exit;
    }
    $stmt = $conn->prepare("SELECT id FROM usuarios WHERE correo = ?");
    $stmt->bind_param("s", $correo);
    $stmt->execute();
    $result = $stmt->get_result();
    $usuario = $result->fetch_assoc();
    $stmt->close();
    if (!$usuario) {
        echo json_encode(['success' => false, 'message' => 'Usuario no encontrado']);
        exit;
    }
    $usuario_id = $usuario['id'];
    $stmt = $conn->prepare("INSERT INTO tareas (usuario_id, materia_id, titulo, descripcion, fecha_entrega, completada) VALUES (?, ?, ?, ?, ?, 0)");
    $stmt->bind_param("iisss", $usuario_id, $materia_id, $titulo, $descripcion, $fecha_entrega);
    $success = $stmt->execute();
    $stmt->close();
    echo json_encode(['success' => $success]);
    exit;
}

// Modificar perfil
if (isset($input['action']) && $input['action'] === 'update_perfil') {
    $correo = $input['correo'] ?? '';
    $nombre_completo = $input['nombre_completo'] ?? '';
    $semestre = $input['semestre'] ?? '';
    $foto_perfil = $input['foto_perfil'] ?? '';
    if (!$correo || !$nombre_completo) {
        echo json_encode(['success' => false, 'message' => 'Datos incompletos']);
        exit;
    }
    $stmt = $conn->prepare("UPDATE usuarios SET nombre_completo = ?, semestre = ?, foto_perfil = ? WHERE correo = ?");
    $stmt->bind_param("ssss", $nombre_completo, $semestre, $foto_perfil, $correo);
    $success = $stmt->execute();
    $stmt->close();
    echo json_encode(['success' => $success]);
    exit;
}

// Subir foto de perfil
if (isset($_POST['action']) && $_POST['action'] === 'update_foto_perfil') {
    $correo = $_POST['correo'] ?? '';
    if (!$correo || !isset($_FILES['foto_perfil'])) {
        echo json_encode(['success' => false, 'message' => 'Datos incompletos']);
        exit;
    }
    $file = $_FILES['foto_perfil'];
    $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
    $allowed = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    if (!in_array($ext, $allowed)) {
        echo json_encode(['success' => false, 'message' => 'Formato de imagen no permitido']);
        exit;
    }
    $filename = uniqid('perfil_') . '.' . $ext;
    $ruta = '../uploads/' . $filename;
    if (!is_dir('../uploads')) mkdir('../uploads', 0777, true);
    if (move_uploaded_file($file['tmp_name'], $ruta)) {
        $ruta_db = 'uploads/' . $filename;
        $stmt = $conn->prepare("UPDATE usuarios SET foto_perfil = ? WHERE correo = ?");
        $stmt->bind_param("ss", $ruta_db, $correo);
        $success = $stmt->execute();
        $stmt->close();
        echo json_encode(['success' => $success, 'foto_perfil' => $ruta_db]);
    } else {
        echo json_encode(['success' => false, 'message' => 'No se pudo guardar la imagen']);
    }
    exit;
}

// Obtener tareas del mes para el calendario
if (isset($input['action']) && $input['action'] === 'get_tareas_mes') {
    $correo = $input['correo'] ?? '';
    $mes = $input['mes'] ?? '';
    $anio = $input['anio'] ?? '';
    if (!$correo || !$mes || !$anio) {
        echo json_encode(['success' => false, 'message' => 'Datos incompletos']);
        exit;
    }
    $stmt = $conn->prepare("SELECT t.titulo, t.fecha_entrega, t.descripcion FROM tareas t INNER JOIN usuarios u ON t.usuario_id = u.id WHERE u.correo = ? AND MONTH(t.fecha_entrega) = ? AND YEAR(t.fecha_entrega) = ?");
    $stmt->bind_param("sii", $correo, $mes, $anio);
    $stmt->execute();
    $result = $stmt->get_result();
    $tareas = [];
    while ($fila = $result->fetch_assoc()) {
        $tareas[] = $fila;
    }
    $stmt->close();
    echo json_encode(['success' => true, 'tareas' => $tareas]);
    exit;
}

// Completar tarea
if (isset($input['action']) && $input['action'] === 'completar_tarea') {
    $id = $input['id'] ?? '';
    if (!$id) {
        echo json_encode(['success' => false, 'message' => 'ID de tarea requerido']);
        exit;
    }
    $stmt = $conn->prepare("UPDATE tareas SET completada = 1 WHERE id = ?");
    $stmt->bind_param("i", $id);
    $success = $stmt->execute();
    $stmt->close();
    echo json_encode(['success' => $success]);
    exit;
}

// Eliminar tarea
if (isset($input['action']) && $input['action'] === 'eliminar_tarea') {
    $id = $input['id'] ?? '';
    if (!$id) {
        echo json_encode(['success' => false, 'message' => 'ID de tarea requerido']);
        exit;
    }
    $stmt = $conn->prepare("DELETE FROM tareas WHERE id = ?");
    $stmt->bind_param("i", $id);
    $success = $stmt->execute();
    $stmt->close();
    echo json_encode(['success' => $success]);
    exit;
}

// Editar tarea
if (isset($input['action']) && $input['action'] === 'editar_tarea') {
    $id = $input['id'] ?? '';
    $titulo = $input['titulo'] ?? '';
    $fecha_entrega = $input['fecha_entrega'] ?? '';
    $descripcion = $input['descripcion'] ?? '';
    if (!$id || !$titulo || !$fecha_entrega) {
        echo json_encode(['success' => false, 'message' => 'Datos incompletos']);
        exit;
    }
    $stmt = $conn->prepare("UPDATE tareas SET titulo = ?, fecha_entrega = ?, descripcion = ? WHERE id = ?");
    $stmt->bind_param("sssi", $titulo, $fecha_entrega, $descripcion, $id);
    $success = $stmt->execute();
    $stmt->close();
    echo json_encode(['success' => $success]);
    exit;
}

echo json_encode(['success' => false, 'message' => 'Acción no válida']);
$conn->close();
?>
