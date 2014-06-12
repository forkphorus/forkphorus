<?php

$ch = curl_init($_GET['u']);

curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
curl_setopt($ch, CURLOPT_HEADER, false);
curl_setopt($ch, CURLOPT_REFERER, 'http://scratch.mit.edu/');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_BINARYTRANSFER, true);

$body = curl_exec($ch);

if (!curl_errno($ch)) {
  $mime = curl_getinfo($ch, CURLINFO_CONTENT_TYPE);
  http_response_code(curl_getinfo($ch, CURLINFO_HTTP_CODE));
  header('Content-Type: '.$mime);
  header('Content-Length: '.curl_getinfo($ch, CURLINFO_CONTENT_LENGTH_DOWNLOAD));
  if ($mime == 'application/json') {
    header('Cache-Control: max-age=0, no-cache');
  } else {
    header('Cache-Control: public, max-age=31536000');
  }
  echo $body;
} else {
  http_response_code(500);
  echo 'cURL Error.';
}

curl_close($ch);
