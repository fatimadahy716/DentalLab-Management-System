function checkAuth() {
    const userDataString = localStorage.getItem('user'); 
    
    // التحقق 1: هل هناك أي شيء مخزن؟
    if (!userDataString || userDataString === 'null' || userDataString === 'undefined') {
        localStorage.clear();
        alert("يجب تسجيل الدخول أولاً للوصول لهذه الصفحة.");
        window.location.href = 'login.html'; 
        return false; 
    }
    
    try {
        const user = JSON.parse(userDataString);
        
        // التحقق 2: هل يحتوي الكائن على حقل 'token' الذي تم إضافته في الخادم؟
        if (!user || !user.email || !user.token) { 
            localStorage.clear();
            alert("فشل التحقق من الهوية. يرجى تسجيل الدخول مجدداً.");
            window.location.href = 'login.html';
            return false;
        }

        // إذا كان كل شيء صحيحاً، نرسل بيانات المستخدم لاستخدامها في الصفحة
        return user; 

    } catch (e) {
        // التحقق 3: فشل تحليل JSON (بيانات فاسدة)
        console.error("Failed to parse user data from localStorage:", e);
        localStorage.clear();
        alert("فشل التحقق من الهوية. يرجى تسجيل الدخول مجدداً.");
        window.location.href = 'login.html';
        return false;
    }
}

// تشغيل دالة الحماية
checkAuth();