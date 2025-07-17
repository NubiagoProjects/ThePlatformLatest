'use client';

import React, { useEffect, useState } from 'react';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, getDocs } from 'firebase/firestore';

export const FirebaseTest: React.FC = () => {
  const [authStatus, setAuthStatus] = useState<string>('Checking...');
  const [firestoreStatus, setFirestoreStatus] = useState<string>('Checking...');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Test Authentication
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setAuthStatus(`✅ Authenticated as: ${user.email}`);
      } else {
        setAuthStatus('✅ Authentication ready (no user signed in)');
      }
    }, (error) => {
      setAuthStatus(`❌ Auth Error: ${error.message}`);
      setError(error.message);
    });

    // Test Firestore
    const testFirestore = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'test'));
        setFirestoreStatus(`✅ Firestore connected (${querySnapshot.size} test documents)`);
      } catch (err) {
        setFirestoreStatus(`❌ Firestore Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
        setError(err instanceof Error ? err.message : 'Unknown error');
      }
    };

    testFirestore();

    return () => unsubscribe();
  }, []);

  return (
    <div className="p-6 bg-white rounded-lg shadow-md max-w-md mx-auto mt-8">
      <h2 className="text-xl font-bold mb-4 text-gray-800">Firebase Connection Test</h2>
      
      <div className="space-y-3">
        <div className="p-3 bg-gray-50 rounded">
          <h3 className="font-semibold text-gray-700">Authentication:</h3>
          <p className="text-sm">{authStatus}</p>
        </div>
        
        <div className="p-3 bg-gray-50 rounded">
          <h3 className="font-semibold text-gray-700">Firestore:</h3>
          <p className="text-sm">{firestoreStatus}</p>
        </div>
        
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded">
            <h3 className="font-semibold text-red-700">Error:</h3>
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}
      </div>
      
      <div className="mt-4 text-xs text-gray-500">
        Project: nubiago-test
      </div>
    </div>
  );
}; 