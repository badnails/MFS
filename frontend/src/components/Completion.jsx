// src/components/Completion.jsx

import React from 'react';
import { Link } from 'react-router-dom';

const Completion = () => (
  <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 flex items-center justify-center px-4 py-10">
    <div className="bg-white shadow-2xl rounded-3xl w-full max-w-2xl p-8 space-y-6 text-center transition-all duration-300 hover:shadow-xl">
      {/* Progress indicator */}
      <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
        <div className="bg-blue-600 h-2 rounded-full w-full transition-all duration-500"></div>
      </div>
      
      <div className="flex flex-col items-center space-y-4">
        <div className="bg-green-100 rounded-full p-3">
          <svg className="w-12 h-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
          </svg>
        </div>
        
        <h2 className="text-3xl font-bold text-gray-800">Setup Complete!</h2>
        <p className="text-gray-600 text-lg">Your account has been successfully created and is ready to use.</p>
        
        <Link 
          to="/login" 
          className="mt-8 inline-flex items-center space-x-2 px-6 py-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-all duration-200 shadow-lg shadow-blue-200"
        >
          <span>Continue to Login</span>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </Link>
      </div>
    </div>
  </div>
);

export default Completion;
