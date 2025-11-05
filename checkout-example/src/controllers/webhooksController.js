/**
 * Webhooks Controller
 * Handles Adyen webhook notifications
 */

const { hmacValidator } = require('@adyen/api-library');
const { config } = require('../config');
const { asyncHandler } = require('../utils/errorHandler');
const paymentService = require('../services/paymentService');

/**
 * Process incoming webhook notifications
 */
const processWebhook = asyncHandler(async (req, res) => {
  console.log('=== WEBHOOK RECEIVED ===');
  console.log('Headers keys:', Object.keys(req.headers));
  console.log('Body keys:', Object.keys(req.body || {}));

  try {
    // Parse the webhook notification
    const notificationRequestItems = req.body.notificationItems;
    
    if (!notificationRequestItems || !Array.isArray(notificationRequestItems)) {
      console.error('Invalid webhook format: missing notificationItems');
      return res.status(400).json({
        error: 'Invalid webhook format',
        code: 'INVALID_FORMAT'
      });
    }

    // Process each notification item
    for (const item of notificationRequestItems) {
      const notification = item.NotificationRequestItem;
      
      if (!notification) {
        console.warn('Skipping invalid notification item');
        continue;
      }

      console.log('Processing notification:', {
        merchantReference: notification.merchantReference,
        eventCode: notification.eventCode,
        success: notification.success
      });

      // Validate HMAC signature (if HMAC key is configured)
      const hmacKey = config.adyen.ADYEN_HMAC_KEY;
      
      if (hmacKey) {
        const validator = new hmacValidator();
        if (!validator.validateHMAC(notification, hmacKey)) {
          console.error('Invalid HMAC signature for notification:', notification.merchantReference);
          return res.status(401).json({
            error: 'Invalid HMAC signature',
            code: 'INVALID_HMAC'
          });
        }
      } else {
        console.log('Note: HMAC key not configured. Skipping webhook signature validation.');
      }

      // Update payment status based on webhook event
      paymentService.updatePaymentStatusFromWebhook(
        notification.merchantReference,
        notification.eventCode,
        notification.success
      );
    }

    // Acknowledge that the webhook was processed
    res.status(202).send();
  } catch (error) {
    console.error('Webhook processing error:', {
      message: error.message,
      stack: error.stack,
      body: req.body
    });

    // Return 500 to indicate processing error
    res.status(500).json({
      error: 'Webhook processing failed',
      code: 'PROCESSING_ERROR'
    });
  }
});

module.exports = {
  processWebhook
};
