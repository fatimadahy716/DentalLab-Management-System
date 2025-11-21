document.addEventListener('DOMContentLoaded', async () => {
    // 1. التحقق من وجود المستخدم المسجل في localStorage وتعريف المتغيرات في البداية
    const user = JSON.parse(localStorage.getItem('user'));
    const userEmail = user ? user.email : null;
    const userRole = user ? user.role : null;

    // تأكد أن المستخدم طبيب
    if (!userEmail || userRole !== 'dentist') {
        console.error("User is not a dentist or not logged in. Redirecting to login page.");
        window.location.href = 'login.html';
        return;
    }

    // 2. ملء جدول معلومات الطبيب في الأعلى
    if (user && user.profileComplete) {
        document.getElementById('doctor-name').textContent = user.name || '-';
        document.getElementById('clinic-name').textContent = user.clinicName || '-';
        document.getElementById('doctor-phone').textContent = user.phoneNumber || '-';
        document.getElementById('specialization').textContent = user.specialization || '-';
        document.getElementById('city').textContent = user.city || '-';
    } else {
        // إخفاء الجدول إذا لم يكمل المستخدم ملفه الشخصي
        document.querySelector('.profile-info-container').style.display = 'none';
    }
    
    // 3. جلب الطلبات من الخادم
    async function fetchOrders() {
        try {
            const response = await fetch(`http://localhost:3001/api/my-orders?email=${userEmail}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const orders = await response.json();
            return orders;
        } catch (error) {
            console.error("Could not fetch orders:", error);
            document.getElementById('orders-list').innerHTML = `
                <tr><td colspan="7" style="text-align:center; color: red;">حدث خطأ في جلب الطلبات.</td></tr>
            `;
            return [];
        }
    }

    // 4. عرض الطلبات في الجدول وتحديث الإحصائيات

    function displayOrders(orders) {
        const ordersList = document.getElementById('orders-list');
        const totalOrdersEl = document.getElementById('totalOrders');
        const inProgressEl = document.getElementById('inProgressOrders');
        const completedEl = document.getElementById('completedOrders');
        
        ordersList.innerHTML = ''; // مسح أي محتوى سابق

        if (orders.length === 0) {
            ordersList.innerHTML = `
                <tr><td colspan="8" style="text-align:center;">لا توجد طلبات سابقة حتى الآن.</td></tr>
            `;
            totalOrdersEl.textContent = '0';
            inProgressEl.textContent = '0';
            completedEl.textContent = '0';
            return;
        }
        
        let inProgressCount = 0;
        let completedCount = 0;

        orders.forEach(order => {
            let statusClass = '';
            if (order.status === 'قيد التنفيذ') {
                statusClass = 'status-in-progress';
                inProgressCount++;
            } else if (order.status === 'منجز') {
                statusClass = 'status-completed';
                completedCount++;
            } else if (order.status === 'ملغى') {
                statusClass = 'status-cancelled';
            } else {
                statusClass = 'status-new';
            }
            
            const orderRow = document.createElement('tr');
            orderRow.setAttribute('data-order-id', order._id);
            orderRow.innerHTML = `
                <td>#${order._id.slice(-6)}</td>
                <td>${order.patientName || '-'}</td>
                <td>${order.type || '-'}</td>
                <td>${order.material || '-'}</td>
                <td>${order.shade || '-'}</td>
                <td>${order.tooth_number || '-'}</td>
                <td>${new Date(order.createdAt).toLocaleDateString()}</td>
                <td>
                    <span class="status-badge ${statusClass}">${order.status || 'جديد'}</span>
                </td>
            `;
            ordersList.appendChild(orderRow);
        });

        totalOrdersEl.textContent = orders.length.toString();
        inProgressEl.textContent = inProgressCount.toString();
        completedEl.textContent = completedCount.toString();
    }
    
    // 5. تشغيل الوظائف
    const orders = await fetchOrders();
    displayOrders(orders);

    // وظيفة لتحديث حالة طلب واحد على الواجهة فورياً
    function updateDOMForOrder(orderId, newStatus) {
        // نجد صف الطلب (tr) باستخدام data-order-id
        const orderRow = document.getElementById('orders-list').querySelector(`[data-order-id="${orderId}"]`);

        if (orderRow) {
            const statusSpan = orderRow.querySelector('.status-badge');
            
            // تحديد فئة CSS الجديدة بناءً على الحالة الجديدة
            let newStatusClass = 'status-new';
            if (newStatus === 'قيد التنفيذ') {
                newStatusClass = 'status-in-progress';
            } else if (newStatus === 'منجز') {
                newStatusClass = 'status-completed';
            } else if (newStatus === 'ملغى') {
                newStatusClass = 'status-cancelled';
            }

            // تحديث النص والفئة
            statusSpan.textContent = newStatus;
            statusSpan.className = `status-badge ${newStatusClass}`;
            
            console.log(`✅ تم تحديث الواجهة للطلب #${orderId.slice(-6)} بواسطة WebSocket.`);

            // نعيد جلب كل الطلبات لتحديث الإحصائيات والأرقام في أعلى الصفحة
            fetchOrders().then(displayOrders);
        }
    }

        // ----------------------------------------------------
    // إضافة كود الدردشة هنا 
    // ----------------------------------------------------
    
    // إضافة متغيرات جديدة للدردشة
    let currentOrderId = null;
    const chatSection = document.getElementById('chatSection');
    const chatMessagesList = document.getElementById('chat-messages');
    const chatForm = document.getElementById('chat-form');
    const chatInput = document.getElementById('chat-input');
    const chatOrderIdDisplay = document.getElementById('chatOrderIdDisplay');

    // دالة جديدة لفتح الدردشة وتحميل الرسائل
    const openChat = async (orderId) => {
        currentOrderId = orderId;
        chatOrderIdDisplay.textContent = `(${orderId})`;
        chatSection.style.display = 'block';
        chatMessagesList.innerHTML = ''; // مسح الرسائل القديمة
        
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

    // دالة لإضافة رسالة إلى واجهة الدردشة
    const addMessageToChat = (message) => {
        const li = document.createElement('li');
        // هنا يمكنك تعديل style.textAlign
        li.textContent = `${message.sender}: ${message.message}`;
        li.style.textAlign = message.sender === userEmail ? 'right' : 'left';
        li.style.color = '#000000'; // سيجعل لون خط كلتا الرسالتين أسود
        li.style.backgroundColor = message.sender === userEmail ? '#e0f7fa' : '#f0f4c3';
        li.style.padding = '8px';
        li.style.margin = '5px 0';
        li.style.borderRadius = '8px';
        chatMessagesList.appendChild(li);
        chatMessagesList.scrollTop = chatMessagesList.scrollHeight; // التمرير للأسفل تلقائياً
    };
    
    // ربط الدالة الجديدة بحدث النقر على صفوف الجدول
    document.getElementById('orders-list').addEventListener('click', (e) => {
        if (e.target.tagName === 'TD' && e.target.parentElement.dataset.orderId) {
            const orderId = e.target.parentElement.dataset.orderId;
            openChat(orderId);
        }
    });

    // معالجة إرسال رسالة جديدة
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
    
// معالجة رسائل WebSocket الواردة
    const ws = new WebSocket('ws://localhost:3001/ws');

    ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        
        // 1. معالجة رسائل الدردشة الجديدة
        if (data.type === 'new-chat-message' && data.orderId === currentOrderId) {
            addMessageToChat(data.message);
        }

        // 2. معالجة تحديث حالة الطلب
        if (data.type === 'status-update') {
            const order = data.order;
            // تحديث الواجهة فقط إذا كان الطلب المحدّث هو أحد طلبات هذا الطبيب
            if (order.userEmail === userEmail) {
                updateDOMForOrder(order._id, order.status);
            }
        }
    };
});