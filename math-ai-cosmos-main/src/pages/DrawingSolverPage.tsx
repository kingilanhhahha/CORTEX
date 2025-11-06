import React from 'react';
import { DrawingSolverSimple } from '@/components/calculator/DrawingSolverSimple';

const DrawingSolverPage: React.FC = () => {
  console.log('DrawingSolverPage is loading...'); // Debug log
  
  return (
    <div>
      <div style={{ 
        position: 'fixed', 
        top: '10px', 
        right: '10px', 
        background: 'green', 
        color: 'white', 
        padding: '5px 10px', 
        borderRadius: '5px',
        zIndex: 9999,
        fontSize: '12px'
      }}>
        ✅ Route Working
      </div>
      <DrawingSolverSimple />
    </div>
  );
};

export default DrawingSolverPage;


