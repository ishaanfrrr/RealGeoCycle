import React, { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors, noWebOutline, radius, spacing, type } from '@/constants/theme';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  icon?: IconName;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function Button({ label, onPress, variant = 'primary', icon, loading, disabled, style }: ButtonProps) {
  const v = buttonVariants[variant];
  const isDisabled = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!isDisabled, busy: !!loading }}
      style={({ pressed }) => [
        styles.button,
        v.container,
        pressed && v.pressed,
        pressed && { transform: [{ scale: 0.98 }] },
        isDisabled && { opacity: 0.5 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={v.text.color} />
      ) : (
        <>
          {icon && <Ionicons name={icon} size={18} color={v.text.color} />}
          <Text style={[styles.buttonText, v.text]}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}

const buttonVariants = {
  primary: StyleSheet.create({
    container: { backgroundColor: colors.primary },
    pressed: { backgroundColor: colors.primaryPressed },
    text: { color: colors.onPrimary },
  }),
  secondary: StyleSheet.create({
    container: { backgroundColor: colors.surfaceRaised, borderWidth: 1, borderColor: colors.border },
    pressed: { backgroundColor: colors.border },
    text: { color: colors.text },
  }),
  ghost: StyleSheet.create({
    container: { backgroundColor: 'transparent' },
    pressed: { backgroundColor: colors.surfaceRaised },
    text: { color: colors.textMuted },
  }),
  danger: StyleSheet.create({
    container: { backgroundColor: colors.dangerSoft },
    pressed: { backgroundColor: 'rgba(248, 113, 113, 0.2)' },
    text: { color: colors.danger },
  }),
};

type TextFieldProps = TextInputProps & {
  label: string;
  icon?: IconName;
  containerStyle?: StyleProp<ViewStyle>;
};

export function TextField({ label, icon, containerStyle, secureTextEntry, style, ...rest }: TextFieldProps) {
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(true);
  return (
    <View style={[styles.fieldWrap, containerStyle]}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={[styles.field, focused && styles.fieldFocused]}>
        {icon && <Ionicons name={icon} size={18} color={focused ? colors.primary : colors.textFaint} />}
        <TextInput
          {...rest}
          accessibilityLabel={label}
          secureTextEntry={secureTextEntry && hidden}
          placeholderTextColor={colors.textFaint}
          onFocus={(e) => { setFocused(true); rest.onFocus?.(e); }}
          onBlur={(e) => { setFocused(false); rest.onBlur?.(e); }}
          style={[styles.fieldInput, noWebOutline, style]}
        />
        {secureTextEntry && (
          <Pressable
            onPress={() => setHidden((h) => !h)}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel={hidden ? 'Show password' : 'Hide password'}
          >
            <Ionicons name={hidden ? 'eye-outline' : 'eye-off-outline'} size={18} color={colors.textFaint} />
          </Pressable>
        )}
      </View>
    </View>
  );
}

export function Card({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Banner({ message, tone = 'error' }: { message: string; tone?: 'error' | 'success' }) {
  const isError = tone === 'error';
  return (
    <View
      accessibilityRole="alert"
      style={[styles.banner, { backgroundColor: isError ? colors.dangerSoft : colors.primarySoft }]}
    >
      <Ionicons
        name={isError ? 'alert-circle' : 'checkmark-circle'}
        size={18}
        color={isError ? colors.danger : colors.primary}
      />
      <Text style={[styles.bannerText, { color: isError ? colors.danger : colors.primary }]}>{message}</Text>
    </View>
  );
}

export function IconBadge({ name, color = colors.primary, bg = colors.primarySoft, size = 44 }: {
  name: IconName; color?: string; bg?: string; size?: number;
}) {
  return (
    <View style={{ width: size, height: size, borderRadius: size / 3, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>
      <Ionicons name={name} size={size * 0.5} color={color} />
    </View>
  );
}

export function EmptyState({ icon, title, message, action }: {
  icon: IconName; title: string; message: string; action?: React.ReactNode;
}) {
  return (
    <View style={styles.empty}>
      <IconBadge name={icon} size={64} />
      <Text style={[type.heading, { marginTop: spacing.lg, textAlign: 'center' }]}>{title}</Text>
      <Text style={[type.bodyMuted, { marginTop: spacing.xs, textAlign: 'center', maxWidth: 300 }]}>{message}</Text>
      {action && <View style={{ marginTop: spacing.xl }}>{action}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 50,
    borderRadius: radius.md,
    paddingHorizontal: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  fieldWrap: {
    marginBottom: spacing.lg,
  },
  fieldLabel: {
    ...type.label,
    marginBottom: spacing.sm,
  },
  field: {
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
  },
  fieldFocused: {
    borderColor: colors.primary,
  },
  fieldInput: {
    flex: 1,
    color: colors.text,
    fontSize: 16,
    paddingVertical: spacing.md,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.lg,
  },
  bannerText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxl,
    flex: 1,
  },
});
