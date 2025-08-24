/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const {setGlobalOptions} = require("firebase-functions");
const {onRequest, onCall} = require("firebase-functions/v2/https");
const {initializeApp} = require("firebase-admin/app");
const {getFirestore} = require("firebase-admin/firestore");
const {getAuth} = require("firebase-admin/auth");
const axios = require("axios");
const logger = require("firebase-functions/logger");

// Initialize Firebase Admin
initializeApp();

// For cost control, you can set the maximum number of containers that can be
// running at the same time. This helps mitigate the impact of unexpected
// traffic spikes by instead downgrading performance. This limit is a
// per-function limit. You can override the limit for each function using the
// `maxInstances` option in the function's options, e.g.
// `onRequest({ maxInstances: 5 }, (req, res) => { ... })`.
// NOTE: setGlobalOptions does not apply to functions using the v1 API. V1
// functions should each use functions.runWith({ maxInstances: 10 }) instead.
// In the v1 API, each function can only serve one request per container, so
// this will be the maximum concurrent request count.
setGlobalOptions({ maxInstances: 10 });

// WhatsApp API Configuration
const WHATSAPP_CONFIG = {
  accessToken: "EAAPTyTf77LMBPaOEDQxjXAcwyXPxIucAPXtU1q6aRZCmo9ZAajfrrYZB8L78iFllvUuMxWSWr91uIqQ9ZAOpLVZCXoCGR0Rf3l5cJRQIWoHCgPIWaGSFBYOf2u0GvUCFR3yw0TrrjlHHEUhReE7ZAhluSIie9YYXDCzwZCBDdDDfHnljMM4CPKm6oO2lsd6BVZBkyw9MN9WvtOMUxy7XVAlW8UA6yfGGPpfXDBcL0cIIb2ZBLtgZDZD",
  phoneNumberId: "751377694728568",
  apiUrl: "https://graph.facebook.com/v22.0",
  templateName: "first_vihar_template"
};

// Generate OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Store OTP in Firestore with expiration
async function storeOTP(phoneNumber, otp) {
  const db = getFirestore();
  const otpRef = db.collection('otps').doc(phoneNumber);
  
  // OTP expires in 10 minutes
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
  
  await otpRef.set({
    otp: otp,
    expiresAt: expiresAt,
    createdAt: new Date(),
    attempts: 0
  });
}

// Verify OTP from Firestore
async function verifyOTP(phoneNumber, otp) {
  const db = getFirestore();
  const otpRef = db.collection('otps').doc(phoneNumber);
  const otpDoc = await otpRef.get();
  
  if (!otpDoc.exists) {
    return { valid: false, message: "OTP not found or expired" };
  }
  
  const otpData = otpDoc.data();
  
  // Check if OTP is expired
  if (new Date() > otpData.expiresAt.toDate()) {
    await otpRef.delete();
    return { valid: false, message: "OTP has expired" };
  }
  
  // Check if too many attempts
  if (otpData.attempts >= 3) {
    await otpRef.delete();
    return { valid: false, message: "Too many failed attempts" };
  }
  
  // Verify OTP
  if (otpData.otp === otp) {
    await otpRef.delete();
    return { valid: true, message: "OTP verified successfully" };
  } else {
    // Increment attempts
    await otpRef.update({
      attempts: otpData.attempts + 1
    });
    return { valid: false, message: "Invalid OTP" };
  }
}

// Send WhatsApp OTP
async function sendWhatsAppOTP(phoneNumber, otp) {
  try {
    logger.info('=== START: sendWhatsAppOTP ===');
    logger.info('Input parameters:', { phoneNumber, otp });
    
    const url = `${WHATSAPP_CONFIG.apiUrl}/${WHATSAPP_CONFIG.phoneNumberId}/messages`;
    logger.info('WhatsApp API URL:', url);
    
    const payload = {
      messaging_product: "whatsapp",
      to: phoneNumber,
      type: "template",
      template: {
        name: WHATSAPP_CONFIG.templateName,
        language: { code: "en_US" },
        components: [
          {
            type: "body",
            parameters: [
              { type: "text", text: otp }
            ]
          },
          {
            type: "button",
            sub_type: "url",
            index: "0",
            parameters: [
              { type: "text", text: otp }
            ]
          }
        ]
      }
    };
    
    logger.info('WhatsApp API payload:', JSON.stringify(payload, null, 2));
    logger.info('WhatsApp config:', {
      phoneNumberId: WHATSAPP_CONFIG.phoneNumberId,
      templateName: WHATSAPP_CONFIG.templateName,
      accessTokenLength: WHATSAPP_CONFIG.accessToken?.length || 0
    });
    
    logger.info('Making axios POST request to WhatsApp API...');
    const response = await axios.post(url, payload, {
      headers: {
        'Authorization': `Bearer ${WHATSAPP_CONFIG.accessToken}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000 // 30 second timeout
    });
    
    logger.info('WhatsApp API response received:', {
      status: response.status,
      statusText: response.statusText,
      data: response.data
    });
    
    const messageId = response.data.messages?.[0]?.id;
    logger.info('WhatsApp OTP sent successfully', {
      phoneNumber: phoneNumber,
      messageId: messageId
    });
    
    logger.info('=== END: sendWhatsAppOTP (SUCCESS) ===');
    return { success: true, messageId: messageId };
    
  } catch (error) {
    logger.error('=== ERROR: sendWhatsAppOTP ===');
    logger.error('Error details:', {
      message: error.message,
      code: error.code,
      response: {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      },
      request: {
        url: error.config?.url,
        method: error.config?.method,
        headers: error.config?.headers
      }
    });
    
    const errorMessage = error.response?.data?.error?.message || error.message;
    logger.error('Final error message:', errorMessage);
    
    logger.info('=== END: sendWhatsAppOTP (ERROR) ===');
    return { 
      success: false, 
      error: errorMessage 
    };
  }
}

// Cloud Function: Send OTP
exports.sendOTP = onCall({ maxInstances: 10 }, async (request) => {
  try {
    // Check if user is authenticated
    if (!request.auth) {
      throw new Error('Unauthorized');
    }
    
    const { phoneNumber } = request.data;
    
    if (!phoneNumber) {
      throw new Error('Phone number is required');
    }
    
    // Validate phone number format (should be in international format)
    const phoneRegex = /^[1-9]\d{1,14}$/;
    if (!phoneRegex.test(phoneNumber.replace(/\D/g, ''))) {
      throw new Error('Invalid phone number format');
    }
    
    // Generate OTP
    const otp = generateOTP();
    
    // Store OTP in Firestore
    await storeOTP(phoneNumber, otp);
    
    // Send OTP via WhatsApp
    const result = await sendWhatsAppOTP(phoneNumber, otp);
    
    if (!result.success) {
      throw new Error(`Failed to send OTP: ${result.error}`);
    }
    
    return {
      success: true,
      message: 'OTP sent successfully',
      messageId: result.messageId
    };
    
  } catch (error) {
    logger.error('Error in sendOTP function', { error: error.message });
    throw new Error(error.message);
  }
});

// Cloud Function: Verify OTP
exports.verifyOTP = onCall({ maxInstances: 10 }, async (request) => {
  try {
    // Check if user is authenticated
    if (!request.auth) {
      throw new Error('Unauthorized');
    }
    
    const { phoneNumber, otp } = request.data;
    
    if (!phoneNumber || !otp) {
      throw new Error('Phone number and OTP are required');
    }
    
    // Verify OTP
    const result = await verifyOTP(phoneNumber, otp);
    
    return result;
    
  } catch (error) {
    logger.error('Error in verifyOTP function', { error: error.message });
    throw new Error(error.message);
  }
});

// Cloud Function: Verify OTP for Password Reset (no auth required)
exports.verifyPasswordResetOTP = onCall({ maxInstances: 10 }, async (request) => {
  try {
    const { phoneNumber, otp } = request.data;
    
    logger.info('verifyPasswordResetOTP called with:', { phoneNumber, otp });
    
    if (!otp) {
      logger.error('No OTP provided');
      throw new Error('OTP is required');
    }
    
    if (!phoneNumber) {
      logger.error('No phone number provided');
      throw new Error('Phone number is required');
    }
    
    logger.info('Target phone number for OTP verification:', phoneNumber);
    
    // Verify OTP
    const result = await verifyOTP(phoneNumber, otp);
    logger.info('OTP verification result:', result);
    
    return result;
    
  } catch (error) {
    logger.error('Error in verifyPasswordResetOTP function', { error: error.message, stack: error.stack });
    throw new Error(error.message);
  }
});

// Cloud Function: Send OTP for Password Reset (no auth required)
exports.sendPasswordResetOTP = onCall({ maxInstances: 10 }, async (request) => {
  try {
    logger.info('=== START: sendPasswordResetOTP Cloud Function ===');
    logger.info('Request data:', request.data);
    logger.info('Request auth:', request.auth);
    
    const { phoneNumber } = request.data;
    
    logger.info('Extracted phone number:', phoneNumber);
    
    if (!phoneNumber) {
      logger.error('No phone number provided in request data');
      throw new Error('Phone number is required');
    }
    
    logger.info('Target phone number for OTP:', phoneNumber);
    
    // Generate OTP
    const otp = generateOTP();
    logger.info('Generated OTP:', otp);
    
    // Store OTP in Firestore
    logger.info('Storing OTP in Firestore...');
    await storeOTP(phoneNumber, otp);
    logger.info('OTP stored successfully in Firestore for phone:', phoneNumber);
    
    // Send OTP via WhatsApp
    logger.info('Calling sendWhatsAppOTP function...');
    const result = await sendWhatsAppOTP(phoneNumber, otp);
    logger.info('WhatsApp OTP send result:', result);
    
    if (!result.success) {
      logger.error('Failed to send WhatsApp OTP:', result.error);
      throw new Error(`Failed to send OTP: ${result.error}`);
    }
    
    logger.info('=== SUCCESS: Password reset OTP sent successfully ===');
    return {
      success: true,
      message: 'Password reset OTP sent successfully',
      messageId: result.messageId
    };
    
  } catch (error) {
    logger.error('=== ERROR: sendPasswordResetOTP Cloud Function ===');
    logger.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code
    });
    logger.error('=== END: sendPasswordResetOTP (ERROR) ===');
    throw new Error(error.message);
  }
});



// Test function
exports.helloWorld = onRequest((request, response) => {
  logger.info("Hello logs!", {structuredData: true});
  response.send("Hello from Firebase!");
});
