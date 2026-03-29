<?php
// api/update_course_progress.php
header('Content-Type: application/json');
require_once '../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Метод не разрешён']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);
$traineeId = $data['traineeId'] ?? 0;
$courseName = $data['courseName'] ?? '';
$progress = $data['progress'] ?? 0; // 0..100

if (!$traineeId || empty($courseName)) {
    http_response_code(400);
    echo json_encode(['error' => 'Недостаточно данных']);
    exit;
}

try {
    // Находим id_блока по названию
    $stmt = $pdo->prepare("SELECT id_блока FROM обучающие_блоки WHERE название = ?");
    $stmt->execute([$courseName]);
    $block = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$block) {
        http_response_code(404);
        echo json_encode(['error' => 'Курс не найден']);
        exit;
    }
    $blockId = $block['id_блока'];

    // Определяем статус: если progress >= 100 -> завершено, иначе в процессе
    $status = ($progress >= 100) ? 'завершено' : 'в процессе';

    // Проверяем, есть ли уже запись
    $stmt = $pdo->prepare("SELECT id_записи FROM прохождение_обучения WHERE id_стажера = ? AND id_блока = ?");
    $stmt->execute([$traineeId, $blockId]);
    $record = $stmt->fetch(PDO::FETCH_ASSOC);
    if ($record) {
        // Обновляем статус и дату окончания, если завершено
        $sql = "UPDATE прохождение_обучения SET Статус = :status, Дата_окончания = IF(:status = 'завершено', CURDATE(), NULL) WHERE id_записи = :id";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([':status' => $status, ':id' => $record['id_записи']]);
    } else {
        // Создаём новую запись
        $sql = "INSERT INTO прохождение_обучения (id_стажера, id_блока, Дата_начала, Статус) VALUES (?, ?, CURDATE(), ?)";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$traineeId, $blockId, $status]);
    }

    echo json_encode(['success' => true]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>