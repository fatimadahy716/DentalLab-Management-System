        document.getElementById('unlockForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('doctorEmail').value;
            const statusEl = document.getElementById('unlockStatus');
            
            statusEl.textContent = 'جاري تنفيذ الأمر...';
            statusEl.style.color = 'blue';

            try {
                // إرسال الطلب إلى مسار الخادم
                    const adminToken = localStorage.getItem('adminToken'); // استخراج التوكن مرة واحدة
                    const response = await fetch('http://localhost:3001/api/admin/unlock-profile', {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json', 
                        'Authorization': 'Bearer ' + localStorage.getItem('adminToken')
                    },

                    body: JSON.stringify({ email: email })
                });

                const result = await response.json();

                if (response.ok) {
                    statusEl.textContent = '✅ ' + result.message;
                    statusEl.style.color = '#22c55e'; // أخضر للنجاح
                } else {
                    throw new Error(result.message || 'فشل غير معروف في العملية.');
                }
            } catch (error) {
                console.error('Error unlocking profile:', error);
                statusEl.textContent = '❌ حدث خطأ: ' + error.message;
                statusEl.style.color = '#dc2626'; // أحمر للخطأ
            }
        });
        // ----------------------------------------------------------------------
// 💡 هنا يبدأ الكود الجديد الذي ترسله (جلب وعرض الأطباء)
// ----------------------------------------------------------------------

// متغير لتخزين جميع بيانات الأطباء التي تم جلبها
let allDoctors = [];

// دالة لجلب بيانات الأطباء
async function fetchDoctorsData() {
    try {
        // 💡 تأكد من تضمين الـ Authorization Header
        const token = localStorage.getItem('adminToken');
        if (!token) {
            console.error('Admin token not found.');
            return;
        }

        const response = await fetch('http://localhost:3001/api/admin/doctors', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const doctors = await response.json();
        allDoctors = doctors; // تخزين جميع الأطباء
        displayDoctors(allDoctors); // عرضها فوراً
    } catch (error) {
        console.error('Error fetching doctors data:', error);
        // عرض رسالة خطأ في الواجهة (تحتاج لـ tbody معرف بـ doctor-list)
        const doctorListEl = document.getElementById('doctors-list-body'); 
        if(doctorListEl) doctorListEl.innerHTML = `<tr><td colspan="9" style="text-align:center; color: red;">فشل في جلب البيانات: ${error.message}</td></tr>`;
    }
}

// دالة لعرض البيانات في الجدول وتطبيق التصفية والبحث
function displayDoctors(doctorsToDisplay) {
    const doctorListEl = document.getElementById('doctors-list-body');     
        if (!doctorListEl) return;

    doctorListEl.innerHTML = ''; // تفريغ الجدول القديم

    if (doctorsToDisplay.length === 0) {
        doctorListEl.innerHTML = `<tr><td colspan="9" style="text-align:center;">لا توجد بيانات أطباء مطابقة.</td></tr>`;
        return;
    }

    doctorsToDisplay.forEach(doctor => {
        const isComplete = doctor.profileComplete ? 'مكتملة (نعم)' : 'غير مكتملة (لا)';
        const completeClass = doctor.profileComplete ? 'status-complete' : 'status-incomplete'; // تحتاج لتعريف هذه الكلاسات في CSS

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${doctor.name || '-'}</td>
            <td>${doctor.email || '-'}</td>
            <td>${doctor.clinicName || '-'}</td>
            <td>${doctor.phoneNumber || '-'}</td>
            <td>${doctor.city || '-'}</td>
            <td>${doctor.specialization || '-'}</td>
            <td>
                <span class="${completeClass}">${isComplete}</span>
            </td>
            <td>${new Date(doctor.updatedAt).toLocaleDateString()}</td>
            <td>
                <button class="btn-small btn-update" data-email="${doctor.email}">عرض/تحديث</button>
            </td>
        `;
        doctorListEl.appendChild(row);
    });
}

// دالة لتطبيق التصفية والبحث
function filterAndSearchDoctors() {
    const searchTerm = document.getElementById('doctor-search').value.toLowerCase();
    const filterValue = document.getElementById('profile-status-filter').value; // 'all', 'complete', 'incomplete'

    const filtered = allDoctors.filter(doctor => {
        // 1. التصفية حسب حالة الملف (profileComplete)
        const statusMatch = filterValue === 'all' || 
                            (filterValue === 'complete' && doctor.profileComplete) ||
                            (filterValue === 'incomplete' && !doctor.profileComplete);

        // 2. البحث حسب الاسم أو الإيميل أو اسم العيادة
        const searchMatch = (
            (doctor.name && doctor.name.toLowerCase().includes(searchTerm)) ||
            (doctor.email && doctor.email.toLowerCase().includes(searchTerm)) ||
            (doctor.clinicName && doctor.clinicName.toLowerCase().includes(searchTerm))
        );

        return statusMatch && searchMatch;
    });

    displayDoctors(filtered);
}

// إضافة مُستمعي الأحداث
document.getElementById('doctor-search').addEventListener('input', filterAndSearchDoctors);
document.getElementById('profile-status-filter').addEventListener('change', filterAndSearchDoctors);

// استدعاء الدالة لجلب البيانات عند تحميل الصفحة
fetchDoctorsData();