<?php
// api/add_trainee.php
header('Content-Type: application/json');
require_once '../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Метод не разрешён']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);
if (!$data) {
    http_response_code(400);
    echo json_encode(['error' => 'Некорректные данные']);
    exit;
}

$fullName = $data['fullName'] ?? '';
$startDate = $data['startDate'] ?? '';
$status = $data['status'] ?? 'Активен';
$notes = $data['notes'] ?? '';

if (empty($fullName) || empty($startDate)) {
    http_response_code(400);
    echo json_encode(['error' => 'ФИО и дата начала обязательны']);
    exit;
}

try {
    // Генерируем новый ID (максимальный + 1)
    $stmt = $pdo->query("SELECT MAX(id_стажера) FROM стажеры");
    $maxId = $stmt->fetchColumn();
    $newId = $maxId + 1;

    $sql = "INSERT INTO стажеры (id_стажера, ФИО, Дата_рождения, Контактный_телефон, Отдел, Дата_начала_стажировки)
            VALUES (:id, :fullName, :birth, :phone, :dept, :startDate)";
    // Для простоты заполняем пустыми значениями, которые не обязательны
    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        ':id' => $newId,
        ':fullName' => $fullName,
        ':birth' => '2000-01-01',  // дата по умолчанию, можно передавать из формы
        ':phone' => 0,
        ':dept' => 'Общий',
        ':startDate' => $startDate
    ]);

    // Обновляем статус (если поле статуса есть в таблице стажеры, но его нет в схеме — добавим? 
    // В исходной схеме нет поля статус у стажёра, но в демо-данных фронтенда оно было.
    // Можно добавить поле статус в таблицу стажеры. Для простоты оставим без статуса в БД,
    // а статус будем определять по наличию завершённых курсов и аттестаций.
    // Но чтобы не ломать фронтенд, мы не будем сохранять статус в БД — он будет вычисляться.

    echo json_encode(['success' => true, 'id' => $newId]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>