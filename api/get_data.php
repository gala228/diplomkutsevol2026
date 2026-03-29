<?php
// api/get_data.php
header('Content-Type: application/json');
require_once '../config/database.php';

// Получение параметров из GET-запроса
$sortField = $_GET['sort'] ?? 'order_date';
$sortDir = strtoupper($_GET['dir'] ?? 'ASC');
$internId = isset($_GET['intern_id']) && $_GET['intern_id'] !== '' ? (int)$_GET['intern_id'] : null;
$search = $_GET['search'] ?? '';

// Базовый SQL-запрос
$sql = "
    SELECT 
        po.id_записи AS order_id,
        s.ФИО AS intern_name,
        ob.название AS block_name,
        po.Дата_начала AS order_date,
        po.Статус AS status
    FROM прохождение_обучения po
    INNER JOIN стажеры s ON po.id_стажера = s.id_стажера
    INNER JOIN обучающие_блоки ob ON po.id_блока = ob.id_блока
";

$conditions = [];
$params = [];

// Фильтр по стажёру
if ($internId) {
    $conditions[] = "po.id_стажера = :intern_id";
    $params[':intern_id'] = $internId;
}

// Поиск по строке (имя стажёра, название блока, статус)
if (!empty($search)) {
    $conditions[] = "(s.ФИО LIKE :search OR ob.название LIKE :search OR po.Статус LIKE :search)";
    $params[':search'] = "%$search%";
}

if (count($conditions) > 0) {
    $sql .= " WHERE " . implode(' AND ', $conditions);
}

// Валидация поля сортировки (белый список)
$allowedSortFields = ['order_id', 'intern_name', 'block_name', 'order_date', 'status'];
if (!in_array($sortField, $allowedSortFields)) {
    $sortField = 'order_date';
}
$sortDir = ($sortDir === 'DESC') ? 'DESC' : 'ASC';

// Маппинг сортировки на реальные имена колонок
$sortColumn = match ($sortField) {
    'order_id'    => 'po.id_записи',
    'intern_name' => 's.ФИО',
    'block_name'  => 'ob.название',
    'order_date'  => 'po.Дата_начала',
    'status'      => 'po.Статус',
    default       => 'po.Дата_начала'
};

$sql .= " ORDER BY $sortColumn $sortDir";

$stmt = $pdo->prepare($sql);
$stmt->execute($params);
$data = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo json_encode($data);
?>