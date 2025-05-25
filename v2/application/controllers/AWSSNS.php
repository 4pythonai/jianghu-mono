<?php
defined('BASEPATH') or exit('No direct script access allowed');

class AWSSNS extends CI_Controller {

  public function __construct() {
    parent::__construct();
    // You might load any necessary helpers or libraries here
    // $this->load->helper('url');
  }

  public function index() {
    logtext("AWSSNS/index: Received SNS notification");

    // Get the raw POST body (SNS sends JSON in the body)
    $raw_input = $this->input->raw_input_stream;
    logtext("AWSSNS/index: Raw input: " . $raw_input);

    $sns_message = json_decode($raw_input, true); // Decode as associative array

    // Check if JSON decoding was successful and the 'Type' field exists
    if (json_last_error() !== JSON_ERROR_NONE || !isset($sns_message['Type'])) {
      logtext('error: AWSSNS/index: Failed to decode JSON or Type field is missing.');
      // Respond with a non-200 status code to indicate an error
      $this->output
        ->set_status_header(400, 'Bad Request')
        ->set_output('Invalid SNS message format.');
      return;
    }

    // --- SECURITY WARNING ---
    // Signature verification is CRITICAL for production environments.
    // Without it, anyone can send fake SNS messages to this endpoint.
    // Implementing signature verification without the AWS SDK requires:
    // 1. Fetching the certificate from $sns_message['SigningCertURL']
    // 2. Extracting the public key.
    // 3. Constructing the canonicalized message string.
    // 4. Using a crypto library (like OpenSSL in PHP) to verify $sns_message['Signature']
    //    against the message string and the public key.
    // --- END SECURITY WARNING ---
    // logtext("AWSSNS/index: Signature verification is NOT implemented. This is insecure for production.");
    // Placeholder for where signature verification would go:
    /*
        if (!$this->verify_sns_signature($sns_message)) {
             logtext('error', "AWSSNS/index: Signature verification failed.");
             $this->output
                  ->set_status_header(403, 'Forbidden')
                  ->set_output('Invalid signature.');
             return;
        }
        logtext( "AWSSNS/index: Signature verification (simulated/placeholder) passed.");
        */

    // Process the message based on its type
    switch ($sns_message['Type']) {
      case 'SubscriptionConfirmation':
        logtext("AWSSNS/index: Received SubscriptionConfirmation.");
        if (isset($sns_message['SubscribeURL'])) {
          $subscribe_url = $sns_message['SubscribeURL'];
          logtext("AWSSNS/index: Calling SubscribeURL: " . $subscribe_url);

          // Use file_get_contents to confirm the subscription
          // Consider using cURL for more control and error handling in production
          $response = @file_get_contents($subscribe_url);

          if ($response === FALSE) {
            $error = error_get_last();
            logtext("AWSSNS/index: Failed to confirm subscription: " . ($error ? $error['message'] : 'Unknown error'));
            // Depending on your needs, you might return an error status,
            // but SNS typically expects a 200 even if confirmation fails
            // so it doesn't retry excessively. Log the error is key.
          } else {
            logtext("AWSSNS/index: Subscription confirmation response: " . $response);
          }

          $this->output
            ->set_status_header(200, 'OK')
            ->set_output('Subscription confirmed.');
        } else {
          logtext("AWSSNS/index: SubscriptionConfirmation message missing SubscribeURL.");
          $this->output
            ->set_status_header(400, 'Bad Request')
            ->set_output('Missing SubscribeURL.');
        }
        break;

      case 'Notification':
        logtext("AWSSNS/index: Received Notification.");
        // --- PROCESS THE ACTUAL SNS MESSAGE HERE ---
        // The message content is in $sns_message['Message']
        // The subject is in $sns_message['Subject'] (optional)
        // Add your logic to process the notification payload.
        // This could involve saving to a database, triggering another process, etc.
        logtext("AWSSNS/index: MessageId: " . $sns_message['MessageId']);
        logtext("AWSSNS/index: TopicArn: " . $sns_message['TopicArn']);
        logtext("AWSSNS/index: Subject: " . ($sns_message['Subject'] ?? 'N/A')); // Use null coalescing for optional Subject
        logtext("AWSSNS/index: Message: " . $sns_message['Message']);

        // Example: Simply log the message for now
        // In a real application, you would parse $sns_message['Message']
        // (which is often a JSON string itself) and act on it.

        // Always return 200 OK to indicate successful receipt and processing (even if your processing logic fails,
        // failing here tells SNS *not* to retry sending this notification).
        $this->output
          ->set_status_header(200, 'OK')
          ->set_output('Notification received and processed.');
        break;

      case 'UnsubscribeConfirmation':
        logtext("AWSSNS/index: Received UnsubscribeConfirmation.");
        // Log or handle unsubscribe confirmation if needed.
        logtext("AWSSNS/index: TopicArn: " . $sns_message['TopicArn']);
        logtext("AWSSNS/index: Token: " . $sns_message['Token']); // Token could be used to programmatically re-subscribe

        $this->output
          ->set_status_header(200, 'OK')
          ->set_output('Unsubscribe confirmation received.');
        break;

      default:
        // Handle other potential message types if necessary, or log unknown types
        logtext('warning', "AWSSNS/index: Received unknown SNS message type: " . $sns_message['Type']);
        $this->output
          ->set_status_header(400, 'Bad Request')
          ->set_output('Unknown message type.');
        break;
    }

    logtext("AWSSNS/index: Processing complete.");
  }

  // The _get_all_headers function is generally not needed for basic SNS handling,
  // as the body contains the essential information. Keeping it if you find it useful.
  private function _get_all_headers() {
    $headers = [];
    // Ensure $_SERVER is available and iterate through relevant keys
    if (isset($_SERVER)) {
      foreach ($_SERVER as $key => $value) {
        // Standard HTTP headers often start with HTTP_
        if (strpos($key, 'HTTP_') === 0) {
          // Format the header name (e.g., HTTP_USER_AGENT -> User-Agent)
          $header_name = str_replace('_', '-', substr($key, 5));
          $header_name = ucwords(strtolower($header_name), '-');
          $headers[$header_name] = $value;
        }
        // Include CONTENT_TYPE and CONTENT_LENGTH which don't have HTTP_ prefix
        elseif ($key === 'CONTENT_TYPE' || $key === 'CONTENT_LENGTH') {
          $headers[ucwords(strtolower($key), '-')] = $value;
        }
      }
    }
    return $headers;
  }
}
