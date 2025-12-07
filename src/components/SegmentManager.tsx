import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Globe, Tag } from 'lucide-react';
import { Segment } from '../types';
import { apiService } from '../lib/api';
import { useTeam } from '../hooks/useTeam';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Modal } from './ui/Modal';
import { Textarea } from './ui/Textarea';

interface SegmentManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onSegmentChange?: () => void;
}

export const SegmentManager: React.FC<SegmentManagerProps> = ({ 
  isOpen, 
  onClose, 
  onSegmentChange 
}) => {
  const { currentTeam } = useTeam();
  const [segments, setSegments] = useState<Segment[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingSegment, setEditingSegment] = useState<Segment | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    domain: '',
    description: '',
  });

  useEffect(() => {
    if (isOpen) {
      loadSegments();
    }
  }, [isOpen]);

  const loadSegments = async () => {
    if (!currentTeam) return;
    
    try {
      setLoading(true);
      const data = await apiService.getSegments(currentTeam.id);
      setSegments(data);
    } catch (error) {
      console.error('Failed to load segments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSegment = () => {
    setEditingSegment(null);
    setFormData({ name: '', domain: '', description: '' });
    setIsCreateModalOpen(true);
  };

  const handleEditSegment = (segment: Segment) => {
    setEditingSegment(segment);
    setFormData({
      name: segment.name,
      domain: segment.domain,
      description: segment.description || '',
    });
    setIsCreateModalOpen(true);
  };

  const handleDeleteSegment = async (id: string) => {
    if (!confirm('Are you sure you want to delete this segment? Posts assigned to this segment will become visible on all domains.') || !currentTeam) {
      return;
    }

    try {
      await apiService.deleteSegment(id, currentTeam.id);
      setSegments(segments.filter(segment => segment.id !== id));
      onSegmentChange?.();
    } catch (error) {
      console.error('Failed to delete segment:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentTeam) return;
    
    setLoading(true);

    try {
      if (editingSegment) {
        const updatedSegment = await apiService.updateSegment(editingSegment.id, formData, currentTeam.id);
        setSegments(segments.map(segment => 
          segment.id === editingSegment.id ? updatedSegment : segment
        ));
      } else {
        const newSegment = await apiService.createSegment(formData, currentTeam.id);
        setSegments([...segments, newSegment]);
      }
      setIsCreateModalOpen(false);
      onSegmentChange?.();
    } catch (error) {
      console.error('Failed to save segment:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="Manage Segments" size="lg">
        <div className="space-y-6">
          {/* Header */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Tag className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h3 className="text-sm font-medium text-blue-900 mb-1">Domain Segmentation</h3>
                <p className="text-sm text-blue-800">
                  Create segments to control which posts appear on specific domains. 
                  Posts without segments will appear on all domains.
                </p>
              </div>
            </div>
          </div>

          {/* Create Button */}
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">
              Segments ({segments.length})
            </h3>
            <Button onClick={handleCreateSegment}>
              <Plus size={16} className="mr-2" />
              Create Segment
            </Button>
          </div>

          {/* Segments List */}
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : segments.length === 0 ? (
            <div className="text-center py-8">
              <Globe size={48} className="mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No segments yet</h3>
              <p className="text-gray-500 mb-4">
                Create segments to control which posts appear on specific domains
              </p>
              <Button onClick={handleCreateSegment}>
                <Plus size={16} className="mr-2" />
                Create First Segment
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {segments.map((segment) => (
                <div key={segment.id} className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <div className="bg-blue-100 rounded-lg p-2">
                          <Globe size={16} className="text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{segment.name}</h4>
                          <p className="text-sm text-gray-600">{segment.domain}</p>
                        </div>
                      </div>
                      {segment.description && (
                        <p className="text-sm text-gray-500 ml-11">{segment.description}</p>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEditSegment(segment)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Edit segment"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteSegment(segment.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete segment"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Examples */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">Example Segments</h4>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>AI Agent</span>
                <span className="font-mono">aiagent.net2phone.com</span>
              </div>
              <div className="flex justify-between">
                <span>Main Platform</span>
                <span className="font-mono">app.net2phone.com</span>
              </div>
              <div className="flex justify-between">
                <span>Documentation</span>
                <span className="font-mono">docs.net2phone.com</span>
              </div>
            </div>
          </div>
        </div>
      </Modal>

      {/* Create/Edit Segment Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title={editingSegment ? 'Edit Segment' : 'Create New Segment'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Segment Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., AI Agent, Main App, Documentation"
            required
          />

          <Input
            label="Domain"
            value={formData.domain}
            onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
            placeholder="e.g., aiagent.net2phone.com"
            required
          />

          <Textarea
            label="Description (optional)"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Brief description of this segment..."
            rows={3}
          />

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-sm text-yellow-800">
              <strong>Note:</strong> Posts assigned to this segment will only appear on the specified domain. 
              Posts without segments will appear on all domains.
            </p>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsCreateModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" loading={loading}>
              {editingSegment ? 'Update Segment' : 'Create Segment'}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
};