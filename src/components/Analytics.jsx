
import React from 'react';
import { motion } from 'framer-motion';
import { X, CreditCard, User, Plane, ShoppingBag, Apple, Bike } from 'lucide-react';

const Analytics = ({ onClose }) => {
  // Chart data for the week
  const weekData = [
    { day: '20', dayName: 'Tue', value: 25, secondaryValue: 15 },
    { day: '21', dayName: 'Wed', value: 50, secondaryValue: 35 },
    { day: '22', dayName: 'Thu', value: 90, secondaryValue: 60 },
    { day: '23', dayName: 'Fri', value: 40, secondaryValue: 30 },
    { day: '24', dayName: 'Sat', value: 30, secondaryValue: 20 },
    { day: '25', dayName: 'Sun', value: 45, secondaryValue: 25 },
    { day: '26', dayName: 'Mon', value: 70, secondaryValue: 45 },
  ];
  
  // Expense data
  const expenses = [
    { 
      category: 'Travel', 
      amount: 1200, 
      icon: <Plane size={20} color="white" />,
      color: '#000'
    },
    { 
      category: 'Shopping', 
      amount: 900, 
      icon: <ShoppingBag size={20} color="white" />,
      color: '#333'
    },
    { 
      category: 'Food', 
      amount: 500, 
      icon: <Apple size={20} color="white" />,
      color: '#555'
    },
    { 
      category: 'Rent Bike', 
      amount: 100, 
      icon: <Bike size={20} color="white" />,
      color: '#777'
    },
  ];
  
  return (
    <motion.div 
      className="analytics-container"
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', bounce: 0, duration: 0.5 }}
    >
      <div className="analytics-header">
        <CreditCard size={20} />
        <h1 className="text-xl font-bold">Analytics</h1>
        <User size={20} />
      </div>
      
      <div className="p-6">
        <div className="text-gray-400 text-sm">Use in October</div>
        <div className="text-3xl font-bold mt-1">$ 2,500</div>
      </div>
      
      <div className="analytics-chart">
        <div className="chart-bars">
          {weekData.map((item, index) => (
            <div key={index} className="bar-container" style={{ position: 'relative' }}>
              <div 
                className="bar" 
                style={{ 
                  height: `${item.value}px`,
                }}
              ></div>
              <div 
                className="secondary-bar" 
                style={{ 
                  height: `${item.secondaryValue}px`,
                  bottom: '10px'
                }}
              ></div>
            </div>
          ))}
        </div>
        
        <div className="flex justify-between mt-2">
          {weekData.map((item, index) => (
            <div key={index} className="text-center w-[14%]">
              <div className="day-label font-medium">{item.day}</div>
              <div className="day-label text-gray-500">{item.dayName}</div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="expense-list">
        {expenses.map((expense, index) => (
          <div key={index} className="expense-item">
            <div className="expense-icon" style={{ backgroundColor: expense.color }}>
              {expense.icon}
            </div>
            <div className="flex-1">
              <div className="font-medium">{expense.category}</div>
            </div>
            <div className="text-right">
              <div className="font-medium">- $ {expense.amount}</div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="fixed top-4 right-4">
        <button 
          onClick={onClose}
          className="bg-gray-800 rounded-full p-2"
        >
          <X size={24} color="white" />
        </button>
      </div>
    </motion.div>
  );
};

export default Analytics;
