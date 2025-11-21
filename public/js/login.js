document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const formStatus = document.getElementById('formStatus');

    formStatus.textContent = '';
    formStatus.classList.remove('success', 'error');

    try {
        const response = await fetch('http://localhost:3001/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem('user', JSON.stringify(data.user));
            if (data.user && data.user.role === 'admin' && data.user.token) {
                localStorage.setItem('adminToken', data.user.token); 
            }
            formStatus.textContent = data.message;
            formStatus.classList.add('success');

            setTimeout(() => {
                if (data.redirectTo) {
                    window.location.href = data.redirectTo;
                }
            }, 1500);

        } else {
            formStatus.textContent = data.message;
            formStatus.classList.add('error');
        }

    } catch (error) {
        console.error('Login Error:', error);
        formStatus.textContent = 'حدث خطأ في الاتصال بالخادم. يرجى المحاولة مرة أخرى.';
        formStatus.classList.add('error');
    }
});