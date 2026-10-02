<?php
// api/subscribe.php

// 1. Security Headers
header('Content-Type: application/json');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('X-XSS-Protection: 1; mode=block');

// Prevent direct access
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['status' => 'error', 'message' => 'Method not allowed.']);
    exit;
}

// Config
$dataFileDir = __DIR__ . '/../data'; // Inside web root, secured with .htaccess

// File Rotation: Create a new filename for the current month and year (e.g. subscribers_Oct_2026.csv)
$currentMonth = date('M_Y');
$dataFilePath = $dataFileDir . '/subscribers_' . $currentMonth . '.csv';
$lockFilePath = $dataFileDir . '/subscribers.lock';

// Create data dir if not exists
if (!is_dir($dataFileDir)) {
    if (!@mkdir($dataFileDir, 0750, true)) {
        http_response_code(500);
        echo json_encode(['status' => 'error', 'message' => 'Server configuration error: Cannot create data directory. Please check permissions.']);
        exit;
    }
}

// 2. Rate Limiting (Basic IP based)
session_start();
$ip = $_SERVER['REMOTE_ADDR'];
$time = time();
if (isset($_SESSION['last_submit']) && ($time - $_SESSION['last_submit']) < 5) {
    http_response_code(429);
    echo json_encode(['status' => 'error', 'message' => 'Too many requests. Please wait a few seconds.']);
    exit;
}
$_SESSION['last_submit'] = $time;

// 3. Validation
$email = filter_input(INPUT_POST, 'email', FILTER_VALIDATE_EMAIL);
if (!$email) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Please enter a valid email address.']);
    exit;
}
$email = strtolower(trim($email)); // Normalize for duplicate checking

$date = date('Y-m-d');

// 4. File Locking and Processing
$lock = @fopen($lockFilePath, 'w+');
if (!$lock || !flock($lock, LOCK_EX)) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Permission denied: Cannot write to ' . realpath($dataFileDir)]);
    if ($lock) fclose($lock);
    exit;
}

try {
    // Check for duplicates across ALL past and present csv files
    $csvFiles = glob($dataFileDir . '/subscribers_*.csv');
    if ($csvFiles) {
        foreach ($csvFiles as $file) {
            $handle = fopen($file, 'r');
            if ($handle !== false) {
                while (($row = fgetcsv($handle)) !== false) {
                    // $row[0] is the email column. We strip any leading apostrophe added for formula protection.
                    $existingEmail = strtolower(trim(ltrim($row[0] ?? '', "'")));
                    if ($existingEmail === $email) {
                        http_response_code(409); // Conflict
                        echo json_encode(['status' => 'error', 'message' => 'This email is already on the waitlist!']);
                        fclose($handle);
                        flock($lock, LOCK_UN);
                        fclose($lock);
                        exit;
                    }
                }
                fclose($handle);
            }
        }
    }
    
    // Append new row
    $isNewFile = !file_exists($dataFilePath);
    $handle = fopen($dataFilePath, 'a');
    if ($handle === false) {
        throw new Exception("Could not open CSV file for writing.");
    }
    
    // Write headers if it's a new file
    if ($isNewFile) {
        fputcsv($handle, ['Email', 'Date']);
    }
    
    // Prevent formula injection by prepending apostrophe if starts with =, +, -, @
    $safeEmail = preg_replace('/^([=\+\-@])/', "'$1", $email);
    
    // Write data
    fputcsv($handle, [$safeEmail, $date]);
    fclose($handle);
    
    // Secure file permissions (as best as possible on Windows via PHP)
    chmod($dataFilePath, 0600);
    
    http_response_code(200);
    echo json_encode(['status' => 'success', 'message' => 'Successfully joined the waitlist!']);
    
} catch (Exception $e) {
    // Log exception to secure location, don't output to user
    error_log("CSV Error: " . $e->getMessage() . "\n", 3, $dataFileDir . '/error.log');
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'An internal server error occurred.']);
} finally {
    flock($lock, LOCK_UN);
    fclose($lock);
}
