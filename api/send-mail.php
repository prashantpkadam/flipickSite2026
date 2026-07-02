<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

require __DIR__ . '/PHPMailer/src/Exception.php';
require __DIR__ . '/PHPMailer/src/PHPMailer.php';
require __DIR__ . '/PHPMailer/src/SMTP.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

// ── Config ────────────────────────────────────────────────────────────────────
define('SMTP_HOST',      'smtp.office365.com');
define('SMTP_PORT',      587);
define('SMTP_USERNAME',  'service@flipick.com');
define('SMTP_PASSWORD',  'FPserv1ce');
define('SMTP_FROM',      'service@flipick.com');
define('SMTP_FROM_NAME', 'LMS');
define('RECIPIENT',      'info@flipick.com');

// ── Read & validate ───────────────────────────────────────────────────────────
try {
    $raw  = file_get_contents('php://input');
    $data = json_decode($raw, true) ?? [];

    $name    = trim($data['name']    ?? '');
    $email   = trim($data['email']   ?? '');
    $company = trim($data['company'] ?? '');
    $topic   = trim($data['topic']   ?? '');
    $message = trim($data['message'] ?? '');

    if ($name    === '')                              throw new InvalidArgumentException('Name is required.');
    if ($email   === '' || !filter_var($email, FILTER_VALIDATE_EMAIL))
                                                      throw new InvalidArgumentException('A valid email is required.');
    if ($company === '')                              throw new InvalidArgumentException('Company is required.');
    if ($topic   === '')                              throw new InvalidArgumentException('Topic is required.');
    if ($message === '')                              throw new InvalidArgumentException('Message is required.');

    // Date/time in IST
    $dt = new DateTime('now', new DateTimeZone('Asia/Kolkata'));
    $dateTime = $dt->format('d M Y, h:i A') . ' IST';

    // ── Send ──────────────────────────────────────────────────────────────────
    $mail = new PHPMailer(true);
    $mail->isSMTP();
    $mail->Host       = SMTP_HOST;
    $mail->SMTPAuth   = true;
    $mail->Username   = SMTP_USERNAME;
    $mail->Password   = SMTP_PASSWORD;
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
    $mail->Port       = SMTP_PORT;

    $mail->setFrom(SMTP_FROM, SMTP_FROM_NAME);
    $mail->addAddress(RECIPIENT);
    $mail->addReplyTo($email, $name);
    $mail->Subject = 'New Enquiry: ' . $topic . ' - ' . $name;
    $mail->isHTML(true);
    $mail->Body = buildTemplate($name, $email, $company, $topic, $message, $dateTime);

    $mail->send();

    http_response_code(200);
    echo json_encode(['success' => true]);

} catch (InvalidArgumentException $e) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Mail could not be sent: ' . $mail->ErrorInfo]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Server error: ' . $e->getMessage()]);
}

// ── HTML email template ───────────────────────────────────────────────────────
function buildTemplate($name, $email, $company, $topic, $message, $dateTime) {
    $h = function($s) { return htmlspecialchars($s ?? '', ENT_QUOTES, 'UTF-8'); };

    return '<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>New Enquiry — Flipick</title>
</head>
<body style="margin:0;padding:0;background:#F4F5F9;font-family:Arial,Helvetica,sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
    <tr><td align="center" style="padding:40px 16px;">

      <table width="600" cellpadding="0" cellspacing="0" role="presentation"
             style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;
                    overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,.08);">

        <!-- Header -->
        <tr>
          <td style="background:#11122B;padding:28px 40px;">
            <p style="margin:0;font-size:13px;font-weight:700;letter-spacing:.12em;
                       text-transform:uppercase;color:#7B7FBB;">Flipick</p>
            <h1 style="margin:6px 0 0;font-size:20px;font-weight:700;color:#ffffff;">
              New Contact Form Submission
            </h1>
          </td>
        </tr>

        <!-- Topic badge -->
        <tr>
          <td style="background:#F0F1FF;padding:14px 40px;">
            <span style="display:inline-block;font-size:12px;font-weight:700;
                          letter-spacing:.1em;text-transform:uppercase;
                          color:#444CEC;background:#DDE0FF;
                          padding:5px 12px;border-radius:999px;">'
        . $h($topic) .
        '</span>
          </td>
        </tr>

        <!-- Fields -->
        <tr>
          <td style="padding:32px 40px 8px;">
            <table width="100%" cellpadding="0" cellspacing="0" role="presentation">'
        . row('Name',    $h($name))
        . row('Email',   '<a href="mailto:' . $h($email) . '" style="color:#444CEC;text-decoration:none;">' . $h($email) . '</a>')
        . row('Company', $h($company))
        . row('Topic',   $h($topic)) .
        '
              <!-- Message -->
              <tr>
                <td style="padding:14px 0;border-bottom:1px solid #EBEBF0;">
                  <p style="margin:0 0 5px;font-size:11px;font-weight:700;letter-spacing:.08em;
                             text-transform:uppercase;color:#9999BB;">Message</p>
                  <p style="margin:0;font-size:14px;color:#1A1A2E;line-height:1.65;
                             white-space:pre-wrap;">' . $h($message) . '</p>
                </td>
              </tr>'
        . row('Date &amp; Time', $dateTime) .
        '
            </table>
          </td>
        </tr>

        <!-- Reply tip -->
        <tr>
          <td style="padding:24px 40px 32px;">
            <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
              <tr>
                <td style="background:#F0F1FF;border-left:4px solid #444CEC;
                            border-radius:0 8px 8px 0;padding:14px 18px;">
                  <p style="margin:0;font-size:13px;color:#444CEC;">
                    <strong>Reply-To</strong> is set to
                    <a href="mailto:' . $h($email) . '" style="color:#444CEC;">' . $h($email) . '</a>
                    — just hit <strong>Reply</strong> to respond to ' . $h($name) . ' directly.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#F4F5F9;padding:18px 40px;border-top:1px solid #E8E9F0;">
            <p style="margin:0;font-size:11px;color:#AAAACC;text-align:center;">
              Sent via the contact form on
              <a href="https://flipick.com" style="color:#AAAACC;">flipick.com</a>
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>

</body>
</html>';
}

function row($label, $value) {
    return '<tr><td style="padding:14px 0;border-bottom:1px solid #EBEBF0;">'
         . '<p style="margin:0 0 5px;font-size:11px;font-weight:700;letter-spacing:.08em;'
         . 'text-transform:uppercase;color:#9999BB;">' . $label . '</p>'
         . '<p style="margin:0;font-size:14px;color:#1A1A2E;">' . $value . '</p>'
         . '</td></tr>';
}
