import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { GodAdminPanel } from '../components/GodAdminPanel';

export const GodAdminPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="mb-6">
        <button
          onClick={() => navigate('/admin')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft size={20} className="mr-2" />
          Back to Admin Dashboard
        </button>
      </div>
      <GodAdminPanel />
    </div>
  );
};

