const EmailSequence = require('../models/EmailSequence');
const SequenceEnrollment = require('../models/SequenceEnrollment');
const Lead = require('../models/Lead');
const EmailLog = require('../models/EmailLog');
const EmailTemplate = require('../models/EmailTemplate');
const { sendRotatedEmail } = require('./emailSender');

/**
 * Evaluates node logic for condition step types
 */
async function evaluateCondition(step, lead, enrollment) {
  const { conditionType, value, previousEmailStepId } = step.config || {};

  if (conditionType === 'email_opened') {
    const log = await EmailLog.findOne({
      recipientId: lead._id,
      sequenceStepId: previousEmailStepId,
      status: 'opened'
    });
    return !!log;
  }

  if (conditionType === 'email_clicked') {
    const log = await EmailLog.findOne({
      recipientId: lead._id,
      sequenceStepId: previousEmailStepId,
      status: 'clicked'
    });
    return !!log;
  }

  if (conditionType === 'email_replied') {
    const log = await EmailLog.findOne({
      recipientId: lead._id,
      sequenceStepId: previousEmailStepId,
      status: 'replied'
    });
    return !!log;
  }

  if (conditionType === 'lead_stage_is') {
    return lead.stage === value;
  }

  if (conditionType === 'lead_temperature_is') {
    return lead.temperature === value;
  }

  return false;
}

/**
 * Execute a single step node action for an enrollment record
 */
async function executeStep(step, lead, enrollment, sequence) {
  enrollment.stepHistory.push({
    stepId: step.stepId,
    action: step.type,
    executedAt: new Date()
  });

  if (step.type === 'send_email') {
    const template = await EmailTemplate.findById(step.config?.templateId);
    if (template) {
      await sendRotatedEmail({
        recipient: lead,
        subject: template.subject || 'Follow up',
        htmlContent: template.htmlContent,
        sequenceId: sequence._id,
        sequenceStepId: step.stepId
      });
    }
    enrollment.currentStepId = step.nextStepId;
    enrollment.nextActionAt = new Date(); // Proceed to next action immediately unless delayed later
  } 
  
  else if (step.type === 'wait') {
    const duration = parseInt(step.config?.duration || 1);
    const unit = step.config?.unit || 'days'; // minutes, hours, days
    
    const waitTime = new Date();
    if (unit === 'minutes') waitTime.setMinutes(waitTime.getMinutes() + duration);
    else if (unit === 'hours') waitTime.setHours(waitTime.getHours() + duration);
    else waitTime.setDate(waitTime.getDate() + duration); // default to days

    enrollment.currentStepId = step.nextStepId;
    enrollment.nextActionAt = waitTime;
  } 
  
  else if (step.type === 'condition') {
    const result = await evaluateCondition(step, lead, enrollment);
    enrollment.currentStepId = result ? step.branchTrueStepId : step.branchFalseStepId;
    enrollment.nextActionAt = new Date();
  } 
  
  else if (step.type === 'action') {
    const { actionType, fieldValue } = step.config || {};
    if (actionType === 'update_stage') {
      lead.stage = fieldValue;
      await lead.save();
    } else if (actionType === 'update_temperature') {
      lead.temperature = fieldValue;
      await lead.save();
    }
    enrollment.currentStepId = step.nextStepId;
    enrollment.nextActionAt = new Date();
  } 
  
  else if (step.type === 'exit') {
    enrollment.status = 'completed';
    enrollment.currentStepId = null;
  }
}

/**
 * Cron routine to process active sequences loop
 */
async function processActiveEnrollments() {
  const activeEnrollments = await SequenceEnrollment.find({
    status: 'active',
    nextActionAt: { $lte: new Date() }
  });

  for (const enrollment of activeEnrollments) {
    const sequence = await EmailSequence.findById(enrollment.sequenceId);
    const lead = await Lead.findById(enrollment.leadId);

    if (!sequence || !lead) {
      enrollment.status = 'exited';
      await enrollment.save();
      continue;
    }

    try {
      let currentStep = sequence.steps.find(s => s.stepId === enrollment.currentStepId);
      let safetyCounter = 0;

      // Loop to process consecutive instant actions (conditions, database updates) immediately
      while (currentStep && enrollment.status === 'active' && safetyCounter < 10) {
        const prevStepId = enrollment.currentStepId;
        await executeStep(currentStep, lead, enrollment, sequence);
        
        // If we hit a wait step, nextActionAt gets set to a future date
        if (enrollment.nextActionAt > new Date()) {
          break;
        }

        // If the step hasn't changed or has exited, stop looping
        if (enrollment.currentStepId === prevStepId || !enrollment.currentStepId) {
          break;
        }

        currentStep = sequence.steps.find(s => s.stepId === enrollment.currentStepId);
        safetyCounter++;
      }
      
      await enrollment.save();
    } catch (err) {
      console.error(`Error processing sequence engine enrollment:`, err.message);
    }
  }
}

module.exports = {
  processActiveEnrollments
};
