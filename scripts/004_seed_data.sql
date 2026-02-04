-- إضافة بيانات تجريبية للفئات
INSERT INTO categories (name, name_ar, type, description) VALUES
('Hourly Packages', 'باقات الساعات', 'hourly', 'بطاقات إنترنت محددة بعدد الساعات'),
('Monthly Subscriptions', 'الاشتراكات الشهرية', 'monthly', 'اشتراكات إنترنت شهرية غير محدودة');

-- إضافة بيانات تجريبية للباقات
INSERT INTO packages (category_id, name, name_ar, description, duration, price)
SELECT 
  c.id,
  '5 Hours Package',
  'باقة 5 ساعات',
  'بطاقة إنترنت صالحة لمدة 5 ساعات',
  '5 ساعات',
  5.00
FROM categories c WHERE c.type = 'hourly'
UNION ALL
SELECT 
  c.id,
  '10 Hours Package',
  'باقة 10 ساعات',
  'بطاقة إنترنت صالحة لمدة 10 ساعات',
  '10 ساعات',
  9.00
FROM categories c WHERE c.type = 'hourly'
UNION ALL
SELECT 
  c.id,
  '20 Hours Package',
  'باقة 20 ساعات',
  'بطاقة إنترنت صالحة لمدة 20 ساعات',
  '20 ساعة',
  16.00
FROM categories c WHERE c.type = 'hourly'
UNION ALL
SELECT 
  c.id,
  'Monthly Basic',
  'الاشتراك الشهري الأساسي',
  'اشتراك شهري بسرعة 10 ميجا',
  'شهر واحد',
  25.00
FROM categories c WHERE c.type = 'monthly'
UNION ALL
SELECT 
  c.id,
  'Monthly Premium',
  'الاشتراك الشهري المميز',
  'اشتراك شهري بسرعة 20 ميجا',
  'شهر واحد',
  40.00
FROM categories c WHERE c.type = 'monthly'
UNION ALL
SELECT 
  c.id,
  '3 Months Package',
  'باقة 3 أشهر',
  'اشتراك لمدة 3 أشهر بسعر مخفض',
  '3 أشهر',
  100.00
FROM categories c WHERE c.type = 'monthly';
