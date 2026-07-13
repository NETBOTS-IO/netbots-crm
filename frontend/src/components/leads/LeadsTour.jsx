import React from 'react';
import Joyride, { STATUS } from 'react-joyride';

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
          overlayColor: 'rgba(15, 23, 42, 0.65)',
          primaryColor: '#2563eb',
          textColor: '#1e293b',
          zIndex: 1000,
        },
        tooltipContainer: {
          textAlign: 'left',
          fontFamily: 'inherit',
        },
        buttonBack: {
          marginRight: 10,
          color: '#64748b',
          fontWeight: 600,
          fontSize: '13px',
        },
        buttonNext: {
          backgroundColor: '#2563eb',
          color: '#ffffff',
          fontWeight: 600,
          borderRadius: '6px',
          fontSize: '13px',
          padding: '8px 16px',
          border: 'none',
          cursor: 'pointer'
        },
        buttonSkip: {
          color: '#64748b',
          fontWeight: 600,
          fontSize: '13px',
        }
      }}
      locale={{
        back: 'Peeche',
        close: 'Band Karein',
        last: 'Khatam',
        next: 'Agla',
        open: 'Kholein',
        skip: 'Chorein',
      }}
    />
  );
};

export default LeadsTour;
