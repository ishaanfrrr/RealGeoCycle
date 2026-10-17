import { View, Text, StyleSheet, Image, Animated, Pressable, KeyboardAvoidingView, Platform, ScrollView } from 'react-native'
import React, { useState, useRef } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { auth } from '../FirebaseConfig'
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth'
import { router } from 'expo-router'
import { Button, TextField, Banner } from '@/components/ui'
import { colors, radius, spacing, type } from '@/constants/theme'

type Mode = 'login' | 'signup';

// Turn Firebase error codes into something a person can act on.
function friendlyAuthError(error: any) {
    switch (error?.code) {
        case 'auth/invalid-email': return 'That email address doesn\'t look right.';
        case 'auth/invalid-credential':
        case 'auth/wrong-password':
        case 'auth/user-not-found': return 'Email or password is incorrect.';
        case 'auth/email-already-in-use': return 'An account with this email already exists. Try logging in.';
        case 'auth/weak-password': return 'Password must be at least 6 characters.';
        case 'auth/too-many-requests': return 'Too many attempts. Wait a moment and try again.';
        case 'auth/network-request-failed': return 'No connection. Check your internet and try again.';
        default: return error?.message || 'Something went wrong. Please try again.';
    }
}

const index = () => {
    const [mode, setMode] = useState<Mode>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [loading, setLoading] = useState(false);

    const switchMode = (next: Mode) => {
        setMode(next);
        setErrorMessage('');
    };

    const signIn = async () => {
        setErrorMessage('');
        setLoading(true);
        try {
            const user = await signInWithEmailAndPassword(auth, email.trim(), password);
            if (user) router.replace('/(back)');
        } catch (error: any) {
            setErrorMessage(friendlyAuthError(error));
        } finally {
            setLoading(false);
        }
    }

    const signUp = async () => {
        setErrorMessage('');
        if (firstName.trim() == '' || lastName.trim() == '') {
            setErrorMessage('Please enter your first and last name.');
            return;
        }
        if (password !== confirmPassword) {
            setErrorMessage('Passwords don\'t match.');
            return;
        }
        setLoading(true);
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
            const user = userCredential.user;
            if (user) {
                await updateProfile(user, { displayName: `${firstName.trim()} ${lastName.trim()}` });
                router.replace('/(back)');
            }
        } catch (error: any) {
            setErrorMessage(friendlyAuthError(error));
        } finally {
            setLoading(false);
        }
    }

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(16)).current;

    React.useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
            Animated.spring(slideAnim, { toValue: 0, speed: 14, bounciness: 4, useNativeDriver: true }),
        ]).start();
    }, []);

    return (
        <SafeAreaView style={styles.safe}>
            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
                    <Animated.View style={[styles.column, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
                        <View style={styles.brand}>
                            <View style={styles.logoWrap}>
                                <Image style={styles.logo} source={require('@/assets/images/logo.png')} />
                            </View>
                            <Text style={type.display}>GeoCycle</Text>
                            <Text style={[type.bodyMuted, { marginTop: spacing.xs }]}>Sustainable choices, made simple.</Text>
                        </View>

                        <View style={styles.segment} accessibilityRole="tablist">
                            {(['login', 'signup'] as Mode[]).map((m) => {
                                const active = mode === m;
                                return (
                                    <Pressable
                                        key={m}
                                        onPress={() => switchMode(m)}
                                        accessibilityRole="tab"
                                        accessibilityState={{ selected: active }}
                                        style={[styles.segmentItem, active && styles.segmentItemActive]}
                                    >
                                        <Text style={[styles.segmentText, active && styles.segmentTextActive]}>
                                            {m === 'login' ? 'Log in' : 'Sign up'}
                                        </Text>
                                    </Pressable>
                                );
                            })}
                        </View>

                        {errorMessage !== '' && <Banner message={errorMessage} />}

                        {mode === 'signup' && (
                            <View style={styles.row}>
                                <TextField
                                    label="First name"
                                    containerStyle={{ flex: 1 }}
                                    value={firstName}
                                    onChangeText={setFirstName}
                                    textContentType="givenName"
                                    autoComplete="given-name"
                                />
                                <TextField
                                    label="Last name"
                                    containerStyle={{ flex: 1 }}
                                    value={lastName}
                                    onChangeText={setLastName}
                                    textContentType="familyName"
                                    autoComplete="family-name"
                                />
                            </View>
                        )}
                        <TextField
                            label="Email"
                            icon="mail-outline"
                            placeholder="you@example.com"
                            value={email}
                            onChangeText={setEmail}
                            autoCapitalize="none"
                            keyboardType="email-address"
                            textContentType="emailAddress"
                            autoComplete="email"
                        />
                        <TextField
                            label="Password"
                            icon="lock-closed-outline"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                            textContentType={mode === 'login' ? 'password' : 'newPassword'}
                            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                            onSubmitEditing={mode === 'login' ? signIn : undefined}
                        />
                        {mode === 'signup' && (
                            <TextField
                                label="Confirm password"
                                icon="lock-closed-outline"
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                secureTextEntry
                                textContentType="newPassword"
                                autoComplete="new-password"
                                onSubmitEditing={signUp}
                            />
                        )}

                        <Button
                            label={mode === 'login' ? 'Log in' : 'Create account'}
                            onPress={mode === 'login' ? signIn : signUp}
                            loading={loading}
                            style={{ marginTop: spacing.sm }}
                        />

                        <Pressable onPress={() => switchMode(mode === 'login' ? 'signup' : 'login')} style={styles.switchLink} hitSlop={8}>
                            <Text style={type.bodyMuted}>
                                {mode === 'login' ? 'New to GeoCycle? ' : 'Already have an account? '}
                                <Text style={{ color: colors.primary, fontWeight: '600' }}>
                                    {mode === 'login' ? 'Create an account' : 'Log in'}
                                </Text>
                            </Text>
                        </Pressable>
                    </Animated.View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    )
}

export default index

const styles = StyleSheet.create({
    safe: {
        flex: 1,
        backgroundColor: colors.background,
    },
    scroll: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: spacing.xl,
    },
    column: {
        width: '100%',
        maxWidth: 420,
        alignSelf: 'center',
    },
    brand: {
        alignItems: 'center',
        marginBottom: spacing.xxl,
    },
    logoWrap: {
        width: 72,
        height: 72,
        borderRadius: radius.xl,
        backgroundColor: colors.primarySoft,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.lg,
    },
    logo: {
        width: 48,
        height: 48,
    },
    segment: {
        flexDirection: 'row',
        backgroundColor: colors.surface,
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: colors.border,
        padding: spacing.xs,
        marginBottom: spacing.xl,
    },
    segmentItem: {
        flex: 1,
        minHeight: 40,
        borderRadius: radius.sm,
        alignItems: 'center',
        justifyContent: 'center',
    },
    segmentItemActive: {
        backgroundColor: colors.surfaceRaised,
    },
    segmentText: {
        fontSize: 15,
        fontWeight: '600',
        color: colors.textFaint,
    },
    segmentTextActive: {
        color: colors.text,
    },
    row: {
        flexDirection: 'row',
        gap: spacing.md,
    },
    switchLink: {
        alignItems: 'center',
        marginTop: spacing.xl,
        paddingVertical: spacing.sm,
    },
});
