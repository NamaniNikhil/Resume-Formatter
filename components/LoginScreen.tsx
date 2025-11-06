import React, { useState } from 'react';
import { DocumentTextIcon } from './icons/DocumentTextIcon';
import { supabase } from '../services/supabaseClient';
import { SpinnerIcon } from './icons/SpinnerIcon';

export const LoginScreen: React.FC = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    if (!email || !password) {
        setError("Email and password are required.");
        return;
    }
    if (isSignUp && password.length < 6) {
        setError("Password must be at least 6 characters long.");
        return;
    }

    try {
      setLoading(true);
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMessage('Account created successfully! You can now sign in.');
        setIsSignUp(false); // Switch to sign-in view
        setPassword('');   // Clear password field for security
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        // No message needed on success, the app will redirect
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      setError(error.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="text-center p-8 bg-white shadow-xl rounded-lg max-w-md mx-auto w-full">
        <div className="flex justify-center items-center mx-auto bg-indigo-100 rounded-full h-16 w-16">
          <DocumentTextIcon className="h-10 w-10 text-indigo-600" />
        </div>
        <h1 className="mt-6 text-3xl font-bold text-gray-800">
          {isSignUp ? 'Create an Account' : 'Welcome Back!'}
        </h1>
        <p className="mt-4 text-gray-600">
          {isSignUp ? 'Sign up to start saving and managing your resumes.' : 'Sign in to access your saved resumes.'}
        </p>
        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div>
                <input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    disabled={loading}
                />
            </div>
            <div>
                <input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    disabled={loading}
                />
            </div>
            <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400 transition-colors"
            >
                {loading ? <SpinnerIcon /> : null}
                {loading ? 'Processing...' : (isSignUp ? 'Sign Up' : 'Sign In')}
            </button>
        </form>
        {message && <p className="mt-4 text-green-600">{message}</p>}
        {error && <p className="mt-4 text-red-600">{error}</p>}

        <p className="mt-6 text-sm text-gray-600">
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError('');
              setMessage('');
            }}
            className="font-medium text-indigo-600 hover:text-indigo-500"
          >
            {isSignUp ? 'Sign In' : 'Sign Up'}
          </button>
        </p>
      </div>
    </div>
  );
};