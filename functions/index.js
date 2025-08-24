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
  accessToken: "EAAPTyTf77LMBPZA83TamGGB1LZBxKZBUwSeckkB16hpYEpAsj0ZBhZAw8IR3Rq005T9pbYqomwe6OtjJPWVCZBZAIRYhTLRCtgk0sTrNiPCD1LgPpLk29MSZBmMhpXabXFI92JYHnvxCPOroZCM1eVi51atfleJkdZBbfCYYUieIc2gvohW8dVL0z2yT4kDZCslJoq4Hi4qeAxt7tnHrzdXCNr1Xetmx0tJZBgrwkEunwusvH0cgAcBK",
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
    const url = `${WHATSAPP_CONFIG.apiUrl}/${WHATSAPP_CONFIG.phoneNumberId}/messages`;
    
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
    
    logger.info('Sending WhatsApp OTP', {
      phoneNumber: phoneNumber,
      otp: otp
    });
    
    const response = await axios.post(url, payload, {
      headers: {
        'Authorization': `Bearer ${WHATSAPP_CONFIG.accessToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    logger.info('WhatsApp OTP sent successfully', {
      phoneNumber: phoneNumber,
      messageId: response.data.messages?.[0]?.id
    });
    
    return { success: true, messageId: response.data.messages?.[0]?.id };
  } catch (error) {
    logger.error('Error sending WhatsApp OTP', {
      phoneNumber: phoneNumber,
      error: error.response?.data || error.message
    });
    
    return { 
      success: false, 
      error: error.response?.data?.error?.message || error.message 
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
    const { phoneNumber } = request.data;
    
    logger.info('sendPasswordResetOTP called with:', { phoneNumber });
    
    if (!phoneNumber) {
      logger.error('No phone number provided');
      throw new Error('Phone number is required');
    }
    
    logger.info('Target phone number for OTP:', phoneNumber);
    
    // Generate OTP
    const otp = generateOTP();
    logger.info('Generated OTP:', otp);
    
    // Store OTP in Firestore
    await storeOTP(phoneNumber, otp);
    logger.info('OTP stored in Firestore for phone:', phoneNumber);
    
    // Send OTP via WhatsApp
    const result = await sendWhatsAppOTP(phoneNumber, otp);
    logger.info('WhatsApp OTP send result:', result);
    
    if (!result.success) {
      logger.error('Failed to send WhatsApp OTP:', result.error);
      throw new Error(`Failed to send OTP: ${result.error}`);
    }
    
    logger.info('Password reset OTP sent successfully');
    return {
      success: true,
      message: 'Password reset OTP sent successfully',
      messageId: result.messageId
    };
    
  } catch (error) {
    logger.error('Error in sendPasswordResetOTP function', { error: error.message, stack: error.stack });
    throw new Error(error.message);
  }
});

// Cloud Function: Reset Password with OTP
exports.resetPasswordWithOTP = onCall({ maxInstances: 10 }, async (request) => {
  try {
    const { phoneNumber, otp, newPassword } = request.data;
    
    logger.info('resetPasswordWithOTP called with:', { phoneNumber, otp });
    
    if (!otp || !newPassword) {
      logger.error('Missing OTP or new password');
      throw new Error('OTP and new password are required');
    }
    
    if (!phoneNumber) {
      logger.error('No phone number provided');
      throw new Error('Phone number is required');
    }
    
    logger.info('Target phone number for password reset:', phoneNumber);
    
    // Verify OTP first
    const otpResult = await verifyOTP(phoneNumber, otp);
    logger.info('OTP verification result for password reset:', otpResult);
    
    if (!otpResult.valid) {
      logger.error('Invalid OTP for password reset');
      throw new Error('Invalid OTP');
    }
    
    // Find user by phone number
    const db = getFirestore();
    const usersRef = db.collection('users');
    const query = usersRef.where('phoneNumber', '==', phoneNumber);
    const snapshot = await query.get();
    
    if (snapshot.empty) {
      logger.error('User not found with phone number:', phoneNumber);
      throw new Error('User not found with this phone number');
    }
    
    const userDoc = snapshot.docs[0];
    const userUid = userDoc.id;
    logger.info('Found user UID for password reset:', userUid);
    
    // Update password in Firebase Auth
    const auth = getAuth();
    await auth.updateUser(userUid, { password: newPassword });
    logger.info('Password updated in Firebase Auth for user:', userUid);
    
    // Update password in Firestore users collection
    await userDoc.ref.update({ 
      password: newPassword,
      passwordChangedAt: new Date(),
      updatedAt: new Date()
    });
    logger.info('Password updated in Firestore for user:', userUid);
    
    return {
      success: true,
      message: 'Password reset successfully'
    };
    
  } catch (error) {
    logger.error('Error in resetPasswordWithOTP function', { error: error.message, stack: error.stack });
    throw new Error(error.message);
  }
});

// Test function
exports.helloWorld = onRequest((request, response) => {
  logger.info("Hello logs!", {structuredData: true});
  response.send("Hello from Firebase!");
});
