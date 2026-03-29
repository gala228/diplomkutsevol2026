<?php
// api/add_mentor.php
header('Content-Type: application/json');
require_once '../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Метод не разрешён']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);
$name = $data['name'] ?? '';
$email = $data['email'] ?? '';
$phone = $data['phone'] ?? '';

if (empty($name)) {
    http_response_code(400);
    echo json_encode(['error' => 'Имя наставника обязательно']);
    exit;
}

try {
    $stmt = $pdo->prepare("INSERT INTO наставники (ФИО, Email, Контактный_телефон, Отдел) VALUES (?, ?, ?, ?)");
    $stmt->execute([$name, $email, $phone, 'Общий']);
    $newId = $pdo->lastInsertId();
    echo json_encode(['success' => true, 'id' => $newId]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>