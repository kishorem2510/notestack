import {
  signUp,
  signIn,
  signOut,
  confirmSignUp,
  fetchAuthSession,
} from "aws-amplify/auth";

// Sign up
export async function register(email: string, password: string) {
  return await signUp({
    username: email,
    password,
    options: { userAttributes: { email } },
  });
}

// Confirm email with OTP
export async function confirmEmail(email: string, code: string) {
  return await confirmSignUp({ username: email, confirmationCode: code });
}

// Login
export async function login(email: string, password: string) {
  return await signIn({ username: email, password });
}

// Logout
export async function logout() {
  return await signOut();
}

// Get JWT token for API calls
export async function getToken(): Promise<string> {
  const session = await fetchAuthSession();
  return session.tokens?.idToken?.toString() ?? "";
}