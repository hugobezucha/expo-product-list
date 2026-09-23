import { act, fireEvent, render, screen } from '@testing-library/react-native';

import {
  abortError,
  deferred,
  fakeResponse,
  flushPromises,
  type Deferred,
} from '../../test/helpers';
import UserProfile, { type User } from '../refactored';

interface FetchCall {
  url: string;
  signal: AbortSignal | undefined;
  response: Deferred<Response>;
}

const calls: FetchCall[] = [];

function user(id: number): User {
  return { id, firstName: `First${id}`, lastName: `Last${id}`, email: `user${id}@example.com` };
}

async function respond(call: FetchCall, body: unknown, status = 200) {
  await act(async () => {
    call.response.resolve(fakeResponse(body, status));
    await flushPromises();
  });
}

beforeEach(() => {
  calls.length = 0;
  global.fetch = jest.fn((url: string, init?: RequestInit) => {
    const response = deferred<Response>();
    // behave like a real fetch: abort rejects the pending promise
    init?.signal?.addEventListener('abort', () => response.reject(abortError()));
    calls.push({ url, signal: init?.signal ?? undefined, response });
    return response.promise;
  }) as unknown as typeof fetch;
});

describe('UserProfile (refactored)', () => {
  it('loads the user and calls onUserFetched once', async () => {
    const onUserFetched = jest.fn();
    await render(<UserProfile userId={1} onUserFetched={onUserFetched} />);

    expect(screen.getByText('Načítám uživatele...')).toBeTruthy();
    expect(calls[0]?.url).toBe('https://dummyjson.com/users/1');

    await respond(calls[0]!, { ...user(1), age: 29, extra: true });

    expect(screen.getByText('Jméno: First1 Last1')).toBeTruthy();
    expect(screen.getByText('E-mail: user1@example.com')).toBeTruthy();
    expect(onUserFetched).toHaveBeenCalledTimes(1);
    expect(onUserFetched).toHaveBeenCalledWith(user(1));
  });

  it('refetches when userId changes and lets the newest request win', async () => {
    const onUserFetched = jest.fn();
    const { rerender } = await render(<UserProfile userId={1} onUserFetched={onUserFetched} />);
    await rerender(<UserProfile userId={2} onUserFetched={onUserFetched} />);

    expect(calls).toHaveLength(2);
    expect(calls[0]?.signal?.aborted).toBe(true);
    expect(calls[1]?.url).toBe('https://dummyjson.com/users/2');

    await respond(calls[1]!, user(2));
    expect(screen.getByText('Jméno: First2 Last2')).toBeTruthy();

    // a late answer for user 1 must not overwrite user 2
    await act(async () => {
      calls[0]!.response.resolve(fakeResponse(user(1)));
      await flushPromises();
    });
    expect(screen.getByText('Jméno: First2 Last2')).toBeTruthy();
    expect(screen.queryByText('Jméno: First1 Last1')).toBeNull();
    expect(onUserFetched).toHaveBeenCalledTimes(1);
    expect(onUserFetched).toHaveBeenCalledWith(user(2));
  });

  it('does not refetch when only the callback changes', async () => {
    const { rerender } = await render(<UserProfile userId={1} onUserFetched={() => undefined} />);
    await rerender(<UserProfile userId={1} onUserFetched={() => undefined} />);

    expect(calls).toHaveLength(1);
  });

  it('aborts the request on unmount', async () => {
    const { unmount } = await render(<UserProfile userId={1} />);
    await unmount();

    expect(calls[0]?.signal?.aborted).toBe(true);
  });

  it('shows an error for a missing user and recovers after refresh', async () => {
    await render(<UserProfile userId={9999} />);
    await respond(calls[0]!, { message: 'not found' }, 404);

    expect(screen.getByText('Požadovaná data neexistují.')).toBeTruthy();
    expect(screen.getByText('Žádná data.')).toBeTruthy();

    await fireEvent.press(screen.getByText('Obnovit'));
    expect(calls).toHaveLength(2);
    expect(screen.getByText('Načítám uživatele...')).toBeTruthy();

    await respond(calls[1]!, user(9999));
    expect(screen.getByText('Jméno: First9999 Last9999')).toBeTruthy();
    expect(screen.queryByText('Požadovaná data neexistují.')).toBeNull();
  });

  it('keeps last data during refresh and on refresh error', async () => {
    await render(<UserProfile userId={1} />);
    await respond(calls[0]!, user(1));

    await fireEvent.press(screen.getByText('Obnovit'));
    expect(screen.getByText('Jméno: First1 Last1')).toBeTruthy();

    await respond(calls[1]!, {}, 500);
    expect(screen.getByText('Jméno: First1 Last1')).toBeTruthy();
    expect(screen.getByText('Server vrátil chybu (500).')).toBeTruthy();
  });
});
