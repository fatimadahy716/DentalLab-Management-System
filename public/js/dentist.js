// ==========================================================
// 1. تعريف المتغيرات والأدوات الرئيسية في النطاق العام
// ==========================================================
// جلب بريد المستخدم من التخزين المحلي (للاستخدام في API و WebSocket)
const userEmail = localStorage.getItem('userEmail');

// ربط عناصر HTML المطلوبة
const editRequestButton = document.getElementById('editRequestButton');
// const profileForm = document.getElementById('profileForm'); // نموذج الملف الشخصي قد لا يكون مطلوباً بشكل مباشر
const chatInput = document.getElementById('chat-input');
const chatForm = document.getElementById('chat-form');
const chatMessagesList = document.getElementById('chat-messages');

let ws; // لمتغير WebSocket
let currentDoctorData = {}; // لحفظ البيانات الأصلية للطبيب بعد الجلب

// ==========================================================
// 2. دوال الدردشة (WebSocket)
// ==========================================================

function connectWebSocket() {
    if (!userEmail) return;

    // اتصال WebSocket: يستخدم إيميل الطبيب ونوع المستخدم 'dentist' للتمييز على الخادم
    // تأكد من تغيير 'ws://localhost:3000' إلى عنوان خادمك الفعلي
    ws = new WebSocket(`ws://localhost:3000?email=${userEmail}&userType=dentist`);

    ws.onopen = () => {
        console.log("WebSocket متصل بنجاح كطبيب.");
    };

    ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        // senderType سيكون 'admin' للرسائل القادمة من الإدارة
        displayMessage(message.content, message.senderType);
        
        // يمكنك إضافة إشعار هنا (مثل نقطة حمراء أو صوت)
        console.log("رسالة جديدة من الإدارة:", message.content);
    };

    ws.onclose = () => {
        console.log("WebSocket مغلق. محاولة إعادة الاتصال بعد 5 ثوانٍ...");
        setTimeout(connectWebSocket, 5000); // إعادة محاولة الاتصال التلقائي
    };

    ws.onerror = (error) => {
        console.error("خطأ في WebSocket:", error);
    };
}

function displayMessage(content, senderType) {
    if (!chatMessagesList) return;
    
    const messageItem = document.createElement('li');
    // استخدام التنسيق الذي عرفناه في admin.css (لأن الطبيب يستخدم نفس التنسيق)
    const className = senderType === 'admin' ? 'admin-message' : 'dentist-message';
    messageItem.className = className;
    messageItem.textContent = content;
    chatMessagesList.appendChild(messageItem);
    
    // التمرير إلى الأسفل لعرض أحدث رسالة
    chatMessagesList.scrollTop = chatMessagesList.scrollHeight;
}

function sendChatMessage(e) {
    e.preventDefault();
    if (!chatInput || !chatInput.value.trim() || !userEmail) return;

    const messageContent = chatInput.value.trim();
    
    if (ws && ws.readyState === WebSocket.OPEN) {
        const message = {
            senderEmail: userEmail,
            senderType: 'dentist',
            recipientEmail: 'admin@system.com', // الإيميل الافتراضي للمسؤول
            content: messageContent,
            timestamp: new Date().toISOString()
        };

        ws.send(JSON.stringify(message));
        
        // عرض الرسالة المرسلة في قائمة الدردشة
        displayMessage(messageContent, 'dentist'); 
        
        chatInput.value = ''; // تفريغ حقل الإدخال
    } else {
        alert("فشل الاتصال بالدردشة. يرجى إعادة تحميل الصفحة.");
    }
}


// ==========================================================
// 3. دوال الملف الشخصي وطلب التعديل
// ==========================================================

// الدالة الرئيسية لجلب البيانات وعرضها وقفل الحقول
async function initializeProfilePage() {
    if (!userEmail) {
        alert("يرجى تسجيل الدخول أولاً.");
        window.location.href = 'login.html';
        return;
    }

    // جلب عناصر الإدخال
    const nameInput = document.getElementById('doctorName');
    const clinicInput = document.getElementById('clinicName');
    const specializationInput = document.getElementById('specialization');
    const phoneInput = document.getElementById('phoneNumber');
    const addressInput = document.getElementById('clinicAddress');

    try {
        const response = await fetch(`/api/dentist/profile?email=${userEmail}`);
        if (!response.ok) throw new Error("فشل في جلب بيانات الملف الشخصي.");
        
        currentDoctorData = await response.json();
        
        // عرض البيانات الحالية
        nameInput.value = currentDoctorData.name || '';
        clinicInput.value = currentDoctorData.clinicName || '';
        specializationInput.value = currentDoctorData.specialization || '';
        phoneInput.value = currentDoctorData.phoneNumber || '';
        addressInput.value = currentDoctorData.clinicAddress || '';

        // تطبيق منطق قفل الحقول بناءً على اكتمال الملف
        if (currentDoctorData.profileComplete) {
            // قفل الحقول الحساسة
            nameInput.disabled = true;
            clinicInput.disabled = true;
            specializationInput.disabled = true;
            phoneInput.disabled = true;
            // إظهار زر طلب التعديل
            if (editRequestButton) {
                editRequestButton.style.display = 'block';
            }
        } else {
            // الملف غير مكتمل، يمكن التعديل
            if (editRequestButton) {
                editRequestButton.style.display = 'none';
            }
        }

    } catch (error) {
        console.error("خطأ في جلب الملف الشخصي:", error);
    }
}

// دالة إرسال طلب التعديل إلى الإدارة
async function handleEditRequest(e) {
    e.preventDefault();
    
    const nameInput = document.getElementById('doctorName');
    const clinicInput = document.getElementById('clinicName');
    const specializationInput = document.getElementById('specialization');
    const phoneInput = document.getElementById('phoneNumber');
    
    // التحقق من وجود الحقول قبل المتابعة (لمنع الخطأ الذي ظهر سابقاً)
    if (!nameInput || !clinicInput || !specializationInput || !phoneInput) {
        console.error("خطأ: لم يتم العثور على حقول الإدخال.");
        alert("خطأ داخلي: يرجى التأكد من وجود جميع حقول الملف الشخصي.");
        return;
    }
    
    // يجب أن تكون هذه الحقول مفتوحة مؤقتاً لتعديلها أو أن يتم التعديل في نموذج منبثق
    // لغرض التطبيق الحالي: نفترض أن القيم الحالية في الحقول هي القيم المطلوبة للتعديل
    if (!confirm("هل أنت متأكد من إرسال طلب تعديل البيانات الحساسة للإدارة؟ سيتم قفل هذه الحقول حتى تتم مراجعة الطلب.")) {
        return;
    }
    
    const changesToSubmit = {
        name: nameInput.value,
        clinicName: clinicInput.value,
        specialization: specializationInput.value,
        phoneNumber: phoneInput.value
    };

    try {
        const response = await fetch('/api/dentist/request-edit', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-user-email': userEmail 
            },
            body: JSON.stringify({ 
                updateFields: changesToSubmit,
                doctorName: changesToSubmit.name, // بيانات إضافية للتوثيق
                doctorEmail: userEmail
            })
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'فشل إرسال طلب التعديل.');
        }

        alert("✅ تم إرسال طلب تعديل الملف الشخصي بنجاح. سيتم قفل الحقول ومراجعة التغييرات من قبل الإدارة.");
        
        // قفل الحقول بعد الإرسال الناجح لانتظار موافقة الإدارة
        nameInput.disabled = true;
        clinicInput.disabled = true;
        specializationInput.disabled = true;
        phoneInput.disabled = true;
        
        // إخفاء زر طلب التعديل
        if (editRequestButton) {
            editRequestButton.style.display = 'none';
        }
        
    } catch (error) {
        console.error("خطأ في إرسال طلب التعديل:", error);
        alert('فشل في إرسال طلب التعديل: ' + error.message);
    }
}


// ==========================================================
// 4. ربط الأحداث (DOMContentLoaded)
// ==========================================================

document.addEventListener('DOMContentLoaded', () => {
    // 1. تهيئة صفحة الملف الشخصي (جلب البيانات والقفل)
    initializeProfilePage(); 

    // 2. ربط الدالة بحدث النقر على زر طلب التعديل
    if (editRequestButton) {
        editRequestButton.addEventListener('click', handleEditRequest); 
    }
    
    // 3. ربط الدردشة
    connectWebSocket(); 
    if (chatForm) {
        chatForm.addEventListener('submit', sendChatMessage);
    }
    
    // ملاحظة: يجب أن تتأكد من استدعاء هذه الدوال مرة واحدة فقط
    // وإذا كان لديك منطق آخر لـ dentist.js، يجب دمجه بعناية
});