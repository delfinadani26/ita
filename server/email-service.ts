/**
 * 📧 Serviço de Notificações por Email
 * Envia emails de aprovação/rejeição aos participantes
 */

const SMTP_CONFIG = {
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  user: process.env.SMTP_USER || "",
  pass: process.env.SMTP_PASS || "",
  from: process.env.SMTP_FROM || "noreply@congresso-urnm.ao",
};

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

/**
 * Função para enviar email (simulada em desenvolvimento)
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    // Em produção, usar serviço real como Nodemailer, SendGrid, etc
    console.log(`📧 Email enviado para ${options.to}`);
    console.log(`   Assunto: ${options.subject}`);
    
    // TODO: Implementar com Nodemailer ou SendGrid
    // const transporter = nodemailer.createTransport({...});
    // await transporter.sendMail({...});
    
    return true;
  } catch (error) {
    console.error("Erro ao enviar email:", error);
    return false;
  }
}

/**
 * Email de aprovação do participante
 */
export async function sendApprovalEmail(
  fullName: string,
  email: string,
  category: string,
  institution: string | undefined
): Promise<boolean> {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; background: #f5f5f5; }
          .container { max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 8px; }
          .header { text-align: center; margin-bottom: 30px; }
          .logo { color: #0A2040; font-size: 24px; font-weight: bold; }
          .success-icon { font-size: 48px; margin: 20px 0; }
          h1 { color: #0A2040; }
          .badge { background: #2ECC71; color: white; padding: 10px 20px; border-radius: 20px; display: inline-block; margin: 20px 0; }
          .info { background: #f0f2f5; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .footer { text-align: center; color: #999; font-size: 12px; margin-top: 30px; border-top: 1px solid #ddd; padding-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">CSA URNM 2026</div>
            <div class="success-icon">✅</div>
          </div>
          
          <h1>Inscrição Aprovada!</h1>
          
          <p>Olá <strong>${fullName}</strong>,</p>
          
          <p>É com prazer que informamos que sua inscrição para o <strong>Congresso sobre Sistemas Alimentares 2026</strong> foi <strong>aprovada com sucesso</strong>!</p>
          
          <div class="badge">Status: Aprovado</div>
          
          <div class="info">
            <h3>Próximos Passos:</h3>
            <ul>
              <li>Faça login na plataforma com suas credenciais</li>
              <li>Aceda ao programa do congresso</li>
              <li>Proceda com o pagamento (se aplicável)</li>
              <li>Guarde seu código QR para entrada no congresso</li>
            </ul>
          </div>
          
          <div class="info">
            <h4>Informações da Inscrição:</h4>
            <p><strong>Categoria:</strong> ${category}</p>
            <p><strong>Instituição:</strong> ${institution || "Não especificada"}</p>
          </div>
          
          <p>Se tiver alguma dúvida, entre em contacto com a comissão organizadora.</p>
          
          <div class="footer">
            <p>Este é um email automático. Por favor não responda directamente.</p>
            <p>Congresso sobre Sistemas Alimentares 2026 © URNM</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: "✅ Sua Inscrição Foi Aprovada - CSA URNM 2026",
    html,
  });
}

/**
 * Email de rejeição do participante
 */
export async function sendRejectionEmail(
  fullName: string,
  email: string,
  reason: string = "Não cumprimento dos critérios de elegibilidade"
): Promise<boolean> {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; background: #f5f5f5; }
          .container { max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 8px; }
          .header { text-align: center; margin-bottom: 30px; }
          .logo { color: #0A2040; font-size: 24px; font-weight: bold; }
          .alert-icon { font-size: 48px; margin: 20px 0; }
          h1 { color: #0A2040; }
          .badge { background: #E74C3C; color: white; padding: 10px 20px; border-radius: 20px; display: inline-block; margin: 20px 0; }
          .info { background: #ffe6e6; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #E74C3C; }
          .footer { text-align: center; color: #999; font-size: 12px; margin-top: 30px; border-top: 1px solid #ddd; padding-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">CSA URNM 2026</div>
            <div class="alert-icon">⚠️</div>
          </div>
          
          <h1>Inscrição Não Aprovada</h1>
          
          <p>Olá <strong>${fullName}</strong>,</p>
          
          <p>Agradecemos o seu interesse no <strong>Congresso sobre Sistemas Alimentares 2026</strong>. Após análise cuidadosa, sua inscrição não foi aprovada.</p>
          
          <div class="badge">Status: Não Aprovado</div>
          
          <div class="info">
            <h3>Motivo:</h3>
            <p>${reason}</p>
          </div>
          
          <p><strong>O que fazer agora?</strong></p>
          <ul>
            <li>Revise seus dados de inscrição</li>
            <li>Certifique-se de que atende aos critérios de elegibilidade</li>
            <li>Contacte a comissão organizadora para mais informações</li>
            <li>Poderá resubmeter sua inscrição se corrigir os problemas identificados</li>
          </ul>
          
          <p>Para questões, entre em contacto com <strong>congresso@urnm.ao</strong></p>
          
          <div class="footer">
            <p>Este é um email automático. Por favor não responda directamente.</p>
            <p>Congresso sobre Sistemas Alimentares 2026 © URNM</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: "ℹ️ Sua Inscrição - CSA URNM 2026",
    html,
  });
}

/**
 * Email de confirmação de pagamento
 */
export async function sendPaymentConfirmationEmail(
  fullName: string,
  email: string,
  amount: number
): Promise<boolean> {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; background: #f5f5f5; }
          .container { max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 8px; }
          .header { text-align: center; margin-bottom: 30px; }
          .logo { color: #0A2040; font-size: 24px; font-weight: bold; }
          .success-icon { font-size: 48px; margin: 20px 0; }
          h1 { color: #0A2040; }
          .amount { font-size: 32px; color: #2ECC71; font-weight: bold; text-align: center; margin: 20px 0; }
          .info { background: #f0f2f5; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .footer { text-align: center; color: #999; font-size: 12px; margin-top: 30px; border-top: 1px solid #ddd; padding-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">CSA URNM 2026</div>
            <div class="success-icon">💳</div>
          </div>
          
          <h1>Pagamento Confirmado!</h1>
          
          <p>Olá <strong>${fullName}</strong>,</p>
          
          <p>Seu pagamento foi processado com sucesso!</p>
          
          <div class="amount">${amount.toLocaleString("pt-AO")} Kz</div>
          
          <div class="info">
            <h3>Você está oficialmente inscrito no congresso!</h3>
            <ul>
              <li>✅ Acesso completo ao programa</li>
              <li>✅ Acesso às mensagens e comunicações</li>
              <li>✅ Código QR para check-in</li>
              <li>✅ Direito de participação em eventos</li>
            </ul>
          </div>
          
          <p>Não se esqueça de guardar seu código QR! Será necessário para entrada no local do congresso.</p>
          
          <div class="footer">
            <p>Este é um email automático. Por favor não responda directamente.</p>
            <p>Congresso sobre Sistemas Alimentares 2026 © URNM</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: "💳 Pagamento Confirmado - CSA URNM 2026",
    html,
  });
}
