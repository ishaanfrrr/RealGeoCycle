import { View, Text, SafeAreaView, StyleSheet, TextInput, TouchableOpacity, Image, Animated, Platform} from 'react-native'
import React, { useState, useRef } from 'react'
import { auth } from '../FirebaseConfig'
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth'
import { router } from 'expo-router'
import { Dialog, Portal, Button, Paragraph } from 'react-native-paper';

const index = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [showLogin, setShowLogin] = useState(false);
    const [showSignup, setShowSignup] = useState(false);
    const [visible, setVisible] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    const hideDialog = () => setVisible(false);

    const signIn = async () => {
        try {
            const user = await signInWithEmailAndPassword(auth, email, password);
            if (user) router.replace('/(back)');
        } catch (error: any) {
            setErrorMessage('Sign in failed: ' + error.message);
            setVisible(true);
        }
    }

    const signUp = async () => {
        if (password !== confirmPassword) {
            setErrorMessage('Sign up failed: passwords do not match.');
            setVisible(true);
            return;
        }
        if (firstName == '' || lastName == '') {
            setErrorMessage('Sign up failed: please set a name.');
            setVisible(true);
            return;
        }
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            if (user) {
                await updateProfile(user, { displayName: `${firstName} ${lastName}` });
                router.replace('/(back)');
            }
        } catch (error: any) {
            setErrorMessage('Sign up failed: ' + error.message);
            setVisible(true);
        }
    }

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;

    React.useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
            Animated.spring(slideAnim, { toValue: 0, speed: 12, bounciness: 6, useNativeDriver: true }),
        ]).start();
    }, []);

    return (
        <Animated.View style={[styles.outerContainer, { opacity: fadeAnim }]}>
            <SafeAreaView style={styles.container}>
                <Animated.View style={[styles.card, { transform: [{ translateY: slideAnim }] }]}>
                    <Image style={{ width: 80, height: 80, marginBottom: 12 }} source={require('@/assets/images/logo.png')} />
                    <Text style={styles.title}>GeoCycle</Text>
                    <Text style={styles.subtitle}>Empowering sustainable choices</Text>

                    <Portal>
                        <Dialog visible={visible} onDismiss={hideDialog} style={{ backgroundColor: '#1C2B14' }}>
                            <Dialog.Title style={{ color: '#C9A84C', fontSize: 20, fontWeight: 'bold' }}>Error</Dialog.Title>
                            <Dialog.Content>
                                <Paragraph style={{ color: '#E8F0DC', fontSize: 16 }}>{errorMessage}</Paragraph>
                            </Dialog.Content>
                            <Dialog.Actions>
                                <Button onPress={hideDialog} textColor="#8BC34A" labelStyle={{ fontSize: 16, fontWeight: 'bold' }}>OK</Button>
                            </Dialog.Actions>
                        </Dialog>
                    </Portal>

                    {!showLogin && !showSignup && (
                        <View style={styles.buttonGroup}>
                            <TouchableOpacity style={styles.primaryButton} onPress={() => setShowLogin(true)}>
                                <Text style={styles.primaryButtonText}>Login</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.secondaryButton} onPress={() => setShowSignup(true)}>
                                <Text style={styles.secondaryButtonText}>Create Account</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {showLogin && (
                        <View style={styles.formGroup}>
                            <TextInput style={styles.textInput} placeholder="Email" placeholderTextColor="#6B8A52" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
                            <TextInput style={styles.textInput} placeholder="Password" placeholderTextColor="#6B8A52" value={password} onChangeText={setPassword} secureTextEntry />
                            <TouchableOpacity style={styles.primaryButton} onPress={signIn}>
                                <Text style={styles.primaryButtonText}>Login</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.ghostButton} onPress={() => setShowLogin(false)}>
                                <Text style={styles.ghostButtonText}>← Back</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {showSignup && (
                        <View style={styles.formGroup}>
                            <View style={styles.row}>
                                <TextInput style={[styles.textInput, styles.halfInput]} placeholder="First Name" placeholderTextColor="#6B8A52" value={firstName} onChangeText={setFirstName} />
                                <TextInput style={[styles.textInput, styles.halfInput]} placeholder="Last Name" placeholderTextColor="#6B8A52" value={lastName} onChangeText={setLastName} />
                            </View>
                            <TextInput style={styles.textInput} placeholder="Email" placeholderTextColor="#6B8A52" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
                            <TextInput style={styles.textInput} placeholder="Password" placeholderTextColor="#6B8A52" value={password} onChangeText={setPassword} secureTextEntry />
                            <TextInput style={styles.textInput} placeholder="Confirm Password" placeholderTextColor="#6B8A52" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry />
                            <TouchableOpacity style={styles.primaryButton} onPress={signUp}>
                                <Text style={styles.primaryButtonText}>Create Account</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.ghostButton} onPress={() => setShowSignup(false)}>
                                <Text style={styles.ghostButtonText}>← Back</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </Animated.View>
            </SafeAreaView>
        </Animated.View>
    )
}

export default index

const styles = StyleSheet.create({
    outerContainer: {
        flex: 1,
        backgroundColor: '#0E1A0A',
    },
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    card: {
        width: Platform.select({ web: '45%', default: '90%' }),
        backgroundColor: '#1C2B14',
        borderRadius: 20,
        padding: 36,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#3D5C28',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
    },
    title: {
        fontSize: 36,
        fontWeight: 'bold',
        color: '#8BC34A',
        letterSpacing: 1,
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 14,
        color: '#6B8A52',
        marginBottom: 32,
        letterSpacing: 0.5,
    },
    buttonGroup: {
        width: '100%',
        gap: 12,
    },
    formGroup: {
        width: '100%',
    },
    row: {
        flexDirection: 'row',
        gap: 10,
    },
    textInput: {
        width: '100%',
        backgroundColor: '#243318',
        borderRadius: 10,
        padding: 14,
        marginBottom: 12,
        color: '#E8F0DC',
        borderWidth: 1,
        borderColor: '#3D5C28',
        fontSize: 15,
    },
    halfInput: {
        flex: 1,
        width: undefined,
    },
    primaryButton: {
        width: '100%',
        backgroundColor: '#5B8C35',
        borderRadius: 10,
        padding: 15,
        alignItems: 'center',
        marginBottom: 10,
    },
    primaryButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    secondaryButton: {
        width: '100%',
        backgroundColor: 'transparent',
        borderRadius: 10,
        padding: 15,
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: '#5B8C35',
        marginBottom: 10,
    },
    secondaryButtonText: {
        color: '#8BC34A',
        fontSize: 16,
        fontWeight: '600',
    },
    ghostButton: {
        width: '100%',
        padding: 12,
        alignItems: 'center',
    },
    ghostButtonText: {
        color: '#6B8A52',
        fontSize: 15,
    },
});
