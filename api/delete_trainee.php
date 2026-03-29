<?php
// api/delete_trainee.php
header('Content-Type: application/json');
require_once '../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Метод не разрешён']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);
if (!$data || !isset($data['id'])) {
    http_response_code(400);
    echo json_encode(['error' => 'ID стажёра не указан']);
    exit;
}

$id = $data['id'];

try {
    // Удаление каскадно удалит связанные записи, если настроены внешние ключи
    $stmt = $pdo->prepare("DELETE FROM стажеры WHERE id_стажера = ?");
    $stmt->execute([$id]);
    echo json_encode(['success' => true]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>