<?php
// api/get_mentors.php
header('Content-Type: application/json');
require_once '../config/database.php';

try {
    $stmt = $pdo->query("SELECT * FROM наставники ORDER BY id_наставника");
    $mentors = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($mentors);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>