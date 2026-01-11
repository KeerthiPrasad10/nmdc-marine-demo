import { useState, useEffect } from 'react';
import { 
  X, 
  Database, 
  FileText, 
  FolderOpen,
  Check,
  Plus,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  Trash2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import type { KnowledgeBase } from './types';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  knowledgeBases: KnowledgeBase[];
  onRefresh: () => void;
  selectedKbId?: string;
  onSelectKb?: (id: string | null) => void;
}

interface Project {
  id: string;
  name: string;
  drawingCount?: number;
}

interface Manual {
  id: string;
  name: string;
  pageCount?: number;
}

export function SettingsPanel({
  isOpen,
  onClose,
  knowledgeBases,
  onRefresh,
  selectedKbId,
  onSelectKb
}: SettingsPanelProps) {
  const [activeTab, setActiveTab] = useState<'sources' | 'kbs'>('sources');
  const [projects, setProjects] = useState<Project[]>([]);
  const [manuals, setManuals] = useState<Manual[]>([]);
  const [selectedProjects, setSelectedProjects] = useState<Set<string>>(new Set());
  const [selectedManuals, setSelectedManuals] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateKb, setShowCreateKb] = useState(false);
  const [newKbName, setNewKbName] = useState('');
  
  // Load user's projects and manuals
  useEffect(() => {
    if (isOpen) {
      loadSources();
    }
  }, [isOpen]);
  
  const loadSources = async () => {
    setIsLoading(true);
    try {
      // Load P&ID analyses (standalone drawings)
      const { data: analysesData } = await supabase
        .from('pnid_analyses')
        .select('id, name, drawing_number')
        .order('created_at', { ascending: false });
      
      // Load P&ID projects (bulk uploads)
      const { data: projectsData } = await supabase
        .from('pnid_projects')
        .select('id, name')
        .order('created_at', { ascending: false });
      
      // Load manuals from book_library
      const { data: manualsData } = await supabase
        .from('book_library')
        .select('id, name, total_pages')
        .order('created_at', { ascending: false });
      
      // Combine analyses and projects as "P&ID sources"
      const allProjects: Project[] = [
        ...(analysesData?.map(a => ({
          id: a.id,
          name: a.name || a.drawing_number || 'Untitled P&ID',
          drawingCount: 1
        })) || []),
        ...(projectsData?.map(p => ({
          id: p.id,
          name: p.name
        })) || [])
      ];
      
      setProjects(allProjects);
      
      setManuals(manualsData?.map(m => ({
        id: m.id,
        name: m.name,
        pageCount: m.total_pages
      })) || []);
      
      // Select all by default
      setSelectedProjects(new Set(allProjects.map(p => p.id)));
      setSelectedManuals(new Set(manualsData?.map(m => m.id) || []));
      
    } catch (err) {
      console.error('Failed to load sources:', err);
    } finally {
      setIsLoading(false);
    }
  };
  
  const toggleProject = (id: string) => {
    const newSet = new Set(selectedProjects);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedProjects(newSet);
  };
  
  const toggleManual = (id: string) => {
    const newSet = new Set(selectedManuals);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedManuals(newSet);
  };
  
  const handleCreateKb = async () => {
    if (!newKbName.trim()) return;
    
    try {
      // Get current user ID for proper ownership
      const { data: { user } } = await supabase.auth.getUser();
      
      console.log('Creating knowledge base with user_id:', user?.id);
      
      const { data: createdKb, error } = await supabase
        .from('user_knowledge_bases')
        .insert({
          name: newKbName,
          project_ids: Array.from(selectedProjects),
          manual_ids: Array.from(selectedManuals),
          is_default: knowledgeBases.length === 0,
          user_id: user?.id // Required for API access
        })
        .select()
        .single();
      
      if (error) {
        console.error('Failed to create knowledge base:', error);
        throw error;
      }
      
      console.log('Knowledge base created successfully:', createdKb);
      
      setNewKbName('');
      setShowCreateKb(false);
      
      // Force refresh to ensure sync
      await onRefresh();
      
    } catch (err) {
      console.error('Failed to create knowledge base:', err);
    }
  };
  
  const handleDeleteKb = async (id: string) => {
    if (!confirm('Delete this knowledge base?')) return;
    
    try {
      const { error } = await supabase
        .from('user_knowledge_bases')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      onRefresh();
      
    } catch (err) {
      console.error('Failed to delete knowledge base:', err);
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />
      
      {/* Panel */}
      <div className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-[#0f0f15] border-l border-white/10 z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h2 className="text-lg font-semibold text-white">Settings</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-white/50 hover:text-white"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
        
        {/* Tabs */}
        <div className="flex border-b border-white/10">
          <button
            onClick={() => setActiveTab('sources')}
            className={cn(
              "flex-1 py-3 px-4 text-sm font-medium transition-colors",
              activeTab === 'sources' 
                ? "text-white border-b-2 border-[#71717A]" 
                : "text-white/50 hover:text-white"
            )}
          >
            <Database className="w-4 h-4 inline-block mr-2" />
            Data Sources
          </button>
          <button
            onClick={() => setActiveTab('kbs')}
            className={cn(
              "flex-1 py-3 px-4 text-sm font-medium transition-colors",
              activeTab === 'kbs' 
                ? "text-white border-b-2 border-[#71717A]" 
                : "text-white/50 hover:text-white"
            )}
          >
            <FolderOpen className="w-4 h-4 inline-block mr-2" />
            Knowledge Bases
          </button>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === 'sources' ? (
            <div className="space-y-6">
              {/* Info */}
              <p className="text-sm text-white/60">
                Select which P&ID projects and manuals the agent can search. 
                By default, all your documents are included.
              </p>
              
              {/* Projects */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-white flex items-center gap-2">
                    <FolderOpen className="w-4 h-4 text-[#71717A]" />
                    P&ID Projects ({selectedProjects.size}/{projects.length})
                  </h3>
                  <button 
                    onClick={() => {
                      if (selectedProjects.size === projects.length) {
                        setSelectedProjects(new Set());
                      } else {
                        setSelectedProjects(new Set(projects.map(p => p.id)));
                      }
                    }}
                    className="text-xs text-[#71717A] hover:underline"
                  >
                    {selectedProjects.size === projects.length ? 'Deselect all' : 'Select all'}
                  </button>
                </div>
                
                <div className="space-y-1">
                  {projects.length === 0 ? (
                    <p className="text-sm text-white/40 italic">No projects uploaded yet</p>
                  ) : (
                    projects.map(project => (
                      <SourceItem
                        key={project.id}
                        name={project.name}
                        selected={selectedProjects.has(project.id)}
                        onToggle={() => toggleProject(project.id)}
                      />
                    ))
                  )}
                </div>
              </div>
              
              {/* Manuals */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-white flex items-center gap-2">
                    <FileText className="w-4 h-4 text-amber-400" />
                    Equipment Manuals ({selectedManuals.size}/{manuals.length})
                  </h3>
                  <button 
                    onClick={() => {
                      if (selectedManuals.size === manuals.length) {
                        setSelectedManuals(new Set());
                      } else {
                        setSelectedManuals(new Set(manuals.map(m => m.id)));
                      }
                    }}
                    className="text-xs text-[#71717A] hover:underline"
                  >
                    {selectedManuals.size === manuals.length ? 'Deselect all' : 'Select all'}
                  </button>
                </div>
                
                <div className="space-y-1">
                  {manuals.length === 0 ? (
                    <p className="text-sm text-white/40 italic">No manuals indexed yet</p>
                  ) : (
                    manuals.map(manual => (
                      <SourceItem
                        key={manual.id}
                        name={manual.name}
                        meta={manual.pageCount ? `${manual.pageCount} pages` : undefined}
                        selected={selectedManuals.has(manual.id)}
                        onToggle={() => toggleManual(manual.id)}
                      />
                    ))
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Info */}
              <p className="text-sm text-white/60">
                Save document selections as knowledge bases for quick switching.
                Hidden by default for demo purposes.
              </p>
              
              {/* Knowledge Bases List */}
              <div className="space-y-2">
                {knowledgeBases.length === 0 ? (
                  <div className="text-center py-8">
                    <Database className="w-12 h-12 text-white/20 mx-auto mb-3" />
                    <p className="text-white/40">No knowledge bases yet</p>
                  </div>
                ) : (
                  knowledgeBases.map(kb => (
                    <div
                      key={kb.id}
                      className={cn(
                        "p-3 rounded-lg border transition-colors",
                        selectedKbId === kb.id 
                          ? "bg-[#71717A]/10 border-[#71717A]/30" 
                          : "bg-white/5 border-white/10 hover:border-white/20"
                      )}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1" onClick={() => onSelectKb?.(kb.id)}>
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-white">{kb.name}</h4>
                            {kb.isDefault && (
                              <span className="text-xs px-1.5 py-0.5 rounded bg-[#71717A]/20 text-[#71717A]">
                                Default
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-white/50 mt-0.5">
                            {kb.projectIds.length} projects, {kb.manualIds.length} manuals
                          </p>
                        </div>
                        <button
                          onClick={() => handleDeleteKb(kb.id)}
                          className="p-1 text-white/30 hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
              
              {/* Create New */}
              {showCreateKb ? (
                <div className="p-4 rounded-lg bg-white/5 border border-white/10 space-y-3">
                  <Input
                    value={newKbName}
                    onChange={(e) => setNewKbName(e.target.value)}
                    placeholder="Knowledge base name..."
                    className="bg-white/5 border-white/20"
                  />
                  <p className="text-xs text-white/50">
                    Will include: {selectedProjects.size} projects, {selectedManuals.size} manuals
                  </p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={handleCreateKb}
                      disabled={!newKbName.trim()}
                      className="bg-[#71717A] hover:bg-[#52525B]"
                    >
                      Create
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setShowCreateKb(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  variant="outline"
                  className="w-full border-dashed border-white/20 text-white/60 hover:text-white hover:bg-white/5"
                  onClick={() => setShowCreateKb(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Knowledge Base
                </Button>
              )}
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t border-white/10">
          <Button
            onClick={loadSources}
            variant="outline"
            className="w-full border-white/20 text-white/70 hover:bg-white/10"
          >
            <RefreshCw className={cn("w-4 h-4 mr-2", isLoading && "animate-spin")} />
            Refresh Sources
          </Button>
        </div>
      </div>
    </>
  );
}

// Source item component
function SourceItem({ 
  name, 
  meta,
  selected, 
  onToggle 
}: { 
  name: string;
  meta?: string;
  selected: boolean; 
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className={cn(
        "w-full flex items-center gap-3 p-2.5 rounded-lg text-left transition-colors",
        selected 
          ? "bg-white/5" 
          : "bg-transparent hover:bg-white/5 opacity-50"
      )}
    >
      <div className={cn(
        "w-5 h-5 rounded border flex items-center justify-center transition-colors",
        selected 
          ? "bg-[#71717A] border-[#71717A]" 
          : "border-white/30"
      )}>
        {selected && <Check className="w-3 h-3 text-white" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn(
          "text-sm truncate",
          selected ? "text-white" : "text-white/60"
        )}>
          {name}
        </p>
        {meta && (
          <p className="text-xs text-white/40">{meta}</p>
        )}
      </div>
      {selected ? (
        <Eye className="w-4 h-4 text-white/40" />
      ) : (
        <EyeOff className="w-4 h-4 text-white/30" />
      )}
    </button>
  );
}

export default SettingsPanel;

