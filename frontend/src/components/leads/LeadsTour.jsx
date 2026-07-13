import React from 'react';
import { Joyride, STATUS } from 'react-joyride';

const LeadsTour = ({ run, setRun, steps, tourKey }) => {
  const handleJoyrideCallback = (data) => {
    const { status } = data;
    const finishedStatuses = [STATUS.FINISHED, STATUS.SKIPPED];

    if (finishedStatuses.includes(status)) {
      setRun(false);
      localStorage.setItem(tourKey, 'true');
    }
  };

  return (
    <Joyride
      callback={handleJoyrideCallback}
      continuous
      run={run}
      scrollToFirstStep
      showProgress
      showSkipButton
      steps={steps}
      styles={{
        options: {
          arrowColor: '#ffffff',
          backgroundColor: '#ffffff',
          overlayColor: 'rgba(15, 23, 42, 0.6)',
          primaryColor: '#3b82f6',
          textColor: '#1e293b',
          zIndex: 10000,
        },
        tooltip: {
          borderRadius: '12px',
          padding: '24px',
          boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
          maxWidth: '450px',
        },
        tooltipTitle: {
          fontSize: '16px',
          fontWeight: '800',
          color: '#0f172a',
          marginBottom: '10px',
          textAlign: 'left',
        },
        tooltipContent: {
          fontSize: '13px',
          lineHeight: '1.6',
          color: '#475569',
          textAlign: 'left',
        },
        buttonBack: {
          marginRight: 12,
          color: '#64748b',
          fontWeight: 700,
          fontSize: '12px',
        },
        buttonNext: {
          backgroundColor: '#2563eb',
          color: '#ffffff',
          fontWeight: 700,
          borderRadius: '8px',
          fontSize: '12px',
          padding: '8px 16px',
          border: 'none',
          boxShadow: '0 4px 6px -1px rgb(37 99 235 / 0.2)',
          cursor: 'pointer',
        },
        buttonSkip: {
          color: '#ef4444',
          fontWeight: 700,
          fontSize: '12px',
        }
      }}
    />
  );
};

export default LeadsTour;
