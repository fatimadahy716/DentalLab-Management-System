// **هنا يتم تعريف المتغيرات كلها مرة واحدة في بداية الملف**
// عناصر النموذج الرئيسية
const form = document.getElementById("orderForm");
const statusEl = document.getElementById("formStatus");
const prosthesisType = document.getElementById("prosthesisType");
const materialInput = document.getElementById("material");
const toothNumberInput = document.getElementById("toothNumber");
const bridgeFields = document.getElementById("bridgeFields");
const shadeInput = document.getElementById("shade");
const shadePreviewImage = document.getElementById("shadePreviewImage");
const recommendationAlert = document.getElementById("recommendationAlert");
const recommendedMaterialText = document.getElementById("recommendedMaterial");
const recommendedShadeText = document.getElementById("recommendedShade");

// العناصر الجديدة للإشعار الذكي
const smartAlert = document.getElementById("smartAlert");
const smartAlertText = smartAlert.querySelector('p');

// **منطق التحقق من ملف تعريف المستخدم عند تحميل الصفحة**
const user = JSON.parse(localStorage.getItem('user'));
if (user) {
    // إذا كان المستخدم موجوداً، قم بملء الحقول تلقائياً
    document.getElementById('doctorName').value = user.name || '';
    document.getElementById('clinicName').value = user.clinicName || '';
    document.getElementById('doctorPhone').value = user.phoneNumber || '';
    document.getElementById('specialization').value = user.specialization || '';
    document.getElementById('yearsExperience').value = user.yearsExperience || '';
    document.getElementById('licenseNumber').value = user.licenseNumber || '';

// التحقق من إكمال الملف الشخصي
    if (!user.profileComplete) {
        const alertMessage = "يجب عليك إكمال ملف تعريف عيادتك لمرة واحدة فقط.";
        alert(alertMessage);
        window.location.href = 'profile.html';
    }
} else {
    // إذا لم يكن هناك مستخدم، قم بإعادة التوجيه لصفحة تسجيل الدخول
    window.location.href = 'login.html';
}

// ----------------------------------------------------
// الدوال (Functions)
// ----------------------------------------------------

// فحص بسيط لرقم السن وفق FDI
function isValidFDIList(value) {
    if (!value) return false;
    const parts = value.split(",").map(s => s.trim()).filter(Boolean);
    if (parts.length === 0) return false;
    return parts.every(p => /^\d{2}$/.test(p) && Number(p) >= 11 && Number(p) <= 48 || Number(p) >= 51 && Number(p) <= 85);
}

// عرض رسائل الخطأ بجانب الحقل
function setError(input, message = "") {
    const field = input.closest(".field");
    const errorEl = field ? field.querySelector(".error") : null;
    if (errorEl) errorEl.textContent = message;
    input.setAttribute("aria-invalid", message ? "true" : "false");
}

// الكود الجديد (المعدل) للدالة validateForm()

// التحقق من الحقول المطلوبة
function validateForm() {
    let valid = true;
    
    // ** تم تحديث التحقق ليشمل حقول الطبيب والمريض الجديدة **
    if (!document.getElementById('doctorName').value.trim()) {
        setError(document.getElementById('doctorName'), "هذا الحقل مطلوب");
        valid = false;
    } else setError(document.getElementById('doctorName'));
    
    if (!document.getElementById('clinicName').value.trim()) {
        setError(document.getElementById('clinicName'), "هذا الحقل مطلوب");
        valid = false;
    } else setError(document.getElementById('clinicName'));
    
    if (!document.getElementById('doctorPhone').value.trim()) {
        setError(document.getElementById('doctorPhone'), "هذا الحقل مطلوب");
        valid = false;
    } else setError(document.getElementById('doctorPhone'));

    if (!document.getElementById('patientName').value.trim()) {
        setError(document.getElementById('patientName'), "هذا الحقل مطلوب");
        valid = false;
    } else setError(document.getElementById('patientName'));


    // tooth number
    if (!isValidFDIList(form.tooth_number.value.trim())) {
        setError(form.tooth_number, "أدخل أرقام FDI صحيحة (مثال: 11 أو 11, 21)");
        valid = false;
    } else setError(form.tooth_number);

    // type
    if (!form.type.value.trim()) {
        setError(form.type, "اختر نوع التعويض");
        valid = false;
    } else setError(form.type);

    // material
    if (!form.material.value.trim()) {
        setError(form.material, "اختر نوع المادة");
        valid = false;
    } else setError(form.material);

    // shade (مرة واحدة فقط)
    if (!form.shade.value.trim()) {
        setError(form.shade, "أدخل درجة اللون");
        valid = false;
    } else setError(form.shade);
    
    // ملاحظة: حقول part1 إلى part9 وحقل split (إذا كان موجوداً)
    // لا يتم التحقق من إلزاميتها هنا، وهي خطوة صحيحة.

    return valid;
}

// دالة فحص الإشعار الذكي
function checkSmartAlert() {
    const type = prosthesisType.value.trim();
    const material = materialInput.value.trim();
    
    smartAlert.classList.add("hidden");
    smartAlertText.textContent = "";

    // هي كرمال لو اخترت فينير وزيركون بطلعلي تحت ملاحظة
    if (type === "فينير (قشرة)" && material === "زيركون") {
        smartAlertText.textContent = "ملاحظة: للحصول على أفضل النتائج الجمالية للوجه، قد يكون الإيماكس (E.max) خيارًا أفضل من الزيركون.";
        smartAlert.classList.remove("hidden");
    }
}

async function getRecommendations() {
    const type = prosthesisType.value.trim();

    // إذا لم يختر الطبيب نوع تعويض، لا تُظهر أي توصيات
    if (!type) {
        recommendationAlert.classList.add("hidden");
        return;
    }

    try {
        // نرسل طلب إلى الخادم للحصول على التوصيات
        const response = await fetch(`http://localhost:3001/api/recommendations?type=${encodeURIComponent(type)}`);
        if (!response.ok) throw new Error('فشل في جلب التوصيات');

        const data = await response.json();

        // نتحقق إذا كانت هناك توصيات
        const hasMaterialRec = data.recommendedMaterial;
        const hasShadeRec = data.recommendedShade; // لاحظ هنا قمنا بتغيير recommendedShaded إلى recommendedShade

        // إذا وُجدت توصيات، قم بعرضها
        if (hasMaterialRec || hasShadeRec) {
            recommendedMaterialText.textContent = hasMaterialRec ? `المادة المقترحة: ${data.recommendedMaterial}` : '';
            recommendedShadeText.textContent = hasShadeRec ? `اللون المقترح: ${data.recommendedShade}` : '';
            recommendationAlert.classList.remove("hidden"); // أظهر المربع
        } else {
            recommendationAlert.classList.add("hidden"); // أخفِ المربع
        }
    } catch (error) {
        console.error("حدث خطأ أثناء جلب التوصيات:", error);
        recommendationAlert.classList.add("hidden");
    }
}


// ----------------------------------------------------
// المستمعون للأحداث (Event Listeners)
// ----------------------------------------------------

// إظهار/إخفاء حقول الجسر تلقائياً
prosthesisType.addEventListener("change", () => {
    const isBridge = prosthesisType.value.trim() === "جسر";
    bridgeFields.classList.toggle("hidden", !isBridge);
    getRecommendations();
});

// عند إرسال النموذج
form.addEventListener("submit", async (e) => {
    e.preventDefault();
    statusEl.textContent = "";

    if (!validateForm()) {
        statusEl.textContent = "تحقق من الحقول المظللة بالخطأ ثم أعد الإرسال.";
        return;
    }

    const user = JSON.parse(localStorage.getItem('user'));
    
    const formData = new FormData(form);
    const payload = {};
    for (const [k, v] of formData.entries()) {
        payload[k] = v;
    }

    // **هنا تم دمج كل الأجزاء التي أضفناها سابقاً**
    // إضافة بيانات الطبيب الجديدة إلى كائن الـ payload
    payload.doctorName = document.getElementById('doctorName').value;
    payload.clinicName = document.getElementById('clinicName').value;
    payload.doctorPhone = document.getElementById('doctorPhone').value;
    payload.specialization = document.getElementById('specialization').value;
    payload.yearsExperience = document.getElementById('yearsExperience').value;
    payload.licenseNumber = document.getElementById('licenseNumber').value;
    
    // إضافة بيانات المريض الجديدة إلى كائن الـ payload
    payload.patientName = document.getElementById('patientName').value;
    payload.patientId = document.getElementById('patientId').value;
    payload.patientPhone = document.getElementById('patientPhone').value;
    
    // نهاية الكود الجديد
    
    if (user && user.email) {
        payload.userEmail = user.email;
    } else {
        statusEl.textContent = "خطأ: يرجى تسجيل الدخول قبل إرسال الطلب.";
        return;
    }

    try {
        const response = await fetch('http://localhost:3001/api/orders', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });
        
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || 'فشل في الإرسال');
        }

        console.log('Success:', data);
        statusEl.textContent = "تم إرسال الطلب بنجاح!";
        statusEl.style.color = '#22c55e';
    } catch (error) {
        console.error('Error:', error);
        statusEl.textContent = `حدث خطأ أثناء الإرسال: ${error.message}`;
        statusEl.style.color = '#dc2626';
    }
});

// تنظيف الأخطاء عند الكتابة
document.querySelectorAll("#orderForm input, #orderForm select, #orderForm textarea")
    .forEach(el => el.addEventListener("input", () => setError(el)));

// استدعاء دالة الإشعار الذكي عند تغيير الحقول
prosthesisType.addEventListener("change", checkSmartAlert);
materialInput.addEventListener("change", checkSmartAlert);
toothNumberInput.addEventListener("input", checkSmartAlert);



// ----------------------------------------------------
// تفعيل نظام التقييم بالنجوم
// ----------------------------------------------------
const ratingStars = document.getElementById("rating");
const ratingInput = document.getElementById("ratingInput");

ratingStars.addEventListener("click", (e) => {
    const star = e.target;
    if (star.tagName === "SPAN") {
        const value = star.dataset.value;
        ratingInput.value = value;
        updateStars(value);
    }
});

function updateStars(activeValue) {
    const stars = ratingStars.querySelectorAll("span");
    stars.forEach(star => {
        if (star.dataset.value <= activeValue) {
            star.classList.add("active");
        } else {
            star.classList.remove("active");
        }
    });
}

// تحديث النجوم عند تحميل الصفحة بناءً على القيمة الافتراضية
updateStars(ratingInput.value);

// ----------------------------------------------------
// تفعيل زر مسح المدخلات
// ----------------------------------------------------
const resetButton = document.querySelector('button[type="reset"]');

resetButton.addEventListener("click", () => {
    // إعادة تعيين كل حقول النموذج
    form.reset();

    // إخفاء حقول الجسر وإزالة الأخطاء
    bridgeFields.classList.add("hidden");
    document.querySelectorAll(".error").forEach(el => el.textContent = "");

    // إعادة صورة معاينة اللون إلى الصورة الافتراضية
    shadePreviewImage.src = `images/default.png`;

    // إخفاء التنبيه الذكي
    smartAlert.classList.add("hidden");
});