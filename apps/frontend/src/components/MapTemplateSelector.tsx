import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Sparkles } from 'lucide-react';

interface MapTemplate {
  id: number;
  name: string;
  width: number;
  height: number;
  thumbnail?: string;
  category: string;
  creatorName: string;
}

interface MapTemplateSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onTemplateCopied: () => void; // Called when template is successfully copied
}

export const MapTemplateSelector: React.FC<MapTemplateSelectorProps> = ({
  isOpen,
  onClose,
  onTemplateCopied,
}) => {
  const { token } = useAuth();
  const [templates, setTemplates] = useState<MapTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<MapTemplate | null>(
    null
  );
  const [mapName, setMapName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchTemplates();
    }
  }, [isOpen]);

  const fetchTemplates = async () => {
    try {
      const response = await fetch(
        'http://localhost:3000/api/v1/maps/templates',
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setTemplates(data.templates || []);
      }
    } catch (error) {
      console.error('Failed to fetch templates:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTemplateSelect = (template: MapTemplate) => {
    setSelectedTemplate(template);
    setMapName(`${template.name} Copy`);
  };

  const handleCreateFromTemplate = async () => {
    if (!selectedTemplate || !mapName.trim()) return;

    setIsCreating(true);
    try {
      const response = await fetch(
        'http://localhost:3000/api/v1/user/copy-template',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            templateId: selectedTemplate.id,
            name: mapName.trim(),
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        alert(
          `Map "${mapName}" created successfully! Access code: ${data.accessCode}`
        );
        onTemplateCopied();
        onClose();
        setSelectedTemplate(null);
        setMapName('');
      } else {
        const error = await response.json();
        alert(`Failed to create map: ${error.message}`);
      }
    } catch (error) {
      console.error('Failed to create map from template:', error);
      alert('Failed to create map. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleStartFromScratch = () => {
    // For now, just close - we can implement this later if needed
    alert('Start from scratch functionality coming soon!');
    onClose();
  };

  const handleBack = () => {
    setSelectedTemplate(null);
    setMapName('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-75">
      <div className="bg-gray-900 rounded-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-700">
          <div className="flex items-center gap-4">
            {selectedTemplate && (
              <button
                onClick={handleBack}
                className="text-gray-400 hover:text-white transition-colors"
              >
                ← Back
              </button>
            )}
            <h2 className="text-xl font-semibold text-white">
              {selectedTemplate
                ? `Create from "${selectedTemplate.name}"`
                : 'Please select a template'}
            </h2>
          </div>
          {!selectedTemplate && (
            <button
              onClick={handleStartFromScratch}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              Start from scratch
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-6 max-h-[calc(80vh-100px)] overflow-y-auto">
          {selectedTemplate ? (
            /* Name Input Form */
            <div className="space-y-6">
              <div className="bg-gray-800 rounded-lg p-4 flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-yellow-300 rounded-lg flex-shrink-0 flex items-center justify-center">
                  <div className="text-green-800 text-center">
                    <div className="text-xs font-bold">
                      {selectedTemplate.width}x{selectedTemplate.height}
                    </div>
                  </div>
                </div>
                <div>
                  <div className="text-white font-medium">
                    {selectedTemplate.name}
                  </div>
                  <div className="text-sm text-gray-400">
                    By {selectedTemplate.creatorName}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Template • {selectedTemplate.category}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Give your map a name:
                </label>
                <input
                  type="text"
                  value={mapName}
                  onChange={(e) => setMapName(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                  placeholder="Enter map name..."
                  maxLength={100}
                />
              </div>

              <div className="bg-gray-800 rounded-lg p-4">
                <h3 className="text-white font-medium mb-2">
                  What will be copied:
                </h3>
                <ul className="text-sm text-gray-300 space-y-1">
                  <li>
                    • Complete map layout ({selectedTemplate.width}x
                    {selectedTemplate.height})
                  </li>
                  <li>• All elements and decorations</li>
                  <li>• All spaces and their contents</li>
                  <li>• You'll get full editing rights to your copy</li>
                </ul>
              </div>
            </div>
          ) : (
            /* Template Selection */
            <>
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                </div>
              ) : (
                <div className="space-y-4">
                  {templates.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                      <p>No templates available</p>
                      <p className="text-sm mt-2">
                        Admins haven't created any templates yet
                      </p>
                    </div>
                  ) : (
                    templates.map((template) => (
                      <button
                        key={template.id}
                        onClick={() => handleTemplateSelect(template)}
                        className="w-full flex items-center gap-4 p-4 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors text-left"
                      >
                        {/* Template Thumbnail */}
                        <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-yellow-300 rounded-lg flex-shrink-0 overflow-hidden">
                          {template.thumbnail ? (
                            <img
                              src={template.thumbnail}
                              alt={template.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <div className="text-green-800 text-center">
                                <div className="text-xs font-bold">
                                  {template.width}x{template.height}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Template Info */}
                        <div className="flex-1">
                          <div className="text-sm text-gray-400 mb-1">
                            {template.category}
                          </div>
                          <div className="text-white font-medium">
                            {template.name}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            By {template.creatorName}
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-700 flex justify-end gap-3">
          <button
            onClick={selectedTemplate ? handleBack : onClose}
            className="px-4 py-2 border border-gray-600 rounded-lg text-gray-300 hover:bg-gray-700 transition-colors"
          >
            {selectedTemplate ? 'Back' : 'Cancel'}
          </button>
          {selectedTemplate && (
            <button
              onClick={handleCreateFromTemplate}
              disabled={!mapName.trim() || isCreating}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCreating ? 'Creating...' : 'Create Map'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
