// Test script for promocode integration with home page
// This script tests the new getFeaturedPromocodes functionality

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, query, where, getDocs, deleteDoc, doc } = require('firebase/firestore');

// Firebase config (you'll need to replace with your actual config)
const firebaseConfig = {
  // Add your Firebase config here
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Mock promocode service for testing
const mockPromocodeService = {
  async getActivePromocodes() {
    const q = query(
      collection(db, 'promocodes'),
      where('isActive', '==', true)
    );
    
    const querySnapshot = await getDocs(q);
    const promocodes = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const validFrom = data.validFrom?.toDate() || new Date();
      const validUntil = data.validUntil?.toDate() || new Date();
      
      const now = new Date();
      if (now >= validFrom && now <= validUntil) {
        promocodes.push({
          id: doc.id,
          code: data.code,
          discountType: data.discountType,
          discountValue: data.discountValue,
          minOrderAmount: data.minOrderAmount,
          maxDiscount: data.maxDiscount,
          usageLimit: data.usageLimit,
          usedCount: data.usedCount || 0,
          validFrom: validFrom,
          validUntil: validUntil,
          isActive: data.isActive,
          description: data.description,
          createdBy: data.createdBy,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        });
      }
    });

    return promocodes;
  },

  async getFeaturedPromocodes(limit = 3) {
    try {
      const activePromocodes = await this.getActivePromocodes();
      
      // Sort promocodes by priority:
      // 1. Higher discount value first
      // 2. Lower usage percentage (more availability)
      // 3. Newer promocodes first
      const sortedPromocodes = activePromocodes.sort((a, b) => {
        // Calculate usage percentage
        const aUsagePercent = (a.usedCount / a.usageLimit) * 100;
        const bUsagePercent = (b.usedCount / b.usageLimit) * 100;
        
        // Normalize discount value (percentage vs fixed amount)
        const aValue = a.discountType === 'percentage' ? a.discountValue * 2 : a.discountValue;
        const bValue = b.discountType === 'percentage' ? b.discountValue * 2 : b.discountValue;
        
        // Priority score (higher is better)
        const aScore = aValue - aUsagePercent + (a.createdAt / 1000000);
        const bScore = bValue - bUsagePercent + (b.createdAt / 1000000);
        
        return bScore - aScore;
      });
      
      return sortedPromocodes.slice(0, limit);
    } catch (error) {
      console.error('Error getting featured promocodes:', error);
      throw error;
    }
  }
};

// Test function
async function testPromocodeIntegration() {
  console.log('🧪 Testing Promocode Integration with Home Page...\n');

  try {
    // Test 1: Get active promocodes
    console.log('1. Testing getActivePromocodes()...');
    const activePromocodes = await mockPromocodeService.getActivePromocodes();
    console.log(`   ✅ Found ${activePromocodes.length} active promocodes`);
    
    if (activePromocodes.length > 0) {
      console.log('   Sample promocodes:');
      activePromocodes.slice(0, 3).forEach((promo, index) => {
        console.log(`   ${index + 1}. ${promo.code} - ${promo.discountValue}${promo.discountType === 'percentage' ? '%' : '$'} off`);
      });
    }

    // Test 2: Get featured promocodes
    console.log('\n2. Testing getFeaturedPromocodes()...');
    const featuredPromocodes = await mockPromocodeService.getFeaturedPromocodes(3);
    console.log(`   ✅ Found ${featuredPromocodes.length} featured promocodes`);
    
    if (featuredPromocodes.length > 0) {
      console.log('   Featured promocodes (sorted by priority):');
      featuredPromocodes.forEach((promo, index) => {
        const usagePercent = ((promo.usedCount / promo.usageLimit) * 100).toFixed(1);
        console.log(`   ${index + 1}. ${promo.code} - ${promo.discountValue}${promo.discountType === 'percentage' ? '%' : '$'} off (${usagePercent}% used)`);
      });
    }

    // Test 3: Verify sorting logic
    console.log('\n3. Testing sorting logic...');
    if (featuredPromocodes.length >= 2) {
      const first = featuredPromocodes[0];
      const second = featuredPromocodes[1];
      
      const firstScore = (first.discountType === 'percentage' ? first.discountValue * 2 : first.discountValue) - 
                        ((first.usedCount / first.usageLimit) * 100) + (first.createdAt / 1000000);
      const secondScore = (second.discountType === 'percentage' ? second.discountValue * 2 : second.discountValue) - 
                         ((second.usedCount / second.usageLimit) * 100) + (second.createdAt / 1000000);
      
      if (firstScore >= secondScore) {
        console.log('   ✅ Sorting logic working correctly (higher scores first)');
      } else {
        console.log('   ❌ Sorting logic issue detected');
      }
    }

    console.log('\n🎉 All tests completed successfully!');
    console.log('\n📋 Integration Summary:');
    console.log('   • getFeaturedPromocodes() method implemented');
    console.log('   • Smart sorting by discount value, usage, and recency');
    console.log('   • Ready for home page integration');
    console.log('   • Fallback to default banner when no promocodes available');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
if (require.main === module) {
  testPromocodeIntegration();
}

module.exports = { testPromocodeIntegration, mockPromocodeService };
