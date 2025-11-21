// استيراد المكتبات الأساسية
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const WebSocket = require('ws'); // استيراد مكتبة WebSocket
const JWT_SECRET = 'your_super_secret_key_for_jwt_signing_12345';
// إنشاء تطبيق Express
const app = express();
const PORT = process.env.PORT || 3001;

// تفعيل middleware
app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

// ----------------------------------------------------
// الاتصال بقاعدة البيانات (MongoDB)
// ----------------------------------------------------
const MONGODB_URI = 'mongodb://localhost:27017/dental_lab_db';

mongoose.connect(MONGODB_URI)
.then(() => console.log('Connected to MongoDB!'))
.catch(err => console.error('Could not connect to MongoDB:', err));

// ----------------------------------------------------
// تعريف مخطط (Schema) النموذج
// ----------------------------------------------------
const orderSchema = new mongoose.Schema({
    doctorName: { type: String },
    clinicName: { type: String },
    doctorPhone: { type: String },
    specialization: { type: String },
    yearsExperience: { type: Number },
    licenseNumber: { type: String },
    patientName: { type: String, required: true },
    patientId: { type: String },
    patientPhone: { type: String },
    age: { type: Number },
    gender: { type: String },
    tooth_number: { type: String, required: false },
    type: { type: String, required: true },
    material: { type: String, required: true },
    abutments: { type: String },
    pontics: { type: String },
    shade_system: { type: String },
    shade: { type: String, required: true },
    translucency: { type: String },
    edge_shape: { type: String },
    surface_texture: { type: String },
    part1: { type: String },
    part2: { type: String },
    part3: { type: String },
    part4: { type: String },
    part5: { type: String },
    part6: { type: String },
    part7: { type: String },
    part8: { type: String },
    part9: { type: String },
    userEmail: { type: String, required: true },
    occlusion: { type: String },
    keep_spaces: { type: String },
    dimensions: { type: String },
    notes: { type: String },
    attachment: { type: String },
    rating: { type: Number },
    feedback: { type: String },
    status: { type: String, default: 'جديد' }, // إضافة حقل الحالة
    createdAt: { type: Date, default: Date.now },
    chat: [{ 
        sender: { type: String, required: true }, // 'dentist' أو 'admin'
        message: { type: String, required: true },
        timestamp: { type: Date, default: Date.now }
        }]
});

const Order = mongoose.model('Order', orderSchema);

// ----------------------------------------------------
// تعريف مخطط (Schema) المستخدم
// ----------------------------------------------------
const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    name: { type: String, required: true },
    role: { type: String, enum: ['admin', 'technician', 'dentist'], required: true },
    specialization: { type: String },
    yearsExperience: { type: Number },
    licenseNumber: { type: String },
    clinicName: { type: String },
    phoneNumber: { type: String },
    city: { type: String },
    profileComplete: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

// ----------------------------------------------------
// WebSocket Server
// ----------------------------------------------------
const wss = new WebSocket.Server({ noServer: true });

wss.broadcast = function broadcast(data) {
    wss.clients.forEach(function each(client) {
        if (client.readyState === WebSocket.OPEN) {
            client.send(data);
        }
    });
};

// ----------------------------------------------------
// دالة Middleware للحماية (التحقق من التوكن ودور الأدمن)
// ----------------------------------------------------
const isAdmin = (req, res, next) => {
    // 1. استخراج التوكن من الهيدر (Authorization: Bearer <token>)
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'الوصول محظور. التوكن مفقود أو غير صحيح.' });
    }
    const token = authHeader.split(' ')[1];

    try {
        // 2. التحقق من التوكن
        const decoded = jwt.verify(token, JWT_SECRET);
        
        // 3. التحقق من الدور (Role)
        if (decoded.role !== 'admin') {
            return res.status(403).json({ message: 'الوصول محظور. هذه العملية مخصصة للمسؤولين فقط.' });
        }

        // تخزين بيانات المستخدم في req لاستخدامها لاحقاً
        req.user = decoded; 
        next(); // السماح بالمرور إلى المسار التالي
        
    } catch (error) {
        return res.status(401).json({ message: 'التوكن غير صالح أو منتهي الصلاحية.' });
    }
};



// ----------------------------------------------------
// مسار (Route) استقبال الطلبات من النموذج
// ----------------------------------------------------
app.post('/api/orders', async (req, res) => {
    const {             
            doctorName, 
            clinicName, 
            doctorPhone, 
            specialization, 
            yearsExperience, 
            licenseNumber,
            patientName,
            patientId,
            patientPhone,
            tooth_number, 
            type, 
            material, 
            shade, 
            age, 
            gender, 
            notes, 
            userEmail,
            occlusion,
            keep_spaces,
            dimensions,
            rating,
            feedback,
            part1,
            part2,
            part3,
            part4,
            part5,
            part6,
            part7,
            part8,
            part9} = req.body;
    
    if (!userEmail || !doctorName || !clinicName || !doctorPhone || !patientName || !type || !shade || !material) {
        return res.status(400).json({ message: 'توجد حقول إلزامية مفقودة.' });
    }
    
    try {
        const newOrder = new Order({
            doctorName, 
            clinicName, 
            doctorPhone,
            specialization,
            yearsExperience,
            licenseNumber,
            patientName,
            patientId,
            patientPhone,
            tooth_number, 
            type, 
            material, 
            shade,
            age,
            gender,
            notes,
            userEmail,
            occlusion,
            keep_spaces,
            dimensions,
            rating,
            feedback,
            part1,
            part2,
            part3,
            part4,
            part5,
            part6,
            part7,
            part8,
            part9
        });
        
        await newOrder.save();
        console.log("Order saved successfully to database!");
        res.status(201).json({ message: 'Order submitted successfully!', order: newOrder });

        // إرسال تحديث بالطلب الجديد لجميع عملاء WebSocket
        wss.broadcast(JSON.stringify({ type: 'new-order', order: newOrder }));

    } catch (error) {
        console.error('Failed to save order:', error);
        res.status(500).json({ message: 'Failed to save order to database.', error: error.message });
    }
});

// مسار جديد للحصول على التوصيات الذكية
app.get('/api/recommendations', async (req, res) => {
    const { type } = req.query; // نستقبل 'type' من طلب الواجهة الأمامية
    let recommendations = {};

    try {
        if (type) {
            // 1. نبحث في قاعدة البيانات عن كل الطلبات التي لها نفس 'type'
            const orders = await Order.find({ type: type });
            
            // 2. نقوم بتحليل البيانات للعثور على أكثر مادة ولون شيوعاً
            const materialCounts = {};
            const shadeCounts = {};
            
            orders.forEach(order => {
                if (order.material) {
                    materialCounts[order.material] = (materialCounts[order.material] || 0) + 1;
                }
                if (order.shade) {
                    shadeCounts[order.shade] = (shadeCounts[order.shade] || 0) + 1;
                }
            });

            // 3. نحدد أكثر مادة ولون متكرر
            const recommendedMaterial = Object.keys(materialCounts).reduce((a, b) => materialCounts[a] > materialCounts[b] ? a : b, null);
            const recommendedShade = Object.keys(shadeCounts).reduce((a, b) => shadeCounts[a] > shadeCounts[b] ? a : b, null);

            recommendations = { recommendedMaterial, recommendedShade };
        }
        
        // 4. نرجع النتائج كملف JSON
        res.json(recommendations);
        
    } catch (error) {
        console.error("Error fetching recommendations:", error);
        res.status(500).json({ message: "فشل في الحصول على التوصيات." });
    }
});

// ----------------------------------------------------
// مسار تسجيل مستخدم جديد
// ----------------------------------------------------
app.post('/api/register', async (req, res) => {
    try {
        const { email, password, name } = req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(409).json({ message: "هذا البريد الإلكتروني مسجل بالفعل." });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        
        const newUser = new User({
            email,
            password: hashedPassword,
            name,
            role: 'dentist',
        });
        
        await newUser.save();
        console.log("Registered a new user:", newUser.name);
        res.status(201).json({ message: "تم تسجيل المستخدم بنجاح." });
    } catch (error) {
        console.error("Error registering user:", error);
        res.status(500).json({ message: "حدث خطأ أثناء التسجيل.", error: error.message });
    }
});

// ----------------------------------------------------
// مسار جلب الطلبات الخاصة بمستخدم معين
// ----------------------------------------------------
app.get('/api/my-orders', async (req, res) => {
    try {
        const userEmail = req.query.email;
        if (!userEmail) {
            return res.status(400).json({ message: "البريد الإلكتروني للمستخدم مفقود." });
        }

        const orders = await Order.find({ userEmail: userEmail }).sort({ createdAt: -1 });

        res.status(200).json(orders);
        
    } catch (error) {
        console.error("Error fetching orders:", error);
        res.status(500).json({ message: "حدث خطأ أثناء جلب الطلبات.", error: error.message });
    }
});

// ----------------------------------------------------
// مسار جلب كل الطلبات للمسؤول
// ----------------------------------------------------
app.get('/api/admin/orders', async (req, res) => {
    try {
        const orders = await Order.find({}).sort({ createdAt: -1 });
        res.status(200).json(orders);
    } catch (error) {
        console.error("Error fetching all orders:", error);
        res.status(500).json({ message: "حدث خطأ أثناء جلب الطلبات.", error: error.message });
    }
});

// ----------------------------------------------------
// 💡 مسار (Route) جديد لجلب قائمة الأطباء للمسؤول
// ----------------------------------------------------
app.get('/api/admin/doctors', isAdmin, async (req, res) => {
    try {
        // العثور على جميع المستخدمين الذين لديهم دور 'dentist' (الطبيب)
        // واختيار الحقول اللازمة فقط
        const doctors = await User.find({ role: 'dentist' })
                                .select('name email clinicName profileComplete updatedAt'); 
        
        // ملاحظة: استبدلت 'fullName' بـ 'name' لأنه الحقل المستخدم في مخطط User
        // إذا كان لديك حقل اسمه 'fullName' في مخططك، استخدمه.
        
        res.status(200).json(doctors);
    } catch (error) {
        console.error('Error fetching doctors data for admin:', error);
        res.status(500).json({ message: 'فشل الخادم في جلب قائمة الأطباء.' });
    }
});

// ----------------------------------------------------
// مسار تسجيل الدخول (بعد التعديل)
// ----------------------------------------------------
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({ message: 'البريد الإلكتروني غير موجود.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'كلمة المرور غير صحيحة.' });
        }

        let redirectTo = 'اسنان9.html'; 
        
        if (user.role === 'dentist') {
            if (user.profileComplete) {
                redirectTo = 'my-orders.html';
            } else {
                redirectTo = 'profile.html';
            }
        } else if (user.role === 'admin') {
            redirectTo = 'admin.html';
        }
        // 🆕 إنشاء توكن JWT
        const token = jwt.sign(
            { userId: user._id, role: user.role }, // Payload: البيانات التي نريد تخزينها
            JWT_SECRET,
            { expiresIn: '1h' } // انتهاء الصلاحية بعد ساعة
        );




        res.status(200).json({
            message: 'تم تسجيل الدخول بنجاح!',
            user: {
                id: user._id,
                email: user.email,
                role: user.role,
                profileComplete: user.profileComplete,
                name: user.name,
                clinicName: user.clinicName,
                phoneNumber: user.phoneNumber,
                specialization: user.specialization,
                city: user.city,
                token: token
            },
            redirectTo: redirectTo
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'حدث خطأ في الخادم.' });
    }
});

// ----------------------------------------------------
// مسار (Route) لتحديث ملف تعريف المستخدم (الطبيب)
// ----------------------------------------------------
app.post('/api/update-profile', async (req, res) => {
    try {
        const { email, specialization, yearsExperience, licenseNumber, clinicName, phoneNumber, city } = req.body;
        
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: "المستخدم غير موجود." });
        }
        if (user.role === 'dentist' && user.profileComplete) {
            return res.status(403).json({ message: "لا يمكنك تعديل ملفك الشخصي بعد إكماله. يرجى التواصل مع المدير." });
        }
        
        const updatedUser = await User.findOneAndUpdate(
            { email: email },
            { 
                specialization,
                yearsExperience,
                licenseNumber,
                clinicName,
                phoneNumber,
                city,
                profileComplete: true 
            },
            { new: true, runValidators: true } 
        );

        if (!updatedUser) {
            return res.status(404).json({ message: "المستخدم غير موجود." });
        }
        
        console.log("User profile updated successfully:", updatedUser.email);
        res.status(200).json({ 
            message: "تم تحديث الملف الشخصي بنجاح.",
            user: {
                id: updatedUser._id,
                email: updatedUser.email,
                role: updatedUser.role,
                profileComplete: updatedUser.profileComplete, // الآن profileComplete: true
                name: updatedUser.name,
                clinicName: updatedUser.clinicName,
                phoneNumber: updatedUser.phoneNumber,
                specialization: updatedUser.specialization,
                city: updatedUser.city,
                token: 'TEMPORARY_AUTH_TOKEN'
            }
        });

    } catch (error) {
        console.error("Error updating user profile:", error);
        res.status(500).json({ message: "حدث خطأ أثناء تحديث الملف الشخصي.", error: error.message });
    }
});

// ----------------------------------------------------
// مسار (Route) جديد لفك قفل ملف الطبيب يدوياً (للأدمن)
// ----------------------------------------------------
app.post('/api/admin/unlock-profile', isAdmin, async (req, res) => {
    try {
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({ message: "البريد الإلكتروني مطلوب لفك القفل." });
        }

        // استخدام findOneAndUpdate لتغيير profileComplete إلى false
        const updatedUser = await User.findOneAndUpdate(
            { email: email },
            { profileComplete: false },
            { new: true } 
        );

        if (!updatedUser) {
            return res.status(404).json({ message: "المستخدم غير موجود بهذا البريد." });
        }
        
        // إرجاع رسالة نجاح
        res.status(200).json({ 
            message: `تم فك قفل ملف الطبيب (${email}) بنجاح. يمكنه الآن التعديل.`
        });

    } catch (error) {
        console.error("Error unlocking user profile:", error);
        res.status(500).json({ message: "حدث خطأ أثناء فك القفل.", error: error.message });
    }
});

// ----------------------------------------------------
// مسار (Route) جديد لتلقي طلبات تعديل الملف الشخصي من الطبيب
// ----------------------------------------------------
app.post('/api/admin/request-profile-update', async (req, res) => {
    try {
        const { userEmail, userName } = req.body;

        if (!userEmail || !userName) {
            return res.status(400).json({ message: "البريد الإلكتروني أو الاسم مفقود." });
        }

        console.log(`🔔 تم تلقي طلب تعديل ملف شخصي من الطبيب: ${userName} (${userEmail})`);
        
        // إرسال تنبيه لجميع عملاء WebSocket
        // نوع الرسالة الجديد هو 'profile-update-request'
        wss.broadcast(JSON.stringify({ 
            type: 'profile-update-request', 
            userName: userName,
            userEmail: userEmail,
            message: `الطبيب ${userName} يطلب تعديل ملفه الشخصي.`
        }));

        res.status(200).json({ message: 'تم إرسال إشعار التعديل بنجاح.' });

    } catch (error) {
        console.error("Error sending profile update request:", error);
        res.status(500).json({ message: 'حدث خطأ في إرسال طلب الإشعار.', error: error.message });
    }
});

// ----------------------------------------------------
// مسار تحديث حالة الطلب
// ----------------------------------------------------
app.post('/api/admin/update-status', async (req, res) => {
    const { orderId, status } = req.body;

    if (!orderId || !status) {
        return res.status(400).json({ message: "معرّف الطلب أو الحالة مفقودة." });
    }

    try {
        const updatedOrder = await Order.findByIdAndUpdate(
            orderId,
            { status: status },
            { new: true }
        );

        if (!updatedOrder) {
            return res.status(404).json({ message: "الطلب غير موجود." });
        }

        console.log(`Order ${orderId} status updated to: ${status}`);
        res.status(200).json({
            message: "تم تحديث حالة الطلب بنجاح.",
            order: updatedOrder
        });

        // إرسال التحديث إلى جميع عملاء WebSocket
        wss.broadcast(JSON.stringify({ type: 'status-update', order: updatedOrder }));

    } catch (error) {
        console.error("Error updating order status:", error);
        res.status(500).json({
            message: "حدث خطأ أثناء تحديث حالة الطلب.",
            error: error.message
        });
    }
});

// ----------------------------------------------------
// بدء تشغيل الخادم
// ----------------------------------------------------
const server = app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

// ----------------------------------------------------
// إدارة اتصالات WebSockets
// ----------------------------------------------------
server.on('upgrade', (request, socket, head) => {
    if (request.url === '/ws') {
        wss.handleUpgrade(request, socket, head, (ws) => {
            wss.emit('connection', ws, request);
        });
    } else {
        socket.destroy();
    }
});

// ----------------------------------------------------
// مسار (Route) جديد لإرسال رسالة في الدردشة
// ----------------------------------------------------
app.post('/api/orders/:orderId/chat', async (req, res) => {
    try {
        const { orderId } = req.params;
        const { sender, message } = req.body;

        if (!sender || !message) {
            return res.status(400).json({ message: 'المرسل أو الرسالة مفقودة.' });
        }

        const updatedOrder = await Order.findByIdAndUpdate(
            orderId,
            { $push: { chat: { sender, message } } }, // إضافة الرسالة الجديدة إلى مصفوفة الدردشة
            { new: true }
        );

        if (!updatedOrder) {
            return res.status(404).json({ message: 'الطلب غير موجود.' });
        }
        
        // إرسال تحديث لجميع عملاء WebSocket
        wss.broadcast(JSON.stringify({ 
            type: 'new-chat-message', 
            orderId: updatedOrder._id,
            message: { sender, message, timestamp: Date.now() }
        }));

        res.status(200).json({ message: 'تم إرسال الرسالة بنجاح.', order: updatedOrder });

    } catch (error) {
        console.error('Error sending chat message:', error);
        res.status(500).json({ message: 'حدث خطأ أثناء إرسال الرسالة.', error: error.message });
    }
});

// ----------------------------------------------------
// مسار (Route) جديد لجلب تفاصيل ملف الطبيب الكاملة
// ----------------------------------------------------
app.get('/api/get-profile-details', async (req, res) => {
    try {
        const userEmail = req.query.email;
        if (!userEmail) {
            return res.status(400).json({ message: "البريد الإلكتروني مفقود." });
        }

        // البحث عن المستخدم باستخدام البريد الإلكتروني
        const user = await User.findOne({ email: userEmail });
        
        if (!user) {
            return res.status(404).json({ message: "المستخدم غير موجود." });
        }

        // إرجاع الحقول المطلوبة لملء النموذج (مع قيمة فارغة إذا كانت مفقودة)
        res.status(200).json({
            clinicName: user.clinicName || '',
            phoneNumber: user.phoneNumber || '',
            specialization: user.specialization || '',
            yearsExperience: user.yearsExperience || '',
            licenseNumber: user.licenseNumber || '',
            city: user.city || '',
            profileComplete: user.profileComplete
        });

    } catch (error) {
        console.error("Error fetching profile details:", error);
        res.status(500).json({ message: "حدث خطأ أثناء جلب تفاصيل الملف." });
    }
});

// ----------------------------------------------------
// مسار (Route) جديد لجلب سجل الدردشة لطلب معين
// ----------------------------------------------------
app.get('/api/orders/:orderId/chat', async (req, res) => {
    try {
        const { orderId } = req.params;
        const order = await Order.findById(orderId);

        if (!order) {
            return res.status(404).json({ message: 'الطلب غير موجود.' });
        }

        res.status(200).json({ chat: order.chat });
    } catch (error) {
        console.error('Error fetching chat history:', error);
        res.status(500).json({ message: 'حدث خطأ أثناء جلب سجل الدردشة.', error: error.message });
    }
});