-- ملاحظة: لإنشاء حساب مدير، قم بتسجيل مستخدم عادي أولاً
-- ثم قم بتشغيل هذا الأمر مع استبدال البريد الإلكتروني

-- تحديث مستخدم ليصبح مدير
UPDATE profiles 
SET is_admin = true 
WHERE id = (
  SELECT id FROM auth.users WHERE email = 'admin@example.com'
);

-- أو يمكنك تحديث بناءً على ID المستخدم مباشرة
-- UPDATE profiles SET is_admin = true WHERE id = 'USER_ID_HERE';
