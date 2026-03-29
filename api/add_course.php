<?php
header('Content-Type: application/json');
require_once '../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Метод не разрешён']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);
$name = $data['name'] ?? '';
$description = $data['description'] ?? '';
$duration = $data['duration'] ?? 0;
$level = $data['level'] ?? 'Начальный';

if (empty($name)) {
    http_response_code(400);
    echo json_encode(['error' => 'Название курса обязательно']);
    exit;
}

try {
    $stmt = $pdo->prepare("INSERT INTO обучающие_блоки (название, описание, продолжительность, уровень) VALUES (?, ?, ?, ?)");
    $stmt->execute([$name, $description, $duration, $level]);
    $newId = $pdo->lastInsertId();
    echo json_encode(['success' => true, 'id' => $newId]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>