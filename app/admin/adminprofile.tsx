import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, useFonts } from '@expo-google-fonts/inter';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { ArrowLeft, Bell, ChevronRight, Edit, Lock, LogOut, Tag, Trash2, User, Users, X } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Alert, Modal, ScrollView, StatusBar, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../core/auth/AuthContext';
import { useAdminNavigation } from '../../core/auth/StableAdminLayout';
import { NotificationData, notificationService } from '../../core/services/notificationService';
import { PromocodeData, promocodeService } from '../../core/services/promocodeService';
import { SubAdminData, SubAdminPermissions, subAdminService } from '../../core/services/subAdminService';
import { userService } from '../../core/services/userService';

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
};



// --- Modal Content Components ---
const EditProfileContent = ({ user, onSave, isSaving }: { user: any, onSave: (data: { name: string; email: string }) => Promise<void> | void, isSaving: boolean }) => {
    const [formData, setFormData] = useState({ name: user?.displayName || '', email: user?.email || '' });
    return (
        <View>
            <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Name</Text>
                <TextInput style={styles.input} value={formData.name} onChangeText={text => setFormData({ ...formData, name: text })} />
            </View>
            <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email</Text>
                <TextInput style={styles.input} value={formData.email} editable={false} keyboardType="email-address" autoCapitalize="none" />
            </View>
            <TouchableOpacity style={[styles.saveButton, isSaving && styles.saveButtonDisabled]} disabled={isSaving} onPress={() => onSave(formData)}>
                <Text style={styles.saveButtonText}>{isSaving ? 'Saving...' : 'Save Changes'}</Text>
            </TouchableOpacity>
        </View>
    );
};

const ChangePasswordContent = () => (
    <View>
        <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Current Password</Text>
            <TextInput style={styles.input} secureTextEntry />
        </View>
        <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>New Password</Text>
            <TextInput style={styles.input} secureTextEntry />
        </View>
        <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Confirm New Password</Text>
            <TextInput style={styles.input} secureTextEntry />
        </View>
        <TouchableOpacity style={styles.saveButton}>
            <Text style={styles.saveButtonText}>Update Password</Text>
        </TouchableOpacity>
    </View>
);

const SubAdminContent = ({ setModalView, setEditingAdmin, subAdmins, onDeleteSubAdmin }: { 
    setModalView: any, 
    setEditingAdmin: any,
    subAdmins: SubAdminData[],
    onDeleteSubAdmin: (uid: string) => void
}) => {
    const handleEdit = (admin: SubAdminData) => {
        setEditingAdmin(admin);
        setModalView('addOrEdit');
    }

    const handleDelete = (admin: SubAdminData) => {
        Alert.alert(
            'Delete Sub-Admin',
            `Are you sure you want to delete ${admin.displayName}? This action cannot be undone.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => onDeleteSubAdmin(admin.uid),
                },
            ]
        );
    };

    return (
        <View>
            {subAdmins.map(admin => (
                <View key={admin.uid} style={styles.subAdminCard}>
                    <View style={{flex: 1}}>
                        <Text style={styles.subAdminName}>{admin.displayName}</Text>
                        <Text style={styles.subAdminEmail}>{admin.email}</Text>
                        <View style={styles.permissionTags}>
                            {admin.permissions.orders && <Text style={styles.permissionTag}>Orders</Text>}
                            {admin.permissions.delivery && <Text style={styles.permissionTag}>Delivery</Text>}
                            {admin.permissions.products && <Text style={styles.permissionTag}>Products</Text>}
                        </View>
                    </View>
                    <View style={styles.subAdminActions}>
                        <TouchableOpacity onPress={() => handleEdit(admin)}>
                            <Edit size={18} color={Colors.primary} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => handleDelete(admin)}>
                            <Trash2 size={18} color={Colors.red} />
                        </TouchableOpacity>
                    </View>
                </View>
            ))}
            {subAdmins.length === 0 && (
                <View style={styles.emptyState}>
                    <Text style={styles.emptyStateText}>No sub-admins created yet</Text>
                </View>
            )}
            <TouchableOpacity style={styles.saveButton} onPress={() => { setEditingAdmin(null); setModalView('addOrEdit'); }}>
                <Text style={styles.saveButtonText}>Add New Sub-admin</Text>
            </TouchableOpacity>
        </View>
    );
}



// --- Promocode Components ---
const PromocodeContent = ({ setModalView, setEditingPromocode, promocodes, onDeletePromocode }: { 
    setModalView: any, 
    setEditingPromocode: any,
    promocodes: PromocodeData[],
    onDeletePromocode: (id: string) => void
}) => {
    const handleEdit = (promocode: PromocodeData) => {
        console.log('Editing promocode:', promocode); // Debug log
        console.log('Promocode ID:', promocode.id); // Debug log
        
        if (!promocode.id) {
            console.error('Promocode has no ID:', promocode);
            Alert.alert('Error', 'Cannot edit promocode: missing ID');
            return;
        }
        
        setEditingPromocode(promocode);
        setModalView('addOrEdit');
    }

    const handleDelete = (promocode: PromocodeData) => {
        Alert.alert(
            'Delete Promocode',
            `Are you sure you want to delete ${promocode.code}? This action cannot be undone.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => onDeletePromocode(promocode.id),
                },
            ]
        );
    };

    const formatDate = (date: Date) => {
        return new Date(date).toLocaleDateString();
    };

    const getDiscountText = (promocode: PromocodeData) => {
        if (promocode.discountType === 'percentage') {
            return `${promocode.discountValue}% off`;
        } else {
            return `₹${promocode.discountValue} off`;
        }
    };

    console.log('Rendering promocodes:', promocodes); // Debug log
    
    return (
        <View>
            {promocodes.map(promocode => (
                <View key={promocode.id} style={styles.promocodeCard}>
                    <View style={{flex: 1}}>
                        <View style={styles.promocodeHeader}>
                            <Text style={styles.promocodeCode}>{promocode.code}</Text>
                            <View style={[styles.statusBadge, { backgroundColor: promocode.isActive ? Colors.primaryLighter : Colors.redLighter }]}>
                                <Text style={[styles.statusText, { color: promocode.isActive ? Colors.primary : Colors.red }]}>
                                    {promocode.isActive ? 'Active' : 'Inactive'}
                                </Text>
                            </View>
                        </View>
                        <Text style={styles.promocodeDiscount}>{getDiscountText(promocode)}</Text>
                        <Text style={styles.promocodeDetails}>
                            Used: {promocode.usedCount}/{promocode.usageLimit} • Valid until: {formatDate(promocode.validUntil)}
                        </Text>
                        {promocode.description && (
                            <Text style={styles.promocodeDescription}>{promocode.description}</Text>
                        )}
                        {promocode.showOnHome && (
                            <View style={styles.homeBadge}>
                                <Text style={styles.homeBadgeText}>🏠 Home Page</Text>
                            </View>
                        )}
                    </View>
                    <View style={styles.promocodeActions}>
                        <TouchableOpacity onPress={() => handleEdit(promocode)}>
                            <Edit size={18} color={Colors.primary} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => handleDelete(promocode)}>
                            <Trash2 size={18} color={Colors.red} />
                        </TouchableOpacity>
                    </View>
                </View>
            ))}
            {promocodes.length === 0 && (
                <View style={styles.emptyState}>
                    <Text style={styles.emptyStateText}>No promocodes created yet</Text>
                </View>
            )}
            <TouchableOpacity style={styles.saveButton} onPress={() => { setEditingPromocode(null); setModalView('addOrEdit'); }}>
                <Text style={styles.saveButtonText}>Add New Promocode</Text>
            </TouchableOpacity>
        </View>
    );
};

const AddPromocodeContent = ({ editingPromocode, onSave }: { editingPromocode: PromocodeData | null, onSave: (data: any) => void }) => {
    const [formData, setFormData] = useState({
        code: '',
        discountType: 'percentage' as 'percentage' | 'fixed',
        discountValue: '',
        minOrderAmount: '',
        maxDiscount: '',
        usageLimit: '',
        validFrom: new Date().toISOString().split('T')[0],
        validUntil: '',
        isActive: true,
        description: '',
        showOnHome: false,
    });
    const [isLoading, setIsLoading] = useState(false);

    // Update form data when editingPromocode changes
    useEffect(() => {
        if (editingPromocode) {
            setFormData({
                code: editingPromocode.code || '',
                discountType: editingPromocode.discountType || 'percentage',
                discountValue: editingPromocode.discountValue?.toString() || '',
                minOrderAmount: editingPromocode.minOrderAmount?.toString() || '',
                maxDiscount: editingPromocode.maxDiscount?.toString() || '',
                usageLimit: editingPromocode.usageLimit?.toString() || '',
                validFrom: editingPromocode.validFrom ? new Date(editingPromocode.validFrom).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                validUntil: editingPromocode.validUntil ? new Date(editingPromocode.validUntil).toISOString().split('T')[0] : '',
                isActive: editingPromocode.isActive ?? true,
                description: editingPromocode.description || '',
                showOnHome: editingPromocode.showOnHome ?? false,
            });
        } else {
            // Reset form for new promocode
            setFormData({
                code: '',
                discountType: 'percentage',
                discountValue: '',
                minOrderAmount: '',
                maxDiscount: '',
                usageLimit: '',
                validFrom: new Date().toISOString().split('T')[0],
                validUntil: '',
                isActive: true,
                description: '',
                showOnHome: false,
            });
        }
    }, [editingPromocode]);

    const handleSave = async () => {
        if (!formData.code.trim() || !formData.discountValue.trim() || !formData.usageLimit.trim() || !formData.validUntil.trim()) {
            Alert.alert('Error', 'Please fill in all required fields.');
            return;
        }

        const discountValue = parseFloat(formData.discountValue);
        const usageLimit = parseInt(formData.usageLimit);
        const minOrderAmount = formData.minOrderAmount && formData.minOrderAmount.trim() !== '' ? parseFloat(formData.minOrderAmount) : undefined;
        const maxDiscount = formData.maxDiscount && formData.maxDiscount.trim() !== '' ? parseFloat(formData.maxDiscount) : undefined;

        if (isNaN(discountValue) || isNaN(usageLimit)) {
            Alert.alert('Error', 'Please enter valid numbers for discount value and usage limit.');
            return;
        }

        if (formData.discountType === 'percentage' && (discountValue <= 0 || discountValue > 100)) {
            Alert.alert('Error', 'Percentage discount must be between 1 and 100.');
            return;
        }

        if (formData.discountType === 'fixed' && discountValue <= 0) {
            Alert.alert('Error', 'Fixed discount must be greater than 0.');
            return;
        }

        setIsLoading(true);
        try {
            console.log('Saving form data, editingPromocode:', editingPromocode); // Debug log
            console.log('Editing promocode ID:', editingPromocode?.id); // Debug log
            
            await onSave({
                code: formData.code.trim().toUpperCase(),
                discountType: formData.discountType,
                discountValue,
                minOrderAmount,
                maxDiscount,
                usageLimit,
                validFrom: new Date(formData.validFrom),
                validUntil: new Date(formData.validUntil),
                isActive: formData.isActive,
                description: formData.description.trim(),
                showOnHome: formData.showOnHome,
                isEdit: !!editingPromocode,
                id: editingPromocode?.id,
            });
        } catch (error) {
            console.error('Error saving promocode:', error);
            Alert.alert('Error', 'An error occurred while saving.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <View>
            <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Promocode <Text style={styles.requiredAsterisk}>*</Text></Text>
                <TextInput 
                    style={styles.input} 
                    value={formData.code} 
                    onChangeText={text => setFormData({...formData, code: text})} 
                    placeholder="Enter promocode (e.g., SAVE20)" 
                    placeholderTextColor={Colors.textSecondary}
                    autoCapitalize="characters"
                />
            </View>
            
            <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Discount Type <Text style={styles.requiredAsterisk}>*</Text></Text>
                <View style={styles.radioGroup}>
                    <TouchableOpacity 
                        style={[styles.radioOption, formData.discountType === 'percentage' && styles.radioOptionSelected]}
                        onPress={() => setFormData({...formData, discountType: 'percentage'})}
                    >
                        <Text style={[styles.radioText, formData.discountType === 'percentage' && styles.radioTextSelected]}>Percentage</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={[styles.radioOption, formData.discountType === 'fixed' && styles.radioOptionSelected]}
                        onPress={() => setFormData({...formData, discountType: 'fixed'})}
                    >
                        <Text style={[styles.radioText, formData.discountType === 'fixed' && styles.radioTextSelected]}>Fixed Amount</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Discount Value <Text style={styles.requiredAsterisk}>*</Text></Text>
                <TextInput 
                    style={styles.input} 
                    value={formData.discountValue} 
                    onChangeText={text => setFormData({...formData, discountValue: text})} 
                    placeholder={formData.discountType === 'percentage' ? "Enter percentage (e.g., 20)" : "Enter amount (e.g., 10)"}
                    placeholderTextColor={Colors.textSecondary}
                    keyboardType="numeric"
                />
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Minimum Order Amount</Text>
                <TextInput 
                    style={styles.input} 
                    value={formData.minOrderAmount} 
                    onChangeText={text => setFormData({...formData, minOrderAmount: text})} 
                    placeholder="Enter minimum order amount" 
                    placeholderTextColor={Colors.textSecondary}
                    keyboardType="numeric"
                />
            </View>

            {formData.discountType === 'percentage' && (
                <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Maximum Discount Amount</Text>
                    <TextInput 
                        style={styles.input} 
                        value={formData.maxDiscount} 
                        onChangeText={text => setFormData({...formData, maxDiscount: text})} 
                        placeholder="Enter maximum discount amount" 
                        placeholderTextColor={Colors.textSecondary}
                        keyboardType="numeric"
                    />
                </View>
            )}

            <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Usage Limit <Text style={styles.requiredAsterisk}>*</Text></Text>
                <TextInput 
                    style={styles.input} 
                    value={formData.usageLimit} 
                    onChangeText={text => setFormData({...formData, usageLimit: text})} 
                    placeholder="Enter usage limit" 
                    placeholderTextColor={Colors.textSecondary}
                    keyboardType="numeric"
                />
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Valid From</Text>
                <TextInput 
                    style={styles.input} 
                    value={formData.validFrom} 
                    onChangeText={text => setFormData({...formData, validFrom: text})} 
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={Colors.textSecondary}
                />
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Valid Until <Text style={styles.requiredAsterisk}>*</Text></Text>
                <TextInput 
                    style={styles.input} 
                    value={formData.validUntil} 
                    onChangeText={text => setFormData({...formData, validUntil: text})} 
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={Colors.textSecondary}
                />
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Description</Text>
                <TextInput 
                    style={[styles.input, styles.textArea]} 
                    value={formData.description} 
                    onChangeText={text => setFormData({...formData, description: text})} 
                    placeholder="Enter description (optional)" 
                    placeholderTextColor={Colors.textSecondary}
                    multiline
                    numberOfLines={3}
                />
            </View>

            <View style={styles.permissionRow}>
                <Text style={styles.permissionLabel}>Active</Text>
                <Switch 
                    value={formData.isActive} 
                    onValueChange={(value) => setFormData({...formData, isActive: value})} 
                    trackColor={{false: Colors.border, true: Colors.primaryLight}} 
                    thumbColor={Colors.white} 
                />
            </View>

            <View style={styles.permissionRow}>
                <Text style={styles.permissionLabel}>Show on Home Page</Text>
                <Switch 
                    value={formData.showOnHome || false} 
                    onValueChange={(value) => {
                        console.log('Toggle changed to:', value);
                        setFormData({...formData, showOnHome: value});
                    }} 
                    trackColor={{false: Colors.border, true: Colors.primaryLight}} 
                    thumbColor={Colors.white} 
                />
            </View>

            <TouchableOpacity 
                style={[styles.saveButton, isLoading && styles.saveButtonDisabled]} 
                onPress={handleSave}
                disabled={isLoading}
            >
                <Text style={styles.saveButtonText}>
                    {isLoading ? 'Saving...' : (editingPromocode ? 'Update Promocode' : 'Create Promocode')}
                </Text>
            </TouchableOpacity>
        </View>
    );
};

// --- Notification Components ---
const NotificationContent = ({ setModalView, setEditingNotification, notifications, onDeleteNotification }: { 
    setModalView: any, 
    setEditingNotification: any,
    notifications: NotificationData[],
    onDeleteNotification: (id: string) => void
}) => {
    const handleEdit = (notification: NotificationData) => {
        setEditingNotification(notification);
        setModalView('addOrEdit');
    }

    const handleDelete = (notification: NotificationData) => {
        Alert.alert(
            'Delete Notification',
            `Are you sure you want to delete "${notification.title}"? This action cannot be undone.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => onDeleteNotification(notification.id),
                },
            ]
        );
    };



    const formatDate = (timestamp: number) => {
        return new Date(timestamp).toLocaleDateString();
    };





    return (
        <View>
            {notifications.map(notification => (
                <View key={notification.id} style={styles.notificationCard}>
                    <View style={styles.notificationHeader}>
                        <View style={styles.notificationTitleRow}>
                            <View style={{flex: 1}}>
                                <Text style={styles.notificationTitle}>{notification.title}</Text>
                            </View>
                        </View>
                        <View style={styles.notificationActionButtons}>
                            <TouchableOpacity onPress={() => handleEdit(notification)}>
                                <Edit size={20} color={Colors.primary} />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => handleDelete(notification)}>
                                <Trash2 size={20} color={Colors.red} />
                            </TouchableOpacity>
                        </View>
                    </View>
                    
                    <Text style={styles.notificationMessage}>{notification.message}</Text>
                    
                    <Text style={styles.notificationDetails}>
                        Created: {formatDate(notification.createdAt)}
                        {notification.expiresAt && ` • Expires: ${formatDate(notification.expiresAt)}`}
                    </Text>
                </View>
            ))}
            {notifications.length === 0 && (
                <View style={styles.emptyState}>
                    <Bell size={48} color={Colors.textSecondary} />
                    <Text style={styles.emptyStateText}>No notifications created yet</Text>
                    <Text style={styles.emptyStateSubtext}>Create your first notification to get started</Text>
                </View>
            )}
            <TouchableOpacity style={styles.saveButton} onPress={() => { setEditingNotification(null); setModalView('addOrEdit'); }}>
                <Text style={styles.saveButtonText}>Add New Notification</Text>
            </TouchableOpacity>
        </View>
    );
};

const AddNotificationContent = ({ editingNotification, onSave }: { editingNotification: NotificationData | null, onSave: (data: any) => void }) => {
    const [formData, setFormData] = useState({
        title: '',
        message: '',
        type: 'announcement' as 'announcement' | 'order_update' | 'promo' | 'system',
        priority: 'medium' as 'low' | 'medium' | 'high',
        expiresAt: '',
    });
    const [isLoading, setIsLoading] = useState(false);

    // Update form data when editingNotification changes
    useEffect(() => {
        if (editingNotification) {
            setFormData({
                title: editingNotification.title || '',
                message: editingNotification.message || '',
                type: editingNotification.type || 'announcement',
                priority: editingNotification.priority || 'medium',
                expiresAt: editingNotification.expiresAt ? new Date(editingNotification.expiresAt).toISOString().split('T')[0] : '',
            });
        } else {
            // Reset form for new notification
            setFormData({
                title: '',
                message: '',
                type: 'announcement',
                priority: 'medium',
                expiresAt: '',
            });
        }
    }, [editingNotification]);

    const handleSave = async () => {
        if (!formData.title.trim() || !formData.message.trim()) {
            Alert.alert('Error', 'Please fill in all required fields.');
            return;
        }

        setIsLoading(true);
        try {
            await onSave({
                title: formData.title.trim(),
                message: formData.message.trim(),
                type: formData.type,
                priority: formData.priority,
                expiresAt: formData.expiresAt ? new Date(formData.expiresAt) : undefined,
                isEdit: !!editingNotification,
                id: editingNotification?.id,
            });
        } catch (error) {
            console.error('Error saving notification:', error);
            Alert.alert('Error', 'An error occurred while saving.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <View>
            <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Title *</Text>
                <TextInput 
                    style={styles.input} 
                    value={formData.title} 
                    onChangeText={text => setFormData({...formData, title: text})} 
                    placeholder="Enter notification title" 
                />
            </View>
            
            <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Message *</Text>
                <TextInput 
                    style={[styles.input, styles.textArea]} 
                    value={formData.message} 
                    onChangeText={text => setFormData({...formData, message: text})} 
                    placeholder="Enter notification message" 
                    multiline
                    numberOfLines={4}
                />
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Type</Text>
                <View style={styles.radioGroup}>
                    <TouchableOpacity 
                        style={[styles.radioOption, formData.type === 'announcement' && styles.radioOptionSelected]}
                        onPress={() => setFormData({...formData, type: 'announcement'})}
                    >
                        <Text style={[styles.radioText, formData.type === 'announcement' && styles.radioTextSelected]}>Announcement</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={[styles.radioOption, formData.type === 'promo' && styles.radioOptionSelected]}
                        onPress={() => setFormData({...formData, type: 'promo'})}
                    >
                        <Text style={[styles.radioText, formData.type === 'promo' && styles.radioTextSelected]}>Promo</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Priority</Text>
                <View style={styles.radioGroup}>
                    <TouchableOpacity 
                        style={[styles.radioOption, formData.priority === 'low' && styles.radioOptionSelected]}
                        onPress={() => setFormData({...formData, priority: 'low'})}
                    >
                        <Text style={[styles.radioText, formData.priority === 'low' && styles.radioTextSelected]}>Low</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={[styles.radioOption, formData.priority === 'medium' && styles.radioOptionSelected]}
                        onPress={() => setFormData({...formData, priority: 'medium'})}
                    >
                        <Text style={[styles.radioText, formData.priority === 'medium' && styles.radioTextSelected]}>Medium</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={[styles.radioOption, formData.priority === 'high' && styles.radioOptionSelected]}
                        onPress={() => setFormData({...formData, priority: 'high'})}
                    >
                        <Text style={[styles.radioText, formData.priority === 'high' && styles.radioTextSelected]}>High</Text>
                    </TouchableOpacity>
                </View>
            </View>



            <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Expiration Date (Optional)</Text>
                <TextInput 
                    style={styles.input} 
                    value={formData.expiresAt} 
                    onChangeText={text => setFormData({...formData, expiresAt: text})} 
                    placeholder="YYYY-MM-DD (leave empty for no expiration)"
                />
            </View>

            <TouchableOpacity 
                style={[styles.saveButton, isLoading && styles.saveButtonDisabled]} 
                onPress={handleSave}
                disabled={isLoading}
            >
                <Text style={styles.saveButtonText}>
                    {isLoading ? 'Saving...' : (editingNotification ? 'Update Notification' : 'Create Notification')}
                </Text>
            </TouchableOpacity>
        </View>
    );
};

const AddSubAdminContent = ({ editingAdmin, onSave }: { editingAdmin: SubAdminData | null, onSave: (data: any) => void }) => {
    const [formData, setFormData] = useState({
        name: editingAdmin?.displayName || '',
        phone: editingAdmin?.phoneNumber || '',
        email: editingAdmin?.email || '',
        password: '',
    });
    const [permissions, setPermissions] = useState<SubAdminPermissions>({
        orders: editingAdmin?.permissions?.orders || false,
        delivery: editingAdmin?.permissions?.delivery || false,
        products: editingAdmin?.permissions?.products || false,
    });
    const [isLoading, setIsLoading] = useState(false);

    const togglePermission = (key: keyof SubAdminPermissions) => {
        setPermissions(prev => ({...prev, [key]: !prev[key]}));
    };

    const handleSave = async () => {
        if (!formData.name.trim() || !formData.email.trim()) {
            Alert.alert('Error', 'Please fill in all required fields.');
            return;
        }

        if (!editingAdmin && !formData.password.trim()) {
            Alert.alert('Error', 'Password is required for new sub-admin.');
            return;
        }

        setIsLoading(true);
        try {
            await onSave({
                displayName: formData.name.trim(),
                email: formData.email.trim(),
                phoneNumber: formData.phone.trim(),
                password: formData.password,
                permissions,
                isEdit: !!editingAdmin,
                uid: editingAdmin?.uid,
            });
        } catch (error) {
            console.error('Error saving sub-admin:', error);
            Alert.alert('Error', 'An error occurred while saving.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <View>
            <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Name *</Text>
                <TextInput 
                    style={styles.input} 
                    value={formData.name} 
                    onChangeText={text => setFormData({...formData, name: text})} 
                    placeholder="Enter sub-admin name" 
                />
            </View>
            <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Phone Number</Text>
                <TextInput 
                    style={styles.input} 
                    value={formData.phone} 
                    onChangeText={text => setFormData({...formData, phone: text})} 
                    placeholder="Enter phone number" 
                    keyboardType="phone-pad" 
                />
            </View>
            <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email *</Text>
                <TextInput 
                    style={styles.input} 
                    value={formData.email} 
                    onChangeText={text => setFormData({...formData, email: text})} 
                    placeholder="Enter email address" 
                    keyboardType="email-address" 
                    autoCapitalize="none"
                    editable={!editingAdmin} // Don't allow email editing for existing users
                />
            </View>
            {!editingAdmin && (
                <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Password *</Text>
                    <TextInput 
                        style={styles.input} 
                        value={formData.password} 
                        onChangeText={text => setFormData({...formData, password: text})} 
                        placeholder="Create a password" 
                        secureTextEntry 
                    />
                </View>
            )}
            
            <Text style={styles.modalSectionTitle}>Module Access</Text>
            <View style={styles.permissionRow}>
                <Text style={styles.permissionLabel}>Orders Management</Text>
                <Switch 
                    value={permissions.orders} 
                    onValueChange={() => togglePermission('orders')} 
                    trackColor={{false: Colors.border, true: Colors.primaryLight}} 
                    thumbColor={Colors.white} 
                />
            </View>
            <View style={styles.permissionRow}>
                <Text style={styles.permissionLabel}>Delivery Agent Management</Text>
                <Switch 
                    value={permissions.delivery} 
                    onValueChange={() => togglePermission('delivery')} 
                    trackColor={{false: Colors.border, true: Colors.primaryLight}} 
                    thumbColor={Colors.white} 
                />
            </View>
            <View style={styles.permissionRow}>
                <Text style={styles.permissionLabel}>Product Management</Text>
                <Switch 
                    value={permissions.products} 
                    onValueChange={() => togglePermission('products')} 
                    trackColor={{false: Colors.border, true: Colors.primaryLight}} 
                    thumbColor={Colors.white} 
                />
            </View>

            <TouchableOpacity 
                style={[styles.saveButton, isLoading && styles.saveButtonDisabled]} 
                onPress={handleSave}
                disabled={isLoading}
            >
                <Text style={styles.saveButtonText}>
                    {isLoading ? 'Saving...' : (editingAdmin ? 'Update Sub-admin' : 'Create Sub-admin')}
                </Text>
            </TouchableOpacity>
        </View>
    );
};

export default function AdminProfileScreen({ navigation }: { navigation: any }) {
  const insets = useSafeAreaInsets();
  const { goBack } = useAdminNavigation();
  const { userSession, logout, login } = useAuth();
  const [modalVisible, setModalVisible] = useState(false);
  const [modalContent, setModalContent] = useState('');
  const [modalView, setModalView] = useState('list');
  const [editingAdmin, setEditingAdmin] = useState<SubAdminData | null>(null);
  const [subAdmins, setSubAdmins] = useState<SubAdminData[]>([]);
  const [isLoadingSubAdmins, setIsLoadingSubAdmins] = useState(false);
  const [editingPromocode, setEditingPromocode] = useState<PromocodeData | null>(null);
  const [promocodes, setPromocodes] = useState<PromocodeData[]>([]);
  const [isLoadingPromocodes, setIsLoadingPromocodes] = useState(false);
  const [editingNotification, setEditingNotification] = useState<NotificationData | null>(null);
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);


  let [fontsLoaded] = useFonts({
    Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold,
  });

  // Load sub-admins, promocodes, and notifications when component mounts
  useEffect(() => {
    console.log('Component mounted, userSession:', userSession); // Debug log
    loadSubAdmins();
    loadPromocodes();
    loadNotifications();
  }, [userSession]);

  // Monitor promocodes state changes
  useEffect(() => {
    console.log('Promocodes state changed:', promocodes); // Debug log
  }, [promocodes]);

  const loadSubAdmins = async () => {
    if (!userSession?.uid) return;
    
    setIsLoadingSubAdmins(true);
    try {
      const adminSubAdmins = await subAdminService.getSubAdminsByAdmin(userSession.uid);
      setSubAdmins(adminSubAdmins);
    } catch (error) {
      console.error('Error loading sub-admins:', error);
      Alert.alert('Error', 'Failed to load sub-admins.');
    } finally {
      setIsLoadingSubAdmins(false);
    }
  };

  const handleSaveSubAdmin = async (data: any) => {
    if (!userSession?.uid || !userSession?.email) {
      return;
    }

    try {
      if (data.isEdit) {
        // Update existing sub-admin
        await subAdminService.updateSubAdminPermissions(data.uid, data.permissions);
        if (data.displayName !== editingAdmin?.displayName || data.phoneNumber !== editingAdmin?.phoneNumber) {
          await subAdminService.updateSubAdminProfile(data.uid, {
            displayName: data.displayName,
            phoneNumber: data.phoneNumber,
          });
        }
        Alert.alert('Success', 'Sub-admin updated successfully!');
      } else {
        // Create new sub-admin
        await subAdminService.createSubAdmin(
          userSession.uid,
          {
            email: data.email,
            password: data.password,
            displayName: data.displayName,
            phoneNumber: data.phoneNumber,
            permissions: data.permissions,
          }
        );
        Alert.alert('Success', 'Sub-admin created successfully!');
      }
      
      // Reload sub-admins and close modal (for edit case)
      await loadSubAdmins();
      setModalVisible(false);
      setModalView('list');
      setEditingAdmin(null);
    } catch (error) {
      console.error('Error saving sub-admin:', error);
      Alert.alert('Error', 'Failed to save sub-admin. Please try again.');
    }
  };

  const handleDeleteSubAdmin = async (uid: string) => {
    try {
      await subAdminService.deleteSubAdmin(uid);
      Alert.alert('Success', 'Sub-admin permanently deleted.');
      await loadSubAdmins();
    } catch (error) {
      console.error('Error deleting sub-admin:', error);
      Alert.alert('Error', 'Failed to delete sub-admin. Please try again.');
    }
  };

  const loadPromocodes = async () => {
    if (!userSession?.uid) return;
    
    console.log('Loading promocodes for userSession.uid:', userSession.uid); // Debug log
    
    setIsLoadingPromocodes(true);
    try {
      const adminPromocodes = await promocodeService.getPromocodesByAdmin(userSession.uid);
      console.log('Loaded promocodes:', adminPromocodes); // Debug log
      console.log('Setting promocodes state with length:', adminPromocodes.length); // Debug log
      setPromocodes(adminPromocodes);
    } catch (error) {
      console.error('Error loading promocodes:', error);
      Alert.alert('Error', 'Failed to load promocodes.');
    } finally {
      setIsLoadingPromocodes(false);
    }
  };

  const handleSavePromocode = async (data: any) => {
    if (!userSession?.uid) {
      return;
    }

    console.log('Saving promocode data:', data); // Debug log

    try {
      if (data.isEdit) {
        console.log('Updating promocode with ID:', data.id); // Debug log
        
        // Check if ID exists
        if (!data.id) {
          throw new Error('Promocode ID is missing. Cannot update.');
        }
        
        // Update existing promocode
        const updateData: any = {
          code: data.code,
          discountType: data.discountType,
          discountValue: data.discountValue,
          usageLimit: data.usageLimit,
          validFrom: data.validFrom,
          validUntil: data.validUntil,
          isActive: data.isActive,
        };

        // Only add optional fields if they have values
        if (data.minOrderAmount !== undefined && data.minOrderAmount !== null && data.minOrderAmount !== '') {
          updateData.minOrderAmount = data.minOrderAmount;
        }
        if (data.maxDiscount !== undefined && data.maxDiscount !== null && data.maxDiscount !== '') {
          updateData.maxDiscount = data.maxDiscount;
        }
        if (data.description !== undefined && data.description !== null && data.description.trim() !== '') {
          updateData.description = data.description;
        }
        if (data.showOnHome !== undefined) {
          updateData.showOnHome = data.showOnHome;
        }

        await promocodeService.updatePromocode(data.id, updateData);
        Alert.alert('Success', 'Promocode updated successfully!');
      } else {
        console.log('Creating new promocode'); // Debug log
        // Create new promocode
        const createData: any = {
          code: data.code,
          discountType: data.discountType,
          discountValue: data.discountValue,
          usageLimit: data.usageLimit,
          validFrom: data.validFrom,
          validUntil: data.validUntil,
          isActive: data.isActive,
        };

        // Only add optional fields if they have values
        if (data.minOrderAmount !== undefined && data.minOrderAmount !== null && data.minOrderAmount !== '') {
          createData.minOrderAmount = data.minOrderAmount;
        }
        if (data.maxDiscount !== undefined && data.maxDiscount !== null && data.maxDiscount !== '') {
          createData.maxDiscount = data.maxDiscount;
        }
        if (data.description !== undefined && data.description !== null && data.description.trim() !== '') {
          createData.description = data.description;
        }
        if (data.showOnHome !== undefined) {
          createData.showOnHome = data.showOnHome;
        }

        await promocodeService.createPromocode(userSession.uid, createData);
        Alert.alert('Success', 'Promocode created successfully!');
      }
      
      // Reload promocodes and close modal
      await loadPromocodes();
      setModalVisible(false);
      setModalView('list');
      setEditingPromocode(null);
    } catch (error) {
      console.error('Error saving promocode:', error);
      Alert.alert('Error', 'Failed to save promocode. Please try again.');
    }
  };

  const handleDeletePromocode = async (id: string) => {
    try {
      await promocodeService.deletePromocode(id);
      Alert.alert('Success', 'Promocode permanently deleted.');
      await loadPromocodes();
    } catch (error) {
      console.error('Error deleting promocode:', error);
      Alert.alert('Error', 'Failed to delete promocode. Please try again.');
    }
  };

  const loadNotifications = async () => {
    if (!userSession?.uid) return;
    
    setIsLoadingNotifications(true);
    try {
      const adminNotifications = await notificationService.getNotificationsByAdmin(userSession.uid);
      setNotifications(adminNotifications);
    } catch (error) {
      console.error('Error loading notifications:', error);
      Alert.alert('Error', 'Failed to load notifications.');
    } finally {
      setIsLoadingNotifications(false);
    }
  };

  const handleSaveNotification = async (data: any) => {
    if (!userSession?.uid) {
      return;
    }

    try {
      if (data.isEdit) {
        // Update existing notification
        await notificationService.updateNotification(data.id, {
          title: data.title,
          message: data.message,
          type: data.type,
          priority: data.priority,
          expiresAt: data.expiresAt,
        });
        Alert.alert('Success', 'Notification updated successfully!');
      } else {
        // Create new notification
        await notificationService.createNotification(userSession.uid, {
          title: data.title,
          message: data.message,
          type: data.type,
          priority: data.priority,
          expiresAt: data.expiresAt,
        });
        Alert.alert('Success', 'Notification created successfully!');
      }
      
      // Reload notifications and close modal
      await loadNotifications();
      setModalVisible(false);
      setModalView('list');
      setEditingNotification(null);
    } catch (error) {
      console.error('Error saving notification:', error);
      Alert.alert('Error', 'Failed to save notification. Please try again.');
    }
  };

  const handleDeleteNotification = async (id: string) => {
    try {
      await notificationService.deleteNotification(id);
      Alert.alert('Success', 'Notification permanently deleted.');
      await loadNotifications();
    } catch (error) {
      console.error('Error deleting notification:', error);
      Alert.alert('Error', 'Failed to delete notification. Please try again.');
    }
  };



  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
              router.replace('/');
            } catch (error) {
              console.error('Logout error:', error);
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
          },
        },
      ]
    );
  };

  const openModal = (contentKey: string) => {
      setModalContent(contentKey);
      setModalView('list');
      setEditingAdmin(null);
      setModalVisible(true);
  }

  const menuItems = [
    { id: '1', title: 'Edit Profile', icon: User, action: () => openModal('editProfile') },
    { id: '2', title: 'Change Password', icon: Lock, action: () => openModal('changePassword') },
    // Only show sub-admin management for full admins, not sub-admins
    ...(userSession?.role === 'admin' ? [
      { id: '3', title: 'Sub-admin Management', icon: Users, action: () => openModal('subAdmin') },
      { id: '4', title: 'Promocode Management', icon: Tag, action: () => openModal('promocode') },
      { id: '5', title: 'Notification Management', icon: Bell, action: () => openModal('notification') }
    ] : []),
  ];

  if (!fontsLoaded) {
    return <View style={styles.loadingContainer} />;
  }
  
  const renderModalContent = () => {
      switch(modalContent) {
          case 'editProfile': return <EditProfileContent user={userSession} onSave={handleSaveProfile} isSaving={isSavingProfile} />;
          case 'changePassword': return <ChangePasswordContent />;
          case 'subAdmin': 
            return modalView === 'list' ? 
              <SubAdminContent 
                setModalView={setModalView} 
                setEditingAdmin={setEditingAdmin} 
                subAdmins={subAdmins}
                onDeleteSubAdmin={handleDeleteSubAdmin}
              /> : 
              <AddSubAdminContent 
                editingAdmin={editingAdmin} 
                onSave={handleSaveSubAdmin}
              />;
          case 'promocode': 
            return modalView === 'list' ? 
              <PromocodeContent 
                setModalView={setModalView} 
                setEditingPromocode={setEditingPromocode} 
                promocodes={promocodes}
                onDeletePromocode={handleDeletePromocode}
              /> : 
              <AddPromocodeContent 
                editingPromocode={editingPromocode} 
                onSave={handleSavePromocode}
              />;
          case 'notification': 
            return modalView === 'list' ? 
              <NotificationContent 
                setModalView={setModalView} 
                setEditingNotification={setEditingNotification} 
                notifications={notifications}
                onDeleteNotification={handleDeleteNotification}
              /> : 
              <AddNotificationContent 
                editingNotification={editingNotification} 
                onSave={handleSaveNotification}
              />;
          default: return null;
      }
  }

  const handleSaveProfile = async (data: { name: string; email: string }) => {
    if (!userSession?.uid) return;
    const trimmedName = (data.name || '').trim();
    if (!trimmedName) {
      Alert.alert('Error', 'Name cannot be empty.');
      return;
    }
    try {
      setIsSavingProfile(true);
      await userService.updateUser(userSession.uid, { displayName: trimmedName });
      const updatedSession = { ...userSession, displayName: trimmedName };
      await login(updatedSession);
      Alert.alert('Success', 'Profile updated successfully.');
      setModalVisible(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setIsSavingProfile(false);
    }
  }
  
  const getModalTitle = () => {
      if (modalContent === 'subAdmin') {
          if (modalView === 'list') return 'Sub-admin Management';
          return editingAdmin ? 'Edit Sub-admin' : 'Add New Sub-admin';
      }
      if (modalContent === 'promocode') {
          if (modalView === 'list') return 'Promocode Management';
          return editingPromocode ? 'Edit Promocode' : 'Add New Promocode';
      }
      if (modalContent === 'notification') {
          if (modalView === 'list') return 'Notification Management';
          return editingNotification ? 'Edit Notification' : 'Add New Notification';
      }
      const item = menuItems.find(item => item.action.toString().includes(modalContent));
      return item ? item.title : '';
  }

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
            <Text style={styles.headerTitle}>My Profile</Text>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.menuContainer}>
            {menuItems.map((item, index) => (
              <TouchableOpacity
                key={item.id}
                style={[styles.menuItem, index === menuItems.length - 1 && { borderBottomWidth: 0 }]}
                onPress={item.action}
              >
                <View style={styles.menuItemLeft}>
                  <View style={styles.menuIcon}>
                    <item.icon size={20} color={Colors.primary} />
                  </View>
                  <Text style={styles.menuText}>
                    {item.title}
                  </Text>
                </View>
                <ChevronRight size={20} color={Colors.textSecondary} />
              </TouchableOpacity>
            ))}
        </View>

        <TouchableOpacity
            style={[styles.menuItem, styles.logoutItem]}
            onPress={handleLogout}
          >
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuIcon, styles.logoutIcon]}>
                <LogOut size={20} color={Colors.red} />
              </View>
              <Text style={[styles.menuText, styles.logoutText]}>
                Logout
              </Text>
            </View>
        </TouchableOpacity>
      </ScrollView>

      {/* Generic Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
            <View style={[styles.modalContainer, {paddingBottom: insets.bottom}]}>
                <View style={styles.modalHeader}>
                    {modalView !== 'list' && (modalContent === 'subAdmin' || modalContent === 'promocode') && (
                        <TouchableOpacity onPress={() => setModalView('list')} style={styles.modalBack}>
                            <ArrowLeft size={24} color={Colors.textSecondary} />
                        </TouchableOpacity>
                    )}
                    <Text style={styles.modalTitle}>{getModalTitle()}</Text>
                    <TouchableOpacity onPress={() => setModalVisible(false)}>
                        <X size={24} color={Colors.textSecondary} />
                    </TouchableOpacity>
                </View>
                <ScrollView>
                    <View style={styles.modalForm}>
                        {renderModalContent()}
                    </View>
                </ScrollView>
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
  content: {
    padding: 20,
  },
  menuContainer: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    marginBottom: 24,
    shadowColor: '#959DA5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  menuIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primaryLighter,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuText: {
    fontSize: 16,
    fontFamily: 'Inter_500Medium',
    color: Colors.text,
  },
  logoutItem: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderBottomWidth: 0,
    shadowColor: '#959DA5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  logoutIcon: {
    backgroundColor: Colors.redLighter,
  },
  logoutText: {
    color: Colors.red,
    fontFamily: 'Inter_600SemiBold',
  },
  // --- Modal Styles ---
  modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'flex-end',
  },
  modalContainer: {
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
      borderColor: Colors.border,
  },
  modalBack: {
      position: 'absolute',
      left: 20,
      padding: 4,
  },
  modalTitle: {
      fontSize: 18,
      fontFamily: 'Inter_600SemiBold',
      color: Colors.text,
      textAlign: 'center',
      flex: 1,
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
  requiredAsterisk: {
    color: Colors.red,
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
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
  saveButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.white,
  },
  subAdminCard: {
      backgroundColor: Colors.background,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
  },
  subAdminName: {
      fontSize: 16,
      fontFamily: 'Inter_600SemiBold',
      color: Colors.text,
  },
  subAdminEmail: {
      fontSize: 14,
      fontFamily: 'Inter_400Regular',
      color: Colors.textSecondary,
  },
  subAdminActions: {
      flexDirection: 'row',
      gap: 16,
  },
  permissionTags: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
      marginTop: 8,
  },
  permissionTag: {
      backgroundColor: Colors.primaryLighter,
      color: Colors.primary,
      fontSize: 12,
      fontFamily: 'Inter_500Medium',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
  },
  modalSectionTitle: {
      fontSize: 16,
      fontFamily: 'Inter_600SemiBold',
      color: Colors.text,
      marginBottom: 8,
  },
  permissionRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
  },
  permissionLabel: {
      fontSize: 16,
      fontFamily: 'Inter_500Medium',
      color: Colors.text,
  },
  saveButtonDisabled: {
    backgroundColor: Colors.textSecondary,
    opacity: 0.6,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    marginVertical: 20,
  },
  emptyStateText: {
    fontSize: 16,
    fontFamily: 'Inter_500Medium',
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
  // --- Promocode Styles ---
  promocodeCard: {
      backgroundColor: Colors.background,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
  },
  promocodeHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
  },
  promocodeCode: {
      fontSize: 18,
      fontFamily: 'Inter_600SemiBold',
      color: Colors.text,
  },
  statusBadge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
  },
  statusText: {
      fontSize: 12,
      fontFamily: 'Inter_500Medium',
  },
  promocodeDiscount: {
      fontSize: 16,
      fontFamily: 'Inter_500Medium',
      color: Colors.primary,
      marginBottom: 4,
  },
  promocodeDetails: {
      fontSize: 14,
      fontFamily: 'Inter_400Regular',
      color: Colors.textSecondary,
      marginBottom: 4,
  },
  promocodeDescription: {
      fontSize: 14,
      fontFamily: 'Inter_400Regular',
      color: Colors.textSecondary,
      fontStyle: 'italic',
  },
  promocodeActions: {
      flexDirection: 'row',
      gap: 16,
  },
  homeBadge: {
      backgroundColor: Colors.primaryLighter,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
      alignSelf: 'flex-start',
      marginTop: 4,
  },
  homeBadgeText: {
      fontSize: 12,
      fontFamily: 'Inter_500Medium',
      color: Colors.primary,
  },
  radioGroup: {
      flexDirection: 'row',
      gap: 12,
  },
  radioOption: {
      flex: 1,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: Colors.border,
      alignItems: 'center',
  },
  radioOptionSelected: {
      backgroundColor: Colors.primaryLighter,
      borderColor: Colors.primary,
  },
  radioText: {
      fontSize: 14,
      fontFamily: 'Inter_500Medium',
      color: Colors.textSecondary,
  },
  radioTextSelected: {
      color: Colors.primary,
  },
  textArea: {
      height: 80,
      textAlignVertical: 'top',
  },
  // --- Notification Styles ---
  notificationCard: {
      backgroundColor: Colors.surface,
      borderRadius: 16,
      padding: 20,
      marginBottom: 16,
      shadowColor: '#959DA5',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
  },
  notificationHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 12,
  },
  notificationTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
  },
  notificationTitle: {
      fontSize: 18,
      fontFamily: 'Inter_600SemiBold',
      color: Colors.text,
      flex: 1,
      marginBottom: 4,
  },
  notificationMessage: {
      fontSize: 15,
      fontFamily: 'Inter_400Regular',
      color: Colors.textSecondary,
      lineHeight: 22,
      marginBottom: 12,
  },
  notificationDetails: {
      fontSize: 13,
      fontFamily: 'Inter_400Regular',
      color: Colors.textSecondary,
      backgroundColor: Colors.background,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 8,
      marginBottom: 16,
  },

  notificationActionButtons: {
      flexDirection: 'row',
      gap: 16,
      alignItems: 'center',
  },

});

