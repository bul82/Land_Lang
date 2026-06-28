document.getElementById('start-quiz').addEventListener('click', function() {
    alert('Тест на уровень языка начнется сейчас!');
});

document.getElementById('feedback-form').addEventListener('submit', function(event) {
    event.preventDefault();
    alert('Форма отправлена!');
    // Здесь можно добавить AJAX-запрос для отправки данных на сервер
});