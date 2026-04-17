// FloraID — Authentication Module

const Auth = {
  // Initialize auth state listener
  init() {
    supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        Auth.onSignIn(session);
      } else if (event === 'SIGNED_OUT') {
        Auth.onSignOut();
      }
    });
  },

  // Sign up with email and password
  async signUp(email, password, displayName) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName || email.split('@')[0]
        }
      }
    });

    if (error) throw error;
    return data;
  },

  // Sign in with email and password
  async signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;
    return data;
  },

  // Sign out
  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  // Get current session
  async getSession() {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  },

  // Get current user
  async getUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  },

  // Handle sign in event
  onSignIn(session) {
    // If on auth page, redirect to app
    const page = window.location.pathname.split('/').pop() || '';
    if (page === '' || page === 'index.html') {
      window.location.href = 'app.html';
    }
  },

  // Handle sign out event
  onSignOut() {
    // Redirect to login page
    const page = window.location.pathname.split('/').pop() || '';
    if (page !== 'index.html' && page !== '') {
      window.location.href = 'index.html';
    }
  },

  // Protect a page — redirect to login if not authenticated
  async requireAuth() {
    const session = await Auth.getSession();
    if (!session) {
      window.location.href = 'index.html';
      return null;
    }
    return session;
  },

  // Redirect if already logged in (for auth page)
  async redirectIfAuth() {
    const session = await Auth.getSession();
    if (session) {
      window.location.href = 'app.html';
      return true;
    }
    return false;
  }
};
