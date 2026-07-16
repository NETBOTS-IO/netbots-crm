import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Save, Plus, Maximize, Minimize, PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen } from 'lucide-react';
import { ReactFlow, Controls, Background, useNodesState, useEdgesState, addEdge, applyNodeChanges, applyEdgeChanges } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { nodeTypes } from './SequenceNodes';

const generateId = () => `step_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;

export default function SequenceBuilder() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isEdit = id && id !== 'new';
  const reactFlowWrapper = useRef(null);

  const [name, setName] = useState('');
  const [triggerType, setTriggerType] = useState('lead_created');
  const [templates, setTemplates] = useState([]);
  
  const [nodes, setNodes] = useNodesState([]);
  const [edges, setEdges] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState(null);

  // UI State
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);

  const onSelectionChange = useCallback(({ nodes }) => {
    setSelectedNode(nodes.length === 1 ? nodes[0] : null);
    if (nodes.length === 1 && nodes[0].type !== 'trigger') {
      setRightOpen(true); // auto open right panel when node selected
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const tpl = await api.get('/email-templates');
        let templateMap = {};
        if (tpl) {
          setTemplates(tpl);
          templateMap = tpl.reduce((acc, t) => {
            acc[t._id] = t.name;
            return acc;
          }, {});
        }

        if (isEdit) {
          const seq = await api.get(`/email-sequences/${id}`);
          if (seq) {
            setName(seq.name);
            setTriggerType(seq.trigger?.type || 'lead_created');
            
            const loadedNodes = [];
            const loadedEdges = [];

            loadedNodes.push({
              id: 'trigger',
              type: 'trigger',
              position: { x: 300, y: 50 },
              data: { type: seq.trigger?.type || 'lead_created' },
              deletable: false,
            });

            const steps = seq.steps || [];
            
            if (steps.length > 0) {
              loadedEdges.push({ id: `e-trigger-next`, source: 'trigger', target: steps[0].stepId });
            }

            steps.forEach(step => {
              loadedNodes.push({
                id: step.stepId,
                type: step.type,
                position: step.config?.position || { x: 300, y: 200 },
                data: { 
                  config: step.config || {},
                  templateName: step.type === 'send_email' ? templateMap[step.config?.templateId] : null
                }
              });

              if (step.type === 'condition') {
                if (step.branchTrueStepId) {
                  loadedEdges.push({ id: `e-${step.stepId}-true`, source: step.stepId, sourceHandle: 'true', target: step.branchTrueStepId });
                }
                if (step.branchFalseStepId) {
                  loadedEdges.push({ id: `e-${step.stepId}-false`, source: step.stepId, sourceHandle: 'false', target: step.branchFalseStepId });
                }
              } else {
                if (step.nextStepId) {
                  loadedEdges.push({ id: `e-${step.stepId}-next`, source: step.stepId, sourceHandle: 'next', target: step.nextStepId });
                }
              }
            });

            setNodes(loadedNodes);
            setEdges(loadedEdges);
          }
        } else {
          setNodes([{
            id: 'trigger',
            type: 'trigger',
            position: { x: 300, y: 50 },
            data: { type: 'lead_created' },
            deletable: false,
          }]);
        }
      } catch (err) {
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to fetch builder configuration.' });
      }
    };
    fetchData();
  }, [id, isEdit, setNodes, setEdges, toast]);

  useEffect(() => {
    setNodes(nds => nds.map(n => {
      if (n.id === 'trigger') {
        n.data = { ...n.data, type: triggerType };
      }
      return n;
    }));
  }, [triggerType, setNodes]);

  const onNodesChange = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
    [setNodes]
  );
  
  const onEdgesChange = useCallback(
    (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    [setEdges]
  );

  const onConnect = useCallback(
    (connection) => {
      setEdges((eds) => addEdge(connection, eds));
    },
    [setEdges]
  );

  const addStep = (type) => {
    const newId = generateId();
    const newNode = {
      id: newId,
      type,
      position: { x: 300, y: 200 },
      data: {
        config: type === 'send_email' ? { templateId: '' } : type === 'wait' ? { duration: 1, unit: 'days' } : { conditionType: 'email_replied', value: '' },
      }
    };
    setNodes(nds => [...nds, newNode]);
  };

  const handleUpdateNodeConfig = (key, val) => {
    if (!selectedNode) return;
    
    setNodes(nds => nds.map(n => {
      if (n.id === selectedNode.id) {
        const newConfig = { ...n.data.config, [key]: val };
        let templateName = n.data.templateName;
        if (key === 'templateId') {
           const tpl = templates.find(t => t._id === val);
           templateName = tpl ? tpl.name : null;
        }
        return { ...n, data: { ...n.data, config: newConfig, templateName } };
      }
      return n;
    }));
    
    setSelectedNode(prev => {
      const newConfig = { ...prev.data.config, [key]: val };
      return { ...prev, data: { ...prev.data, config: newConfig } };
    });
  };

  const handleSave = async () => {
    if (!name) {
      toast({ variant: 'destructive', title: 'Error', description: 'Sequence name is required.' });
      return;
    }

    const triggerEdge = edges.find(e => e.source === 'trigger');
    const firstStepId = triggerEdge ? triggerEdge.target : null;

    let backendSteps = nodes.filter(n => n.type !== 'trigger').map(node => {
      const outEdges = edges.filter(e => e.source === node.id);
      let nextStepId = '';
      let branchTrueStepId = '';
      let branchFalseStepId = '';

      if (node.type === 'condition') {
        const trueEdge = outEdges.find(e => e.sourceHandle === 'true');
        const falseEdge = outEdges.find(e => e.sourceHandle === 'false');
        if (trueEdge) branchTrueStepId = trueEdge.target;
        if (falseEdge) branchFalseStepId = falseEdge.target;
      } else {
        const nextEdge = outEdges[0];
        if (nextEdge) nextStepId = nextEdge.target;
      }

      return {
        stepId: node.id,
        type: node.type,
        config: { ...node.data.config, position: node.position },
        nextStepId,
        branchTrueStepId,
        branchFalseStepId
      };
    });

    if (firstStepId) {
      const firstIndex = backendSteps.findIndex(s => s.stepId === firstStepId);
      if (firstIndex > -1) {
        const firstStep = backendSteps.splice(firstIndex, 1)[0];
        backendSteps.unshift(firstStep);
      }
    }

    const payload = {
      name,
      status: isEdit ? undefined : 'active',
      trigger: { type: triggerType, conditions: {} },
      steps: backendSteps
    };

    try {
      if (isEdit) {
        await api.put(`/email-sequences/${id}`, payload);
        toast({ title: 'Success', description: 'Sequence flow updated.' });
      } else {
        await api.post('/email-sequences', payload);
        toast({ title: 'Success', description: 'Sequence flow saved and activated.' });
      }
      navigate('/email/sequences');
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to save workflow.' });
    }
  };

  return (
    <div className={`flex flex-col bg-slate-50 transition-all ${isFullscreen ? 'fixed inset-0 z-50' : 'h-screen'}`}>
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm shrink-0">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={() => navigate('/email/sequences')}>
            <ArrowLeft size={16} />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-slate-900">{isEdit ? 'Edit funnel flow' : 'Visual funnel builder'}</h1>
            <p className="text-xs text-slate-500">Drag and drop visual canvas for email marketing funnels</p>
          </div>
        </div>
        <div className="flex gap-3 items-center">
          <Button variant="outline" size="icon" onClick={() => setIsFullscreen(!isFullscreen)} title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}>
            {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
          </Button>
          <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 gap-2">
            <Save size={16} /> Save Workflow
          </Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {leftOpen && (
          <div className="w-64 bg-white border-r border-slate-200 flex flex-col z-10 relative shrink-0">
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
               <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Add Node Blocks</span>
               <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400" onClick={() => setLeftOpen(false)}>
                  <PanelLeftClose size={14} />
               </Button>
            </div>
            
            <div className="p-4 space-y-4 flex-1 overflow-y-auto">
              <div className="space-y-2">
                <Button onClick={() => addStep('send_email')} className="w-full justify-start gap-2" variant="outline">
                  <Plus size={14} /> Send Email Node
                </Button>
                <Button onClick={() => addStep('wait')} className="w-full justify-start gap-2" variant="outline">
                  <Plus size={14} /> Wait Node
                </Button>
                <Button onClick={() => addStep('condition')} className="w-full justify-start gap-2" variant="outline">
                  <Plus size={14} /> If/Else Reply Node
                </Button>
              </div>

              <div className="space-y-2 pt-4 border-t border-slate-100">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Enrollment Trigger</span>
                <select
                  className="w-full p-2 bg-white border rounded text-xs"
                  value={triggerType}
                  onChange={e => setTriggerType(e.target.value)}
                >
                  <option value="lead_created">New Lead Enters CRM</option>
                  <option value="stage_changed">Stage Changed</option>
                </select>
              </div>
            </div>
            
            <div className="p-4 bg-slate-50 border-t border-slate-200">
              <span className="text-xs font-semibold text-slate-600 block">Funnel Title</span>
              <Input className="h-8 text-xs mt-1.5" placeholder="Campaign name" value={name} onChange={e => setName(e.target.value)} />
            </div>
          </div>
        )}

        <div className="flex-1 relative" ref={reactFlowWrapper}>
          {!leftOpen && (
             <Button variant="outline" size="icon" className="absolute top-4 left-4 z-20 bg-white shadow-md" onClick={() => setLeftOpen(true)} title="Open Blocks Panel">
                <PanelLeftOpen size={16} />
             </Button>
          )}
          
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onSelectionChange={onSelectionChange}
            nodeTypes={nodeTypes}
            fitView
            className="bg-slate-50"
            defaultEdgeOptions={{ 
              style: { strokeWidth: 2, stroke: '#94a3b8' },
              type: 'smoothstep'
            }}
          >
            <Background color="#cbd5e1" gap={16} size={2} />
            <Controls position="bottom-left" className="m-4 shadow-lg border-none" showInteractive={false} />
          </ReactFlow>

          {!rightOpen && (
             <Button variant="outline" size="icon" className="absolute top-4 right-4 z-20 bg-white shadow-md" onClick={() => setRightOpen(true)} title="Open Settings Panel">
                <PanelRightOpen size={16} />
             </Button>
          )}
        </div>

        {rightOpen && (
          <div className="w-80 bg-white border-l border-slate-200 flex flex-col z-10 relative shrink-0 shadow-[-4px_0_15px_-3px_rgba(0,0,0,0.05)]">
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
               <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Settings</span>
               <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400" onClick={() => setRightOpen(false)}>
                  <PanelRightClose size={14} />
               </Button>
            </div>
            
            <div className="p-6 flex-1 overflow-y-auto space-y-6">
              {selectedNode && selectedNode.type !== 'trigger' ? (
                <div className="space-y-6">
                  <div className="space-y-4">
                    {selectedNode.type === 'send_email' && (
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-700">Select Template to Send</label>
                        <select
                          className="w-full p-2 bg-slate-50 border border-slate-200 rounded-md text-sm outline-none focus:ring-2 focus:ring-blue-500"
                          value={selectedNode.data.config?.templateId || ''}
                          onChange={e => handleUpdateNodeConfig('templateId', e.target.value)}
                        >
                          <option value="">-- Choose Email Template --</option>
                          {templates.map(t => (
                             <option key={t._id} value={t._id}>{t.name}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    {selectedNode.type === 'wait' && (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-xs font-semibold text-slate-700">Duration</label>
                          <Input
                            type="number"
                            className="text-sm h-9 bg-slate-50 focus:ring-blue-500"
                            value={selectedNode.data.config?.duration || ''}
                            onChange={e => handleUpdateNodeConfig('duration', parseInt(e.target.value))}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-semibold text-slate-700">Unit</label>
                          <select
                            className="w-full p-2 bg-slate-50 border border-slate-200 rounded-md text-sm outline-none focus:ring-2 focus:ring-blue-500"
                            value={selectedNode.data.config?.unit || 'days'}
                            onChange={e => handleUpdateNodeConfig('unit', e.target.value)}
                          >
                            <option value="minutes">Minutes (Testing)</option>
                            <option value="hours">Hours</option>
                            <option value="days">Days</option>
                          </select>
                        </div>
                      </div>
                    )}

                    {selectedNode.type === 'condition' && (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-xs font-semibold text-slate-700">Condition Type</label>
                          <select
                            className="w-full p-2 bg-slate-50 border border-slate-200 rounded-md text-sm outline-none focus:ring-2 focus:ring-blue-500"
                            value={selectedNode.data.config?.conditionType || 'email_replied'}
                            onChange={e => handleUpdateNodeConfig('conditionType', e.target.value)}
                          >
                            <option value="email_replied">Recipient Replied to Email</option>
                            <option value="email_opened">Recipient Opened Email</option>
                            <option value="email_clicked">Recipient Clicked Link</option>
                          </select>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                    <Maximize size={20} className="text-slate-300" />
                  </div>
                  <div className="text-slate-400 text-sm">
                    Select a node on the canvas<br/>to configure its settings.
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
