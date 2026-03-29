<?php
// api/get_stats.php
header('Content-Type: application/json');
require_once '../config/database.php';

$stats = [];

// Количество стажёров
$stmt = $pdo->query("SELECT COUNT(*) FROM стажеры");
$stats['trainees'] = $stmt->fetchColumn();

// Количество активных обучений (статус 'в процессе')
$stmt = $pdo->query("SELECT COUNT(*) FROM прохождение_обучения WHERE Статус = 'в процессе'");
$stats['activeTrainings'] = $stmt->fetchColumn();

echo json_encode($stats);
?>