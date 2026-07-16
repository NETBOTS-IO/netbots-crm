import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { Mail, Clock, Split, Play } from 'lucide-react';

export const TriggerNode = ({ data }) => {
  return (
    <div className="px-4 py-2 bg-green-50 border-2 border-green-500 rounded-lg shadow-sm min-w-[200px] text-center">
      <div className="flex items-center justify-center gap-2 mb-1">
        <Play size={14} className="text-green-600" />
        <span className="text-xs font-bold text-green-700 uppercase tracking-widest block">Trigger</span>
      </div>
      <span className="text-sm font-semibold text-green-800 capitalize block">
        {data.type?.replace('_', ' ')}
      </span>
      <Handle type="source" position={Position.Bottom} id="next" className="w-3 h-3 bg-green-600" />
    </div>
  );
};

export const EmailNode = ({ data, selected }) => {
  return (
    <div className={`p-4 bg-white border-2 rounded-lg shadow-sm min-w-[250px] transition-all ${selected ? 'border-blue-600 ring-4 ring-blue-100' : 'border-blue-200'}`}>
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-slate-400" />
      <div className="flex items-center gap-2 border-b border-slate-100 pb-2 mb-2">
        <Mail size={16} className="text-blue-600" />
        <span className="text-xs font-bold uppercase tracking-wider text-blue-600">Send Email</span>
      </div>
      <div className="text-xs text-slate-600">
        Template: <span className="font-semibold text-slate-800">{data.templateName || '(Not set)'}</span>
      </div>
      <Handle type="source" position={Position.Bottom} id="next" className="w-3 h-3 bg-blue-600" />
    </div>
  );
};

export const WaitNode = ({ data, selected }) => {
  return (
    <div className={`p-4 bg-white border-2 rounded-lg shadow-sm min-w-[200px] transition-all ${selected ? 'border-amber-600 ring-4 ring-amber-100' : 'border-amber-200'}`}>
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-slate-400" />
      <div className="flex items-center gap-2 border-b border-slate-100 pb-2 mb-2">
        <Clock size={16} className="text-amber-600" />
        <span className="text-xs font-bold uppercase tracking-wider text-amber-600">Wait Delay</span>
      </div>
      <div className="text-xs text-slate-600">
        Duration: <span className="font-semibold text-slate-800">{data.config?.duration || 1} {data.config?.unit || 'days'}</span>
      </div>
      <Handle type="source" position={Position.Bottom} id="next" className="w-3 h-3 bg-amber-600" />
    </div>
  );
};

export const ConditionNode = ({ data, selected }) => {
  return (
    <div className={`p-4 bg-white border-2 rounded-lg shadow-sm min-w-[250px] transition-all ${selected ? 'border-purple-600 ring-4 ring-purple-100' : 'border-purple-200'}`}>
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-slate-400" />
      <div className="flex items-center gap-2 border-b border-slate-100 pb-2 mb-2">
        <Split size={16} className="text-purple-600" />
        <span className="text-xs font-bold uppercase tracking-wider text-purple-600">If / Else Condition</span>
      </div>
      <div className="text-xs text-slate-600 text-center mb-4">
        Check: <span className="font-semibold text-slate-800 capitalize">{data.config?.conditionType?.replace('_', ' ') || 'Email Replied'}</span>
      </div>
      
      {/* Handles */}
      <Handle type="source" position={Position.Bottom} id="true" className="w-3 h-3 bg-green-500 !left-[25%]" />
      <div className="absolute text-[10px] font-bold text-green-600" style={{ bottom: '-20px', left: '20%' }}>Yes</div>
      
      <Handle type="source" position={Position.Bottom} id="false" className="w-3 h-3 bg-red-500 !left-[75%]" />
      <div className="absolute text-[10px] font-bold text-red-600" style={{ bottom: '-20px', left: '70%' }}>No</div>
    </div>
  );
};

export const nodeTypes = {
  trigger: TriggerNode,
  send_email: EmailNode,
  wait: WaitNode,
  condition: ConditionNode
};
