document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('profileForm');
    const statusEl = document.getElementById('formStatus');
    
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
        document.getElementById('doctorName').value = user.name || ''; // افترض أن الاسم مخزن في user.name
        document.getElementById('email').value = user.email || '';
        }
    async function fetchAndPopulateProfile() {
        if (!user || !user.email) return;

        try {
            const response = await fetch(`http://localhost:3001/api/get-profile-details?email=${user.email}`);
            
            if (response.ok) {
                const profile = await response.json();
                document.getElementById('clinicName').value = profile.clinicName || '';
                document.getElementById('phoneNumber').value = profile.phoneNumber || '';
                document.getElementById('specialization').value = profile.specialization || '';
                document.getElementById('yearsExperience').value = profile.yearsExperience || '';
                document.getElementById('licenseNumber').value = profile.licenseNumber || '';
                document.getElementById('city').value = profile.city || '';
            }
        } catch (error) {
            console.error("فشل في جلب تفاصيل الملف:", error);
        }
    }
    
    if (user && user.email) {
        fetchAndPopulateProfile();
    }

    // **2. التعامل مع إرسال النموذج (الكود المصحح والمدمج)**
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        statusEl.textContent = 'جاري الحفظ...';
        statusEl.style.color = '#333';
        
        // 1. جمع البيانات من النموذج
        const formData = {
            email: user.email,
            clinicName: document.getElementById('clinicName').value,
            phoneNumber: document.getElementById('phoneNumber').value,
            specialization: document.getElementById('specialization').value,
            yearsExperience: document.getElementById('yearsExperience').value,
            licenseNumber: document.getElementById('licenseNumber').value,
            city: document.getElementById('city').value,
        };

        try {
            // 2. إرسال البيانات إلى الخادم (عملية إرسال واحدة فقط)
            const response = await fetch('http://localhost:3001/api/update-profile', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const result = await response.json();

            // 3. التحقق من رد الخادم (بما في ذلك حالة 403 الجديدة)
            if (response.status === 403) {
                // حالة الرفض الأمني: الملف مقفل
                statusEl.textContent = "حدث خطأ: " + result.message; 
                statusEl.style.color = '#dc2626';

                // إرسال الإشعار الفوري إلى الأدمن
                await fetch('http://localhost:3001/api/admin/request-profile-update', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userEmail: user.email, userName: user.name })
                });
                console.log("✅ تم إرسال طلب إشعار بتعديل الملف الشخصي إلى الفني.");
                
                return; // إنهاء الدالة بعد إرسال الإشعار
            }


            if (response.ok) {
                // حالة النجاح: تم الحفظ بنجاح
                statusEl.textContent = result.message;
                statusEl.style.color = '#22c55e';
                
                // تحديث بيانات المستخدم في التخزين المحلي بعد الحفظ الناجح
                localStorage.setItem('user', JSON.stringify(result.user));

            } else {
                // أي خطأ آخر بخلاف 403
                throw new Error(result.message || 'فشل في حفظ البيانات');
            }

        } catch (error) {
            console.error('Error:', error);
            statusEl.textContent = `حدث خطأ: ${error.message}`;
            statusEl.style.color = '#dc2626';
        }
    });
});