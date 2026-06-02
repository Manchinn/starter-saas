export default {
  nav: {
    settings: 'ตั้งค่า',
  },
  settings: {
    title: 'ตั้งค่า',
    subtitle: 'จัดการการตั้งค่าทั้งระบบ',
    tabs: {
      email: 'ตั้งค่าอีเมล',
    },
    email: {
      title: 'อีเมล (SMTP)',
      desc: 'ตั้งค่าเซิร์ฟเวอร์ SMTP สำหรับส่งอีเมลของระบบ เช่น การรีเซ็ตรหัสผ่านและการยืนยันอีเมล',
      statusConfigured: 'ตั้งค่า SMTP แล้ว',
      statusStub: 'ยังไม่ได้ตั้งค่า — อีเมลจะถูกบันทึกในคอนโซลเท่านั้น',

      host: 'SMTP Host',
      hostPh: 'smtp.example.com',
      hostHint: 'เว้นว่างเพื่อปิดการส่งอีเมล (อีเมลจะถูกบันทึกในคอนโซล)',
      port: 'พอร์ต',
      secure: 'ความปลอดภัย (TLS/SSL)',
      secureHint: 'เปิดสำหรับพอร์ต 465 และปิดสำหรับ 587 (STARTTLS)',
      user: 'ชื่อผู้ใช้',
      userPh: "apikey หรือ user{'@'}example.com",
      pass: 'รหัสผ่าน',
      passKeepPh: '••••••••',
      passKeepHint: 'เว้นว่างเพื่อใช้รหัสผ่านเดิม',
      from: 'อีเมลผู้ส่ง',
      fromPh: "no-reply{'@'}example.com",

      save: 'บันทึกการตั้งค่า',
      saved: 'บันทึกการตั้งค่าอีเมลแล้ว',
      saveFailed: 'บันทึกการตั้งค่าอีเมลไม่สำเร็จ',
      loadFailed: 'โหลดการตั้งค่าอีเมลไม่สำเร็จ',

      testConnection: 'ทดสอบการเชื่อมต่อ',
      testConnectionOk: 'เชื่อมต่อ SMTP สำเร็จ',
      testConnectionFailed: 'เชื่อมต่อ SMTP ไม่สำเร็จ',

      testSection: 'ส่งอีเมลทดสอบ',
      testDesc: 'ส่งอีเมลถึงตัวคุณเองเพื่อยืนยันว่าการส่งทำงานได้',
      testTo: 'ผู้รับ',
      testToPh: "you{'@'}example.com",
      sendTest: 'ส่งทดสอบ',
      testSent: 'ส่งอีเมลทดสอบแล้ว',
      testFailed: 'ส่งอีเมลทดสอบไม่สำเร็จ',
    },
  },
}
