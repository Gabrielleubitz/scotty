import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { TeamSettings } from '../components/TeamSettings';

export const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = React.useState(true);

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-6">
          <button
            onClick={() => navigate('/')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft size={20} className="mr-2" />
            Back to Home
          </button>
          <h1 className="text-2xl font-semibold text-gray-900">Team Settings</h1>
        </div>
        <TeamSettings 
          isOpen={isOpen} 
          onClose={() => {
            setIsOpen(false);
            navigate('/');
          }} 
        />
      </div>
    </div>
  );
};

