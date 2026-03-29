<?php
// api/get_certifications.php
header('Content-Type: application/json');
require_once '../config/database.php';

try {
    $stmt = $pdo->query("
        SELECT a.id_аттестации, a.id_стажера, s.ФИО AS trainee_name, a.Дата, a.Результат, a.комментарий
        FROM аттестация a
        JOIN стажеры s ON a.id_стажера = s.id_стажера
        ORDER BY a.Дата DESC
    ");
    $certifications = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($certifications);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>