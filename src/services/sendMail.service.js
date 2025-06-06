const SibApiV3Sdk = require('sib-api-v3-sdk');

class EmailService {
  constructor() {
    if (!process.env.BREVO_API_KEY) {
      console.error('BREVO_API_KEY não encontrada no .env');
      return;
    }

    const defaultClient = SibApiV3Sdk.ApiClient.instance;
    const apiKey = defaultClient.authentications['api-key'];
    apiKey.apiKey = process.env.BREVO_API_KEY;

    this.apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
  }

  async sendWelcomeEmail(userEmail, userName) {
    if (!this.apiInstance) {
      console.error('Brevo não configurado corretamente');
      return false;
    }

    const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();

    sendSmtpEmail.sender = {
      name: 'RocketPonto',
      email: 'liedsonleite3@hotmail.com'
    };
    sendSmtpEmail.to = [{
      email: userEmail,
      name: userName
    }];
    sendSmtpEmail.subject = '🚀 Bem-vindo ao RocketPonto!';
    sendSmtpEmail.htmlContent = this.getWelcomeTemplate(userName);

    try {
      const result = await this.apiInstance.sendTransacEmail(sendSmtpEmail);
      console.log(`✅ Email enviado para: ${userEmail}`, result.messageId);
      return true;
    } catch (error) {
      console.error('❌ Erro Brevo:', error.response?.body || error.message);
      return false;
    }
  }

  getWelcomeTemplate(userName) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🚀 RocketPonto</h1>
            <p>Sistema de Controle de Ponto</p>
          </div>
          <div class="content">
            <h2>Olá, ${userName}! 👋</h2>
            <p>Sua conta no <strong>RocketPonto</strong> foi criada com sucesso!</p>
            <ul>
              <li>✅ Registrar entrada e saída</li>
              <li>📊 Visualizar histórico de pontos</li>
              <li>⏰ Acompanhar horas trabalhadas</li>
            </ul>
            <p>Bem-vindo(a) ao sistema!</p>
          </div>
          <div class="footer">
            <p>Este é um email automático, não responda.</p>
            <p>© 2025 RocketPonto</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  async testConnection() {
    try {
      const accountApi = new SibApiV3Sdk.AccountApi();
      const account = await accountApi.getAccount();
      console.log('✅ Conexão Brevo OK:', account.email);
      return true;
    } catch (error) {
      console.error('❌ Erro na conexão Brevo:', error.message);
      return false;
    }
  }
}

module.exports = new EmailService();