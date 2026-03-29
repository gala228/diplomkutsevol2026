<?php
// api/update_trainee.php
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
    echo json_encode(['error' => 'Некорректные данные']);
    exit;
}

$id = $data['id'];
$fullName = $data['fullName'] ?? '';
$startDate = $data['startDate'] ?? '';

try {
    $sql = "UPDATE стажеры SET ФИО = :fullName, Дата_начала_стажировки = :startDate WHERE id_стажера = :id";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        ':fullName' => $fullName,
        ':startDate' => $startDate,
        ':id' => $id
    ]);
    echo json_encode(['success' => true]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>