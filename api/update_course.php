<?php
header('Content-Type: application/json');
require_once '../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Метод не разрешён']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);
$id = $data['id'] ?? 0;
$name = $data['name'] ?? '';
$description = $data['description'] ?? '';
$duration = $data['duration'] ?? 0;
$level = $data['level'] ?? '';

if (!$id || empty($name)) {
    http_response_code(400);
    echo json_encode(['error' => 'ID и название курса обязательны']);
    exit;
}

try {
    $sql = "UPDATE обучающие_блоки SET название = :name, описание = :description, продолжительность = :duration, уровень = :level WHERE id_блока = :id";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([':name' => $name, ':description' => $description, ':duration' => $duration, ':level' => $level, ':id' => $id]);
    echo json_encode(['success' => true]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>