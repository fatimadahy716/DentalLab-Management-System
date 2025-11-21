document.getElementById('registerForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const formStatus = document.getElementById('formStatus');

    formStatus.textContent = '';
    formStatus.classList.remove('success', 'error');

    try {
        const response = await fetch('http://localhost:3001/api/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, email, password })
        });

        const data = await response.json();

        if (response.ok) {
            formStatus.textContent = data.message;
            formStatus.classList.add('success');
            // إعادة توجيه المستخدم إلى صفحة تسجيل الدخول بعد 2 ثانية
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);
        } else {
            formStatus.textContent = data.message;
            formStatus.classList.add('error');
        }

    } catch (error) {
        console.error('Registration Error:', error);
        formStatus.textContent = 'حدث خطأ في الاتصال بالخادم. يرجى المحاولة مرة أخرى.';
        formStatus.classList.add('error');
    }
});