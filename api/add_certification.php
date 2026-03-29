<?php
// api/add_certification.php
header('Content-Type: application/json');
require_once '../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Метод не разрешён']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);
$traineeId = $data['traineeId'] ?? 0;
$theme = $data['theme'] ?? '';
$date = $data['date'] ?? '';
$result = $data['result'] ?? '';

if (!$traineeId || empty($theme) || empty($date)) {
    http_response_code(400);
    echo json_encode(['error' => 'Не все поля заполнены']);
    exit;
}

try {
    $sql = "INSERT INTO аттестация (id_стажера, Дата, Результат, комментарий) VALUES (?, ?, ?, ?)";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$traineeId, $date, $result, $theme]); // комментарий используем для темы
    echo json_encode(['success' => true]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>