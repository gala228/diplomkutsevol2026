<?php
header('Content-Type: application/json');
require_once '../config/database.php';

try {
    $stmt = $pdo->query("SELECT id_блока as id, название as name, описание as description, продолжительность as duration, уровень as level FROM обучающие_блоки ORDER BY id_блока");
    $courses = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($courses);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>