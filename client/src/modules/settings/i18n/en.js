export default {
  nav: {
    settings: 'Settings',
  },
  settings: {
    title: 'Settings',
    subtitle: 'Manage platform-wide configuration.',
    tabs: {
      email: 'Email Setting',
    },
    email: {
      title: 'Email (SMTP)',
      desc: 'Configure the SMTP server used to send transactional emails such as password resets and email verification.',
      statusConfigured: 'SMTP configured',
      statusStub: 'Not configured — emails are logged to the server console',

      host: 'SMTP Host',
      hostPh: 'smtp.example.com',
      hostHint: 'Leave blank to disable sending (emails are logged to the console).',
      port: 'Port',
      secure: 'Secure (TLS/SSL)',
      secureHint: 'On for port 465; off for 587 (STARTTLS).',
      user: 'Username',
      userPh: "apikey or user{'@'}example.com",
      pass: 'Password',
      passKeepPh: '••••••••',
      passKeepHint: 'Leave blank to keep the current password.',
      from: 'From Address',
      fromPh: "no-reply{'@'}example.com",

      save: 'Save Settings',
      saved: 'Email settings saved.',
      saveFailed: 'Failed to save email settings.',
      loadFailed: 'Failed to load email settings.',

      testConnection: 'Test Connection',
      testConnectionOk: 'SMTP connection successful.',
      testConnectionFailed: 'SMTP connection failed.',

      testSection: 'Send Test Email',
      testDesc: 'Send yourself a message to confirm delivery works end to end.',
      testTo: 'Recipient',
      testToPh: "you{'@'}example.com",
      sendTest: 'Send Test',
      testSent: 'Test email sent.',
      testFailed: 'Failed to send test email.',
    },
  },
}
