import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, Calendar, Bell, HelpCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { addToGoogleCalendar } from '../utils/googleCalendar';

interface QuickActionsProps {
  onAddSubscription: () => void;
}

const QuickActions: React.FC<QuickActionsProps> = ({ onAddSubscription }) => {
  const navigate = useNavigate();
  const [isConnecting, setIsConnecting] = useState(false);

  const handleAddSubscription = () => {
    onAddSubscription();
  };

  const handleCalendarConnect = async () => {
    if (isConnecting) return;
    
    setIsConnecting(true);
    try {
      await addToGoogleCalendar({
        name: 'Test Subscription',
        price: '$9.99',
        renewalDate: new Date().toISOString()
      });
    } catch (error) {
      // Error is handled in the addToGoogleCalendar function
      console.error('Calendar connection failed:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleSetReminder = () => {
    navigate('/reminders');
  };

  const handleGetSupport = () => {
    navigate('/support');
  };

  return (
    <div className="grid grid-cols-2 gap-4">
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleAddSubscription}
        className="p-4 bg-indigo-50 rounded-lg text-indigo-700 hover:bg-indigo-100 transition-colors"
      >
        <CreditCard className="h-6 w-6 mx-auto mb-2" />
        <span className="text-sm font-medium">Add Subscription</span>
      </motion.button>

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleCalendarConnect}
        disabled={isConnecting}
        className={`p-4 ${
          isConnecting ? 'bg-gray-100 text-gray-500' : 'bg-green-50 text-green-700 hover:bg-green-100'
        } rounded-lg transition-colors`}
      >
        <Calendar className="h-6 w-6 mx-auto mb-2" />
        <span className="text-sm font-medium">
          {isConnecting ? 'Connecting...' : 'Connect Calendar'}
        </span>
      </motion.button>

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleSetReminder}
        className="p-4 bg-yellow-50 rounded-lg text-yellow-700 hover:bg-yellow-100 transition-colors"
      >
        <Bell className="h-6 w-6 mx-auto mb-2" />
        <span className="text-sm font-medium">Set Reminder</span>
      </motion.button>

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleGetSupport}
        className="p-4 bg-purple-50 rounded-lg text-purple-700 hover:bg-purple-100 transition-colors"
      >
        <HelpCircle className="h-6 w-6 mx-auto mb-2" />
        <span className="text-sm font-medium">Get Support</span>
      </motion.button>
    </div>
  );
};

export default QuickActions;