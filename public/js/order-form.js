// هذه الأسطر يجب حذفها من ملف server.js
const orderForm = document.getElementById('orderForm');

orderForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData(orderForm);

    try {
        const response = await fetch('/api/orders', {
            method: 'POST',
            body: formData 
        });

        const result = await response.json();

        if (response.ok) {
            alert(result.message);
        } else {
            alert(result.message);
        }
    } catch (error) {
        console.error('Error submitting order:', error);
        alert('An error occurred. Please try again.');
    }
});