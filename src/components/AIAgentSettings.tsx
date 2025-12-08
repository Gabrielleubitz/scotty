import React, { useState } from 'react';
import { Bot, Check, AlertCircle, ExternalLink, TestTube } from 'lucide-react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { AIAgentConfig } from '../types';
import { apiService } from '../lib/api';

interface AIAgentSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  config: AIAgentConfig;
  onConfigChange: (config: AIAgentConfig) => void;
}

export const AIAgentSettings: React.FC<AIAgentSettingsProps> = ({
  isOpen,
  onClose,
  config,
  onConfigChange,
}) => {
  const [formData, setFormData] = useState<AIAgentConfig>(config);
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [saved, setSaved] = useState(false);

  React.useEffect(() => {
    setFormData(config);
  }, [config]);

  const handleSave = async () => {
    setLoading(true);
    try {
      await apiService.saveAIAgentConfig(formData);
      onConfigChange(formData);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      console.error('Failed to save AI config:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTest = async () => {
    if (!formData.apiToken) {
      setTestResult({ success: false, message: 'Please enter an API token first' });
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      const success = await apiService.testAIAgentConnection(formData);
      setTestResult({
        success,
        message: success 
          ? 'Connection successful! AI agent is working correctly.' 
          : 'Connection failed. Please check your API token and URL.'
      });
    } catch (error) {
      setTestResult({
        success: false,
        message: 'Connection test failed. Please check your configuration.'
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="AI Agent Settings" size="lg">
      <div className="space-y-6">
        {/* Header Info */}
        <div className="bg-accent/10 border border-accent/30 rounded-card p-4">
          <div className="flex items-start space-x-3">
            <Bot className="h-5 w-5 text-accent mt-0.5" />
            <div>
              <h3 className="text-body font-medium text-text-primary mb-1">AI Agent Integration</h3>
              <p className="text-body text-text-muted">
                Connect your changelog widget to an AI agent for intelligent customer support. 
                The AI will have access to your latest product updates for context-aware responses.
              </p>
            </div>
          </div>
        </div>

        {/* Enable/Disable Toggle */}
        <div className="flex items-center justify-between p-4 bg-bg-cardAlt rounded-card">
          <div>
            <h4 className="font-medium text-text-primary">Enable AI Agent</h4>
            <p className="text-body text-text-muted">Use AI agent for chat responses instead of mock responses</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={formData.enabled}
              onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        {/* API Configuration */}
        <div className="space-y-4">
          <Input
            label="API URL"
            value={formData.apiUrl}
            onChange={(e) => setFormData({ ...formData, apiUrl: e.target.value })}
            placeholder="https://api.example.com"
            disabled={!formData.enabled}
          />

          <div>
            <Input
              label="API Token"
              type="password"
              value={formData.apiToken}
              onChange={(e) => setFormData({ ...formData, apiToken: e.target.value })}
              placeholder="This will be stored securely on the server"
              disabled={!formData.enabled}
            />
            <p className="text-caption text-text-muted mt-1">
              Enter the base URL without /api (e.g., https://api.example.com). The system will automatically add /api/chat to your URL.
            </p>
            <p className="text-caption text-text-muted mt-1">
              Get your API token from the Admin interface under "Manage Tokens". The token is stored securely as a server environment variable.
              {(testResult && !testResult.success) && (
                <span className="block mt-2 text-xs">
                  <strong>Note:</strong> If testing from a deployed site, ensure the AI agent API allows CORS requests from your domain: <code>{window.location.origin}</code>
                </span>
              )}
            </p>
            <div className="bg-status-success/10 border border-status-success/30 rounded-card p-3 mt-2">
              <p className="text-caption text-status-success">
                <strong>🔒 Security:</strong> Your API token is stored securely on the server and never exposed to client-side code.
              </p>
            </div>
          </div>
        </div>

        {/* Test Connection */}
        {formData.enabled && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-text-primary">Test Connection</h4>
              <Button
                variant="outline"
                size="sm"
                onClick={handleTest}
                loading={testing}
                disabled={!formData.apiToken}
              >
                <TestTube size={16} className="mr-2" />
                Test API
              </Button>
            </div>

            {testResult && (
              <div className={`p-3 rounded-card flex items-start space-x-2 ${
                testResult.success 
                  ? 'bg-status-success/10 border border-status-success/30' 
                  : 'bg-status-error/10 border border-status-error/30'
              }`}>
                {testResult.success ? (
                  <Check className="h-4 w-4 text-status-success mt-0.5" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-status-error mt-0.5" />
                )}
                <p className={`text-body ${
                  testResult.success ? 'text-status-success' : 'text-status-error'
                }`}>
                  {testResult.message}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Documentation Link */}
        <div className="bg-bg-cardAlt rounded-card p-4">
          <h4 className="font-medium text-text-primary mb-2">API Documentation</h4>
          <p className="text-body text-text-muted mb-3">
            The AI agent will receive context about your recent changelog posts and can provide 
            intelligent responses about your product updates.
          </p>
          <a
            href="#"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center text-body text-accent hover:text-accent-hover"
          >
            View API Documentation
            <ExternalLink size={14} className="ml-1" />
          </a>
        </div>

        {/* Context Information */}
        <div className="bg-status-warning/10 border border-status-warning/30 rounded-card p-4">
          <h4 className="font-medium text-status-warning mb-2">Context Provided to AI</h4>
          <ul className="text-body text-text-muted space-y-1">
            <li>• Recent changelog posts (titles and content)</li>
            <li>• User's domain and timestamp</li>
            <li>• Session management for conversation continuity</li>
            <li>• Custom variables for personalized responses</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-border">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} loading={loading}>
            {saved ? (
              <>
                <Check size={16} className="mr-2" />
                Saved!
              </>
            ) : (
              'Save Settings'
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
};