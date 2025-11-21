document.addEventListener('DOMContentLoaded', async () => {
    const ordersList = document.getElementById('admin-orders-list');
    const searchInput = document.getElementById('search-input');
    const statusFilter = document.getElementById('status-filter');
    let allOrders = []; // A place to store all orders
    const totalOrdersEl = document.getElementById('totalOrders');
    const inProgressEl = document.getElementById('inProgressOrders');
    const completedEl = document.getElementById('completedOrders');
    const logoutBtn = document.getElementById('logoutBtn');

    // وظيفة لتحديث حالة الطلب على السيرفر
    async function updateOrderStatus(orderId, newStatus) {
        try {
            const response = await fetch('http://localhost:3001/api/admin/update-status', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderId, status: newStatus })
            });

            if (!response.ok) {
                throw new Error('Failed to update status.');
            }

            console.log(`✅ تم تحديث الطلب #${orderId.slice(-6)} إلى: ${newStatus}`);

            // استدعاء دالة لتحديث الواجهة مباشرة
            updateDOMForOrder(orderId, newStatus); 
        } catch (error) {
            console.error("❌ حدث خطأ أثناء تحديث حالة الطلب:", error);
            alert("حدث خطأ أثناء تحديث حالة الطلب.");
        }
    }

    // وظيفة لتحديث حالة طلب واحد على الواجهة
    function updateDOMForOrder(orderId, newStatus) {
        const orderRow = ordersList.querySelector(`[data-order-id="${orderId}"]`).closest('tr');

        if (orderRow) {
            const statusSpan = orderRow.querySelector('.status-badge');
            const statusSelector = orderRow.querySelector('.status-selector');
            
            const newStatusClass = newStatus.replace(' ', '-').toLowerCase();
            statusSpan.textContent = newStatus;
            statusSpan.className = `status-badge status-${newStatusClass}`;

            if (statusSelector) {
                statusSelector.value = newStatus;
            }
            updateStats();
            console.log(`✅ تم تحديث الواجهة للطلب #${orderId.slice(-6)}`);
        }
    }
    
    // وظيفة لعرض الطلبات في الجدول
    function displayOrders(orders) {
        ordersList.innerHTML = '';
        if (orders.length === 0) {
            ordersList.innerHTML = `<tr><td colspan="9" style="text-align:center;">لا توجد طلبات حتى الآن.</td></tr>`;
            return;
        }

        orders.forEach(order => {
            const statusClass = order.status ? order.status.replace(' ', '-').toLowerCase() : 'new';
            const orderRow = document.createElement('tr');
            // تأكد من إضافة data-order-id هنا
            orderRow.dataset.orderId = order._id;
            orderRow.innerHTML = `
                <td>#${order._id.slice(-6)}</td>
                <td>${order.doctorName || '-'} <br> <small>${order.clinicName || ''}</small></td>
                <td>${order.patientName || '-'}</td>
                <td>${order.type || '-'}</td>
                <td>${order.material || '-'}</td>
                <td>${order.shade || '-'}</td>
                <td>${new Date(order.createdAt).toLocaleDateString()}</td>
                <td>
                    <span class="status-badge status-${statusClass}">${order.status || 'جديد'}</span>
                </td>
                <td>
                    <select class="status-selector" data-order-id="${order._id}">
                        <option value="جديد" ${order.status === 'جديد' ? 'selected' : ''}>جديد</option>
                        <option value="قيد التنفيذ" ${order.status === 'قيد التنفيذ' ? 'selected' : ''}>قيد التنفيذ</option>
                        <option value="منجز" ${order.status === 'منجز' ? 'selected' : ''}>منجز</option>
                        <option value="ملغى" ${order.status === 'ملغى' ? 'selected' : ''}>ملغى</option>
                    </select>
                    <button class="details-btn" data-order-id="${order._id}">تفاصيل</button>
                </td>
            `;
            ordersList.appendChild(orderRow);
        });
    }

    // وظيفة تحديث الإحصائيات (مفصولة لتجنب التكرار)
// Function to update stats and draw charts
async function updateStats() {
    try {
        const timestamp = new Date().getTime();
        const response = await fetch(`http://localhost:3001/api/admin/orders?t=${timestamp}`);
        const orders = await response.json();
        
        let inProgressCount = 0;
        let completedCount = 0;
        let newCount = 0;
        let cancelledCount = 0;
        
        // Count statuses and group orders by doctor
        const doctorCounts = {};
        orders.forEach(order => {
            const status = order.status || 'جديد';
            if (status === 'قيد التنفيذ') inProgressCount++;
            if (status === 'منجز') completedCount++;
            if (status === 'جديد') newCount++;
            if (status === 'ملغى') cancelledCount++;

            const doctorName = order.doctorName || 'غير معروف';
            doctorCounts[doctorName] = (doctorCounts[doctorName] || 0) + 1;
        });

        // Update the stats cards
        totalOrdersEl.textContent = orders.length.toString();
        inProgressEl.textContent = inProgressCount.toString();
        completedEl.textContent = completedCount.toString();
        
        // --- Draw Charts ---
        
        // Data for the status pie chart
        const statusData = {
            labels: ['جديد', 'قيد التنفيذ', 'منجز', 'ملغى'],
            datasets: [{
                data: [newCount, inProgressCount, completedCount, cancelledCount],
                backgroundColor: ['#28a745', '#007bff', '#17a2b8', '#dc3545'],
                hoverOffset: 4
            }]
        };

        // Configuration for the status pie chart
        const statusConfig = {
            type: 'pie',
            data: statusData,
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    title: {
                        display: false
                    }
                }
            },
        };

        // Draw the status chart
        const statusCtx = document.getElementById('statusChart').getContext('2d');
        if (window.statusChartInstance) {
            window.statusChartInstance.destroy();
        }
        window.statusChartInstance = new Chart(statusCtx, statusConfig);


        // Data for the doctor bar chart
        const doctorData = {
            labels: Object.keys(doctorCounts),
            datasets: [{
                label: 'عدد الطلبات',
                data: Object.values(doctorCounts),
                backgroundColor: 'rgba(54, 162, 235, 0.5)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1
            }]
        };

        // Configuration for the doctor bar chart
        const doctorConfig = {
            type: 'bar',
            data: doctorData,
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    title: {
                        display: false
                    }
                }
            },
        };

        // Draw the doctor chart
        const doctorCtx = document.getElementById('doctorChart').getContext('2d');
        if (window.doctorChartInstance) {
            window.doctorChartInstance.destroy();
        }
        window.doctorChartInstance = new Chart(doctorCtx, doctorConfig);

    } catch (error) {
        console.error("❌ فشل في تحديث الإحصائيات:", error);
    }
}

    // وظيفة جلب جميع الطلبات من السيرفر
    async function fetchAllOrders() {
        try {
            const timestamp = new Date().getTime();
            const response = await fetch(`http://localhost:3001/api/admin/orders?t=${timestamp}`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const orders = await response.json();
            allOrders = orders; // Store all orders here
            displayOrders(allOrders); // Display all orders initially
            updateStats();
        } catch (error) {
            console.error("❌ فشل في جلب الطلبات:", error);
            ordersList.innerHTML = `<tr><td colspan="9" style="text-align:center; color: red;">حدث خطأ في جلب الطلبات.</td></tr>`;
        }
    }

    // وظيفة تسجيل الخروج
    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('user');
        window.location.href = 'login.html';
    });

    // إضافة مستمع حدث واحد للجدول بالكامل
    ordersList.addEventListener('change', async (e) => {
        if (e.target.classList.contains('status-selector')) {
            const orderId = e.target.dataset.orderId;
            const newStatus = e.target.value;
            await updateOrderStatus(orderId, newStatus);
        }
    });

    // --- Modal Logic (المكان الصحيح) ---
    const modal = document.getElementById('orderDetailsModal');
    const closeBtn = document.querySelector('.close-btn');

    // عندما يضغط المستخدم على زر الإغلاق
    closeBtn.onclick = function() {
        modal.style.display = "none";
    }

    // عندما يضغط المستخدم خارج النافذة
    window.onclick = function(event) {
        if (event.target == modal) {
            modal.style.display = "none";
        }
    }

    // دالة جديدة لإنشاء عرض الأجزاء (Parts) المشروطة
function renderOptionalParts(order) {
    let partsHtml = '';
    // قائمة بأسماء الحقول والقيم التي تظهر للمستخدم
    const partLabels = {
        'part1': 'Part 1',
        'part2': 'Part 2',
        'part3': 'Part 3',
        'part4': 'Part 4',
        'part5': 'Part 5',
        'part6': 'Part 6',
        'part7': 'Part 7',
        'part8': 'Part 8',
        'part9': 'Part 9',
    };

    // نمر على كل حقل من part1 إلى part9
    for (let i = 1; i <= 9; i++) {
        const key = `part${i}`;
        const label = partLabels[key];
        const value = order[key];

        // نضيف الحقل إلى الـ HTML فقط إذا كانت قيمته موجودة وغير فارغة
        if (value && value.trim() !== '') {
            partsHtml += `<p><strong>${label}:</strong> <span>${value}</span></p>`;
        }
    }
    
    // إذا لم يضف الطبيب أي جزء، نعرض ملاحظة بذلك
    if (partsHtml === '') {
        return `<p style="color: #6c757d; font-style: italic;">لم يتم إدخال تفاصيل إضافية للأجزاء.</p>`;
    }

    // إذا كانت هناك أجزاء، نغلفها بعنوان
    return `
        <h4 style="margin-top: 20px; border-bottom: 1px solid #ddd; padding-bottom: 5px;">تفاصيل الأجزاء الإضافية</h4>
        ${partsHtml}
    `;
}

// مستمع حدث لجميع أزرار "تفاصيل"
    ordersList.addEventListener('click', async (e) => {
        if (e.target.classList.contains('details-btn')) {
            const orderId = e.target.dataset.orderId;
            try {
                const timestamp = new Date().getTime();
                const response = await fetch(`http://localhost:3001/api/admin/orders?t=${timestamp}`);
                const orders = await response.json();
                const order = orders.find(o => o._id === orderId);

                if (order) {
                    // Populate the modal with order data
                    document.getElementById('modal-order-id').textContent = '#' + order._id.slice(-6);
                    document.getElementById('modal-doctor-name').textContent = order.doctorName || '-';
                    document.getElementById('modal-patient-name').textContent = order.patientName || '-';
                    
                    // Fields for Age and Gender
                    document.getElementById('modal-age').textContent = order.age || '-';
                    document.getElementById('modal-gender').textContent = order.gender || '-';

                    document.getElementById('modal-type').textContent = order.type || '-';
                    document.getElementById('modal-material').textContent = order.material || '-';
                    document.getElementById('modal-shade').textContent = order.shade || '-';
                    
                    // Fields for Translucency, Edge Shape, and Surface Texture
                    document.getElementById('modal-translucency').textContent = order.translucency || '-';
                    document.getElementById('modal-edge-shape').textContent = order.edge_shape || '-';
                    document.getElementById('modal-surface-texture').textContent = order.surface_texture || '-';
                    
                    document.getElementById('modal-notes').textContent = order.notes || '-';
                    document.getElementById('modal-status').textContent = order.status || '-';
                    document.getElementById('modal-created-at').textContent = new Date(order.createdAt).toLocaleDateString() || '-';
                    
                    const optionalPartsContainer = document.getElementById('optional-parts-container');
                    optionalPartsContainer.innerHTML = renderOptionalParts(order);
                    modal.style.display = "block";
                }
            } catch (error) {
                console.error("Error fetching order details:", error);
                alert("حدث خطأ في جلب تفاصيل الطلب.");
            }
        }
    });
    
    // تشغيل جلب الطلبات عند تحميل الصفحة
    fetchAllOrders();

    // وظيفة البحث والفلترة
    function filterAndSearchOrders() {
        const searchTerm = searchInput.value.toLowerCase();
        const selectedStatus = statusFilter.value;

        const filteredOrders = allOrders.filter(order => {
            // Filter by status
            const statusMatch = selectedStatus === 'all' || order.status === selectedStatus;

            // Search by doctor, patient, or order ID
            const searchMatch = (
                order.doctorName?.toLowerCase().includes(searchTerm) ||
                order.patientName?.toLowerCase().includes(searchTerm) ||
                order._id?.slice(-6).includes(searchTerm)
            );

            return statusMatch && searchMatch;
        });

        displayOrders(filteredOrders);
    }

    // إضافة مستمعي الأحداث على حقول البحث والفلترة
    searchInput.addEventListener('input', filterAndSearchOrders);
    statusFilter.addEventListener('change', filterAndSearchOrders);


    // ----------------------------------------------------
    // هنا يبدأ الكود الجديد للدردشة. ضعه بعد كل الأكواد السابقة.
    // ----------------------------------------------------

    let currentOrderId = null;
    const chatSection = document.getElementById('chatSection');
    const chatMessagesList = document.getElementById('chat-messages');
    const chatForm = document.getElementById('chat-form');
    const chatInput = document.getElementById('chat-input');
    const chatOrderIdDisplay = document.getElementById('chatOrderIdDisplay');
    const userEmail = "admin@yourdomain.com"; // أو أي بريد إلكتروني خاص بالأدمن

    const openChat = async (orderId) => {
        currentOrderId = orderId;
        chatOrderIdDisplay.textContent = `(${orderId.slice(-6)})`;
        chatSection.style.display = 'block';
        chatMessagesList.innerHTML = '';
        
        try {
            const response = await fetch(`http://localhost:3001/api/orders/${orderId}/chat`);
            if (!response.ok) {
                throw new Error('Failed to fetch chat history');
            }
            const data = await response.json();
            data.chat.forEach(addMessageToChat);
        } catch (error) {
            console.error('Error fetching chat history:', error);
        }
    };

    const addMessageToChat = (message) => {
        const li = document.createElement('li');
        li.textContent = `${message.sender}: ${message.message}`;
        li.style.textAlign = message.sender === userEmail ? 'right' : 'left';
        li.style.color = message.sender === userEmail ? 'var(--primary)' : '#000000';
        li.style.backgroundColor = message.sender === userEmail ? '#e0f7fa' : '#f0f4c3';
        li.style.padding = '8px';
        li.style.margin = '5px 0';
        li.style.borderRadius = '8px';
        chatMessagesList.appendChild(li);
        chatMessagesList.scrollTop = chatMessagesList.scrollHeight;
    };
    
    // هذا الجزء هو المهم: نعدل مستمع الأحداث لكي يعمل مع الدردشة أيضاً.
    ordersList.addEventListener('click', (e) => {
        const row = e.target.closest('tr');
        if (row && row.dataset.orderId) {
            // إذا كان المستخدم يضغط على زر "تفاصيل"، لا تفتح الدردشة.
            // إذا ضغط على أي مكان آخر في الصف، افتح الدردشة.
            if (!e.target.classList.contains('details-btn') && !e.target.classList.contains('status-selector')) {
                const orderId = row.dataset.orderId;
                openChat(orderId);
            }
        }
    });

    chatForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const message = chatInput.value.trim();
        if (message && currentOrderId) {
            try {
                const response = await fetch(`http://localhost:3001/api/orders/${currentOrderId}/chat`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ sender: userEmail, message })
                });
                if (!response.ok) {
                    throw new Error('Failed to send message');
                }
                chatInput.value = '';
            } catch (error) {
                console.error('Error sending message:', error);
            }
        }
    });
    
// ----------------------------------------------------
// هنا يبدأ الكود الجديد للدردشة. ضعه بعد كل الأكواد السابقة.
// ----------------------------------------------------

// ... (بقية أكواد الدردشة openChat, addMessageToChat, etc.)

// تعريف الـ WebSocket في نطاق DOMContentLoaded
const ws = new WebSocket('ws://localhost:3001/ws');

ws.onmessage = (event) => {
    const data = JSON.parse(event.data);

    // 1. معالجة رسائل الدردشة الجديدة
    if (data.type === 'new-chat-message' && data.orderId === currentOrderId) {
        addMessageToChat(data.message);
    }
    
    // 2. معالجة طلب تعديل الملف الشخصي
    if (data.type === 'profile-update-request') {
        const message = `⚠️ طلب تعديل ملف شخصي جديد من: ${data.userName} (${data.userEmail})`;
        
        alert(message); // تنبيه بسيط ومؤقت
        console.log(message);
    }
    
    // 3. 💡 إضافة معالج تحديث حالة الطلب ليعكس التغيير الفوري 💡
    if (data.type === 'status-update') {
        const order = data.order;
        // نستخدم الوظيفة الموجودة بالفعل لتحديث سطر واحد في الجدول
        updateDOMForOrder(order._id, order.status);
        
        // يجب تحديث الإحصائيات (الرسوم البيانية والأرقام) أيضاً
        updateStats(); 
        
        console.log(`✅ تم تحديث الطلب #${order._id.slice(-6)} بواسطة WebSocket.`);
    }
};

}); // نهاية DOMContentLoaded);

