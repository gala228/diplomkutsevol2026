<?php
// config/database.php
$host = 'localhost';
$dbname = 'диплом';        // название вашей базы данных
$user = 'root';            // пользователь MySQL (обычно root)
$pass = '';                // пароль (если есть)

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    die(json_encode(['error' => 'Ошибка подключения: ' . $e->getMessage()]));
}
?>