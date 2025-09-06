import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, useFonts } from '@expo-google-fonts/inter';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Edit, Lock, Mail, Phone, Plus, Search, Trash2, X } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAdminNavigation } from '../../core/auth/AdminNavigationContext';
import { useAuth } from '../../core/auth/AuthContext';
import { DeliveryAgent, deliveryAgentService } from '../../core/services/deliveryAgentService';
import { createToastHelpers } from '../../core/utils/toastUtils';

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
  const toast = createToastHelpers();
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [agentToEdit, setAgentToEdit] = useState<DeliveryAgent | null>(null);
  const [viewingAgent, setViewingAgent] = useState<DeliveryAgent | null>(null);
  const [agentToChangePassword, setAgentToChangePassword] = useState<DeliveryAgent | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [agents, setAgents] = useState<DeliveryAgent[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
  });
  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: '',
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
      toast.showError('Load Error', 'Failed to load delivery agents');
    } finally {
      setLoading(false);
    }
  };

     const openEditModal = (agent: DeliveryAgent | null = null) => {
     if (agent) {
       setAgentToEdit(agent);
       setFormData({
         name: agent.name,
         phone: agent.phone || '', // Convert undefined to empty string
         email: agent.email || '', // Convert undefined to empty string
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
    setPasswordModalVisible(false);
    setAgentToEdit(null);
    setViewingAgent(null);
    setAgentToChangePassword(null);
    setFormData({ name: '', phone: '', email: '', password: '' });
    setPasswordData({ newPassword: '', confirmPassword: '' });
  };

  const openPasswordModal = (agent: DeliveryAgent) => {
    setAgentToChangePassword(agent);
    setPasswordData({ newPassword: '', confirmPassword: '' });
    setPasswordModalVisible(true);
  };



  const handleSave = async () => {
    // Validate form data
    if (!formData.name.trim()) {
      toast.showError('Validation Error', 'Please enter the agent name');
      return;
    }

         // Require either email or phone number (for both new and existing agents)
     if (!formData.email.trim() && !formData.phone.trim()) {
       toast.showError('Validation Error', 'Please enter either email or phone number');
       return;
     }

    // Validate email format if provided
    if (formData.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        toast.showInvalidEmailFormat();
        return;
      }
    }

    // Validate phone format if provided
    if (formData.phone.trim()) {
      const phoneRegex = /^\d{10}$/;
      if (!phoneRegex.test(formData.phone.trim())) {
        toast.showInvalidPhoneFormat();
        return;
      }
    }

    if (!agentToEdit && !formData.password.trim()) {
      toast.showError('Validation Error', 'Password is required for new agents');
      return;
    }

    try {
      setSaving(true);

                    if (agentToEdit) {
         // Update existing agent
         const updateData: any = {
           name: formData.name.trim(),
         };
         
         // Handle phone number - allow clearing it
         updateData.phone = formData.phone.trim(); // Always include phone, even if empty
         
         // Handle email - allow updating it (for phone-only agents who want to add email)
         updateData.email = formData.email.trim(); // Always include email, even if empty
         
         await deliveryAgentService.updateDeliveryAgent(agentToEdit.uid, updateData);
         toast.showSuccess('Agent Updated', 'Delivery agent updated successfully');
       } else {
        // Create new agent
        await deliveryAgentService.createDeliveryAgent({
          name: formData.name.trim(),
          email: formData.email.trim() || undefined,
          phone: formData.phone.trim() || undefined,
          password: formData.password,
        });
        toast.showSuccess('Agent Created', 'Delivery agent created successfully');
      }

      // Reload agents list
      await loadDeliveryAgents();
      closeModals();
         } catch (error: any) {
       console.error('Error saving agent:', error);
       
               // Handle specific validation errors
        if (error.message?.includes('Email address is already registered')) {
          toast.showEmailAlreadyExists();
        } else if (error.message?.includes('Phone number is already registered')) {
          toast.showPhoneAlreadyExists();
        } else if (error.message?.includes('Email address is already registered by another user')) {
          toast.showEmailAlreadyExists();
        } else if (error.message?.includes('Phone number is already registered by another user')) {
          toast.showPhoneAlreadyExists();
        } else {
          toast.showError('Save Error', error.message || 'Failed to save delivery agent');
        }
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
              toast.showSuccess('Agent Deleted', 'Delivery agent deleted successfully');
              await loadDeliveryAgents();
            } catch (error: any) {
              console.error('Error deleting agent:', error);
              toast.showError('Delete Error', error.message || 'Failed to delete delivery agent');
            }
          },
        },
      ]
    );
  };

  const handleChangePassword = async () => {
    if (!agentToChangePassword) return;

    // Validate password data
    if (!passwordData.newPassword.trim() || !passwordData.confirmPassword.trim()) {
      toast.showError('Validation Error', 'Please fill in all password fields');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.showError('Validation Error', 'Passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.showError('Validation Error', 'Password must be at least 6 characters long');
      return;
    }

    Alert.alert(
      'Change Password',
      `Are you sure you want to change the password for ${agentToChangePassword.name}? This will force them to log out immediately.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Change Password',
          style: 'destructive',
          onPress: async () => {
            try {
              setChangingPassword(true);
              await deliveryAgentService.changeDeliveryAgentPassword(
                agentToChangePassword.uid,
                passwordData.newPassword
              );
              toast.showSuccess('Password Changed', 'Password changed successfully. The delivery agent will be logged out immediately.');
              closeModals();
            } catch (error: any) {
              console.error('Error changing password:', error);
              toast.showError('Password Change Error', error.message || 'Failed to change password');
            } finally {
              setChangingPassword(false);
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
               {agent.phone && <Text style={styles.agentDetail}>{agent.phone}</Text>}
               {agent.email && <Text style={styles.agentDetail}>{agent.email}</Text>}
             </View>
            <View style={styles.agentActions}>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => openEditModal(agent)}
              >
                <Edit size={18} color={Colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.actionButton, styles.passwordButton]}
                onPress={() => openPasswordModal(agent)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Lock size={18} color={Colors.white} />
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
        statusBarTranslucent={true}
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
                     <Text style={styles.inputLabel}>Phone Number <Text style={styles.optionalText}>(Optional if email provided)</Text></Text>
                     <TextInput 
                         style={styles.input} 
                         value={formData.phone} 
                         onChangeText={(text) => setFormData({ ...formData, phone: text })} 
                         placeholder="Enter 10-digit mobile number" 
                         keyboardType="phone-pad" 
                         maxLength={10}
                     />
                     <Text style={styles.helpText}>Format: 10 digits (e.g., 9876543210)</Text>
                 </View>
                 <View style={styles.inputGroup}>
                     <Text style={styles.inputLabel}>Email <Text style={styles.optionalText}>(Optional if phone provided)</Text></Text>
                     <TextInput 
                        style={[
                          styles.input,
                          (agentToEdit && agentToEdit.email) && styles.inputDisabled,
                        ]} 
                        value={formData.email} 
                        onChangeText={(text) => setFormData({ ...formData, email: text })} 
                        placeholder="Enter email address" 
                        keyboardType="email-address" 
                        autoCapitalize="none" 
                        editable={!(agentToEdit && agentToEdit.email)}
                     />
                     <Text style={styles.helpText}>Format: user@example.com</Text>
                 </View>
                <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Password</Text>
                    <TextInput style={styles.input} value={formData.password} onChangeText={(text) => setFormData({ ...formData, password: text })} placeholder={agentToEdit ? "Enter new password (optional)" : "Enter password"} secureTextEntry />
                </View>
                <View style={styles.helpNote}>
                    <Text style={styles.helpNoteText}>
                        💡 Note: Delivery agents can login using either their phone number or email address. At least one contact method is required.
                    </Text>
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
        statusBarTranslucent={true}
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
                         {viewingAgent.phone && <View style={styles.detailRow}><Phone size={16} color={Colors.textSecondary}/><Text style={styles.detailText}>{viewingAgent.phone}</Text></View>}
                         {viewingAgent.email && <View style={styles.detailRow}><Mail size={16} color={Colors.textSecondary}/><Text style={styles.detailText}>{viewingAgent.email}</Text></View>}
                        
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

      {/* Password Change Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        statusBarTranslucent={true}
        visible={passwordModalVisible}
        onRequestClose={closeModals}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, {paddingBottom: insets.bottom}]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Change Password - {agentToChangePassword?.name}
              </Text>
              <TouchableOpacity onPress={closeModals}>
                <X size={24} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView>
              <View style={styles.modalForm}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>New Password</Text>
                  <TextInput 
                    style={styles.input} 
                    value={passwordData.newPassword} 
                    onChangeText={(text) => setPasswordData({ ...passwordData, newPassword: text })} 
                    placeholder="Enter new password" 
                    secureTextEntry 
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Confirm Password</Text>
                  <TextInput 
                    style={styles.input} 
                    value={passwordData.confirmPassword} 
                    onChangeText={(text) => setPasswordData({ ...passwordData, confirmPassword: text })} 
                    placeholder="Confirm new password" 
                    secureTextEntry 
                  />
                </View>
                <View style={styles.warningBox}>
                  <Text style={styles.warningText}>
                    ⚠️ Warning: Changing the password will immediately log out the delivery agent from all their active sessions.
                  </Text>
                </View>
              </View>
            </ScrollView>
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={[styles.saveButton, styles.passwordButton, changingPassword && styles.saveButtonDisabled]} 
                onPress={handleChangePassword}
                disabled={changingPassword}
              >
                {changingPassword ? (
                  <ActivityIndicator size="small" color={Colors.white} />
                ) : (
                  <Text style={styles.saveButtonText}>Change Password</Text>
                )}
              </TouchableOpacity>
            </View>
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
  optionalText: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  helpNote: {
    backgroundColor: Colors.primaryLighter,
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
  },
     helpNoteText: {
     fontSize: 13,
     fontFamily: 'Inter_400Regular',
     color: Colors.primary,
     lineHeight: 18,
   },
   helpText: {
     fontSize: 12,
     fontFamily: 'Inter_400Regular',
     color: Colors.textSecondary,
     marginTop: 4,
     fontStyle: 'italic',
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
  inputDisabled: {
    backgroundColor: Colors.border,
    color: Colors.textSecondary,
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
  },
  passwordButton: {
    backgroundColor: Colors.yellow,
  },
  warningBox: {
    backgroundColor: Colors.redLighter,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: Colors.red,
    marginTop: 20,
  },
  warningText: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: Colors.red,
    lineHeight: 20,
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