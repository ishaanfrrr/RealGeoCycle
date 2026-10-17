import { StyleSheet, View, Text, TouchableOpacity, Image, ScrollView, Platform, TextInput } from 'react-native';
import { auth } from '@/FirebaseConfig';
import { getAuth, onAuthStateChanged, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { Dialog, Portal, Button, Paragraph } from 'react-native-paper';

const features = [
    { emoji: '📰', title: 'Eco News', description: 'Stay informed with the latest environmental headlines from around the world.' },
    { emoji: '♻️', title: 'Waste Classifier', description: 'Snap a photo of any waste item and instantly learn how to dispose of it.' },
    { emoji: '🌿', title: 'Eco Forum', description: 'Connect with others, share ideas, and discuss sustainable living.' },
];

export default function Index() {
    const router = useRouter();
    const [userName, setUserName] = useState('');

    const handleSignOut = async () => {
        await auth.signOut();
        router.replace('/');
    };
    const [showChangePassword, setShowChangePassword] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [dialogVisible, setDialogVisible] = useState(false);
    const [dialogMessage, setDialogMessage] = useState('');
    const [dialogSuccess, setDialogSuccess] = useState(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(getAuth(), (user) => {
            if (!user) {
                router.replace('/');
            } else if (user.displayName) {
                setUserName(user.displayName.split(' ')[0]);
            }
        });
        return () => unsubscribe();
    }, [router]);

    const handleChangePassword = async () => {
        if (!currentPassword || !newPassword || !confirmPassword) {
            setDialogMessage('Please fill in all fields.');
            setDialogSuccess(false);
            setDialogVisible(true);
            return;
        }
        if (newPassword !== confirmPassword) {
            setDialogMessage('New passwords do not match.');
            setDialogSuccess(false);
            setDialogVisible(true);
            return;
        }
        if (newPassword.length < 6) {
            setDialogMessage('New password must be at least 6 characters.');
            setDialogSuccess(false);
            setDialogVisible(true);
            return;
        }
        try {
            const user = getAuth().currentUser;
            if (!user || !user.email) throw new Error('Not logged in.');
            const credential = EmailAuthProvider.credential(user.email, currentPassword);
            await reauthenticateWithCredential(user, credential);
            await updatePassword(user, newPassword);
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            setShowChangePassword(false);
            setDialogMessage('Password changed successfully!');
            setDialogSuccess(true);
            setDialogVisible(true);
        } catch (error: any) {
            if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
                setDialogMessage('Current password is incorrect.');
            } else {
                setDialogMessage('Failed to change password: ' + error.message);
            }
            setDialogSuccess(false);
            setDialogVisible(true);
        }
    };

    return (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
            <Portal>
                <Dialog visible={dialogVisible} onDismiss={() => setDialogVisible(false)} style={{ backgroundColor: '#1C2B14' }}>
                    <Dialog.Title style={{ color: dialogSuccess ? '#8BC34A' : '#C9A84C', fontWeight: 'bold' }}>
                        {dialogSuccess ? 'Success' : 'Error'}
                    </Dialog.Title>
                    <Dialog.Content>
                        <Paragraph style={{ color: '#E8F0DC', fontSize: 16 }}>{dialogMessage}</Paragraph>
                    </Dialog.Content>
                    <Dialog.Actions>
                        <Button onPress={() => setDialogVisible(false)} textColor="#8BC34A" labelStyle={{ fontWeight: 'bold' }}>OK</Button>
                    </Dialog.Actions>
                </Dialog>
            </Portal>

            <View style={styles.heroSection}>
                <Image style={{ width: 90, height: 90, marginBottom: 16 }} source={require('@/assets/images/logo.png')} />
                <Text style={styles.greeting}>{userName ? `Hello, ${userName} 👋` : 'Welcome back 👋'}</Text>
                <Text style={styles.header}>GeoCycle</Text>
                <Text style={styles.tagline}>Making sustainability simple, one choice at a time.</Text>
            </View>

            <View style={styles.featuresSection}>
                <Text style={styles.sectionLabel}>What you can do</Text>
                {features.map((f, i) => (
                    <View key={i} style={styles.featureCard}>
                        <Text style={styles.featureEmoji}>{f.emoji}</Text>
                        <View style={styles.featureText}>
                            <Text style={styles.featureTitle}>{f.title}</Text>
                            <Text style={styles.featureDesc}>{f.description}</Text>
                        </View>
                    </View>
                ))}
            </View>

            {showChangePassword && (
                <View style={styles.changePasswordCard}>
                    <Text style={styles.changePasswordTitle}>Change Password</Text>
                    <TextInput
                        style={styles.textInput}
                        placeholder="Current Password"
                        placeholderTextColor="#6B8A52"
                        value={currentPassword}
                        onChangeText={setCurrentPassword}
                        secureTextEntry
                    />
                    <TextInput
                        style={styles.textInput}
                        placeholder="New Password"
                        placeholderTextColor="#6B8A52"
                        value={newPassword}
                        onChangeText={setNewPassword}
                        secureTextEntry
                    />
                    <TextInput
                        style={styles.textInput}
                        placeholder="Confirm New Password"
                        placeholderTextColor="#6B8A52"
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        secureTextEntry
                    />
                    <View style={styles.buttonRow}>
                        <TouchableOpacity style={styles.cancelButton} onPress={() => { setShowChangePassword(false); setCurrentPassword(''); setNewPassword(''); setConfirmPassword(''); }}>
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.saveButton} onPress={handleChangePassword}>
                            <Text style={styles.saveButtonText}>Save</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            <View style={styles.accountButtons}>
                {!showChangePassword && (
                    <TouchableOpacity style={styles.changePasswordButton} onPress={() => setShowChangePassword(true)}>
                        <Text style={styles.changePasswordButtonText}>Change Password</Text>
                    </TouchableOpacity>
                )}
                <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
                    <Text style={styles.signOutText}>Sign Out</Text>
                </TouchableOpacity>
            </View>

            <Text style={styles.attribution}>Icons by Pixellez from pngtree.com</Text>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    scroll: {
        flex: 1,
        backgroundColor: '#0E1A0A',
    },
    container: {
        alignItems: 'center',
        padding: 24,
        paddingBottom: 48,
    },
    heroSection: {
        alignItems: 'center',
        paddingVertical: 32,
        width: '100%',
    },
    greeting: {
        fontSize: 16,
        color: '#6B8A52',
        marginBottom: 4,
        letterSpacing: 0.5,
    },
    header: {
        fontSize: 48,
        fontWeight: 'bold',
        color: '#8BC34A',
        letterSpacing: 2,
        marginBottom: 10,
    },
    tagline: {
        fontSize: 15,
        color: '#A0B87A',
        textAlign: 'center',
        maxWidth: 300,
        lineHeight: 22,
    },
    featuresSection: {
        width: Platform.select({ web: '60%', default: '100%' }),
        marginTop: 8,
        gap: 14,
    },
    sectionLabel: {
        fontSize: 12,
        color: '#6B8A52',
        letterSpacing: 1.5,
        textTransform: 'uppercase',
        marginBottom: 4,
    },
    featureCard: {
        backgroundColor: '#1C2B14',
        borderRadius: 14,
        padding: 20,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#3D5C28',
        gap: 16,
    },
    featureEmoji: {
        fontSize: 32,
    },
    featureText: {
        flex: 1,
    },
    featureTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: '#E8F0DC',
        marginBottom: 4,
    },
    featureDesc: {
        fontSize: 13,
        color: '#7A9B5A',
        lineHeight: 19,
    },
    changePasswordCard: {
        width: Platform.select({ web: '60%', default: '100%' }),
        backgroundColor: '#1C2B14',
        borderRadius: 14,
        padding: 20,
        marginTop: 24,
        borderWidth: 1,
        borderColor: '#3D5C28',
    },
    changePasswordTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#E8F0DC',
        marginBottom: 16,
    },
    textInput: {
        backgroundColor: '#243318',
        borderRadius: 10,
        padding: 14,
        marginBottom: 12,
        color: '#E8F0DC',
        borderWidth: 1,
        borderColor: '#3D5C28',
        fontSize: 15,
    },
    buttonRow: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 4,
    },
    cancelButton: {
        flex: 1,
        padding: 13,
        borderRadius: 10,
        borderWidth: 1.5,
        borderColor: '#3D5C28',
        alignItems: 'center',
    },
    cancelButtonText: {
        color: '#6B8A52',
        fontWeight: '600',
        fontSize: 15,
    },
    saveButton: {
        flex: 1,
        padding: 13,
        borderRadius: 10,
        backgroundColor: '#5B8C35',
        alignItems: 'center',
    },
    saveButtonText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 15,
    },
    accountButtons: {
        marginTop: 32,
        gap: 12,
        alignItems: 'center',
    },
    changePasswordButton: {
        paddingVertical: 12,
        paddingHorizontal: 36,
        borderRadius: 10,
        borderWidth: 1.5,
        borderColor: '#3D5C28',
    },
    changePasswordButtonText: {
        color: '#8BC34A',
        fontSize: 15,
        fontWeight: '600',
    },
    signOutButton: {
        paddingVertical: 12,
        paddingHorizontal: 36,
        borderRadius: 10,
        borderWidth: 1.5,
        borderColor: '#5B4A3A',
        backgroundColor: 'transparent',
    },
    signOutText: {
        color: '#8B6343',
        fontSize: 15,
        fontWeight: '600',
    },
    attribution: {
        marginTop: 24,
        color: '#3D5228',
        fontSize: 11,
    },
});
