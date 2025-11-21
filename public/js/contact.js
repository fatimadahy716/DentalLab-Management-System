const contactForm = document.getElementById('contactForm');

if (contactForm) {
    contactForm.addEventListener('submit', function(e) {
        e.preventDefault(); // يمنع إرسال النموذج إلى الخادم
        
        // هنا يمكنك إضافة كود للتحقق من صحة الحقول (Validation) إذا أردت
        
        // إنشاء عنصر رسالة النجاح
        const message = document.createElement('p');
        message.textContent = "تم استلام رسالتك بنجاح. شكراً لتواصلك معنا!";
        message.style.cssText = "color: #22c55e; margin-top: 15px; text-align: center; font-weight: bold;";
        
        // إزالة الرسالة السابقة إن وجدت لمنع تكرارها
        const oldMessage = contactForm.querySelector('p[style*=' + 'color' + ']');
        if (oldMessage) {
            oldMessage.remove();
        }

        // إضافة الرسالة إلى أسفل النموذج
        contactForm.appendChild(message);
        
        // مسح الحقول بعد الإرسال
        contactForm.reset();
    });
}