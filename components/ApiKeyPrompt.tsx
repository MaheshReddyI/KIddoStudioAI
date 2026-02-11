
import React from 'react';

interface ApiKeyPromptProps {
  onSuccess: () => void;
}

const ApiKeyPrompt: React.FC<ApiKeyPromptProps> = ({ onSuccess }) => {
  const handleSelectKey = async () => {
    try {
      // @ts-ignore
      await window.aistudio.openSelectKey();
      onSuccess();
    } catch (error) {
      console.error("Error selecting key:", error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 text-center border-4 border-yellow-400">
        <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <i className="fas fa-key text-3xl text-yellow-600"></i>
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Activation Required</h2>
        <p className="text-gray-600 mb-8 leading-relaxed">
          To generate high-quality AI videos for kids using Veo models, you need to select a billing-enabled Google AI Studio API key.
        </p>
        <div className="space-y-4">
          <button
            onClick={handleSelectKey}
            className="w-full bg-yellow-400 hover:bg-yellow-500 text-yellow-900 font-bold py-4 px-6 rounded-2xl transition-all shadow-lg active:scale-95 text-lg"
          >
            Select API Key
          </button>
          <a 
            href="https://ai.google.dev/gemini-api/docs/billing" 
            target="_blank" 
            rel="noopener noreferrer"
            className="block text-sm text-blue-500 hover:underline"
          >
            Learn about API billing & documentation
          </a>
        </div>
      </div>
    </div>
  );
};

export default ApiKeyPrompt;
