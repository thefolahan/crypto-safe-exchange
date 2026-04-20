class MailService {
    async sendMail() {
        return { ok: true, disabled: true };
    }

    async sendVerificationEmail() {
        return { ok: true, disabled: true };
    }
}

module.exports = new MailService();
