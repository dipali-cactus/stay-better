<?php
// api/send_report.php

// This file should ideally be protected so it can only be run via command line (Cron)
// For security, if accessed via browser, require a secret key
$secretKey = 'my_super_secret_cron_key_123';
if (php_sapi_name() !== 'cli' && (!isset($_GET['key']) || $_GET['key'] !== $secretKey)) {
    http_response_code(403);
    die('Forbidden');
}

// Load Composer's autoloader (PHPMailer)
require __DIR__ . '/../vendor/autoload.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

$dataFileDir = __DIR__ . '/../data';

// SMART LOGIC: If today is the 1st of the month, grab the previous month's file!
// Otherwise, grab the current month's file.
if (date('j') == '1') {
    $reportMonth = date('M_Y', strtotime('yesterday'));
} else {
    $reportMonth = date('M_Y');
}

$dataFilePath = $dataFileDir . '/subscribers_' . $reportMonth . '.csv';

if (!file_exists($dataFilePath)) {
    die("No subscriber file found for " . $reportMonth . ".\n");
}

// --- MAILTRAP CONFIGURATION ---
$smtpHost = 'live.smtp.mailtrap.io'; // Or sandbox.smtp.mailtrap.io if you use testing
$smtpUsername = 'api';               // Replace with your Mailtrap Username
$smtpPassword = '89137a0669db43b612e9f00236d86d73'; // Replace with your Mailtrap Password
$smtpPort = 587;                     // Mailtrap usually uses 587 or 2525

$fromEmail = 'info@staybetter.life'; // Replace with the verified domain email you set up in Mailtrap
$toEmail = 'support@staybetter.life';


$mail = new PHPMailer(true);

try {
    // Server settings
    $mail->isSMTP();
    $mail->Host       = $smtpHost;
    $mail->SMTPAuth   = true;
    $mail->Username   = $smtpUsername;
    $mail->Password   = $smtpPassword;
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
    $mail->Port       = $smtpPort;

    // testing 
    //$mail->SMTPDebug = 2; // Enable verbose debug output
    //$mail->addAddress('dipali@cactuscreatives.com');
    //$mail->addAddress('dipalicactus@gmail.com');
    //$mail->addAddress('payal@cactuscreatives.com');

    // Recipients
    $mail->setFrom($fromEmail, 'Stay Better System');
    $mail->addAddress($toEmail);

    // Attachments
    $mail->addAttachment($dataFilePath, 'subscribers_' . $reportMonth . '.csv');

    // Content
    $mail->isHTML(true);
    $mail->Subject = 'Stay Better - Monthly Subscriber Report (' . $reportMonth . ')';
    $mail->Body    = 'Hello,<br><br>Attached is the latest subscriber CSV export for <b>' . $reportMonth . '</b>.<br><br>Best,<br>Stay Better System';
    $mail->AltBody = 'Hello, Attached is the latest subscriber CSV export for ' . $reportMonth . '.';

    $mail->send();
    echo "Message has been sent successfully\n";
} catch (Exception $e) {
    echo "Message could not be sent. Mailer Error: {$mail->ErrorInfo}\n";
}
