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

if (!$id) {
    http_response_code(400);
    echo json_encode(['error' => 'ID курса не указан']);
    exit;
}

try {
    $stmt = $pdo->prepare("DELETE FROM обучающие_блоки WHERE id_блока = ?");
    $stmt->execute([$id]);
    echo json_encode(['success' => true]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>