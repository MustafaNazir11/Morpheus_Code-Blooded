import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSelector } from 'react-redux';

const CheatingLogContext = createContext();

export const CheatingLogProvider = ({ children }) => {
  const { userInfo } = useSelector((state) => state.auth);
  const [cheatingLog, setCheatingLog] = useState({
    totalViolations: 0,
    examId: '',
    username: userInfo?.name || '',
    email: userInfo?.email || '',
    screenshots: [],
  });

  useEffect(() => {
    if (userInfo) {
      setCheatingLog((prev) => ({
        ...prev,
        username: userInfo.name,
        email: userInfo.email,
      }));
    }
  }, [userInfo]);

  const updateCheatingLog = (newLog) => {
    console.log('[CheatingLogContext] 📝 updateCheatingLog called with:', newLog);
    setCheatingLog((prev) => {
      console.log('[CheatingLogContext] 📊 Previous state:', prev);
      const updatedLog = {
        ...prev,
        ...newLog,
        totalViolations: Number(newLog.totalViolations !== undefined ? newLog.totalViolations : prev.totalViolations || 0),
        screenshots: newLog.screenshots || prev.screenshots || [],
      };
      console.log('[CheatingLogContext] ✅ New state:', updatedLog);
      return updatedLog;
    });
  };

  const resetCheatingLog = (examId) => {
    const resetLog = {
      totalViolations: 0,
      examId: examId,
      username: userInfo?.name || '',
      email: userInfo?.email || '',
      screenshots: [],
    };
    console.log('[CheatingLogContext] 🔄 Reset cheating log:', resetLog);
    setCheatingLog(resetLog);
  };

  return (
    <CheatingLogContext.Provider value={{ cheatingLog, updateCheatingLog, resetCheatingLog }}>
      {children}
    </CheatingLogContext.Provider>
  );
};

export const useCheatingLog = () => {
  const context = useContext(CheatingLogContext);
  if (!context) {
    throw new Error('useCheatingLog must be used within a CheatingLogProvider');
  }
  return context;
};
