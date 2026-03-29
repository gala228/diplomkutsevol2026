<?php
// api/get_interns.php
header('Content-Type: application/json');
require_once '../config/database.php';

$stmt = $pdo->query("SELECT id_стажера, ФИО FROM стажеры ORDER BY ФИО");
$interns = $stmt->fetchAll(PDO::FETCH_ASSOC);

// Добавляем вариант "Все стажёры"
array_unshift($interns, ['id_стажера' => '', 'ФИО' => 'Все стажёры']);

echo json_encode($interns);
?>