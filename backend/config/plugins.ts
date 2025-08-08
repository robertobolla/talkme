export default ({ env }) => ({
  email: {
    config: {
      provider: '@strapi/provider-email-nodemailer',
      providerOptions: {
        host: env('SMTP_HOST', 'localhost'),
        port: env('SMTP_PORT', 1025),
        auth: {
          user: env('SMTP_USERNAME'),
          pass: env('SMTP_PASSWORD'),
        },
      },
      settings: {
        defaultFrom: env('SMTP_FROM_EMAIL', 'noreply@eldercare.com'),
        defaultReplyTo: env('SMTP_FROM_EMAIL', 'noreply@eldercare.com'),
      },
    },
  },
  upload: {
    config: {
      provider: 'local',
      providerOptions: {
        sizeLimit: 5 * 1024 * 1024, // 5 MB
      },
    },
  },
});
