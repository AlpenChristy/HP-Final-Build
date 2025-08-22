import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, useFonts } from '@expo-google-fonts/inter';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Edit, Mail, Phone, Plus, Search, Trash2, X } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../core/auth/AuthContext';
import { DeliveryAgent, deliveryAgentService } from '../../core/services/deliveryAgentService';
import { router } from 'expo-router';
import { useAdminNavigation } from '../../core/auth/StableAdminLayout';

// --- Color Palette (Matched with other pages) ---
const Colors = {
  primary: '#0D47A1',
  primaryLight: '#1E88E5',
  primaryLighter: '#E3F2FD',
  background: '#F8F9FA',
  surface: '#FFFFFF',
  text: '#1D3557',
  textSecondary: '#6C757D',
  border: '#EAECEF',
  white: '#FFFFFF',
  red: '#DC2626',
  redLighter: '#FFEBEE',
  green: '#16A34A',
  yellow: '#F59E0B',
};

export default function AdminDeliveryAgentScreen({ navigation }: { navigation: any }) {
  const insets = useSafeAreaInsets();
  const { userSession } = useAuth();
  const { goBack } = useAdminNavigation();
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [agentToEdit, setAgentToEdit] = useState<DeliveryAgent | null>(null);
  const [viewingAgent, setViewingAgent] = useState<DeliveryAgent | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [agents, setAgents] = useState<DeliveryAgent[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
  });


  let [fontsLoaded] = useFonts({
    Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold,
  });

  // Load delivery agents on component mount
  useEffect(() => {
    loadDeliveryAgents();
  }, []);

  const loadDeliveryAgents = async () => {
    try {
      setLoading(true);
      const agentsData = await deliveryAgentService.getAllDeliveryAgents();
      setAgents(agentsData);
    } catch (error) {
      console.error('Error loading delivery agents:', error);
      Alert.alert('Error', 'Failed to load delivery agents');
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (agent: DeliveryAgent | null = null) => {
    if (agent) {
      setAgentToEdit(agent);
      setFormData({
        name: agent.name,
        phone: agent.phone,
        email: agent.email,
        password: '', // Don't pre-fill password for editing
      });
    } else {
      setAgentToEdit(null);
      setFormData({
        name: '',
        phone: '',
        email: '',
        password: '',
      });
    }
    setEditModalVisible(true);
  };

  const openDetailsModal = (agent: DeliveryAgent) => {
      setViewingAgent(agent);
      setDetailsModalVisible(true);
  }

  const closeModals = () => {
    setEditModalVisible(false);
    setDetailsModalVisible(false);
    setAgentToEdit(null);
    setViewingAgent(null);
    setFormData({ name: '', phone: '', email: '', password: '' });
  };



  const handleSave = async () => {
    // Validate form data
    if (!formData.name.trim() || !formData.email.trim() || !formData.phone.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (!agentToEdit && !formData.password.trim()) {
      Alert.alert('Error', 'Password is required for new agents');
      return;
    }

    try {
      setSaving(true);

      if (agentToEdit) {
        // Update existing agent
        await deliveryAgentService.updateDeliveryAgent(agentToEdit.uid, {
          name: formData.name.trim(),
          phone: formData.phone.trim(),
          // Note: Email cannot be updated in Firebase Auth easily
        });
        Alert.alert('Success', 'Delivery agent updated successfully');
      } else {
        // Create new agent
        await deliveryAgentService.createDeliveryAgent({
          name: formData.name.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          password: formData.password,
        });
        Alert.alert('Success', 'Delivery agent created successfully');
      }

      // Reload agents list
      await loadDeliveryAgents();
      closeModals();
    } catch (error: any) {
      console.error('Error saving agent:', error);
      Alert.alert('Error', error.message || 'Failed to save delivery agent');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (agent: DeliveryAgent) => {
    Alert.alert(
      'Delete Agent',
      `Are you sure you want to delete ${agent.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deliveryAgentService.deleteDeliveryAgent(agent.uid);
              Alert.alert('Success', 'Delivery agent deleted successfully');
              await loadDeliveryAgents();
            } catch (error: any) {
              console.error('Error deleting agent:', error);
              Alert.alert('Error', error.message || 'Failed to delete delivery agent');
            }
          },
        },
      ]
    );
  };

  if (!fontsLoaded) {
    return <View style={styles.loadingContainer} />;
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading delivery agents...</Text>
      </View>
    );
  }
  
  const filteredAgents = agents.filter(agent => 
    agent.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <LinearGradient
        colors={[Colors.primaryLight, Colors.primary]}
        style={[styles.header, { paddingTop: insets.top + 10 }]}
      >
        <View style={styles.headerLeft}>
            <TouchableOpacity onPress={goBack} style={styles.headerIcon}>
                <ArrowLeft size={26} color={Colors.white} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Delivery Agents</Text>
        </View>
        <TouchableOpacity onPress={() => openEditModal()} style={styles.headerIcon}>
            <Plus size={26} color={Colors.white} />
        </TouchableOpacity>
      </LinearGradient>

      <View style={styles.searchSection}>
        <View style={styles.searchBox}>
          <Search size={20} color={Colors.textSecondary} />
          <TextInput 
            style={styles.searchInput}
            placeholder="Search agents by name..."
            placeholderTextColor={Colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.agentsList}>
        {filteredAgents.map((agent) => (
          <TouchableOpacity key={agent.id} style={styles.agentCard} onPress={() => openDetailsModal(agent)}>
            <View style={styles.agentInfo}>
              <Text style={styles.agentName}>{agent.name}</Text>
              <Text style={styles.agentDetail}>{agent.phone}</Text>
              <Text style={styles.agentDetail}>{agent.email}</Text>
            </View>
            <View style={styles.agentActions}>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => openEditModal(agent)}
              >
                <Edit size={18} color={Colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.actionButton, styles.deleteButton]}
                onPress={() => handleDelete(agent)}
              >
                <Trash2 size={18} color={Colors.red} />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>



      {/* Add/Edit Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={editModalVisible}
        onRequestClose={closeModals}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, {paddingBottom: insets.bottom}]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {agentToEdit ? 'Edit Agent' : 'Add New Agent'}
              </Text>
              <TouchableOpacity onPress={closeModals}>
                <X size={24} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView>
                <View style={styles.modalForm}>
                <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Agent Name</Text>
                    <TextInput style={styles.input} value={formData.name} onChangeText={(text) => setFormData({ ...formData, name: text })} placeholder="Enter full name" />
                </View>
                <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Phone Number</Text>
                    <TextInput style={styles.input} value={formData.phone} onChangeText={(text) => setFormData({ ...formData, phone: text })} placeholder="Enter 10-digit mobile number" keyboardType="phone-pad" />
                </View>
                <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Email</Text>
                    <TextInput style={styles.input} value={formData.email} onChangeText={(text) => setFormData({ ...formData, email: text })} placeholder="Enter email address" keyboardType="email-address" autoCapitalize="none" />
                </View>
                <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Password</Text>
                    <TextInput style={styles.input} value={formData.password} onChangeText={(text) => setFormData({ ...formData, password: text })} placeholder={agentToEdit ? "Enter new password (optional)" : "Enter password"} secureTextEntry />
                </View>
                </View>
            </ScrollView>
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={[styles.saveButton, saving && styles.saveButtonDisabled]} 
                onPress={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color={Colors.white} />
                ) : (
                  <Text style={styles.saveButtonText}>{agentToEdit ? 'Update Agent' : 'Add Agent'}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Details Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={detailsModalVisible}
        onRequestClose={closeModals}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, {paddingBottom: insets.bottom}]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{viewingAgent?.name}</Text>
              <TouchableOpacity onPress={closeModals}>
                <X size={24} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>
            {viewingAgent && (
                <ScrollView>
                    <View style={styles.modalForm}>
                        <Text style={styles.sectionTitle}>Contact Information</Text>
                        <View style={styles.detailRow}><Phone size={16} color={Colors.textSecondary}/><Text style={styles.detailText}>{viewingAgent.phone}</Text></View>
                        <View style={styles.detailRow}><Mail size={16} color={Colors.textSecondary}/><Text style={styles.detailText}>{viewingAgent.email}</Text></View>
                        
                        <Text style={[styles.sectionTitle, {marginTop: 24}]}>Delivery Statistics</Text>
                        <View style={styles.statsGrid}>
                            <View style={styles.detailStatCard}><Text style={styles.statNumber}>{viewingAgent.deliveriesThisWeek}</Text><Text style={styles.statLabel}>Deliveries this Week</Text></View>
                            <View style={styles.detailStatCard}><Text style={styles.statNumber}>{viewingAgent.remainingToday}</Text><Text style={styles.statLabel}>Remaining Today</Text></View>
                            <View style={styles.detailStatCard}><Text style={styles.statNumber}>{viewingAgent.totalAllotted}</Text><Text style={styles.statLabel}>Total Allotted</Text></View>
                        </View>
                    </View>
                </ScrollView>
            )}
          </View>
        </View>
      </Modal>


    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingBottom: 20,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: { padding: 8 },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.white,
    marginLeft: 12,
  },
  searchSection: {
    backgroundColor: Colors.surface,
    padding: 20,
    borderBottomWidth: 1,
    borderColor: Colors.border,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchInput: {
    flex: 1,
    height: 50,
    fontSize: 16,
    marginLeft: 12,
    fontFamily: 'Inter_400Regular',
  },
  agentsList: {
    flex: 1,
    padding: 20,
  },
  agentCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#959DA5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  agentInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  agentName: {
    fontSize: 17,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.text,
    marginBottom: 4,
  },
  agentDetail: {
      fontSize: 14,
      fontFamily: 'Inter_400Regular',
      color: Colors.textSecondary,
      marginBottom: 4,
  },
  agentActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    backgroundColor: Colors.primaryLighter,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButton: {
    backgroundColor: Colors.redLighter,
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    backgroundColor: Colors.primary,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  // --- Modal Styles ---
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.text,
  },
  modalForm: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
    color: Colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modalActions: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  saveButton: {
  backgroundColor: Colors.primary,
  paddingVertical: 14, // smaller padding
  borderRadius: 12,
  alignItems: 'center',
  justifyContent: 'center', // ensure text stays centered
},
  saveButtonText: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.white,
  },
  saveButtonDisabled: {
    backgroundColor: Colors.textSecondary,
    opacity: 0.7,
  },
  disabledButton: {
    backgroundColor: Colors.textSecondary,
    opacity: 0.7,
  },
  passwordNote: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
    marginBottom: 20,
    lineHeight: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: Colors.border,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.textSecondary,
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Inter_500Medium',
    color: Colors.textSecondary,
    marginTop: 12,
  },
  sectionTitle: {
      fontSize: 16,
      fontFamily: 'Inter_600SemiBold',
      color: Colors.text,
      marginBottom: 16,
  },
  detailRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginBottom: 12,
  },
  detailText: {
      fontSize: 15,
      fontFamily: 'Inter_400Regular',
      color: Colors.text,
  },
  statsGrid: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 16,
  },
  detailStatCard: {
      flex: 1,
      backgroundColor: Colors.background,
      borderRadius: 12,
      padding: 16,
      alignItems: 'center',
  },
  statNumber: {
      fontSize: 22,
      fontFamily: 'Inter_700Bold',
      color: Colors.primary,
      marginBottom: 4,
  },
  statLabel: {
      fontSize: 13,
      fontFamily: 'Inter_500Medium',
      color: Colors.textSecondary,
      textAlign: 'center',
  },
});