import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { describeApiError, isAbortError, toApiError, type ApiError } from '../api/ApiError';
import { request } from '../api/http';

export interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
}

const USERS_URL = 'https://dummyjson.com/users';

function parseUser(data: unknown): User {
  if (typeof data !== 'object' || data === null) throw new TypeError('user must be an object');
  const { id, firstName, lastName, email } = data as Record<string, unknown>;
  if (
    typeof id !== 'number' ||
    typeof firstName !== 'string' ||
    typeof lastName !== 'string' ||
    typeof email !== 'string'
  ) {
    throw new TypeError('user has an unexpected shape');
  }
  return { id, firstName, lastName, email };
}

export function fetchUser(userId: number, signal?: AbortSignal): Promise<User> {
  return request(`${USERS_URL}/${userId}`, { signal, timeoutMs: 10000, parse: parseUser });
}

export type UserStatus = 'loading' | 'success' | 'error';

export interface UseUserResult {
  status: UserStatus;
  user: User | null;
  error: ApiError | null;
  refresh: () => void;
}

interface Settled {
  key: string;
  userId: number;
  user: User | null;
  error: ApiError | null;
}

// Every request has a key (userId + refresh counter). Only the last settled request is stored;
// "loading" means the settled key is not the current one, so there is no flag to get out of sync.
export function useUser(userId: number, onUserFetched?: (user: User) => void): UseUserResult {
  const [generation, setGeneration] = useState(0);
  const [settled, setSettled] = useState<Settled | null>(null);

  // via ref so an inline arrow from the parent doesn't restart the request
  const onUserFetchedRef = useRef(onUserFetched);
  useEffect(() => {
    onUserFetchedRef.current = onUserFetched;
  });

  const key = `${userId}:${generation}`;

  useEffect(() => {
    const controller = new AbortController();

    fetchUser(userId, controller.signal).then(
      (user) => {
        if (controller.signal.aborted) return;
        setSettled({ key, userId, user, error: null });
        onUserFetchedRef.current?.(user);
      },
      (error: unknown) => {
        if (controller.signal.aborted || isAbortError(error)) return;
        setSettled((previous) => ({
          key,
          userId,
          user: previous?.userId === userId ? previous.user : null,
          error: toApiError(error),
        }));
      },
    );

    // abort on unmount / key change: a stale response can't overwrite newer data or fire the callback
    return () => controller.abort();
  }, [userId, key]);

  const isCurrent = settled !== null && settled.key === key;
  const user = isCurrent
    ? settled.user
    : settled !== null && settled.userId === userId
      ? settled.user
      : null;
  const status: UserStatus = !isCurrent ? 'loading' : settled.error !== null ? 'error' : 'success';
  const error = isCurrent ? settled.error : null;

  const refresh = useCallback(() => setGeneration((current) => current + 1), []);

  return { status, user, error, refresh };
}

export interface UserProfileViewProps {
  status: UserStatus;
  user: User | null;
  errorMessage: string | null;
  onRefresh: () => void;
  accentColor?: string;
}

export function UserProfileView({
  status,
  user,
  errorMessage,
  onRefresh,
  accentColor = '#2F54EB',
}: UserProfileViewProps) {
  const loading = status === 'loading';

  return (
    <View style={styles.container}>
      <View style={styles.headingRow}>
        <Text style={styles.heading}>Uživatel</Text>
        {loading && <ActivityIndicator size="small" color={accentColor} />}
      </View>

      {user !== null ? (
        <View>
          <Text style={styles.line}>{`Jméno: ${user.firstName} ${user.lastName}`}</Text>
          <Text style={styles.line}>{`E-mail: ${user.email}`}</Text>
        </View>
      ) : (
        <Text style={styles.muted}>{loading ? 'Načítám uživatele...' : 'Žádná data.'}</Text>
      )}

      {errorMessage !== null && <Text style={styles.error}>{errorMessage}</Text>}

      <Pressable
        disabled={loading}
        onPress={onRefresh}
        style={({ pressed }) => [
          styles.button,
          { backgroundColor: accentColor },
          (pressed || loading) && styles.buttonDimmed,
        ]}
      >
        <Text style={styles.buttonLabel}>Obnovit</Text>
      </Pressable>
    </View>
  );
}

export interface UserProfileProps {
  userId: number;
  onUserFetched?: (user: User) => void;
  accentColor?: string;
}

export default function UserProfile({ userId, onUserFetched, accentColor }: UserProfileProps) {
  const { status, user, error, refresh } = useUser(userId, onUserFetched);
  return (
    <UserProfileView
      status={status}
      user={user}
      errorMessage={error !== null ? describeApiError(error) : null}
      onRefresh={refresh}
      accentColor={accentColor}
    />
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, gap: 10 },
  headingRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  heading: { fontSize: 16, fontWeight: '700' },
  line: { fontSize: 15, lineHeight: 22 },
  muted: { fontSize: 15, color: '#6B7280' },
  error: { fontSize: 14, color: '#DC2626' },
  button: {
    marginTop: 4,
    minHeight: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  buttonDimmed: { opacity: 0.6 },
  buttonLabel: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
});
