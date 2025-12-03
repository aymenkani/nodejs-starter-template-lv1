# 📧 Important: Ensuring Email Deliverability

For the email features in this template to work reliably in a production environment, it is **critical** to configure your email provider correctly. If you don't, your emails will likely end up in the spam folder.

This guide uses SendGrid as an example, but the principles apply to any email service provider (e.g., Postmark, Amazon SES).

### 1. Authenticate Your Domain (Crucial)

You must prove to recipient email servers (like Gmail and Outlook) that you are a legitimate sender. This is the single most important step.

-   **What it is:** You need to set up **SPF**, **DKIM**, and **DMARC** records. These are special DNS records that verify your domain's authenticity and authorize your email provider to send emails on your behalf.
-   **How to do it:**
    1.  Log in to your SendGrid account.
    2.  Navigate to **Settings > Sender Authentication**.
    3.  Follow the on-screen instructions to authenticate your domain. SendGrid will give you several DNS records (usually CNAMEs).
    4.  Add these records to your domain's DNS settings in your domain registrar's dashboard (e.g., GoDaddy, Namecheap, Cloudflare).

### 2. Use a Dedicated IP Address (Recommended for Scale)

-   **What it is:** A dedicated IP address isolates your sender reputation. On shared plans, a spammer on the same IP can negatively affect your deliverability.
-   **How to do it:** This is typically a paid feature. If you plan to send a high volume of emails, upgrade your plan to include a dedicated IP. You will also need to "warm up" the IP by gradually increasing your sending volume.

### 3. Follow Content Best Practices

How you write your emails matters. This template provides the structure, but you control the content.

-   **Always Include an Unsubscribe Link:** It's required by law in many places and builds trust. If users can't easily unsubscribe, they will mark your email as spam.
-   **Provide a Plain Text Version:** Always include a plain text version of your email alongside the HTML version. The `email.service.ts` in this template is set up to do this, so be sure to provide both `html` and `text` content when sending.
-   **Avoid Spam Triggers:** Don't use excessive capitalization, misleading subject lines, or spammy words (e.g., "free," "guarantee," "act now").
-   **Good Text-to-Image Ratio:** Avoid sending emails that are just one large image.

By following these steps, you will significantly improve your chances of landing in the user's inbox.
