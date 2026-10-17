import { StyleSheet, View, Text, Pressable, ScrollView } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { auth } from '@/FirebaseConfig';
import { getAuth, onAuthStateChanged, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { Button, Card, TextField, Banner, IconBadge } from '@/components/ui';
import { colors, contentMaxWidth, radius, spacing, type } from '@/constants/theme';

const features = [
    { icon: 'newspaper' as const, title: 'Eco News', description: 'The latest environmental headlines from around the world.', href: '/news' },
    { icon: 'scan' as const, title: 'Scan an item', description: 'Snap a photo to find out if it can be recycled.', href: '/waste' },
    { icon: 'chatbubbles' as const, title: 'Community', description: 'Share ideas and talk about sustainable living.', href: '/forum' },
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
    const [message, setMessage] = useState('');
    const [messageTone, setMessageTone] = useState<'error' | 'success'>('error');
    const [saving, setSaving] = useState(false);

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

    const showError = (text: string) => {
        setMessage(text);
        setMessageTone('error');
    };

    const closeChangePassword = () => {
        setShowChangePassword(false);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
    };

    const handleChangePassword = async () => {
        if (!currentPassword || !newPassword || !confirmPassword) {
            showError('Please fill in all fields.');
            return;
        }
        if (newPassword !== confirmPassword) {
            showError('New passwords don\'t match.');
            return;
        }
        if (newPassword.length < 6) {
            showError('New password must be at least 6 characters.');
            return;
        }
        setSaving(true);
        try {
            const user = getAuth().currentUser;
            if (!user || !user.email) throw new Error('Not logged in.');
            const credential = EmailAuthProvider.credential(user.email, currentPassword);
            await reauthenticateWithCredential(user, credential);
            await updatePassword(user, newPassword);
            closeChangePassword();
            setMessage('Password changed.');
            setMessageTone('success');
        } catch (error: any) {
            if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
                showError('Current password is incorrect.');
            } else {
                showError('Couldn\'t change password: ' + error.message);
            }
        } finally {
            setSaving(false);
        }
    };

    return (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
            <View style={styles.column}>
                <View style={styles.hero}>
                    <Text style={styles.greeting}>{userName ? `Hi, ${userName}` : 'Welcome back'}</Text>
                    <Text style={type.display}>What will you do{'\n'}for the planet today?</Text>
                </View>

                <View style={styles.features}>
                    {features.map((f) => (
                        <Pressable
                            key={f.title}
                            onPress={() => router.push(f.href as any)}
                            accessibilityRole="button"
                            accessibilityLabel={f.title}
                            style={({ pressed }) => [styles.featureCard, pressed && styles.featureCardPressed]}
                        >
                            <IconBadge name={f.icon} />
                            <View style={{ flex: 1 }}>
                                <Text style={type.heading}>{f.title}</Text>
                                <Text style={[type.bodyMuted, { marginTop: 2 }]}>{f.description}</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color={colors.textFaint} />
                        </Pressable>
                    ))}
                </View>

                <Text style={styles.sectionLabel}>Account</Text>
                {message !== '' && <Banner message={message} tone={messageTone} />}
                <Card>
                    {showChangePassword ? (
                        <>
                            <Text style={[type.heading, { marginBottom: spacing.lg }]}>Change password</Text>
                            <TextField label="Current password" value={currentPassword} onChangeText={setCurrentPassword} secureTextEntry autoComplete="current-password" />
                            <TextField label="New password" value={newPassword} onChangeText={setNewPassword} secureTextEntry autoComplete="new-password" />
                            <TextField label="Confirm new password" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry autoComplete="new-password" />
                            <View style={styles.buttonRow}>
                                <Button label="Cancel" variant="secondary" onPress={() => { closeChangePassword(); setMessage(''); }} style={{ flex: 1 }} />
                                <Button label="Save" onPress={handleChangePassword} loading={saving} style={{ flex: 1 }} />
                            </View>
                        </>
                    ) : (
                        <>
                            <Pressable
                                onPress={() => { setShowChangePassword(true); setMessage(''); }}
                                accessibilityRole="button"
                                style={({ pressed }) => [styles.accountRow, pressed && { opacity: 0.7 }]}
                            >
                                <Ionicons name="key-outline" size={20} color={colors.textMuted} />
                                <Text style={[type.body, { flex: 1 }]}>Change password</Text>
                                <Ionicons name="chevron-forward" size={18} color={colors.textFaint} />
                            </Pressable>
                            <View style={styles.divider} />
                            <Pressable
                                onPress={handleSignOut}
                                accessibilityRole="button"
                                style={({ pressed }) => [styles.accountRow, pressed && { opacity: 0.7 }]}
                            >
                                <Ionicons name="log-out-outline" size={20} color={colors.danger} />
                                <Text style={[type.body, { flex: 1, color: colors.danger }]}>Sign out</Text>
                            </Pressable>
                        </>
                    )}
                </Card>

                <Text style={styles.attribution}>Icons by Pixellez from pngtree.com</Text>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    scroll: {
        flex: 1,
        backgroundColor: colors.background,
    },
    container: {
        padding: spacing.xl,
        paddingBottom: spacing.xxxl,
    },
    column: {
        width: '100%',
        maxWidth: contentMaxWidth,
        alignSelf: 'center',
    },
    hero: {
        paddingTop: spacing.lg,
        paddingBottom: spacing.xl,
    },
    greeting: {
        ...type.label,
        color: colors.primary,
        fontSize: 15,
        marginBottom: spacing.sm,
    },
    features: {
        gap: spacing.md,
        marginBottom: spacing.xxl,
    },
    featureCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.lg,
        backgroundColor: colors.surface,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: colors.border,
        padding: spacing.lg,
    },
    featureCardPressed: {
        backgroundColor: colors.surfaceRaised,
        borderColor: colors.borderStrong,
    },
    sectionLabel: {
        ...type.label,
        textTransform: 'uppercase',
        letterSpacing: 1,
        fontSize: 12,
        marginBottom: spacing.md,
    },
    accountRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        minHeight: 48,
    },
    divider: {
        height: 1,
        backgroundColor: colors.border,
        marginVertical: spacing.xs,
    },
    buttonRow: {
        flexDirection: 'row',
        gap: spacing.md,
        marginTop: spacing.xs,
    },
    attribution: {
        ...type.caption,
        textAlign: 'center',
        marginTop: spacing.xxl,
    },
});
