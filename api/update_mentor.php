<?php
// api/update_mentor.php
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
$name = $data['name'] ?? '';
$email = $data['email'] ?? '';
$phone = $data['phone'] ?? '';

try {
    $sql = "UPDATE наставники SET ФИО = :name, Email = :email, Контактный_телефон = :phone WHERE id_наставника = :id";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([':name' => $name, ':email' => $email, ':phone' => $phone, ':id' => $id]);
    echo json_encode(['success' => true]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>