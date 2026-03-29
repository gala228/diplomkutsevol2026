<?php
// api/get_trainees.php
header('Content-Type: application/json');
require_once '../config/database.php';

try {
    // Получаем всех стажёров
    $stmt = $pdo->query("SELECT * FROM стажеры ORDER BY id_стажера");
    $trainees = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Для каждого стажёра подгружаем курсы (из прохождения обучения) и аттестации
    foreach ($trainees as &$t) {
        $traineeId = $t['id_стажера'];
        
        // Курсы (прохождение обучения)
        $stmtCourses = $pdo->prepare("
            SELECT ob.название, po.Статус, po.Дата_начала, po.Дата_окончания
            FROM прохождение_обучения po
            JOIN обучающие_блоки ob ON po.id_блока = ob.id_блока
            WHERE po.id_стажера = ?
        ");
        $stmtCourses->execute([$traineeId]);
        $courses = $stmtCourses->fetchAll(PDO::FETCH_ASSOC);
        // Преобразуем в формат, ожидаемый фронтендом: [{ name, progress }]
        // Для простоты progress будем вычислять как 100, если статус 'завершено', иначе 0 (или можно добавить поле прогресса)
        $formattedCourses = [];
        foreach ($courses as $c) {
            $progress = ($c['Статус'] === 'завершено') ? 100 : 0;
            $formattedCourses[] = ['name' => $c['название'], 'progress' => $progress];
        }
        $t['courses'] = $formattedCourses;

        // Аттестации
        $stmtAtt = $pdo->prepare("
            SELECT Дата, Результат, комментарий
            FROM аттестация
            WHERE id_стажера = ?
            ORDER BY Дата DESC
        ");
        $stmtAtt->execute([$traineeId]);
        $attestations = $stmtAtt->fetchAll(PDO::FETCH_ASSOC);
        $t['attestations'] = $attestations;

        // Добавим mentorId (если нужно, можно получить из таблицы наставники через связь, но пока оставим пустым)
        // В текущей схеме нет прямой связи стажёр-наставник в таблице стажеры. Но в демо-данных в таблице стажеры есть поле Отдел,
        // а наставники тоже имеют отдел. Можно связать по отделу, но для простоты оставим mentorId = null.
        $t['mentorId'] = null;
        $t['mentor'] = ''; // позже можно вычислить
    }

    echo json_encode($trainees);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>